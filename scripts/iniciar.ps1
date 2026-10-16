# Corre RestaurantPro localmente. Si falta Node.js o las dependencias
# estan desactualizadas (por ejemplo despues de un git pull), las instala primero.

param([int]$Puerto = 5173)

. (Join-Path $PSScriptRoot 'entorno.ps1')

function Abrir-NavegadorCuandoEsteListo($url) {
    # Espera en segundo plano a que el servidor responda y luego abre la app
    # (ventana tipo aplicacion en Edge si existe, si no el navegador predeterminado).
    Start-Job -ArgumentList $url -ScriptBlock {
        param($url)
        for ($i = 0; $i -lt 120; $i++) {
            try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null; break }
            catch { Start-Sleep -Milliseconds 500 }
        }
        $edge = @(
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
        ) | Where-Object { Test-Path $_ } | Select-Object -First 1
        if ($edge) { Start-Process $edge "--app=$url" } else { Start-Process $url }
    } | Out-Null
}

try {
    Write-Host '========================================================'
    Write-Host '              Iniciando RestaurantPro...'
    Write-Host '========================================================'

    Escribir-Paso 'Verificando Node.js'
    Asegurar-Node

    Escribir-Paso 'Verificando dependencias'
    if (Dependencias-AlDia) { Escribir-Ok 'Dependencias al dia' }
    else { Instalar-Dependencias }

    $url = "http://localhost:$Puerto"
    Escribir-Paso "Servidor en $url  (Ctrl+C para detener)"
    Abrir-NavegadorCuandoEsteListo $url

    Push-Location $CarpetaFrontend
    try {
        # --host permite abrirlo tambien desde otros dispositivos de la red local
        & npm.cmd run dev -- --host --port $Puerto --strictPort
    }
    finally { Pop-Location }
    exit $LASTEXITCODE
}
catch {
    Escribir-Error $_.Exception.Message
    exit 1
}
