import contextlib
import functools
import importlib.util
import io
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen


root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("greenflow_launcher", root / "serve-greenflow.py")
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def setUp(self):
        patcher = patch.object(launcher.INTERNET_CLOCK, "run")
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_busy_port_does_not_open_old_app(self):
        error_output = io.StringIO()
        with patch.object(launcher, "ThreadingHTTPServer", side_effect=OSError("Address already in use")), patch.object(launcher.webbrowser, "open") as open_browser, contextlib.redirect_stderr(error_output):
            self.assertEqual(launcher.run(), 1)
        open_browser.assert_not_called()
        self.assertIn("Close the previous GreenFlow server window", error_output.getvalue())

    def test_browser_opens_only_after_successful_bind_and_uses_launch_page(self):
        events = []
        server = Mock()
        server.server_port = 8765
        server.__enter__ = Mock(return_value=server)
        server.__exit__ = Mock(return_value=False)
        server.serve_forever.side_effect = KeyboardInterrupt

        def bind(*args):
            events.append("bound")
            return server

        def open_browser(url):
            events.append(url)

        with patch.object(launcher, "ThreadingHTTPServer", side_effect=bind), patch.object(launcher.webbrowser, "open", side_effect=open_browser), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(launcher.run(), 0)
        self.assertEqual(events, ["bound", "http://localhost:8765/launch.html"])

    def test_no_browser_option_runs_without_opening_a_tab(self):
        server = Mock()
        server.server_port = 8765
        server.__enter__ = Mock(return_value=server)
        server.__exit__ = Mock(return_value=False)
        server.serve_forever.side_effect = KeyboardInterrupt
        with patch.object(launcher, "ThreadingHTTPServer", return_value=server), patch.object(launcher.webbrowser, "open") as open_browser, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(launcher.run(open_browser=False), 0)
        open_browser.assert_not_called()


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class QuietHandler(launcher.GreenFlowHandler):
            def log_message(self, *args):
                pass
        handler = functools.partial(QuietHandler, directory=str(root))
        cls.server = launcher.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_launcher_serves_current_folder_with_no_store(self):
        with urlopen(self.origin + "/launch.html", timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
            self.assertIn(b"Opening GreenFlow", response.read())

    def test_old_file_timestamps_do_not_return_stale_conditional_responses(self):
        request = Request(self.origin + "/app.js?v=24", headers={"If-Modified-Since": "Fri, 01 Jan 2100 00:00:00 GMT"})
        with urlopen(request, timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
            self.assertEqual(response.read(), (root / "app.js").read_bytes())

    def test_favicon_serves_the_existing_icon_without_404(self):
        with urlopen(self.origin + "/favicon.ico", timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), (root / "icon.svg").read_bytes())

    def test_time_endpoint_uses_network_sample_not_server_date(self):
        sample = {"utcMs": 1791464400000, "syncedAgoSeconds": 2}
        with patch.object(launcher.INTERNET_CLOCK, "sample", return_value=sample):
            with urlopen(self.origin + "/api/time", timeout=5) as response:
                self.assertEqual(response.headers["Cache-Control"], "no-store")
                self.assertEqual(launcher.json.loads(response.read()), sample)

    def test_time_endpoint_does_not_claim_verification_when_offline(self):
        with patch.object(launcher.INTERNET_CLOCK, "sample", return_value=None):
            with self.assertRaises(HTTPError) as raised:
                urlopen(self.origin + "/api/time", timeout=5)
            self.assertEqual(raised.exception.code, 503)


class InternetClockTests(unittest.TestCase):
    def response(self, date="Thu, 08 Oct 2026 15:00:00 GMT", age="0"):
        response = Mock()
        response.headers = {"Date": date, "Age": age}
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        return response

    def test_network_time_advances_without_using_device_clock(self):
        clock = launcher.InternetClock()
        with patch.object(launcher, "urlopen", return_value=self.response()) as fetch, patch.object(launcher.time, "monotonic", side_effect=[10, 10.2, 10.2, 70.2]), patch.object(launcher.time, "time", side_effect=AssertionError("Device clock must not be used")):
            self.assertTrue(clock.refresh())
            sample = clock.sample()
        self.assertAlmostEqual(sample["utcMs"], 1791471600000 + 100 + 60000)
        self.assertAlmostEqual(sample["syncedAgoSeconds"], 60)
        request = fetch.call_args.args[0]
        self.assertEqual(request.get_method(), "HEAD")
        self.assertTrue(request.full_url.startswith("https://"))
        self.assertIn("greenflow-time=", request.full_url)

    def test_provider_failure_falls_back_to_another_https_source(self):
        clock = launcher.InternetClock()
        with patch.object(launcher, "urlopen", side_effect=[OSError("Unavailable"), self.response()]):
            self.assertTrue(clock.refresh())
        self.assertIsNotNone(clock.sample())

    def test_old_cached_or_malformed_network_dates_are_rejected(self):
        for response in [self.response(age="3600"), self.response(date="bad-date"), self.response(date="Thu, 08 Oct 2015 15:00:00 GMT"), self.response(age="nan")]:
            with self.subTest(headers=response.headers):
                clock = launcher.InternetClock()
                with patch.object(launcher, "urlopen", return_value=response):
                    self.assertFalse(clock.refresh())
                self.assertIsNone(clock.sample())

    def test_failed_refresh_keeps_previously_synced_time(self):
        clock = launcher.InternetClock()
        with patch.object(launcher, "urlopen", return_value=self.response()):
            self.assertTrue(clock.refresh())
        before = clock.sample()["utcMs"]
        with patch.object(launcher, "urlopen", side_effect=OSError("Offline")):
            self.assertFalse(clock.refresh())
        self.assertGreaterEqual(clock.sample()["utcMs"], before)


if __name__ == "__main__":
    unittest.main()
