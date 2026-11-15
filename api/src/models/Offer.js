const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    salaire: Number,
    dateCreation: { type: Date, default: Date.now },
    statut: {
      type: String,
      enum: ["en_attente", "publiee", "rejetee"],
      default: "en_attente",
    },

    // hybride : référence + résumé intégré (nom affiché dans les listes d'offres)
    entreprise: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      nomEntreprise: { type: String, required: true },
    },

    // référence
    categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { collection: "offres" }
);

module.exports = mongoose.models.Offer || mongoose.model("Offer", offerSchema);