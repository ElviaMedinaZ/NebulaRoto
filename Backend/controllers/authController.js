const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// RESPALDOS DE EMERGENCIA (Se usan si no están definidos en el entorno)
const FALLBACK_JWT_SECRET = "nebula_super_secret_jwt_key_security_2026_fallback";
const FALLBACK_ADMIN_EMAILS = "admin@nebula.com";

// Usa un nombre de cookie con prefijo estricto en producción y uno local en desarrollo.
const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-nebula_admin_session"
  : "nebula_admin_session";

// Convierte la lista de correos permitidos del entorno (o usa el respaldo) en valores normalizados.
function getAllowedAdminEmails() {
  const emailsEnv = process.env.ADMIN_EMAILS || FALLBACK_ADMIN_EMAILS;
  return emailsEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// Define atributos de cookie que reducen exposición de la sesión al navegador.
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/" // Cambiado de un operador ternario a "/" para que la cookie viva en todo el sitio local
  };
}

// Firma y establece el JWT de administrador; utiliza el respaldo si falta el secreto.
function createSession(res, admin) {
  const secret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
  
  if (!secret || secret.length < 32) {
    const error = new Error("La autenticación requiere un JWT_SECRET de al menos 32 caracteres.");
    error.status = 503;
    throw error;
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: "admin" },
    secret,
    { expiresIn: "8h", issuer: "nebula-api", audience: "nebula-admin" }
  );

  res.cookie(COOKIE_NAME, token, { ...getCookieOptions(), maxAge: SESSION_DURATION_MS });
}

// Expone solo los datos de perfil que el cliente necesita, nunca el hash de contraseña.
function publicAdmin(admin) {
  return { id: admin.id, nombre: admin.nombre, email: admin.email };
}

// Aplica los límites de longitud requeridos por bcrypt para la contraseña.
function validPassword(password) {
  return typeof password === "string"
    && password.length >= 12
    && Buffer.byteLength(password, "utf8") <= 72;
}

// Valida, autoriza y crea una cuenta; después de registrarla abre su sesión.
const registrar = async (req, res) => {
  const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;

  if (nombre.length < 2 || nombre.length > 100) {
    return res.status(400).json({ mensaje: "Escribe un nombre de entre 2 y 100 caracteres." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ mensaje: "Escribe un correo electrónico válido." });
  }
  if (!validPassword(password)) {
    return res.status(400).json({
      mensaje: "La contraseña debe tener al menos 12 caracteres y no exceder 72 bytes."
    });
  }
  if (req.body?.aceptaTerminos !== true) {
    return res.status(400).json({ mensaje: "Debes aceptar los términos de uso y privacidad." });
  }

  const allowedEmails = getAllowedAdminEmails();
  if (allowedEmails.length === 0) {
    return res.status(503).json({ mensaje: "El registro administrativo no está configurado." });
  }
  if (!allowedEmails.includes(email)) {
    return res.status(403).json({ mensaje: "Este correo no está autorizado para crear una cuenta administrativa." });
  }

  try {
    const activeSecret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
    if (!activeSecret || activeSecret.length < 32) {
      return res.status(503).json({ mensaje: "La autenticación no está configurada correctamente." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      nombre,
      email,
      passwordHash,
      terminosAceptadosEn: new Date()
    });
    createSession(res, admin);
    return res.status(201).json({
      mensaje: "Cuenta administrativa creada correctamente.",
      usuario: publicAdmin(admin)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe una cuenta con ese correo." });
    }
    if (error.status === 503) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error("No se pudo registrar la cuenta administrativa:", error.name);
    return res.status(500).json({ mensaje: "No se pudo completar el registro." });
  }
};

// Busca una cuenta, compara el hash y crea una cookie cuando las credenciales son válidas.
const login = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
    || typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ mensaje: "Ingresa un correo y una contraseña válidos." });
  }

  try {
    const activeSecret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
    if (!activeSecret || activeSecret.length < 32) {
      return res.status(503).json({ mensaje: "La autenticación no está configurada correctamente." });
    }
    if (getAllowedAdminEmails().length === 0) {
      return res.status(503).json({ mensaje: "El registro administrativo no está configurado." });
    }
    const admin = await Admin.findOne({ email }).select("+passwordHash");
    const passwordIsValid = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false;

    if (!passwordIsValid || !getAllowedAdminEmails().includes(email)) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    createSession(res, admin);
    return res.json({
      mensaje: "Inicio de sesión correcto.",
      usuario: publicAdmin(admin)
    });
  } catch (error) {
    if (error.status === 503) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error("No se pudo iniciar sesión:", error.name);
    return res.status(500).json({ mensaje: "No se pudo completar el inicio de sesión." });
  }
};

// Confirma que el administrador de la cookie siga existiendo y autorizado.
const sesion = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("_id nombre email");
    if (!admin || !getAllowedAdminEmails().includes(admin.email)) {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: process.env.NODE_ENV === "production" ? "/" : "/api/auth"
      });
      return res.status(401).json({ mensaje: "La sesión ya no es válida." });
    }
    return res.json({ usuario: publicAdmin(admin) });
  } catch (error) {
    console.error("No se pudo validar la sesión administrativa:", error.name);
    return res.status(500).json({ mensaje: "No se pudo validar la sesión." });
  }
};

// Borra la cookie de autenticación para cerrar la sesión actual.
const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: process.env.NODE_ENV === "production" ? "/" : "/api/auth"
  });
  return res.status(200).json({ mensaje: "Sesión cerrada correctamente." });
};

module.exports = { registrar, login, sesion, logout, COOKIE_NAME };