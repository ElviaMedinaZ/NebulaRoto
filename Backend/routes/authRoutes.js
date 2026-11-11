const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const router = express.Router();
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const { registrar, login, sesion, logout, ADMIN_EMAIL, getRole } = require("../controllers/authController");
const Admin = require("../models/Admin");

// Limita los intentos de login y registro para reducir ataques de fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." }
});

// Publica acceso y registro; exige sesión válida para consultar el perfil.
router.post("/register", loginLimiter, registrar);
router.post("/login", loginLimiter, login);
router.get("/me", verificarToken, sesion);
router.post("/logout", logout);

router.get("/users", verificarToken, authorizeRoles("admin"), async (_req, res) => {
  try {
    const users = (await Admin.find().select("nombre email role createdAt"))
      .map((user) => ({ ...user.toObject(), role: getRole(user) }));
    return res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ mensaje: "Error al obtener las cuentas registradas." });
  }
});

router.put("/users/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { nombre, email, role } = req.body || {};
  const updates = {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ mensaje: "El identificador del usuario no es válido." });
  }
  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim().length < 2 || nombre.trim().length > 100) {
      return res.status(400).json({ mensaje: "El nombre debe tener entre 2 y 100 caracteres." });
    }
    updates.nombre = nombre.trim();
  }
  if (email !== undefined) {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ mensaje: "Escribe un correo electrónico válido." });
    }
    updates.email = normalizedEmail;
  }
  if (role !== undefined) {
    if (!["admin", "institucional", "usuario"].includes(role)) {
      return res.status(400).json({ mensaje: "Selecciona un rol válido." });
    }
    updates.role = role;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ mensaje: "No se recibieron cambios para guardar." });
  }

  try {
    const existingUser = await Admin.findById(id).select("email role");
    if (!existingUser) {
      return res.status(404).json({ mensaje: "No se encontró el usuario." });
    }
    if (existingUser.email?.toLowerCase() === ADMIN_EMAIL
      && ((updates.email !== undefined && updates.email !== ADMIN_EMAIL)
        || (updates.role !== undefined && updates.role !== "admin"))) {
      return res.status(400).json({ mensaje: "No se puede cambiar el correo ni quitar el rol del administrador principal." });
    }

    const usuario = await Admin.findByIdAndUpdate(id, { $set: updates }, {
      new: true,
      runValidators: true
    }).select("nombre email role createdAt");
    if (!usuario) {
      return res.status(404).json({ mensaje: "No se encontró el usuario." });
    }
    return res.json({ usuario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe una cuenta con ese correo." });
    }
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ mensaje: "No se pudo actualizar el usuario." });
  }
});

router.delete("/users/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ mensaje: "El identificador del usuario no es válido." });
  }
  if (id === req.admin.id) {
    return res.status(400).json({ mensaje: "No puedes eliminar tu propia cuenta desde esta pantalla." });
  }

  try {
    const existingUser = await Admin.findById(id).select("email");
    if (!existingUser) {
      return res.status(404).json({ mensaje: "No se encontró el usuario." });
    }
    if (existingUser.email?.toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ mensaje: "No se puede eliminar la cuenta del administrador principal." });
    }

    const usuario = await Admin.findByIdAndDelete(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "No se encontró el usuario." });
    }
    return res.json({ mensaje: "Usuario eliminado correctamente.", id });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({ mensaje: "No se pudo eliminar el usuario." });
  }
});

module.exports = router;