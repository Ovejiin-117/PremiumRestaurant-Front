@echo off
title Subir Cambios a GitHub - RestaurantPro
echo ========================================================
echo          Enviando cambios a GitHub...
echo ========================================================

:: Si git no esta en el PATH de esta ventana, buscarlo en la ruta de instalacion estandar
where git >nul 2>nul || set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
where git >nul 2>nul || (
    echo  [ERROR] Git no esta instalado. Ejecuta instalar.bat primero.
    pause
    exit /b 1
)

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
