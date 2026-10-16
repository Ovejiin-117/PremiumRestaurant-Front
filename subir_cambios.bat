@echo off
title Subir Cambios a GitHub - RestaurantPro
echo ========================================================
echo          Enviando cambios a GitHub...
echo ========================================================

set "GIT_PATH=C:\Users\Ovejiin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd"
set "PATH=%GIT_PATH%;%PATH%"

cd /d "%~dp0"

git push origin main

echo.
echo ========================================================
if %errorlevel% equ 0 (
    echo  [EXITO] Los cambios se subieron correctamente a GitHub!
) else (
    echo  [AVISO] Si te pidio iniciar sesion, completa el inicio en tu navegador.
)
echo ========================================================
echo.
pause
