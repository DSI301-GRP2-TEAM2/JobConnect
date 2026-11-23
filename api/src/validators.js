const path = require("path");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{8,15}$/;

const ALLOWED_CV_EXTS = [".pdf", ".docx", ".doc"];
const ALLOWED_CV_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/octet-stream",
];
const MAX_CV_SIZE = 5 * 1024 * 1024;

const ROLE_FIELDS = {
  candidat: {
    required: ["prenom"],
    optional: ["telephone", "adresse"],
  },
  entreprise: {
    required: ["nomEntreprise"],
    optional: ["secteur", "siteWeb", "adresse", "telephone"],
  },
};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateRegister(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: ["Corps de requête invalide"] };
  }

  const errors = [];

  if (!isNonEmptyString(body.nom)) {
    errors.push("nom est obligatoire");
  }

  if (!isNonEmptyString(body.email) || !EMAIL_RE.test(body.email.trim())) {
    errors.push("email invalide");
  }

  if (typeof body.mdp !== "string" || body.mdp.length < 8) {
    errors.push("mdp doit contenir au moins 8 caractères");
  } else if (body.mdp.length > 72) {
    errors.push("mdp ne doit pas dépasser 72 caractères");
  }

  const rules = ROLE_FIELDS[body.role];
  if (!rules) {
    errors.push("role doit être candidat ou entreprise");
    return { errors };
  }

  for (const field of rules.required) {
    if (!isNonEmptyString(body[field])) {
      errors.push(`${field} est obligatoire pour le rôle ${body.role}`);
    }
  }

  for (const field of rules.optional) {
    if (body[field] === undefined || body[field] === "") continue;
    if (typeof body[field] !== "string") {
      errors.push(`${field} doit être une chaîne de caractères`);
    }
  }

  if (body.telephone && !PHONE_RE.test(String(body.telephone).trim())) {
    errors.push("telephone invalide (8 à 15 chiffres)");
  }

  if (body.role === "entreprise" && body.siteWeb && !isValidUrl(body.siteWeb)) {
    errors.push("siteWeb doit être une URL valide (http ou https)");
  }

  if (errors.length > 0) {
    return { errors };
  }

  const data = {
    nom: body.nom.trim(),
    email: body.email.trim().toLowerCase(),
    mdp: body.mdp,
    role: body.role,
  };
  for (const field of [...rules.required, ...rules.optional]) {
    if (isNonEmptyString(body[field])) {
      data[field] = body[field].trim();
    }
  }

  return { data };
}

function validateUpdateProfil(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: ["Corps de requête invalide"] };
  }

  const errors = [];
  const data = {};

  if (body.nom !== undefined) {
    if (!isNonEmptyString(body.nom)) {
      errors.push("nom ne peut pas être vide");
    } else {
      data.nom = body.nom.trim();
    }
  }

  if (body.prenom !== undefined) {
    if (!isNonEmptyString(body.prenom)) {
      errors.push("prenom ne peut pas être vide");
    } else {
      data.prenom = body.prenom.trim();
    }
  }

  if (body.titre !== undefined) {
    data.titre = typeof body.titre === "string" ? body.titre.trim() : "";
  }

  if (body.telephone !== undefined) {
    if (typeof body.telephone !== "string") {
      errors.push("numéro de téléphone invalide");
    } else {
      const trimmedPhone = body.telephone.trim();
      if (trimmedPhone === "") {
        data.telephone = "";
      } else if (!PHONE_RE.test(trimmedPhone)) {
        errors.push("numéro de téléphone invalide");
      } else {
        data.telephone = trimmedPhone;
      }
    }
  }

  if (body.ville !== undefined) {
    data.ville = typeof body.ville === "string" ? body.ville.trim() : "";
  }

  if (body.adresse !== undefined) {
    data.adresse = typeof body.adresse === "string" ? body.adresse.trim() : "";
  }

  if (body.bio !== undefined) {
    data.bio = typeof body.bio === "string" ? body.bio.trim() : "";
  }

  if (body.competences !== undefined) {
    if (Array.isArray(body.competences)) {
      data.competences = body.competences
        .map((c) => String(c).trim())
        .filter(Boolean);
    } else if (typeof body.competences === "string") {
      data.competences = body.competences
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    } else {
      errors.push("competences doit être un tableau ou une chaîne");
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  if (Object.keys(data).length === 0) {
    return { errors: ["Aucune information fournie pour la mise à jour"] };
  }

  return { data };
}

function validateCvFile(file) {
  if (!file) {
    return { errors: ["Aucun fichier fourni"] };
  }

  const originalname = file.originalname || file.name || "";
  const ext = path.extname(originalname).toLowerCase();

  if (!ALLOWED_CV_EXTS.includes(ext)) {
    return { errors: ["Format non supporté. Veuillez utiliser un fichier PDF ou DOCX"] };
  }

  if (file.mimetype && !ALLOWED_CV_MIMES.includes(file.mimetype.toLowerCase())) {
    return { errors: ["Format non supporté. Veuillez utiliser un fichier PDF ou DOCX"] };
  }

  if (file.size !== undefined && file.size > MAX_CV_SIZE) {
    return { errors: ["Le fichier dépasse la taille maximale autorisée (5 Mo)"] };
  }

  return { valid: true };
}

module.exports = {
  validateRegister,
  validateUpdateProfil,
  validateCvFile,
};
