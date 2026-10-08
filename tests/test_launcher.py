import contextlib
import functools
import importlib.util
import io
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.request import Request, urlopen


root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("greenflow_launcher", root / "serve-greenflow.py")
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
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
        request = Request(self.origin + "/app.js?v=22", headers={"If-Modified-Since": "Fri, 01 Jan 2100 00:00:00 GMT"})
        with urlopen(request, timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
            self.assertEqual(response.read(), (root / "app.js").read_bytes())


if __name__ == "__main__":
    unittest.main()
