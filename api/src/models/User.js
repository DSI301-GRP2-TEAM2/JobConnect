const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mdp: { type: String, required: true },
  role: { type: String, enum: ["candidat", "entreprise", "agent"], required: true },

  // candidat
  prenom: String,
  cv: String,

  // entreprise
  nomEntreprise: String,
  secteur: String,
  siteWeb: String,

  // agent
  matricule: String,
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);