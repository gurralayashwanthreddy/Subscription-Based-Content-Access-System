const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["Free", "Pro", "Premium"], required: true },
  description: { type: String, default: "" },
  enrolled: { type: Number, default: 0 },
  testsCount: { type: Number, default: 0 },
  videosCount: { type: Number, default: 0 },
  assignmentsCount: { type: Number, default: 0 },
  tests: [
    {
      title: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  videos: [
    {
      title: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  assignments: [
    {
      title: { type: String, required: true },
      url: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model("Course", courseSchema);
