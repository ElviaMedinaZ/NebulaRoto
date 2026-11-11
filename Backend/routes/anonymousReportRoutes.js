const { randomBytes } = require("node:crypto");
const express = require("express");
const mongoose = require("mongoose");
const AnonymousReport = require("../models/AnonymousReport");
const verificarToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();
const reportTypes = ["Psicológica", "Física", "Sexual", "Económica", "Patrimonial", "Digital", "Otra"];
const reportStatuses = ["Recibido", "En revisión", "En seguimiento", "Resuelto"];
const evidenceTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxEvidenceBytes = 2 * 1024 * 1024;

function databaseUnavailable(res) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({ mensaje: "La base de datos no está disponible. Inténtalo más tarde." });
  return true;
}

function hasExpectedEvidenceSignature(mimeType, data) {
  if (mimeType === "application/pdf") return data.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === "image/png") return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") {
    return data.length >= 12
      && data.subarray(0, 4).toString("ascii") === "RIFF"
      && data.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function validateReport(body) {
  const report = {
    type: typeof body?.type === "string" ? body.type.trim() : "",
    place: typeof body?.place === "string" ? body.place.trim() : "",
    description: typeof body?.description === "string" ? body.description.trim() : ""
  };

  if (!reportTypes.includes(report.type)) {
    return { error: "Selecciona un tipo de violencia válido." };
  }
  if (!report.place || report.place.length > 200) {
    return { error: "El lugar es obligatorio y debe tener como máximo 200 caracteres." };
  }
  if (!report.description || report.description.length > 5000) {
    return { error: "La descripción es obligatoria y debe tener como máximo 5000 caracteres." };
  }

  if (body?.evidence !== undefined && body.evidence !== null) {
    const { fileName, mimeType, data } = body.evidence;
    if (typeof fileName !== "string" || !fileName.trim() || fileName.length > 255
        || /[\u0000-\u001f\u007f]/.test(fileName)
        || !evidenceTypes.has(mimeType)
        || typeof data !== "string") {
      return { error: "El archivo adjunto no es válido." };
    }

    const dataUrlPrefix = `data:${mimeType};base64,`;
    if (!data.startsWith(dataUrlPrefix)) {
      return { error: "El formato del archivo adjunto no es válido." };
    }
    const encodedData = data.slice(dataUrlPrefix.length);
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encodedData)) {
      return { error: "El contenido del archivo adjunto no es válido." };
    }

    const evidenceData = Buffer.from(encodedData, "base64");
    if (!evidenceData.length || evidenceData.length > maxEvidenceBytes) {
      return { error: "El archivo adjunto debe pesar menos de 2 MB." };
    }
    if (!hasExpectedEvidenceSignature(mimeType, evidenceData)) {
      return { error: "El contenido no coincide con el formato del archivo adjunto." };
    }
    report.evidence = {
      fileName: fileName.trim(),
      mimeType,
      data: evidenceData
    };
  }

  return { report };
}

router.post("/", async (req, res) => {
  if (databaseUnavailable(res)) return;

  const { report, error } = validateReport(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const createdReport = await AnonymousReport.create({
      ...report,
      folio: `NEB-${randomBytes(12).toString("hex").toUpperCase()}`
    });
    return res.status(201).json({ reporte: { folio: createdReport.folio } });
  } catch (createError) {
    if (createError.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Los datos del reporte no son válidos." });
    }
    console.error("No se pudo guardar el reporte anónimo:", createError.message);
    return res.status(500).json({ mensaje: "No se pudo guardar el reporte anónimo." });
  }
});

router.get("/folio/:folio", async (req, res) => {
  if (databaseUnavailable(res)) return;
  const folio = req.params.folio.trim().toUpperCase();

  try {
    const report = await AnonymousReport.findOne({ folio }).select("folio status createdAt updatedAt").lean();
    if (!report) {
      return res.status(404).json({ mensaje: "No encontramos un reporte con ese folio." });
    }
    return res.json({ reporte: report });
  } catch (error) {
    console.error("No se pudo consultar el reporte anónimo:", error.message);
    return res.status(500).json({ mensaje: "No se pudo consultar el estado del reporte." });
  }
});

router.get("/admin", verificarToken, authorizeRoles("admin", "institucional"), async (_req, res) => {
  if (databaseUnavailable(res)) return;

  try {
    const reports = await AnonymousReport.find()
      .select("-evidence.data")
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.json({ reportes: reports });
  } catch (error) {
    console.error("No se pudieron consultar los reportes anónimos:", error.message);
    return res.status(500).json({ mensaje: "No se pudieron cargar los reportes anónimos." });
  }
});

router.patch("/admin/:id/status", verificarToken, authorizeRoles("admin", "institucional"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del reporte no es válido." });
  }
  if (!reportStatuses.includes(req.body?.status)) {
    return res.status(400).json({ mensaje: "Selecciona un estado de avance válido." });
  }

  try {
    const report = await AnonymousReport.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).select("-evidence.data").lean();
    if (!report) {
      return res.status(404).json({ mensaje: "El reporte que intentas actualizar ya no existe." });
    }
    return res.json({ reporte: report });
  } catch (error) {
    console.error("No se pudo actualizar el estado del reporte anónimo:", error.message);
    return res.status(500).json({ mensaje: "No se pudo actualizar el estado del reporte." });
  }
});

router.get("/admin/:id/evidence", verificarToken, authorizeRoles("admin", "institucional"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del reporte no es válido." });
  }

  try {
    const report = await AnonymousReport.findById(req.params.id).select("evidence");
    if (!report?.evidence?.data) {
      return res.status(404).json({ mensaje: "El reporte no tiene un archivo adjunto." });
    }

    const evidenceData = Buffer.from(report.evidence.data);
    const fileName = encodeURIComponent(report.evidence.fileName);
    res.set({
      "Content-Type": report.evidence.mimeType,
      "Content-Length": evidenceData.length,
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      "X-Content-Type-Options": "nosniff"
    });
    return res.send(evidenceData);
  } catch (error) {
    console.error("No se pudo descargar la evidencia del reporte:", error.message);
    return res.status(500).json({ mensaje: "No se pudo descargar la evidencia del reporte." });
  }
});

router.delete("/admin/:id", verificarToken, authorizeRoles("admin", "institucional"), async (req, res) => {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "El identificador del reporte no es válido." });
  }

  try {
    const deletedReport = await AnonymousReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ mensaje: "El reporte que intentas eliminar ya no existe." });
    }
    return res.status(200).json({ mensaje: "Reporte eliminado correctamente." });
  } catch (error) {
    console.error("No se pudo eliminar el reporte anónimo:", error.message);
    return res.status(500).json({ mensaje: "No se pudo eliminar el reporte." });
  }
});

module.exports = router;
