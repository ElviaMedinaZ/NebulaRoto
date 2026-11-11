const mongoose = require("mongoose");

const violentometroSelectionSchema = new mongoose.Schema({
  selectionId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    match: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },
  level: {
    type: String,
    enum: ["advertencia", "reaccion", "peligro"],
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
});

module.exports = mongoose.models.ViolentometroSelection
  || mongoose.model("ViolentometroSelection", violentometroSelectionSchema);
