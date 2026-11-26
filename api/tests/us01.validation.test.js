const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRegisterCandidat } = require("../src/validators");

test("US-01 validation : accepte un candidat valide", () => {
  const { errors, data } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@email.fr",
    mdp: "password123",
  });
  assert.equal(errors, undefined);
  assert.equal(data.role, "candidat");
  assert.equal(data.email, "jean.dupont@email.fr");
  assert.equal(data.nom, "Dupont");
  assert.equal(data.prenom, "Jean");
});

test("US-01 validation : refuse un nom vide", () => {
  const { errors } = validateRegisterCandidat({
    nom: "",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "password123",
  });
  assert.ok(errors.some((e) => e.includes("nom")));
});

test("US-01 validation : refuse un nom avec seulement des espaces", () => {
  const { errors } = validateRegisterCandidat({
    nom: "   ",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "password123",
  });
  assert.ok(errors.some((e) => e.includes("nom")));
});

test("US-01 validation : refuse un prénom vide", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "",
    email: "us01.test@us01.local",
    mdp: "password123",
  });
  assert.ok(errors.some((e) => e.includes("prenom")));
});

test("US-01 validation : refuse un prénom avec seulement des espaces", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "   ",
    email: "us01.test@us01.local",
    mdp: "password123",
  });
  assert.ok(errors.some((e) => e.includes("prenom")));
});

test("US-01 validation : refuse un e-mail invalide", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "pas-un-email",
    mdp: "password123",
  });
  assert.ok(errors.some((e) => e.includes("email")));
});

test("US-01 validation : refuse un mot de passe vide", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "",
  });
  assert.ok(errors.some((e) => e.includes("mdp") && e.includes("obligatoire")));
});

test("US-01 validation : refuse un mot de passe trop court", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "1234567",
  });
  assert.ok(errors.some((e) => e.includes("8 caractères")));
});

test("US-01 validation : refuse un mot de passe trop long (> 72)", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "a".repeat(73),
  });
  assert.ok(errors.some((e) => e.includes("72")));
});

test("US-01 validation : force le rôle à candidat et ignore le rôle envoyé", () => {
  const { errors, data } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "password123",
    role: "candidat",
  });
  assert.equal(errors, undefined);
  assert.equal(data.role, "candidat");
});

test("US-01 validation : refuse si le client envoie role=agent", () => {
  const { errors } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "us01.test@us01.local",
    mdp: "password123",
    role: "agent",
  });
  assert.ok(errors.some((e) => e.includes("rôle")));
});

test("US-01 validation : refuse un corps invalide", () => {
  const { errors } = validateRegisterCandidat(null);
  assert.ok(errors);
});

test("US-01 validation : stocke l'e-mail en minuscules", () => {
  const { data } = validateRegisterCandidat({
    nom: "Dupont",
    prenom: "Jean",
    email: "Mixed.Case@Example.COM",
    mdp: "password123",
  });
  assert.equal(data.email, "mixed.case@example.com");
});
