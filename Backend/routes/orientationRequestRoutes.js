const express = require("express");
const mongoose = require("mongoose");
const OrientationRequest = require("../models/OrientationRequest");
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

function databaseUnavailable(res) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({ mensaje: "La base de datos no está disponible. Inténtalo más tarde." });
  return true;
}

function validateRequest(body) {
  const orientationRequest = {
    name: typeof body?.name === "string" ? body.name.trim() : "",
    email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : "",
    phone: typeof body?.phone === "string" ? body.phone.trim() : "",
    message: typeof body?.message === "string" ? body.message.trim() : ""
  };

  if (orientationRequest.name.length > 120) {
    return { error: "El nombre excede el límite permitido." };
  }
  if (orientationRequest.phone && !/^\d{10}$/.test(orientationRequest.phone)) {
    return { error: "El teléfono debe contener exactamente 10 dígitos numéricos." };
  }
  if (orientationRequest.email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orientationRequest.email)) {
    return { error: "Escribe un correo electrónico válido." };
  }
  if (!orientationRequest.message || orientationRequest.message.length > 3000) {
    return { error: "El mensaje es obligatorio y debe tener como máximo 3000 caracteres." };
  }

  if (!orientationRequest.name) delete orientationRequest.name;
  if (!orientationRequest.phone) delete orientationRequest.phone;
  return { orientationRequest };
}

router.post("/", async (req, res) => {
  if (databaseUnavailable(res)) return;

  const { orientationRequest, error } = validateRequest(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const createdRequest = await OrientationRequest.create(orientationRequest);
    return res.status(201).json({ solicitud: createdRequest });
  } catch (createError) {
    if (createError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos de la solicitud no son válidos." });
    }
    console.error("No se pudo guardar la solicitud de orientación:", createError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar la solicitud de orientación." });
  }
});

router.get("/", verificarToken, authorizeRoles("admin", "institucional"), async (_req, res) => {
  if (databaseUnavailable(res)) return;

  try {
    const requests = await OrientationRequest.find().sort({ createdAt: -1, _id: -1 }).lean();
    return res.json({ solicitudes: requests });
  } catch (error) {
    console.error("No se pudieron consultar las solicitudes de orientación:", error.message);
    return res.status(500).json({ mensaje: "No se pudieron cargar las solicitudes de orientación." });
  }
});

router.delete("/:id", verificarToken, authorizeRoles("admin", "institucional"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador de la solicitud no es válido." });
  }

  try {
    const deletedRequest = await OrientationRequest.findByIdAndDelete(req.params.id);
    if (!deletedRequest) {
      return res.status(404).json({ mensaje: "La solicitud que intentas eliminar ya no existe." });
    }
    return res.status(200).json({ mensaje: "Solicitud eliminada correctamente." });
  } catch (error) {
    console.error("No se pudo eliminar la solicitud de orientación:", error.message);
    return res.status(500).json({ mensaje: "No se pudo eliminar la solicitud de orientación." });
  }
});

module.exports = router;
