# Proyecto Nebula

Nebula es una plataforma web de orientación y prevención de la violencia contra las mujeres. Reúne información, herramientas de reflexión y accesos a recursos de apoyo en una interfaz que busca ser clara, privada y libre de juicios.

> **Importante:** Nebula es un proyecto informativo en desarrollo. La autoevaluación y el asistente virtual ofrecen orientación general; no son servicios de emergencia, diagnósticos ni sustitutos de atención profesional. Si existe peligro inmediato en México, llama al **911**.

## Contenido

- [Estado actual](#estado-actual)
- [Funciones disponibles](#funciones-disponibles)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Comandos del frontend](#comandos-del-frontend)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Integraciones y configuración](#integraciones-y-configuración)
- [Privacidad y seguridad](#privacidad-y-seguridad)
- [Próximos pasos](#próximos-pasos)

## Estado actual

El repositorio contiene una aplicación frontend React/Vite y una API Express. La autenticación administrativa está implementada y utiliza MongoDB; requiere que Atlas sea accesible y que las variables de entorno estén configuradas. La API informa un estado degradado si la base de datos no está disponible.

Las secciones informativas, el cuestionario y el asistente están disponibles desde la interfaz. Los reportes anónimos ya se guardan en MongoDB, generan un folio para consultar su avance y pueden gestionarse desde el panel administrativo. La vista de estadísticas del panel consulta en MongoDB los totales de autoevaluaciones completadas, reportes y socios; las incidencias se derivan de las categorías y el nivel que devuelve cada autoevaluación, sin guardar respuestas ni identidades. El Violentómetro registra únicamente los cambios de nivel que selecciona una persona y los presenta como consultas, no como detecciones de riesgo. Los gráficos cuentan datos registrados desde la incorporación de estas métricas; las demás métricas que no tienen una vista de gestión siguen siendo demostrativas. La autoevaluación es orientativa y no sustituye atención profesional. El destino del botón de salida rápida debe revisarse antes de publicar el sitio.

## Funciones disponibles

- **Inicio y navegación:** portada con accesos a las secciones principales. La navegación interna utiliza fragmentos de URL, por ejemplo `#centros` o `#ia`.
- **Autoevaluación:** diálogo con los 15 reactivos del mapeo, ponderados por nivel (Advertencia, Reacción y Peligro). Las respuestas positivas priorizan reactivos relacionados; el resultado conserva las conductas identificadas y muestra una puntuación normalizada orientativa. Al finalizar, registra en MongoDB el conteo, las categorías detectadas y el nivel general, sin almacenar respuestas ni datos personales.
- **Líneas de escucha:** información de orientación y canales de atención.
- **Centros de ayuda:** directorio y mapa de recursos de apoyo.
- **Chat global:** conversación anónima en tiempo real con mensajes temporales.
- **Rutas legales:** información general sobre derechos y opciones de acompañamiento.
- **Asistente virtual:** chat en español conectado a un workflow de n8n.
- **Chat global anónimo:** sala pública en tiempo real, con alias aleatorio temporal y mensajes guardados en MongoDB por un máximo de 24 horas.
- **Socios:** directorio público de organizaciones colaboradoras, agrupado por tipo y persistido en MongoDB; el panel administrativo permite agregar colaboradores y eliminarlos.
- **Reportes anónimos:** formulario sin cuenta que guarda tipo de violencia, lugar, descripción y evidencia opcional en MongoDB; genera un folio aleatorio que permite consultar únicamente el estado y la fecha de actualización. El panel administrativo permite revisar los datos, descargar evidencia, cambiar el estado y eliminar reportes.
- **Administración:** registro público de cuentas con rol `usuario` por defecto, inicio de sesión contra MongoDB, validación de sesión al abrir el panel y cierre de sesión. `carlos@nebula.com` recibe el rol administrador al iniciar sesión y no se puede degradar ni eliminar desde el panel. Las contraseñas se almacenan con hash bcrypt y la sesión se conserva en una cookie `HttpOnly`.
- **Panel administrativo:** gestión de recursos de orientación, colaboradores, solicitudes de orientación y reportes anónimos guardados en MongoDB; los administradores pueden consultar, actualizar o eliminar los datos según el módulo. La vista de estadísticas muestra en vivo los totales, la incidencia por categoría de autoevaluación y el conteo de niveles consultados en el Violentómetro.
- **Reportes:** formularios visuales de creación de reportes anónimos y consulta por folio; todavía no se envían ni recuperan desde la API.
- **Preferencia de tema:** alternancia entre modo claro y oscuro, guardada localmente en el navegador.

## Tecnologías

- React 19
- Vite 8
- JavaScript y CSS
- Node.js y Express para la API
- MongoDB Atlas y Mongoose
- JWT, bcryptjs y express-rate-limit para la autenticación administrativa
- ESLint
- Chat de n8n cargado desde jsDelivr
- Docker Compose para despliegue local de frontend y backend

## Requisitos

- Node.js **20.19 o posterior** o **22.12 o posterior**.
- npm.
- Un navegador moderno.
- Opcional: Docker con Docker Compose para iniciar el frontend y el backend en contenedores.

## Instalación y ejecución

Los comandos del frontend se ejecutan desde la carpeta `Frontend/`.

```sh
cd Frontend
npm install
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir la aplicación, normalmente `http://localhost:5173`.

Para iniciar la API, ejecuta desde `Backend/`:

```sh
npm install
npm start
```

La API escucha en el puerto `3000` por defecto (Render asigna `PORT` automáticamente) y `GET /health` informa si MongoDB está conectado. El proceso requiere `MONGODB_URI` (también se acepta `MONGO_URI`) y `JWT_SECRET`; si falta alguna variable o no es posible conectar con MongoDB, el proceso no inicia. Revisa que el clúster esté activo, que las credenciales sean correctas y que las direcciones de salida de Render estén permitidas en **Atlas → Security → Network Access**.

Para habilitar el acceso administrativo, configura en `Backend/.env`:

- `JWT_SECRET`: una clave aleatoria de al menos 32 caracteres; no la compartas ni la incluyas en el frontend.
- `FRONTEND_URL`: orígenes autorizados separados por comas. Los orígenes locales (`localhost`) y las direcciones IPv4 privadas de la LAN en los puertos `5173` y `8080` se autorizan automáticamente para pruebas. En producción, indica el origen exacto del frontend.
- En producción, configura `NODE_ENV=production` y sirve el sitio mediante HTTPS. Con el proxy de Vercel, las llamadas a la API son del mismo origen y la cookie de sesión usa `Secure` con `SameSite=Lax`.

El registro público acepta cualquier correo electrónico válido y crea cuentas con rol `usuario`. Los permisos institucionales y administrativos se pueden asignar desde la gestión de cuentas; `ADMIN_EMAILS` no se utiliza.

Los recursos de orientación y la red de colaboradores se inicializan en MongoDB con los datos actuales en el primer arranque que encuentra cada colección vacía. La API los ofrece públicamente en `GET /api/resources` y `GET /api/partners`; agregar, editar y eliminar elementos requiere una sesión administrativa.

Puedes generar `JWT_SECRET` desde `Backend/` con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` y guardarlo como variable secreta en el proveedor de despliegue. `Backend/.env.example` muestra las variables requeridas para desarrollo local.

En desarrollo, el frontend usa `http://<host-del-frontend>:3000`. En producción, las llamadas usan rutas relativas `/api` y `Frontend/vercel.json` las reenvía al servicio de Render; así las cookies de sesión permanecen bajo el mismo origen del frontend.

### Despliegue del backend en Render

El archivo `render.yaml` configura un Web Service con `Backend/` como directorio raíz, `npm ci` como build, `npm start` como comando de inicio y `/health` como health check. Para desplegarlo:

1. En Render, crea un **Blueprint** conectado a este repositorio y confirma la configuración de `render.yaml`.
2. Completa `MONGODB_URI` con la URI de MongoDB Atlas y `FRONTEND_URL` con el origen exacto de Vercel (por ejemplo, `https://tu-sitio.vercel.app`). Render genera `JWT_SECRET`.
3. En MongoDB Atlas, habilita el acceso de red desde el servicio y confirma que la URI y el usuario de base de datos sean válidos.
4. Espera a que `/health` responda `200`. Si Render asigna una URL distinta de `https://nebularoto.onrender.com`, actualiza el destino de `Frontend/vercel.json` con la URL asignada.

No agregues secretos al repositorio. Las variables de Render se configuran en el panel y el puerto lo asigna el proveedor.

### Acceso desde otras computadoras de la red local

1. Inicia el frontend con `npm.cmd --prefix Frontend run dev` y la API con `npm.cmd --prefix Backend start` en la computadora que actuará como servidor.
2. Averigua su dirección IPv4 local ejecutando `ipconfig` en PowerShell.
3. Desde otra computadora conectada a la misma red, abre `http://<IP-LOCAL-DEL-SERVIDOR>:5173` (por ejemplo, `http://192.168.1.25:5173`).
4. Si no carga, permite los puertos TCP `5173` y `3000` en el Firewall de Windows para redes privadas. El frontend usará automáticamente esa misma IP para autenticación y chat.

El acceso descrito es solo para la red local; no publiques esos puertos en el router para exponer el sistema a Internet.

### API de autenticación administrativa

| Método | Ruta | Función |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registra un correo autorizado y crea una sesión. Requiere nombre, correo, contraseña y aceptación de términos. |
| `POST` | `/api/auth/login` | Valida las credenciales y crea una sesión. |
| `GET` | `/api/auth/me` | Valida la cookie de sesión y devuelve el perfil administrativo. |
| `POST` | `/api/auth/logout` | Elimina la cookie de sesión. |

Los intentos de inicio de sesión y registro están limitados por IP. Las credenciales no deben guardarse ni exponerse en el frontend; `Backend/.env` debe mantenerse fuera del control de versiones.

En PowerShell también puedes ejecutar los comandos desde la raíz del repositorio:

```powershell
npm.cmd --prefix Frontend install
npm.cmd --prefix Frontend run dev
```

## Comandos del frontend

Ejecuta estos comandos desde `Frontend/`:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor local de desarrollo con recarga en caliente. |
| `npm run build` | Genera la versión de producción en `Frontend/dist/`. |
| `npm run preview` | Sirve localmente el resultado compilado para revisarlo. |
| `npm run lint` | Ejecuta ESLint sobre el frontend. |

Antes de integrar cambios, valida el frontend:

```sh
npm run lint
npm run build
```

## Estructura del repositorio

```text
.
├── Backend/
│   ├── controllers/           # Lógica de autenticación administrativa
│   ├── middleware/            # Validación de sesión y rol administrativo
│   ├── models/                # Modelos de cuentas y mensajes del chat
│   ├── routes/                 # Rutas de autenticación y chat global
│   ├── server.js               # API, CORS, MongoDB y health check
│   └── package.json            # Dependencias del backend
├── Frontend/
│   ├── public/                # Recursos estáticos públicos
│   ├── src/
│   │   ├── assets/            # Imágenes y recursos gráficos
│   │   ├── App.jsx            # Navegación y composición principal
│   │   ├── App.css            # Estilos de la aplicación
│   │   ├── Autoevaluacion.jsx # Cuestionario y resultado orientativo
│   │   ├── IA.jsx              # Página del asistente virtual
│   │   ├── Admin.jsx           # Panel administrativo
│   │   ├── LoginAdmin.jsx      # Inicio de sesión
│   │   ├── SingUpAdmin.jsx     # Registro administrativo
│   │   ├── adminAuthApi.js     # Cliente de autenticación
│   │   └── ...                 # Secciones y componentes de la aplicación
│   ├── package.json           # Dependencias y scripts npm
│   └── README.md              # Instrucciones breves del frontend
└── docker-compose.yml         # Servicios de frontend y backend
```

## Integraciones y configuración

### Asistente de n8n

La página de IA carga `@n8n/chat` y sus estilos desde jsDelivr y se conecta a un webhook configurado en `Frontend/src/IA.jsx`. Para que el chat pueda intercambiar mensajes:

1. Activa el workflow correspondiente en n8n.
2. En el nodo **Chat Trigger**, permite mediante CORS los orígenes donde se servirá la aplicación, tanto de desarrollo como de producción.
3. Comprueba que el webhook configurado en el frontend sea el endpoint de producción correcto.
4. Prueba el envío de un mensaje desde cada dominio permitido.

La carga del chat requiere conexión a Internet y disponibilidad de jsDelivr y del servicio de n8n. La URL del webhook está escrita en el código del frontend; antes de desplegar, considera mover la configuración a variables de entorno. Los webhooks publicados en código cliente no deben tratarse como secretos.

### MongoDB

La API se conecta a MongoDB mediante `MONGODB_URI` (o `MONGO_URI`) del entorno. `docker-compose.yml` construye el backend y el frontend, y proporciona el archivo de entorno del backend al contenedor. La disponibilidad de la API no garantiza que Atlas sea accesible: configura la lista de acceso de red de Atlas para el entorno desde donde se ejecuta el backend.

### Chat global anónimo

El chat global no requiere cuenta, correo ni nombre real. El navegador genera un alias aleatorio y lo conserva en `sessionStorage` durante esa sesión; el backend almacena únicamente el alias, el texto y las fechas de cada mensaje, sin crear perfiles ni asociar un identificador de usuaria. Los mensajes se actualizan en vivo mediante Server-Sent Events y MongoDB los elimina con un índice TTL al cumplir 24 horas. La eliminación TTL de MongoDB es automática, aunque el proceso de limpieza puede tardar un poco más de 24 horas; los mensajes vencidos no se entregan en el chat. Como medida antiabuso, el límite de 10 mensajes por minuto mantiene un contador temporal por IP en la memoria del proceso (no en MongoDB); los registros que mantenga el proveedor de alojamiento quedan fuera de la aplicación.

Para probarlo, inicia MongoDB/API local y el frontend. La opción de tema privado o anónimo no evita que una usuaria incluya información personal voluntariamente en un mensaje; la interfaz recomienda no compartirla.

Con Docker Compose instalado y `Backend/.env` configurado, los servicios se pueden iniciar y detener desde la raíz del repositorio:

```sh
docker compose up -d
docker compose down
```

El frontend se publica en el puerto `8080` y la API en el `3000`, según el compose actual. Para que las cookies de sesión funcionen en producción, configura dominios/orígenes compatibles, HTTPS y `FRONTEND_URL` según el despliegue.

## Privacidad y seguridad

- No ingreses ni compartas datos personales o información que identifique a alguien en el chat ni en los reportes anónimos.
- El chat transmite mensajes al workflow configurado en n8n; revisa sus controles de acceso, retención de datos y avisos de privacidad antes de usarlo con personas usuarias.
- La autoevaluación se presenta solo como una reflexión orientativa. La herramienta no sustituye una valoración profesional y su cálculo requiere revisión antes de cualquier uso clínico o institucional.
- Cualquier persona puede crear una cuenta con rol `usuario` y correo válido. Las cuentas públicas no reciben permisos administrativos; mantén `JWT_SECRET` fuera del frontend y del control de versiones.
- La sesión administrativa expira en ocho horas y se guarda en una cookie `HttpOnly`; en producción también requiere HTTPS para activar el atributo `Secure`.
- La autenticación protege los datos y las operaciones administrativas de los reportes. La consulta pública por folio solo devuelve el estado y la fecha de actualización; conserva el folio en un lugar seguro, porque no existe recuperación si se pierde.
- La evidencia opcional se limita a imágenes JPG, PNG o WEBP y archivos PDF de hasta 2 MB, y solo puede descargarse desde el panel autenticado. Define y comunica una política de retención y eliminación de reportes antes de usar el sistema en producción.
- Verifica el destino del botón de salida rápida y asegúrate de que sea apropiado y seguro para la población usuaria antes de cada despliegue.

## Próximos pasos

1. Añadir pruebas automatizadas para autenticación, expiración de sesión, formularios y rutas protegidas.
2. Revisar y validar con especialistas el cuestionario, su cálculo de riesgo y los recursos de apoyo.
3. Documentar privacidad, retención y operación del workflow de n8n.
4. Revisar el destino de salida rápida y la configuración de seguridad antes de cada despliegue.
