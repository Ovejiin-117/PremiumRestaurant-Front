# Funciones compartidas por instalar.ps1 e iniciar.ps1.
# Todas las rutas se calculan a partir de la ubicacion de este archivo,
# asi el proyecto funciona sin importar en que carpeta o PC se clone.
# (Mantener este archivo solo con caracteres ASCII: Windows PowerShell 5.1
#  interpreta mal los acentos en archivos sin BOM.)

$ErrorActionPreference = 'Stop'

$RaizProyecto      = Split-Path -Parent $PSScriptRoot
$CarpetaFrontend   = Join-Path $RaizProyecto 'frontend'
$MarcaInstalacion  = Join-Path $CarpetaFrontend 'node_modules\.instalado'
# Vite 7 requiere Node ^20.19.0 o >=22.12.0
$NodeVersionMinima = [version]'20.19.0'

function Escribir-Paso($texto)  { Write-Host ''; Write-Host "==> $texto" -ForegroundColor Cyan }
function Escribir-Ok($texto)    { Write-Host "    [OK] $texto" -ForegroundColor Green }
function Escribir-Aviso($texto) { Write-Host "    [AVISO] $texto" -ForegroundColor Yellow }
function Escribir-Error($texto) { Write-Host "    [ERROR] $texto" -ForegroundColor Red }

function Actualizar-Path {
    # Relee el PATH del sistema y del usuario. Sirve cuando algo se acaba de
    # instalar y esta ventana todavia tiene el PATH viejo. Tambien agrega las
    # carpetas de instalacion estandar por si no quedaron registradas.
    $maquina = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $usuario = [Environment]::GetEnvironmentVariable('Path', 'User')
    $extras  = @(
        (Join-Path $env:ProgramFiles 'nodejs'),
        (Join-Path $env:ProgramFiles 'Git\cmd')
    ) | Where-Object { Test-Path $_ }
    $env:Path = (@($maquina, $usuario, $env:Path) + $extras | Where-Object { $_ }) -join ';'
}

function Obtener-VersionNode {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
    try { return [version](& node -p 'process.versions.node') } catch { return $null }
}

function Instalar-ConWinget($id, $nombre) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Escribir-Aviso "No se encontro 'winget' para instalar $nombre automaticamente."
        return
    }
    Write-Host "    Instalando $nombre con winget (puede pedir permisos de administrador)..."
    & winget install --id $id --exact --silent --accept-source-agreements --accept-package-agreements
    Actualizar-Path
}

function Asegurar-Node {
    Actualizar-Path
    $version = Obtener-VersionNode
    if ($version -and $version -ge $NodeVersionMinima) { Escribir-Ok "Node.js $version"; return }

    if ($version) { Escribir-Aviso "Node.js $version es muy viejo (se necesita $NodeVersionMinima o mayor)." }
    else          { Escribir-Aviso 'Node.js no esta instalado.' }

    Instalar-ConWinget 'OpenJS.NodeJS.LTS' 'Node.js LTS'

    $version = Obtener-VersionNode
    if (-not $version -or $version -lt $NodeVersionMinima) {
        throw 'No se pudo instalar Node.js automaticamente. Instalalo desde https://nodejs.org (version LTS), cierra esta ventana y vuelve a intentarlo.'
    }
    Escribir-Ok "Node.js $version instalado"
}

function Asegurar-Git {
    Actualizar-Path
    if (Get-Command git -ErrorAction SilentlyContinue) { Escribir-Ok (& git --version); return }

    Escribir-Aviso 'Git no esta instalado (se usa para bajar y subir cambios a GitHub).'
    Instalar-ConWinget 'Git.Git' 'Git'

    if (Get-Command git -ErrorAction SilentlyContinue) { Escribir-Ok (& git --version) }
    else { Escribir-Aviso 'No se pudo instalar Git. Instalalo desde https://git-scm.com (el programa puede correr sin Git).' }
}

function Dependencias-AlDia {
    # Las dependencias se consideran al dia si se instalaron despues del
    # ultimo cambio a package.json / package-lock.json (por ejemplo tras un git pull).
    if (-not (Test-Path $MarcaInstalacion)) { return $false }
    $fechaInstalacion = (Get-Item $MarcaInstalacion).LastWriteTime
    foreach ($archivo in 'package.json', 'package-lock.json') {
        $ruta = Join-Path $CarpetaFrontend $archivo
        if ((Test-Path $ruta) -and (Get-Item $ruta).LastWriteTime -gt $fechaInstalacion) { return $false }
    }
    return $true
}

function Instalar-Dependencias {
    Push-Location $CarpetaFrontend
    try {
        # 'npm ci' instala exactamente las versiones de package-lock.json
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            Escribir-Aviso "'npm ci' fallo; intentando con 'npm install'..."
            & npm.cmd install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) {
                throw 'No se pudieron instalar las dependencias. Si el servidor esta corriendo, cierralo y vuelve a intentar.'
            }
        }
        Set-Content -Path $MarcaInstalacion -Value (Get-Date -Format o)
        Escribir-Ok 'Dependencias instaladas'
    }
    finally { Pop-Location }
}
