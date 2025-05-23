@echo off
echo Starting Data Dashboard...

:: 프로세스 ID를 저장할 임시 파일 설정
set "PID_FILE=processes.pid"

:: 기존 PID 파일이 있으면 삭제
if exist "%PID_FILE%" del "%PID_FILE%"

echo Starting backend server...
start "Backend" /B cmd /C "cd backend-nodejs && npm install && npm run dev"

timeout /t 3

echo Starting frontend server...
start "Frontend" /B cmd /C "cd frontend && npm install && npm run dev"

timeout /t 5  // 프론트엔드가 완전히 시작될 때까지 조금 더 기다립니다

echo Starting Electron app...
start "Electron" /B cmd /C "cd electron-app && npm install && npm start"

echo.
echo All services are starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8082
echo Electron app will start shortly...
echo.
echo Press Ctrl+C to stop all servers...

:loop
timeout /t 1 >nul
goto loop

:cleanup
echo.
echo Stopping all servers...
taskkill /F /FI "WINDOWTITLE eq Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Electron" >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
if exist "%PID_FILE%" del "%PID_FILE%"
exit /b

:: Ctrl+C 핸들러
:ctrlc
call :cleanup
exit /b