

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  { name: { type: String, required: true }, description: { type: String } },
  { timestamps: true }
);
const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

router.get("/items", async (req, res) => {
  try {
    res.json(await Item.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/items", async (req, res) => {
  try {
    res.status(201).json(await Item.create(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/items/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/items/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/items/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
