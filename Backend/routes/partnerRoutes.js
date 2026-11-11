const express = require("express");
const mongoose = require("mongoose");
const Partner = require("../models/Partner");
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function databaseUnavailable(res) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({ mensaje: "La base de datos no está disponible. Inténtalo más tarde." });
  return true;
}

function validatePartner(body) {
  const partner = {
    name: typeof body?.name === "string" ? body.name.trim() : "",
    type: typeof body?.type === "string" ? body.type.trim() : "",
    url: typeof body?.url === "string" ? body.url.trim() : "",
    image: typeof body?.image === "string" ? body.image.trim() : ""
  };

  if (!partner.name || partner.name.length > 150 || !partner.type || partner.type.length > 100) {
    return { error: "Escribe el nombre y tipo de colaboración respetando sus límites de longitud." };
  }
  if (partner.url.length > 2048 || !isHttpUrl(partner.url)) {
    return { error: "La URL de la organización debe ser una dirección HTTP o HTTPS válida." };
  }
  if (partner.image && (partner.image.length > 2048 || !isHttpUrl(partner.image))) {
    return { error: "La URL de imagen debe ser una dirección HTTP o HTTPS válida." };
  }
  if (!partner.image) delete partner.image;

  return { partner };
}

router.get("/", async (_req, res) => {
  if (databaseUnavailable(res)) return;

  try {
    const partners = await Partner.find().sort({ type: 1, name: 1 }).lean();
    return res.json({ colaboradores: partners });
  } catch (error) {
    console.error("No se pudo consultar la red de colaboradores:", error.message);
    return res.status(500).json({ mensaje: "No se pudo cargar la red de colaboradores." });
  }
});

router.post("/", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;

  const { partner, error } = validatePartner(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const nuevoSocio = await Partner.create(partner);
    return res.status(201).json({ colaborador: nuevoSocio });
  } catch (createError) {
    if (createError.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe un colaborador con ese nombre." });
    }
    if (createError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos del colaborador no son válidos." });
    }
    console.error("No se pudo crear el colaborador:", createError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar el colaborador." });
  }
});

router.put("/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del colaborador no es válido." });
  }

  const { partner, error } = validatePartner(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const existingPartner = await Partner.findById(req.params.id);
    if (!existingPartner) {
      return res.status(404).json({ mensaje: "El colaborador que intentas editar ya no existe." });
    }

    existingPartner.set(partner);
    if (!partner.image) existingPartner.image = undefined;
    await existingPartner.save();
    return res.json({ colaborador: existingPartner });
  } catch (updateError) {
    if (updateError.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe un colaborador con ese nombre." });
    }
    if (updateError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos del colaborador no son válidos." });
    }
    console.error("No se pudo actualizar el colaborador:", updateError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar el colaborador actualizado." });
  }
});

router.delete("/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del colaborador no es válido." });
  }

  try {
    const deletedPartner = await Partner.findByIdAndDelete(req.params.id);
    if (!deletedPartner) {
      return res.status(404).json({ mensaje: "El colaborador que intentas eliminar ya no existe." });
    }
    return res.status(200).json({ mensaje: "Colaborador eliminado correctamente." });
  } catch (error) {
    console.error("No se pudo eliminar el colaborador:", error.message);
    return res.status(500).json({ mensaje: "No se pudo eliminar el colaborador." });
  }
});

module.exports = router;