const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    libelle: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
  },
  { collection: "categories" }
);

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);