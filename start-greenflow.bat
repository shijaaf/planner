@echo off
setlocal
cd /d "%~dp0"
title GreenFlow Server
py -3 --version >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0serve-greenflow.py"
  goto finished
)
python --version >nul 2>nul
if not errorlevel 1 (
  python "%~dp0serve-greenflow.py"
  goto finished
)
echo Python 3 was not found. Install Python 3 and try again.
pause
exit /b 1

:finished
if errorlevel 1 pause
