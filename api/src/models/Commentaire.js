const mongoose = require("mongoose");

const commentaireSchema = new mongoose.Schema(
  {
    contenu: { type: String, required: true },
    dateCommentaire: { type: Date, default: Date.now },
    offre: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", required: true },
    candidat: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    reponses: [
      {
        entreprise: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        contenu: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { collection: "commentaires" }
);

module.exports =
  mongoose.models.Commentaire || mongoose.model("Commentaire", commentaireSchema);