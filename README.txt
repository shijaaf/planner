GREENFLOW LOCAL — v24

Run
- Windows: double-click start-greenflow.bat in the current extracted folder and
  leave the server window open. It starts the server before opening the browser.
- Linux/macOS: from this directory run:
  python3 serve-greenflow.py
- For a server without opening a browser, add --no-browser.
- The app uses localhost:8765. Keep the same hostname, port, and browser profile
  to retain your data. The static app needs no npm installation to run.

If the launcher opens an old app
- Close every old GreenFlow server window and GreenFlow browser tab.
- Download the latest ZIP (or git pull) and extract all files into the folder you
  intend to use. Run that folder's start-greenflow.bat; the console prints the
  exact folder being served. The sidebar should show v24.
- If port 8765 is occupied, the launcher stops with instructions instead of
  opening an older server. It does not terminate another program automatically.
- The launch page refreshes only GreenFlow's offline app files. It keeps saved
  tasks/logs in localStorage and does not clear browser site data.

Plans and work logs
- Click a plan in Today or the week/month calendar to change its title, date,
  time, planned duration, or note.
- Click Log time on a plan to record actual time. Planned duration and completion
  are separate from actual time; checking a plan complete does not log time.
- Plan logs appear alongside task and routine logs in Logged and count toward
  the daily time goal. Edit an actual log from Worklog activity.
- Durations accept H:MM or whole minutes, including Persian/Arabic digits.
- Deleting a plan or routine removes its associated time logs; archiving a task
  preserves its history.

Daily refresh and saved data
- Today refreshes at Tehran midnight, on reopening, and after returning to the tab.
  Daily Focus resets on a new day; historical tasks and logs remain intact.
- Dates default to the intended day and edits preserve existing dates. Dates that
  were saved incorrectly by an older version are preserved; edit them manually.
- Existing v4/v5 data and JSON backups remain compatible. Data is stored locally
  per browser/origin; open tabs on the same origin synchronize, but devices do not.
- Export a JSON backup before clearing browser site data. If damaged stored data
  cannot be read, the app preserves it and Export backup downloads a recovery file.
  Restore a valid backup to resume saving.

Performance and offline loading
- Calendar formatters/conversions and history totals are cached. Only the visible
  view renders after changes; hidden views refresh when opened. Timer ticks update
  the clock without rebuilding the issue selector.
- The v24 service worker fetches current app files when the server is reachable
  and uses cached files offline. The launcher repairs stale offline caches before
  opening the planner, without touching localStorage.
- Localhost supports service workers. A phone using a plain HTTP LAN address may
  require HTTPS for installation/offline support. There is no cloud sync backend.

Development checks
- Node.js 20+ and Python 3 are needed to run the browser regression tests:
  npm ci --ignore-scripts
  npm run check
  npm test
- Tests use /usr/bin/chromium when available. Otherwise install the matching browser:
  npx playwright install chromium
  Or set PLAYWRIGHT_CHROMIUM_EXECUTABLE to a Chromium executable.
- The tests include launcher/server checks and browser regressions. They serve
  their own temporary local server and use isolated browser contexts.
  They do not use or clear your real browser's planner data.

Today, reminders, and daily rollover use Tehran time regardless of the browser time zone. Calendar dates keep their selected day in all time zones.

Automatic time correction
- Use start-greenflow.bat or python3 serve-greenflow.py for independent online time.
  The launcher reads HTTPS Date headers from GitHub, falling back to Google; no
  tasks, logs, or other planner data are sent. Checks run in the background.
- Today uses that time rather than the computer date, and keeps advancing after
  a successful sync. It rechecks every 30 seconds and after sleep/reconnection.
- The date status says Internet verified, Using last synced time, or Using
  computer clock. Without internet and a trustworthy saved time, no app can
  determine the real date independently. Enable automatic date/time in Windows
  Settings > Time & language > Date & time, then click Sync now.
- A generic static server (python -m http.server) cannot provide independent
  internet time. Use the included launcher to get automatic clock correction.
- /favicon.ico redirects to the app icon, avoiding an unrelated 404 log entry.
