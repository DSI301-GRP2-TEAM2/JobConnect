// US-03 : contrôleur EJS pour la connexion (Agent + candidat/entreprise).
// Différent du contrôleur API (controllers/api/authController.js) qui renvoie
// du JSON : ici on rend des vues EJS et on pose un cookie JWT httpOnly.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connect } = require("../../db");
const User = require("../../models/User");

// GET /login — affiche le formulaire de connexion
function showLogin(req, res) {
  res.render("login", { error: null });
}

// POST /login — valide les identifiants, pose un cookie JWT, redirige vers /me
async function login(req, res) {
  try {
    const { email, mdp } = req.body || {};
    if (!email || !mdp) {
      return res.status(400).render("login", { error: "Email et mot de passe obligatoires" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET manquant");
      return res.status(500).render("error", { message: "Erreur serveur" });
    }

    await connect();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+mdp");
    const valid = user && (await bcrypt.compare(mdp, user.mdp));

    if (!valid) {
      return res.status(401).render("login", { error: "Email ou mot de passe incorrect" });
    }

    if (user.statut === "bloque") {
      return res.status(403).render("login", { error: "Compte bloqué" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return res.redirect("/me");
  } catch (err) {
    console.error(err);
    return res.status(500).render("error", { message: "Erreur serveur" });
  }
}

// GET /me — affiche l'utilisateur connecté (n'importe quel rôle)
function showMe(req, res) {
  if (!req.user) return res.redirect("/login");
  res.render("me", { user: req.user });
}

module.exports = { showLogin, login, showMe };
