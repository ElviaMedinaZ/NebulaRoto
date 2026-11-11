const jwt = require("jsonwebtoken");
const { COOKIE_NAME } = require("../controllers/authController");

// RESPALDO DE EMERGENCIA (Debe coincidir con el del authController)
const FALLBACK_JWT_SECRET = "nebula_super_secret_jwt_key_security_2026_fallback";

// Extrae la cookie de sesión de la cabecera HTTP sin depender de almacenamiento cliente.
function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
}

// Verifica firma, audiencia y sesión activa del JWT antes de permitir acceso a rutas privadas.
function verificarToken(req, res, next) {
  const token = readCookie(req, COOKIE_NAME);
  const secret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;

  if (!secret || secret.length < 32) {
    return res.status(503).json({ mensaje: "La autenticación no está configurada correctamente." });
  }
  if (!token) {
    return res.status(401).json({ mensaje: "Inicia sesión para continuar." });
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "nebula-api",
      audience: "nebula-admin"
    });

    // Permitir acceso a cualquier usuario autenticado válido (admin o institucional)
    if (!payload || typeof payload.sub !== "string") {
      return res.status(403).json({ mensaje: "No tienes permiso para acceder." });
    }

    // Inyecta los datos del usuario en la petición
    req.admin = { id: payload.sub, email: payload.email, role: payload.role || "usuario" };
    return next();
  } catch (err) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: process.env.NODE_ENV === "production" ? "/" : "/api/auth"
    });
    return res.status(401).json({ mensaje: "La sesión expiró. Inicia sesión nuevamente." });
  }
}

module.exports = verificarToken;