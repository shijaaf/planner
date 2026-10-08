@echo off
setlocal
cd /d "%~dp0"
title GreenFlow Server
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8765/"
  py -m http.server 8765 --bind 0.0.0.0
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    start "" "http://localhost:8765/"
    python -m http.server 8765 --bind 0.0.0.0
  ) else (
    echo Python was not found. Install Python 3 and try again.
    pause
  )
)
