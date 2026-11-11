const express = require("express");
const mongoose = require("mongoose");
const OrientationResource = require("../models/OrientationResource");
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();
const resourceCategories = ["sitios", "multimedia", "documentos"];
const resourceTypes = ["link", "video", "pdf"];

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getYouTubeEmbedUrl(value) {
  try {
    const parsed = new URL(value);
    let videoId = "";
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) {
      videoId = parsed.pathname === "/watch"
        ? parsed.searchParams.get("v") || ""
        : parsed.pathname.startsWith("/embed/")
          ? parsed.pathname.slice("/embed/".length)
          : "";
    }

    return /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : "";
  } catch {
    return "";
  }
}

function databaseUnavailable(res) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({ mensaje: "La base de datos no está disponible. Inténtalo más tarde." });
  return true;
}

function validateResource(body) {
  const resource = {
    category: typeof body?.category === "string" ? body.category.trim() : "",
    title: typeof body?.title === "string" ? body.title.trim() : "",
    description: typeof body?.description === "string" ? body.description.trim() : "",
    source: typeof body?.source === "string" ? body.source.trim() : "",
    url: typeof body?.url === "string" ? body.url.trim() : "",
    type: typeof body?.type === "string" ? body.type.trim() : ""
  };

  if (!resourceCategories.includes(resource.category)) {
    return { error: "Selecciona un tipo de recurso válido." };
  }
  if (!resourceTypes.includes(resource.type)) {
    return { error: "Selecciona un formato de recurso válido." };
  }
  if (!resource.title || resource.title.length > 120
      || !resource.description || resource.description.length > 500
      || !resource.source || resource.source.length > 120) {
    return { error: "Completa título, descripción y fuente respetando sus límites de longitud." };
  }
  if (resource.url.length > 2048 || !isHttpUrl(resource.url)) {
    return { error: "La URL debe ser una dirección HTTP o HTTPS válida." };
  }

  if (resource.type === "video") {
    resource.embedUrl = getYouTubeEmbedUrl(resource.url);
    if (!resource.embedUrl) {
      return { error: "Para agregar un video, usa una URL válida de YouTube." };
    }
  }

  return { resource };
}

router.get("/", async (_req, res) => {
  if (databaseUnavailable(res)) return;

  try {
    const resources = await OrientationResource.find().sort({ createdAt: 1, _id: 1 }).lean();
    return res.json({ recursos: resources });
  } catch (error) {
    console.error("No se pudieron consultar los recursos de orientación:", error.message);
    return res.status(500).json({ mensaje: "No se pudieron cargar los recursos de orientación." });
  }
});

router.post("/", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;

  const { resource, error } = validateResource(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const createdResource = await OrientationResource.create(resource);
    return res.status(201).json({ recurso: createdResource });
  } catch (createError) {
    if (createError.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe un recurso con esa URL en esta categoría." });
    }
    if (createError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos del recurso no son válidos." });
    }
    console.error("No se pudo crear el recurso de orientación:", createError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar el recurso de orientación." });
  }
});

router.put("/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del recurso no es válido." });
  }

  const { resource, error } = validateResource(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const existingResource = await OrientationResource.findById(req.params.id);
    if (!existingResource) {
      return res.status(404).json({ mensaje: "El recurso que intentas editar ya no existe." });
    }

    existingResource.set(resource);
    if (!resource.embedUrl) existingResource.embedUrl = undefined;
    await existingResource.save();
    return res.json({ recurso: existingResource });
  } catch (updateError) {
    if (updateError.code === 11000) {
      return res.status(409).json({ mensaje: "Ya existe un recurso con esa URL en esta categoría." });
    }
    if (updateError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos del recurso no son válidos." });
    }
    console.error("No se pudo actualizar el recurso de orientación:", updateError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar el recurso actualizado." });
  }
});

router.delete("/:id", verificarToken, authorizeRoles("admin"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del recurso no es válido." });
  }

  try {
    const deletedResource = await OrientationResource.findByIdAndDelete(req.params.id);
    if (!deletedResource) {
      return res.status(404).json({ mensaje: "El recurso que intentas eliminar ya no existe." });
    }
    return res.status(200).json({ mensaje: "Recurso eliminado correctamente." });
  } catch (error) {
    console.error("No se pudo eliminar el recurso de orientación:", error.message);
    return res.status(500).json({ mensaje: "No se pudo eliminar el recurso de orientación." });
  }
});

module.exports = router;
