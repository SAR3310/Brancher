@echo off
REM Brancher - Start both server and client
REM This script opens two command windows for server and client

echo Starting Brancher Application...
echo.
echo This will open 2 command windows:
echo  1. Backend Server (Port 3000)
echo  2. Frontend Dev Server (Port 5173)
echo.

cd /d "%~dp0"

REM Start server in new window
echo Starting Backend Server...
start "Brancher Server" cmd /k npm start

REM Wait a bit for server to start
timeout /t 3 /nobreak

REM Start client in new window
echo Starting Frontend Dev Server...
start "Brancher Client" cmd /k cd client ^& npm run dev

echo.
echo Applications starting...
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Open http://localhost:5173 in your browser when ready!
