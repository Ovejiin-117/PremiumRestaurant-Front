@echo off
title RestaurantPro
echo ========================================================
echo          Iniciando RestaurantPro...
echo ========================================================

:: Si node no esta en PATH, verificar ruta en cache de usuario
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin" (
        set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
    )
)

cd /d "%~dp0frontend"

:: Abrir ventana de la aplicacion en Edge o navegador predeterminado
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:5173" 2>nul || start "" "http://localhost:5173"

:: Iniciar el servidor local
node .\node_modules\vite\bin\vite.js --host --port 5173
pause
