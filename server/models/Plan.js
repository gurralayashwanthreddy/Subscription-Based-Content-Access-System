const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  active: { type: Boolean, default: false },
  allowedTypes: [{ type: String, enum: ["Free", "Pro", "Premium"], required: true }]
});

module.exports = mongoose.model("Plan", planSchema);
