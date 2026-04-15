const express = require("express");
const Plan = require("../models/Plan");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

router.post("/", async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create plan" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update plan" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove plan" });
  }
});

module.exports = router;
