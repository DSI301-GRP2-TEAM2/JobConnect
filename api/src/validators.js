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

  if (typeof body.mdp !== "string" || body.mdp === "") {
    errors.push("mdp est obligatoire");
  } else if (body.mdp.length < 8) {
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

function validateRegisterCandidat(body) {
  if (body && typeof body === "object" && body.role !== undefined && body.role !== "candidat") {
    return { errors: ["Le rôle n'est pas autorisé pour cette route"] };
  }
  return validateRegister({ ...body, role: "candidat" });
}

module.exports = { validateRegister, validateRegisterCandidat };