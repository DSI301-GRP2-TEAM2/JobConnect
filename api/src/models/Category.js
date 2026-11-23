const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        libelle: {type: String, required: true, trim: true, maxlength: 100},
        description: {type: String, maxlength: 500, required: true},
    },
    {collection: "categories"}
);

categorySchema.index({ libelle: 1 }, { unique: true, collation: { locale: "fr", strength: 2 }, name: "unique_libelle_fr" });

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);