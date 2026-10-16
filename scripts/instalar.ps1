# Prepara una PC nueva para trabajar en RestaurantPro:
# instala Node.js y Git si faltan, y las dependencias de npm del frontend.

. (Join-Path $PSScriptRoot 'entorno.ps1')

try {
    Write-Host '========================================================'
    Write-Host '        Instalando entorno de RestaurantPro'
    Write-Host '========================================================'

    Escribir-Paso '1/3 Verificando Node.js'
    Asegurar-Node

    Escribir-Paso '2/3 Verificando Git'
    Asegurar-Git

    Escribir-Paso '3/3 Instalando dependencias del proyecto'
    Instalar-Dependencias

    Write-Host ''
    Write-Host '========================================================' -ForegroundColor Green
    Write-Host '  Listo! Ejecuta iniciar.bat para correr el programa.' -ForegroundColor Green
    Write-Host '========================================================' -ForegroundColor Green
    exit 0
}
catch {
    Escribir-Error $_.Exception.Message
    exit 1
}
