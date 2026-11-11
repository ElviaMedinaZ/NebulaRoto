const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const ADMIN_EMAIL = "carlos@nebula.com";

// Usa un nombre de cookie con prefijo estricto en producción y uno local en desarrollo.
const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-nebula_admin_session"
  : "nebula_admin_session";

// Define atributos de cookie que reducen exposición de la sesión al navegador.
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  };
}

// Firma y establece el JWT de administrador.
function createSession(res, admin) {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.length < 32) {
    const error = new Error("La autenticación requiere un JWT_SECRET de al menos 32 caracteres.");
    error.status = 503;
    throw error;
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: getRole(admin) },
    secret,
    { expiresIn: "8h", issuer: "nebula-api", audience: "nebula-admin" }
  );

  res.cookie(COOKIE_NAME, token, { ...getCookieOptions(), maxAge: SESSION_DURATION_MS });
}

function getRole(admin) {
  return admin.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : (admin.role || "usuario");
}

// Aplica los límites de longitud requeridos por bcrypt para la contraseña.
function validPassword(password) {
  return typeof password === "string"
    && password.length >= 12
    && Buffer.byteLength(password, "utf8") <= 72;
}

// Permite que cualquier persona registre una cuenta institucional.
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

  try {
    const activeSecret = process.env.JWT_SECRET;
    if (!activeSecret || activeSecret.length < 32) {
      return res.status(503).json({ mensaje: "La autenticación no está configurada correctamente." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      nombre,
      email,
      passwordHash,
      role: "usuario",
      terminosAceptadosEn: new Date()
    });

    createSession(res, admin);
    return res.status(201).json({
      mensaje: "Cuenta creada correctamente.",
      usuario: publicAdmin(admin)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe una cuenta con ese correo." });
    }
    if (error.status === 503) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error("No se pudo registrar la cuenta:", error);
    return res.status(500).json({ mensaje: "No se pudo completar el registro." });
  }
};

// Busca una cuenta en la base de datos, compara el hash y abre sesión si es válida.
const login = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
    || typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ mensaje: "Ingresa un correo y una contraseña válidos." });
  }

  try {
    const activeSecret = process.env.JWT_SECRET;
    if (!activeSecret || activeSecret.length < 32) {
      return res.status(503).json({ mensaje: "La autenticación no está configurada correctamente." });
    }

    // Busca directamente en MongoDB Atlas incluyendo el hash protegido
    const admin = await Admin.findOne({ email }).select("+passwordHash");
    const passwordIsValid = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false;

    if (!passwordIsValid) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    if (admin.email?.toLowerCase() === ADMIN_EMAIL && admin.role !== "admin") {
      await Admin.findByIdAndUpdate(admin.id, { $set: { role: "admin" } }, { runValidators: true });
      admin.role = "admin";
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
    console.error("No se pudo iniciar sesión:", error);
    return res.status(500).json({ mensaje: "No se pudo completar el inicio de sesión." });
  }
};

const sesion = async (req, res) => {
  try {
    const usuario = await Admin.findById(req.admin.id).select("nombre email role");
    
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (usuario.email?.toLowerCase() === ADMIN_EMAIL && usuario.role !== "admin") {
      await Admin.findByIdAndUpdate(usuario.id, { $set: { role: "admin" } }, { runValidators: true });
      usuario.role = "admin";
    }

    return res.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: getRole(usuario)
      }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener la sesión." });
  }
};

// Borra la cookie de autenticación para cerrar la sesión actual.
const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
  return res.status(200).json({ mensaje: "Sesión cerrada correctamente." });
};

module.exports = { registrar, login, sesion, logout, COOKIE_NAME, ADMIN_EMAIL, getRole };

function publicAdmin(admin) {
  return { 
    id: admin.id, 
    nombre: admin.nombre, 
    email: admin.email, 
    role: getRole(admin)
  };
}