const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Course = require("../models/Course");

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, "..", "uploads") });

const ensureUploadFolder = () => {
  const uploadPath = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};
ensureUploadFolder();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

router.post("/", async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create course" });
  }
});

router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const { category, title } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const validCategories = ["tests", "videos", "assignments"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid upload category" });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const entry = {
      title: title || req.file.originalname,
      url: filePath
    };
    course[category].push(entry);
    course[`${category}Count`] = course[category].length;
    await course.save();
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload course content" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update course" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete course" });
  }
});


router.delete("/:courseId/video/:index", async (req, res) => {
  try {
    const { courseId, index } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.videos.splice(index, 1); // remove video
    await course.save();

    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete video" });
  }
});

router.delete("/:courseId/assignment/:index", async (req, res) => {
  try {
    const { courseId, index } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.assignments.splice(index, 1); // remove assignment
    await course.save();

    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

module.exports = router;
