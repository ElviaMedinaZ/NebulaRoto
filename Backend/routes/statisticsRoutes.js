const express = require("express");
const mongoose = require("mongoose");
const AnonymousReport = require("../models/AnonymousReport");
const AssessmentCompletion = require("../models/AssessmentCompletion");
const Partner = require("../models/Partner");
const ViolentometroSelection = require("../models/ViolentometroSelection");
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/dashboard", verificarToken, authorizeRoles("admin", "institucional"), async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ mensaje: "La base de datos no está disponible." });
  }

  try {
    const [autoevaluaciones, reportes, socios, incidenceRows, meterRows] = await Promise.all([
      AssessmentCompletion.countDocuments(),
      AnonymousReport.countDocuments(),
      Partner.countDocuments(),
      AssessmentCompletion.aggregate([
        { $unwind: "$violenceTypes" },
        { $group: { _id: "$violenceTypes", count: { $sum: 1 } } }
      ]),
      ViolentometroSelection.aggregate([
        { $group: { _id: "$level", count: { $sum: 1 } } }
      ])
    ]);

    const incidence = {
      "Psicológica / Emocional": 0,
      Física: 0,
      Sexual: 0,
      Económica: 0,
      Digital: 0
    };
    for (const row of incidenceRows) incidence[row._id] = row.count;

    const violentometro = { advertencia: 0, reaccion: 0, peligro: 0 };
    for (const row of meterRows) violentometro[row._id] = row.count;

    return res.json({ autoevaluaciones, reportes, socios, incidencia: incidence, violentometro });
  } catch (error) {
    console.error("No se pudieron consultar las estadísticas del panel:", error.message);
    return res.status(500).json({ mensaje: "No se pudieron cargar las estadísticas." });
  }
});

module.exports = router;
