const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const verificarToken = require("../middleware/authMiddleware");
const { registrar, login, sesion, logout } = require("../controllers/authController");

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

module.exports = router;

const Admin = require("../models/Admin");

// Añade este endpoint para listar las cuentas registradas en Atlas
router.get("/users", async (req, res) => {
  try {
    const users = await Admin.find().select("nombre email role createdAt");
    return res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ mensaje: "Error al obtener las cuentas registradas." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await Admin.find().select("nombre email role createdAt");
    console.log("--- USUARIOS EN MONGODB ATLAS ---", users); // <--- Esto lo imprime en tu terminal
    return res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ mensaje: "Error al obtener las cuentas registradas." });
  }
});

router.get('/users', async (req, res) => {
    try {
        const usuarios = await User.find({}, { password: 0 }); // Excluye las contraseñas por seguridad
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});