@echo off
title TheVoice - AI Text-to-Speech Studio
echo ========================================================
echo   THEVOICE - AI NEURAL TEXT-TO-SPEECH STUDIO
echo ========================================================
echo Dang khoi dong Backend API (Port 5050) va Frontend (Port 5173)...
echo.

cd /d "%~dp0"
npm run dev

pause
