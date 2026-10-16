@echo off
title RestaurantPro
:: Corre el programa localmente (instala lo que falte automaticamente).
:: %~dp0 = carpeta donde esta este archivo, asi funciona desde cualquier ubicacion.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar.ps1" %*
if errorlevel 1 pause
