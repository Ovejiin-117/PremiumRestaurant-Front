# RestaurantPro

## Empezar en una PC nueva (Windows)

1. Clona o descarga el repositorio en cualquier carpeta.
2. Doble clic en **`instalar.bat`**: instala Node.js LTS y Git si faltan (con `winget`) y las dependencias del proyecto.
3. Doble clic en **`iniciar.bat`**: arranca el servidor y abre la app en `http://localhost:5173`.

`iniciar.bat` también instala solo lo que haga falta. Por ejemplo, después de un `git pull` que cambie `package.json`, reinstala las dependencias antes de arrancar.

| Archivo | Para qué sirve |
| --- | --- |
| `instalar.bat` | Prepara la PC (una sola vez). |
| `iniciar.bat` | Corre el programa localmente. Puerto distinto: `iniciar.bat -Puerto 3000`. |
| `subir_cambios.bat` | Hace `git push` a GitHub. |
| `scripts/` | La lógica de los `.bat` (PowerShell). Todas las rutas son relativas a la carpeta del proyecto. |

## Comandos manuales (dentro de `frontend/`)

```bash
npm ci          # instalar dependencias exactas del package-lock.json
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run lint    # revisar el código
```

Requiere Node.js `^20.19.0` o `>=22.12.0`.
