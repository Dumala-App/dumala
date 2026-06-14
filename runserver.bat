@echo off
setlocal

cd /d "%~dp0"
title Stack Team Manager

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or is not available in PATH.
  echo Install Node.js from https://nodejs.org/ and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo Starting Stack Team Manager at http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo The server could not be started.
pause
exit /b 1
