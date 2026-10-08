"""Serve this GreenFlow folder before opening its browser launch page."""

import argparse
import functools
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class GreenFlowHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
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
