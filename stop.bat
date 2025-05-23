@echo off
echo Stopping all servers...

taskkill /F /IM node.exe
taskkill /F /IM cmd.exe

echo All servers stopped.