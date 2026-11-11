const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const { getRole } = require("../controllers/authController");

function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ mensaje: "La base de datos no está disponible." });
    }

    try {
      const account = await Admin.findById(req.admin.id).select("email role");
      if (!account) {
        return res.status(401).json({ mensaje: "La cuenta ya no existe." });
      }

      const role = getRole(account);
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ mensaje: "No tienes permisos para acceder a este recurso." });
      }

      req.admin.role = role;
      req.admin.email = account.email;
      return next();
    } catch (error) {
      console.error("No se pudieron verificar los permisos de acceso:", error.message);
      return res.status(500).json({ mensaje: "No se pudieron verificar los permisos." });
    }
  };
}

module.exports = authorizeRoles;
