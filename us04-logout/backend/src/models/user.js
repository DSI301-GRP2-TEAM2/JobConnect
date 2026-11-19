const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["candidat", "entreprise", "agent"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"],
    },
    mdp: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 72,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    statut: {
      type: String,
      enum: ["actif", "bloque"],
      default: "actif",
    },
    dateInscription: { type: Date, default: Date.now },

    
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, trim: true },
    telephone: { type: String, trim: true },

    
    cv: { type: String, default: null },

    
    nomEntreprise: { type: String, trim: true },
    secteur: { type: String, trim: true },
    siteWeb: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { collection: "users", timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("mdp")) return;
  const salt = await bcrypt.genSalt(10);
  this.mdp = await bcrypt.hash(this.mdp, salt);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.mdp);
};

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.mdp;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
