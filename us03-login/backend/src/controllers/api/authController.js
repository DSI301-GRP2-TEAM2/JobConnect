
const { User } = require("../../models/user");
const { handleError } = require("../../utils/errorHandler");
const { generateToken } = require("../../utils/auth");

const validateCandidatInput = (body) => {
  const { email, mdp, nom, prenom } = body || {};
  const errors = [];
  if (!email) errors.push("Email est obligatoire");
  if (!mdp) errors.push("Mot de passe est obligatoire");
  if (mdp && mdp.length < 8) errors.push("Le mot de passe doit contenir au moins 8 caractères");
  if (mdp && mdp.length > 72) errors.push("Le mot de passe ne doit pas dépasser 72 caractères");
  if (!nom) errors.push("Le nom est obligatoire");
  if (!prenom) errors.push("Le prénom est obligatoire");
  return { errors, email, mdp, nom, prenom };
};

const registerCandidat = async (req, res) => {
  try {
    const { errors, email, mdp, nom, prenom } = validateCandidatInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Un compte avec cet email existe déjà" });
    }
    const user = await User.create({ email, mdp, role: "candidat", nom, prenom });
    return res.status(201).json({
      message: "Compte candidat créé avec succès",
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
    });
  } catch (err) {
    const { status, body } = handleError(err);
    return res.status(status).json(body);
  }
};

const validateEntrepriseInput = (body) => {
  const { email, mdp, nom, nomEntreprise, secteur } = body || {};
  const errors = [];
  if (!email) errors.push("Email est obligatoire");
  if (!mdp) errors.push("Mot de passe est obligatoire");
  if (mdp && mdp.length < 8) errors.push("Le mot de passe doit contenir au moins 8 caractères");
  if (mdp && mdp.length > 72) errors.push("Le mot de passe ne doit pas dépasser 72 caractères");
  if (!nom) errors.push("Le nom du contact est obligatoire");
  if (!nomEntreprise) errors.push("Le nom de l'entreprise est obligatoire");
  if (!secteur) errors.push("Le secteur d'activité est obligatoire");
  return { errors, email, mdp, nom, nomEntreprise, secteur };
};

const registerEntreprise = async (req, res) => {
  try {
    const { errors, email, mdp, nom, nomEntreprise, secteur } = validateEntrepriseInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Un compte avec cet email existe déjà" });
    }
    const user = await User.create({
      email, mdp, role: "entreprise", nom, nomEntreprise, secteur,
      siteWeb: req.body?.siteWeb || "", description: req.body?.description || "",
    });
    return res.status(201).json({
      message: "Compte entreprise créé avec succès",
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role, nomEntreprise: user.nomEntreprise, secteur: user.secteur },
    });
  } catch (err) {
    const { status, body } = handleError(err);
    return res.status(status).json(body);
  }
};

const login = async (req, res) => {
  try {
    const { email, mdp } = req.body || {};
    if (!email || !mdp) {
      return res.status(400).json({ error: "Email et mot de passe sont obligatoires" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+mdp");
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    if (user.statut === "bloque") {
      return res.status(403).json({ error: "Compte bloqué" });
    }
    const ok = await user.comparePassword(mdp);
    if (!ok) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const token = generateToken({ id: user._id, role: user.role, email: user.email });
    return res.status(200).json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role },
    });
  } catch (err) {
    const { status, body } = handleError(err);
    return res.status(status).json(body);
  }
};

module.exports = { registerCandidat, registerEntreprise, login, validateCandidatInput, validateEntrepriseInput };
