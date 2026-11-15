const mongoose = require("mongoose");

const candidatureSchema = new mongoose.Schema(
  {
    candidat: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offre: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", required: true },
    datePostulation: { type: Date, default: Date.now },
    lettreMotivation: String, // chemin ou URL du fichier
    cvFichier: String, // chemin ou URL du fichier
    statut: {
      type: String,
      enum: ["en_attente", "acceptee", "refusee"],
      default: "en_attente",
    },
  },
  { collection: "candidatures" }
);

module.exports =
  mongoose.models.Candidature || mongoose.model("Candidature", candidatureSchema);