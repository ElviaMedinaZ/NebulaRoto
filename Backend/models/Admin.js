const mongoose = require("mongoose");

// Define los campos persistidos para cada administrador y las reglas básicas del esquema.
const adminSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ["admin", "institucional", "usuario"],
    default: "usuario",
    required: true
  },
  terminosAceptadosEn: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Reutiliza el modelo si ya fue compilado, evitando errores en recargas y pruebas.
module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);