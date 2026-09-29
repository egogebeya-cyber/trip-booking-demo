@echo off
title Negus Events - dev server (port 3001)
cd /d "%~dp0"
echo.
echo Starting Negus Events at http://127.0.0.1:3001/
echo Keep this window open while you use the site.
echo.
if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto fail
)
call npm run dev
goto end
:fail
echo.
echo Failed to start. Install Node.js 20+ and run: node -v
pause
:end
