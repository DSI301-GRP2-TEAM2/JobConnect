
const { User } = require("../../models/user");
const { generateToken } = require("../../utils/auth");

const showLogin = (req, res) => {
  res.render("login", { error: null });
};

const login = async (req, res) => {
  try {
    const { email, mdp } = req.body || {};
    if (!email || !mdp) {
      return res.status(400).render("login", { error: "Email et mot de passe obligatoires" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+mdp");
    if (!user) {
      return res.status(401).render("login", { error: "Email ou mot de passe incorrect" });
    }
    if (user.statut === "bloque") {
      return res.status(403).render("login", { error: "Compte bloqué" });
    }
    const ok = await user.comparePassword(mdp);
    if (!ok) {
      return res.status(401).render("login", { error: "Email ou mot de passe incorrect" });
    }
    const token = generateToken({ id: user._id, role: user.role, email: user.email });
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.redirect("/me");
  } catch (err) {
    console.error(err);
    return res.status(500).render("error", { message: "Erreur serveur" });
  }
};

const showMe = (req, res) => {
  if (!req.user) return res.redirect("/login");
  res.render("me", { user: req.user });
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};

module.exports = { showLogin, login, showMe, logout };
