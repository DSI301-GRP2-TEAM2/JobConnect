const mongoose = require("mongoose");

const candidatureSchema = new mongoose.Schema(
  {
    candidat: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offre: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", required: true },
    datePostulation: { type: Date, default: Date.now },
    lettreMotivation: String,
    cvFichier: String,
    statut: {
      type: String,
      enum: ["en_attente", "acceptee", "refusee"],
      default: "en_attente",
    },
  },
  { collection: "candidatures" }
);

candidatureSchema.index({ candidat: 1, offre: 1 }, { unique: true });

module.exports =
  mongoose.models.Candidature || mongoose.model("Candidature", candidatureSchema);