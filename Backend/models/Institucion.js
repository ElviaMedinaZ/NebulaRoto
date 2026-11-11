const mongoose = require("mongoose");

const institucionSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    correoContacto: { type: String, required: true },
    activo: { type: Boolean, default: true }
});

module.exports = mongoose.model("Institucion", institucionSchema);