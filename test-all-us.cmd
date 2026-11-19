@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==================================================
echo   JobConnect US-01 to US-05 - Full test runner
echo   Backend  : in-memory MongoDB - no MongoDB install needed
echo   Frontend : requires Chrome - Karma + ChromeHeadless
echo ==================================================
echo.

set BPASS=0
set BFAIL=0
set FPASS=0
set FFAIL=0

call :test_us "us01-register-candidat"
call :test_us "us02-register-entreprise"
call :test_us "us03-login"
call :test_us "us04-logout"
call :test_us "us05-role-spaces"

echo ==================================================
echo   SUMMARY
echo   Backend  : !BPASS!/5 passed, !BFAIL!/5 failed
echo   Frontend : !FPASS!/5 passed, !FFAIL!/5 failed
echo ==================================================

set /a TOTFAIL=BFAIL+FFAIL
if !TOTFAIL! gtr 0 (
  endlocal
  exit /b 1
) else (
  endlocal
  exit /b 0
)

:test_us
set "UNAME=%~1"
echo ==================================================
echo   %UNAME%
echo ==================================================
if exist "%UNAME%\backend\package.json" (
  call :test_backend "%UNAME%"
) else (
  echo [SKIP] %UNAME% - no backend folder
)
if exist "%UNAME%\frontend\package.json" (
  call :test_frontend "%UNAME%"
)
echo.
goto :eof

:test_backend
set "UNAME=%~1"
pushd "%UNAME%\backend"
echo [backend] Installing dependencies...
call npm install --no-audit --no-fund
call npm install --no-save mongodb-memory-server --no-audit --no-fund
rem Copy the test runner into THIS backend folder so node can find mongodb-memory-server
copy "%~dp0run-backend-tests.js" "run-backend-tests.js" /y >nul
echo.
echo [backend] Running tests with in-memory MongoDB...
call node run-backend-tests.js
if !errorlevel! equ 0 (
  echo.
  echo [PASS] %UNAME% backend
  set /a BPASS+=1
) else (
  echo.
  echo [FAIL] %UNAME% backend
  set /a BFAIL+=1
)
del run-backend-tests.js 2>nul
popd
goto :eof

:test_frontend
set "UNAME=%~1"
pushd "%UNAME%\frontend"
echo.
echo [frontend] Installing dependencies - this takes 1-2 minutes
call npm install --no-audit --no-fund
echo [frontend] Running Angular tests - headless Chrome
call npm test
if !errorlevel! equ 0 (
  echo [PASS] %UNAME% frontend
  set /a FPASS+=1
) else (
  echo [FAIL] %UNAME% frontend - check that Chrome is installed
  set /a FFAIL+=1
)
popd
goto :eof
