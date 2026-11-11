# Frontend de Nebula

Aplicación de una sola página construida con React y Vite.

Desde esta carpeta, ejecuta:

```sh
npm install
npm run dev
```

## Despliegue en Vercel

En Vercel, configura `Frontend` como **Root Directory**. Usa el comando de build
`npm run build` y el directorio de salida `dist`. `vercel.json` reenvía las
peticiones `/api/*` a `https://proyecto-nebula-3.onrender.com`; no agregues el
puerto `10000`, ya que Render lo utiliza internamente y publica la API por HTTPS
en el puerto estándar.

Temporalmente, el frontend llama directamente a `http://<host>:3000` tanto en
desarrollo como en builds. Inicia el backend en el puerto `3000`; para pruebas
desde otra computadora, abre el frontend con la IP del equipo que ejecuta la API.
Esta configuración no utiliza el proxy de Vercel ni la API de Render.

Comandos disponibles:

- `npm run build`: genera la versión de producción en `Frontend/dist`.
- `npm run preview`: sirve localmente la versión de producción.
- `npm run lint`: valida el código del frontend.
