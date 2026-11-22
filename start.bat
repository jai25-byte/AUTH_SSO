@echo off
cd /d "%~dp0"
echo ==========================================
echo  Starting SSO Authentication Portal
echo ==========================================

where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Bun is not installed.
    echo Please install Bun from https://bun.sh
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    bun install
)

start http://localhost:3000
bun run dev

