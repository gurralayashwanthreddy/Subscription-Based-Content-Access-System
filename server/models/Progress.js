const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  accessedVideos: [{ type: String }],
  accessedTests: [{ type: String }],
  accessedAssignments: [{ type: String }],
  completedVideos: [{ type: String }],
  completedTests: [{ type: String }],
  completedAssignments: [{ type: String }]
}, { timestamps: true });

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
