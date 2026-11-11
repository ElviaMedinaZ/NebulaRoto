const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    tempPassword: { type: String, required: true },
    role: { type: String, required: true, default: 'Personal Institucional' },
    institution: { type: String, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Account", accountSchema);