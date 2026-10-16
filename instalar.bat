@echo off
title Instalar RestaurantPro
:: Prepara una PC nueva: instala Node.js, Git y las dependencias del proyecto.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\instalar.ps1"
pause
