const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mdp: { type: String, required: true, select: false },
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

// Le mot de passe n'apparaît jamais dans une réponse JSON
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.mdp;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);