const mongoose = require("mongoose");

const signalementSchema = new mongoose.Schema(
  {
    motif: { type: String, required: true },
    description: String,
    dateSignalement: { type: Date, default: Date.now },
    statut: {
      type: String,
      enum: ["en_attente", "traite"],
      default: "en_attente",
    },
    candidat: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    commentaire: { type: mongoose.Schema.Types.ObjectId, ref: "Commentaire", required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // 0..1
  },
  { collection: "signalements" }
);

module.exports =
  mongoose.models.Signalement || mongoose.model("Signalement", signalementSchema);