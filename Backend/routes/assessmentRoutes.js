const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const AssessmentCompletion = require("../models/AssessmentCompletion");
const ViolentometroSelection = require("../models/ViolentometroSelection");

const router = express.Router();
const completionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Se alcanzó el límite de registros. Inténtalo más tarde." }
});

const completionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedViolenceTypes = new Set(["Psicológica / Emocional", "Física", "Sexual", "Económica", "Digital"]);
const allowedRiskLevels = new Set(["warning", "reaction", "danger", "none", "unavailable"]);
const allowedMeterLevels = new Set(["advertencia", "reaccion", "peligro"]);

router.post("/completions", completionLimiter, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ mensaje: "La base de datos no está disponible." });
  }

  const completionId = typeof req.body?.completionId === "string"
    ? req.body.completionId.trim()
    : "";
  const { violenceTypes, riskLevel } = req.body || {};
  if (!completionIdPattern.test(completionId)) {
    return res.status(400).json({ mensaje: "El identificador de finalización no es válido." });
  }
  if (!Array.isArray(violenceTypes)
      || violenceTypes.length > allowedViolenceTypes.size
      || violenceTypes.some((type) => !allowedViolenceTypes.has(type))
      || new Set(violenceTypes).size !== violenceTypes.length
      || !allowedRiskLevels.has(riskLevel)) {
    return res.status(400).json({ mensaje: "Los datos estadísticos de la autoevaluación no son válidos." });
  }

  try {
    await AssessmentCompletion.create({ completionId, violenceTypes, riskLevel });
    return res.status(201).json({ registrada: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ registrada: true, duplicada: true });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ mensaje: "El registro de finalización no es válido." });
    }
    console.error("No se pudo registrar la autoevaluación completada:", error.message);
    return res.status(500).json({ mensaje: "No se pudo registrar la autoevaluación." });
  }
});

router.post("/violentometro-selections", completionLimiter, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ mensaje: "La base de datos no está disponible." });
  }

  const selectionId = typeof req.body?.selectionId === "string"
    ? req.body.selectionId.trim()
    : "";
  const { level } = req.body || {};
  if (!completionIdPattern.test(selectionId) || !allowedMeterLevels.has(level)) {
    return res.status(400).json({ mensaje: "La selección del Violentómetro no es válida." });
  }

  try {
    await ViolentometroSelection.create({ selectionId, level });
    return res.status(201).json({ registrada: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ registrada: true, duplicada: true });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ mensaje: "La selección del Violentómetro no es válida." });
    }
    console.error("No se pudo registrar la selección del Violentómetro:", error.message);
    return res.status(500).json({ mensaje: "No se pudo registrar la selección del Violentómetro." });
  }
});

module.exports = router;
