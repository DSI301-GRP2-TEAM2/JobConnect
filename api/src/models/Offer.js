const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    localisation: { type: String, trim: true },
    typeContrat: { type: String, trim: true },
    missionsPrincipales: { type: String, trim: true },
    profilRecherche: { type: String, trim: true },
    // Retained for offers created before the field was renamed.
    exigencesCandidat: { type: String, trim: true },
    salaire: Number,
    dateCreation: { type: Date, default: Date.now },
    statut: {
      type: String,
      enum: ["brouillon", "en_attente", "publiee", "rejetee"],
      default: "brouillon",
    },

    entreprise: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      nomEntreprise: { type: String, required: true },
    },

    categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    lieu: { type: String, default: null },
    motifRefus: { type: String, default: null },
  },
  { collection: "offres" }
);

offerSchema.set("toJSON", {
  transform(doc, ret) {
    if (!ret.profilRecherche && ret.exigencesCandidat) ret.profilRecherche = ret.exigencesCandidat;
    delete ret.exigencesCandidat;
    return ret;
  },
});

module.exports = mongoose.models.Offer || mongoose.model("Offer", offerSchema);
