@echo off
REM Webhook Integration System - Quick Start Script
REM Windows Batch File

echo ============================================================
echo      ChatGPT-Style Webhook Integration System
echo ============================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed
        echo Please make sure Node.js is installed: https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed
)

echo.
echo [2/3] Starting webhook server...
echo.
echo Server will start on: http://localhost:3000
echo.
echo Available endpoints:
echo   - POST   /webhook
echo   - GET    /health
echo   - GET    /webhook/conversations
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

REM Start the server
call npm start

pause
