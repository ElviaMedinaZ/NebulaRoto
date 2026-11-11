const mongoose = require("mongoose");

const violenceTypes = ["Psicológica / Emocional", "Física", "Sexual", "Económica", "Digital"];
const riskLevels = ["warning", "reaction", "danger", "none", "unavailable"];

const assessmentCompletionSchema = new mongoose.Schema({
  completionId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    match: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },
  violenceTypes: {
    type: [{ type: String, enum: violenceTypes }],
    default: []
  },
  riskLevel: {
    type: String,
    enum: riskLevels,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
});

module.exports = mongoose.models.AssessmentCompletion
  || mongoose.model("AssessmentCompletion", assessmentCompletionSchema);
