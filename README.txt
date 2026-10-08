GREENFLOW LOCAL — v21

Run
- Windows: double-click start-greenflow.bat and leave the server window open.
- Linux/macOS: from this directory run:
  python3 -m http.server 8765 --bind 127.0.0.1
- The app uses localhost:8765. Keep the same hostname, port, and browser profile
  to retain your data. The static app needs no npm installation to run.

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
- Today refreshes at local midnight, on reopening, and after returning to the tab.
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
- The v21 service worker refreshes the offline shell and removes old shell caches
  without touching localStorage. After updating files, reload while online; existing
  open tabs may need a second reload after the new service worker activates.
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
- The tests serve their own temporary local server and use isolated browser contexts.
  They do not use or clear your real browser's planner data.
