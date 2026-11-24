// US-03 : routes EJS pour la connexion.
// GET  /       → redirige vers /me ou /login
// GET  /login  → formulaire de connexion
// POST /login  → valide et redirige vers /me
// GET  /me     → page de l'utilisateur connecté (requireAuth)

const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { showLogin, login, showMe } = require("../../controllers/web/authController");

const router = express.Router();

router.get("/", (req, res) => {
  res.redirect(req.user ? "/me" : "/login");
});

router.get("/login", showLogin);
router.post("/login", login);

router.get("/me", requireAuth, showMe);

module.exports = router;
