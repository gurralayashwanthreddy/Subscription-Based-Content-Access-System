const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Plan = require("../models/Plan");
const { countRecentActiveDays } = require("../utils/activity");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("name email role plan status enrolledCourses").populate("enrolledCourses");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email }).populate("enrolledCourses");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      enrolledCourses: user.enrolledCourses,
      activeDays: countRecentActiveDays(user.activityDates, 30)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.post("/enroll", async (req, res) => {
  try {
    const { email, courseId } = req.body;
    const user = await User.findOne({ email });
    const course = await Course.findById(courseId);
    if (!user || !course) {
      return res.status(404).json({ message: "User or course not found" });
    }

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
      course.enrolled += 1;
      await course.save();
    }

    const updatedUser = await User.findById(user._id).populate("enrolledCourses");
    res.json({ message: "Enrolled successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to enroll" });
  }
});

router.post("/upgrade-plan", async (req, res) => {
  try {
    const { email, planId } = req.body;
    if (!email || !planId) {
      return res.status(400).json({ message: "Email and plan ID are required" });
    }

    const [user, plan] = await Promise.all([
      User.findOne({ email }),
      Plan.findById(planId)
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    user.plan = plan.name;
    user.status = "Active";
    await user.save();

    res.json({
      message: `Plan upgraded to ${plan.name}`,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan
      },
      plan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upgrade plan" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove user" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({ status: "Active" });
    const totalCourses = await Course.countDocuments();
    const plans = await Plan.find();
    const planMap = {};
    for (const p of plans) {
      const match = p.price.match(/\d+/g);
      const priceNum = match ? parseInt(match.join(""), 10) : 0;
      planMap[p.name.toLowerCase()] = priceNum;
    }

    const totalEarningsValue = await User.find().then((users) => {
      return users.reduce((sum, u) => {
        const planName = (u.plan || "").toLowerCase();
        if (planMap[planName] !== undefined) {
          return sum + planMap[planName];
        }
        if (u.plan === "Premium") return sum + 999;
        if (u.plan === "Pro") return sum + 499;
        if (u.plan === "Basic") return sum + 199;
        return sum;
      }, 0);
    });

    res.json({ totalUsers, activeSubscriptions, totalCourses, totalEarnings: totalEarningsValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
