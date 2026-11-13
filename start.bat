@echo off
setlocal

cd /d "%~dp0program"

if not exist node_modules (
  echo Installing dependencies, this may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Starting Legenchess...
start "Legenchess" /min cmd /c "npm run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173

endlocal
