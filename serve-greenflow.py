"""Serve this GreenFlow folder before opening its browser launch page."""

import argparse
import functools
import json
import math
import sys
import threading
import time
import uuid
import webbrowser
from email.utils import parsedate_to_datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent


class InternetClock:
    """Use HTTPS server time and monotonic elapsed time, never the device date."""

    SOURCES = ("https://github.com/", "https://www.google.com/generate_204")

    def __init__(self):
        self.lock = threading.Lock()
        self.anchor = None

    def refresh(self):
        for source in self.SOURCES:
            try:
                # A unique URL prevents a proxy/CDN from returning an old Date header.
                request = Request(
                    source + "?greenflow-time=" + uuid.uuid4().hex,
                    method="HEAD",
                    headers={"Cache-Control": "no-cache"},
                )
                start = time.monotonic()
                with urlopen(request, timeout=3) as response:
                    elapsed = time.monotonic() - start
                    age = float(response.headers.get("Age", "0"))
                    stamp = parsedate_to_datetime(response.headers["Date"])
                    if (
                        stamp.tzinfo is None
                        or not 2020 <= stamp.year <= 2100
                        or not math.isfinite(age)
                        or not 0 <= age <= 5
                        or elapsed > 10
                    ):
                        continue
                    utc_ms = stamp.timestamp() * 1000 + age * 1000 + elapsed * 500
                with self.lock:
                    self.anchor = (utc_ms, time.monotonic())
                return True
            except (OSError, ValueError, TypeError, KeyError, OverflowError):
                continue
        return False

    def sample(self):
        with self.lock:
            if self.anchor is None:
                return None
            utc_ms, tick = self.anchor
            elapsed = time.monotonic() - tick
            return {"utcMs": utc_ms + elapsed * 1000, "syncedAgoSeconds": elapsed}

    def run(self):
        while True:
            successful = self.refresh()
            time.sleep(300 if successful else 30)


INTERNET_CLOCK = InternetClock()


class GreenFlowHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/time":
            sample = INTERNET_CLOCK.sample()
            payload = json.dumps(
                sample or {"error": "Internet time is unavailable"}
            ).encode()
            self.send_response(200 if sample else 503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if path == "/favicon.ico":
            self.send_response(302)
            self.send_header("Location", "/icon.svg")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        # Local files may have the same timestamps after a ZIP extraction.
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def run(port=8765, open_browser=True):
    handler = functools.partial(GreenFlowHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    except OSError as error:
        print(f"GreenFlow could not start on port {port}: {error}", file=sys.stderr)
        print(
            "Close the previous GreenFlow server window, then run this launcher again.\n"
            "If another app uses this port, close it first. No browser was opened.",
            file=sys.stderr,
        )
        return 1

    with server:
        threading.Thread(target=INTERNET_CLOCK.run, daemon=True).start()
        url = f"http://localhost:{server.server_port}/launch.html"
        print(f"Serving GreenFlow from: {ROOT}", flush=True)
        print(f"Opening: {url}", flush=True)
        print("Keep this window open. Press Ctrl+C to stop.", flush=True)
        if open_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    sys.exit(run(args.port, not args.no_browser))
