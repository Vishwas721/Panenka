@echo off
setlocal
title Panenka
cd /d "%~dp0"

echo.
echo   PANENKA - starting up
echo   ---------------------
echo.

rem 1. Docker must be running for the database.
docker info >nul 2>&1
if errorlevel 1 (
  echo [!] Docker is not running. Start Docker Desktop, then run this again.
  pause
  exit /b 1
)

rem 2. Install dependencies on first run.
if not exist "node_modules" (
  echo [1/4] Installing dependencies...
  call pnpm install || goto :fail
) else (
  echo [1/4] Dependencies already installed.
)

rem 3. Start PostgreSQL and wait until it accepts connections.
echo [2/4] Starting database...
docker compose up -d || goto :fail
set /a tries=0
:waitdb
docker exec panenka-postgres pg_isready -U panenka -d panenka_dev >nul 2>&1
if not errorlevel 1 goto :dbready
set /a tries+=1
if %tries% geq 30 (
  echo [!] Database did not become ready in time.
  goto :fail
)
timeout /t 2 /nobreak >nul
goto :waitdb
:dbready

rem 4. Apply any pending migrations (safe to run every time).
echo [3/4] Applying migrations...
call pnpm prisma migrate deploy || goto :fail

rem 5. Open the browser once the server has had a moment (set PANENKA_NO_BROWSER=1 to skip), then run the app.
echo [4/4] Starting Panenka at http://localhost:3000  (Ctrl+C to stop)
echo.
if not defined PANENKA_NO_BROWSER start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call pnpm dev
exit /b 0

:fail
echo.
echo [!] Startup failed. See the messages above.
pause
exit /b 1
