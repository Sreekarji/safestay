@echo off
title SafeStay Running
color 0A

cd /d "%~dp0"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Starting SafeStay...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Kill existing processes on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: Start backend in new window
echo [1/2] Starting backend on :5000
start "SafeStay Backend" cmd /k "cd /d %~dp0server && npx tsx src/index.ts"

:: Wait for backend
echo       Waiting for backend...
:waitloop
timeout /t 2 /nobreak >nul
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 goto waitloop
echo       Backend ready!

:: Start frontend in new window
echo [2/2] Starting frontend on :5173
start "SafeStay Frontend" cmd /k "cd /d %~dp0client && npm run dev"

:: Wait a bit
timeout /t 4 /nobreak >nul

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   SafeStay is running!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000/api
echo.
echo   Login:
echo     Student:  rahul@iiit.ac.in / Password123!
echo     Owner:    owner1@example.com / Password123!
echo.
echo   Close the two terminal windows to stop.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Open browser
start http://localhost:5173

pause
