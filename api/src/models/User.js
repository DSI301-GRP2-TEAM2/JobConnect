const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mdp: { type: String, required: true },
    role: { type: String, enum: ["candidat", "entreprise", "agent"], required: true },
    statut: { type: String, enum: ["actif", "bloque"], default: "actif" },
    dateInscription: { type: Date, default: Date.now },

    // candidat
    prenom: String,
    cv: String,

    // candidat et entreprise
    telephone: String,
    adresse: String,

    // entreprise
    nomEntreprise: String,
    secteur: String,
    siteWeb: String,

    // agent
    matricule: String,
  },
  { collection: "users" }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);