@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-package.ps1" %*
if errorlevel 1 (
  echo.
  echo Verification failed.
  pause
  exit /b 1
)
echo.
echo Verification passed.
pause
