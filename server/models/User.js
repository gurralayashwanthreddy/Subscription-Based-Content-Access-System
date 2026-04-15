const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  plan: { type: String, default: "Basic" },
  status: { type: String, enum: ["Active", "Expired"], default: "Active" },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  activityDates: [{ type: Date }]
});

module.exports = mongoose.model("User", userSchema);
