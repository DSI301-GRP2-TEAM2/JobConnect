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

    entreprise: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      nomEntreprise: { type: String, required: true },
    },

    categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    lieu: { type: String, default: null },
    localisation: { type: String, default: null },
    typeContrat: { type: String, default: null },
    motifRefus: { type: String, default: null },
    missions: { type: String, default: null },
    conditions: { type: String, default: null },
    exigences: { type: String, default: null },
    profilRecherche: { type: String, default: null },
    avantages: { type: String, default: null },
    experience: { type: String, default: null },
    descriptionEntreprise: { type: String, default: null },
    aPropos: { type: String, default: null },
  },
  { collection: "offres" }
);

module.exports = mongoose.models.Offer || mongoose.model("Offer", offerSchema);