const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['admin', 'editor', 'consultor'], 
    default: 'consultor' 
  },
  activo: { type: Boolean, default: true },
  ultimoAcceso: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);