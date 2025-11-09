@echo off
chcp 65001
echo.
echo ========================================
echo    Starter Middagstilbud Dev Server
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo ========================================
echo.

REM Start backend i nytt terminal-vindu
start "Middagstilbud Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Vent litt slik at backend får starte først
timeout /t 3 /nobreak > nul

REM Start frontend i nytt terminal-vindu
start "Middagstilbud Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Begge servere starter nå...
echo Trykk en tast for å lukke dette vinduet
pause > nul
