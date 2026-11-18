const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mdp: { type: String, required: true, select: false },
    role: { type: String, enum: ["candidat", "entreprise", "agent"], required: true },
    statut: { type: String, enum: ["actif", "bloque"], default: "actif" },
    dateInscription: { type: Date, default: Date.now },

    prenom: String,
    titre: String,
    cv: String,

    telephone: String,
    adresse: String,

    nomEntreprise: String,
    secteur: String,
    siteWeb: String,

    matricule: String,
  },
  { collection: "users" }
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.mdp;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);