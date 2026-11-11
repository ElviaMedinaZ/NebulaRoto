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
peticiones `/api/*` a `https://nebularoto.onrender.com`. No agregues el
puerto `10000`: Render publica el servicio por HTTPS en el puerto estándar.

En desarrollo, el frontend llama a `http://<host>:3000`. En producción, utiliza
rutas relativas `/api`, que Vercel reenvía al backend de Render. Si cambia la URL
del servicio, actualiza el destino en `vercel.json`.

Comandos disponibles:

- `npm run build`: genera la versión de producción en `Frontend/dist`.
- `npm run preview`: sirve localmente la versión de producción.
- `npm run lint`: valida el código del frontend.
