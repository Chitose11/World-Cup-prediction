@echo off
setlocal
cd /d "%~dp0"
if not defined TAVILY_API_KEY if exist "%USERPROFILE%\.codex\secrets\tavily_api_key.txt" set /p TAVILY_API_KEY=<"%USERPROFILE%\.codex\secrets\tavily_api_key.txt"
start "" "http://localhost:4173"
npm start
