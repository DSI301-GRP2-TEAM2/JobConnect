
const { User } = require("../../models/user");
const { handleError } = require("../../utils/errorHandler");

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
      email,
      mdp,
      role: "entreprise",
      nom,
      nomEntreprise,
      secteur,
      siteWeb: req.body?.siteWeb || "",
      description: req.body?.description || "",
    });
    return res.status(201).json({
      message: "Compte entreprise créé avec succès",
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        nomEntreprise: user.nomEntreprise,
        secteur: user.secteur,
      },
    });
  } catch (err) {
    const { status, body } = handleError(err);
    return res.status(status).json(body);
  }
};

module.exports = { registerCandidat, registerEntreprise, validateCandidatInput, validateEntrepriseInput };
