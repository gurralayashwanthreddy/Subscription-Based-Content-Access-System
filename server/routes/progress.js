const express = require("express");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const User = require("../models/User");
const { countRecentActiveDays, recordUserActivity } = require("../utils/activity");
const { addItem, summarizeCourseProgress } = require("../utils/progress");

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const [progressList, user] = await Promise.all([
      Progress.find({ userId: req.params.userId }),
      User.findOne({ email: req.params.userId }).select("activityDates enrolledCourses")
    ]);

    const enrolledCourseIds = user?.enrolledCourses || [];
    const courses = await Course.find({ _id: { $in: enrolledCourseIds } }).select(
      "_id testsCount videosCount assignmentsCount tests videos assignments"
    );
    const courseMap = new Map(courses.map((course) => [String(course._id), course]));
    const progressMap = new Map(progressList.map((item) => [String(item.courseId), item]));
    const summary = courses.reduce((totals, course) => {
      const courseSummary = summarizeCourseProgress(course, progressMap.get(String(course._id)));
      return {
        completedItems: totals.completedItems + courseSummary.completedItems,
        totalItems: totals.totalItems + courseSummary.totalItems
      };
    }, { completedItems: 0, totalItems: 0 });

    res.json({
      progress: progressList,
      summary: {
        ...summary,
        percent: summary.totalItems > 0 ? Math.round((summary.completedItems / summary.totalItems) * 100) : 0
      },
      activeDays: countRecentActiveDays(user?.activityDates || [], 30)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

router.post("/activity", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const dates = await recordUserActivity(user);
    res.json({ activeDays: countRecentActiveDays(dates, 30) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to record activity" });
  }
});

router.post("/access", async (req, res) => {
  try {
    const { userId, courseId, itemId, type } = req.body;
    if (!userId || !courseId || itemId === undefined || !type) {
      return res.status(400).json({ message: "Missing required progress fields" });
    }

    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        accessedVideos: [],
        accessedTests: [],
        accessedAssignments: [],
        completedVideos: [],
        completedTests: [],
        completedAssignments: []
      });
    }

    if (type === "video" || type === "videos") {
      progress.accessedVideos = addItem(progress.accessedVideos, itemId);
    } else if (type === "test" || type === "tests") {
      progress.accessedTests = addItem(progress.accessedTests, itemId);
    } else if (type === "assignment" || type === "assignments") {
      progress.accessedAssignments = addItem(progress.accessedAssignments, itemId);
      progress.completedAssignments = addItem(progress.completedAssignments, itemId);
    } else {
      return res.status(400).json({ message: "Invalid progress type" });
    }

    await progress.save();

    const user = await User.findOne({ email: userId });
    if (user) {
      await recordUserActivity(user);
    }

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to record access progress" });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { userId, courseId, itemId, type } = req.body;
    if (!userId || !courseId || itemId === undefined || !type) {
      return res.status(400).json({ message: "Missing required progress fields" });
    }

    let progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        accessedVideos: [],
        accessedTests: [],
        accessedAssignments: [],
        completedVideos: [],
        completedTests: [],
        completedAssignments: []
      });
    }

    if (type === "video" || type === "videos") {
      progress.accessedVideos = addItem(progress.accessedVideos, itemId);
      progress.completedVideos = addItem(progress.completedVideos, itemId);
    } else if (type === "test" || type === "tests") {
      progress.accessedTests = addItem(progress.accessedTests, itemId);
      progress.completedTests = addItem(progress.completedTests, itemId);
    } else if (type === "assignment" || type === "assignments") {
      progress.accessedAssignments = addItem(progress.accessedAssignments, itemId);
      progress.completedAssignments = addItem(progress.completedAssignments, itemId);
    } else {
      return res.status(400).json({ message: "Invalid progress type" });
    }

    await progress.save();

    const user = await User.findOne({ email: userId });
    if (user) {
      await recordUserActivity(user);
    }

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to complete progress item" });
  }
});

module.exports = router;
