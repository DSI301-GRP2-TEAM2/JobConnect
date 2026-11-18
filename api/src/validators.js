const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{8,15}$/;

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
    if (!isNonEmptyString(body.nom)) errors.push("nom ne peut pas être vide");
    else data.nom = body.nom.trim();
  }

  if (body.prenom !== undefined) {
    if (!isNonEmptyString(body.prenom)) errors.push("prenom ne peut pas être vide");
    else data.prenom = body.prenom.trim();
  }

  if (body.telephone !== undefined) {
    if (typeof body.telephone !== "string" || !PHONE_RE.test(body.telephone.trim())) {
      errors.push("numéro de téléphone invalide");
    } else {
      data.telephone = body.telephone.trim();
    }
  }

  if (body.adresse !== undefined) {
    data.adresse = String(body.adresse).trim();
  }

  if (body.titre !== undefined) {
    data.titre = String(body.titre).trim();
  }

  if (errors.length > 0) return { errors };
  return { data };
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

function validateCvFile({ originalname, mimetype, size }) {
  const errors = [];
  if (!originalname) {
    return { errors: ["Nom de fichier manquant"] };
  }

  const dot = originalname.lastIndexOf(".");
  const ext = dot === -1 ? "" : originalname.slice(dot).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push("Format de fichier non autorisé. Formats acceptés : PDF, DOCX");
  }

  if (mimetype && !ALLOWED_MIME_TYPES.includes(mimetype) && mimetype !== "application/octet-stream") {
    errors.push("Type MIME non autorisé pour le CV");
  }

  if (typeof size === "number" && size > 5 * 1024 * 1024) {
    errors.push("Le fichier dépasse la taille maximale autorisée (5 Mo)");
  }

  if (errors.length > 0) return { errors };
  return { valid: true };
}

function validateCandidature(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: ["Corps de requête invalide"] };
  }

  const errors = [];
  if (!body.offreId || typeof body.offreId !== "string" || !body.offreId.trim()) {
    errors.push("offreId est obligatoire");
  }

  if (errors.length > 0) return { errors };

  return {
    data: {
      offreId: body.offreId.trim(),
      lettreMotivation: typeof body.lettreMotivation === "string" ? body.lettreMotivation.trim() : "",
    },
  };
}

module.exports = {
  validateRegister,
  validateUpdateProfil,
  validateCvFile,
  validateCandidature,
};