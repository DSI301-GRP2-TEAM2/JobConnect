const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    libelle: { type: String, required: true, unique: true, trim: true },
    description: String,
  },
  { collection: "categories" }
);

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);