const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
}

const mongoose = require("mongoose");
const User = require("../src/models/User");
const { registerHandler } = require("../src/handlers/register");
const { loginHandler } = require("../src/handlers/login");

const context = { error() {}, log() {} };
const fakeRequest = (body) => ({ json: async () => body });

const candidat = {
  nom: "Test",
  prenom: "Candidat",
  email: "candidat@test.local",
  mdp: "Test12345",
  role: "candidat",
};

const entreprise = {
  nom: "Societe",
  nomEntreprise: "Societe Test",
  email: "entreprise@test.local",
  mdp: "Test12345",
  role: "entreprise",
};

async function cleanup() {
  await User.deleteMany({ email: /@test\.local$/ });
}

test.before(async () => {
  if (!TEST_URI) return;
  await mongoose.connect(TEST_URI);
  await cleanup();
});

test.after(async () => {
  if (!TEST_URI) return;
  await cleanup();
  await mongoose.disconnect();
});

test("register : crée un candidat valide", { skip }, async () => {
  const res = await registerHandler(fakeRequest(candidat), context);
  assert.equal(res.status, 201);
  assert.equal(res.jsonBody.role, "candidat");
  assert.equal(res.jsonBody.mdp, undefined);
});

test("register : le mot de passe est hashé et protégé", { skip }, async () => {
  const user = await User.findOne({ email: candidat.email });
  assert.equal(user.mdp, undefined);

  const withPassword = await User.findOne({ email: candidat.email }).select("+mdp");
  assert.notEqual(withPassword.mdp, candidat.mdp);
});

test("register : crée une entreprise valide", { skip }, async () => {
  const res = await registerHandler(fakeRequest(entreprise), context);
  assert.equal(res.status, 201);
  assert.equal(res.jsonBody.role, "entreprise");
});

test("register : refuse un email déjà utilisé", { skip }, async () => {
  const res = await registerHandler(fakeRequest(candidat), context);
  assert.equal(res.status, 409);
});

test("register : refuse un email invalide", { skip }, async () => {
  const res = await registerHandler(
    fakeRequest({ ...candidat, email: "pas-un-email" }),
    context
  );
  assert.equal(res.status, 400);
});

test("register : refuse un mot de passe trop court", { skip }, async () => {
  const res = await registerHandler(
    fakeRequest({ ...candidat, email: "court@test.local", mdp: "abc" }),
    context
  );
  assert.equal(res.status, 400);
});

test("register : refuse un candidat sans prénom", { skip }, async () => {
  const res = await registerHandler(
    fakeRequest({ ...candidat, email: "sansprenom@test.local", prenom: "" }),
    context
  );
  assert.equal(res.status, 400);
});

test("register : refuse une entreprise sans nomEntreprise", { skip }, async () => {
  const res = await registerHandler(
    fakeRequest({ ...entreprise, email: "sansnom@test.local", nomEntreprise: undefined }),
    context
  );
  assert.equal(res.status, 400);
});

test("register : refuse le rôle agent", { skip }, async () => {
  const res = await registerHandler(
    fakeRequest({ ...candidat, email: "agent@test.local", role: "agent" }),
    context
  );
  assert.equal(res.status, 400);
});

test("login : retourne un token avec les bons identifiants", { skip }, async () => {
  const res = await loginHandler(
    fakeRequest({ email: candidat.email, mdp: candidat.mdp }),
    context
  );
  assert.equal(res.status, 200);
  assert.ok(res.jsonBody.token);
  assert.equal(res.jsonBody.user.role, "candidat");
});

test("login : refuse un mauvais mot de passe", { skip }, async () => {
  const res = await loginHandler(
    fakeRequest({ email: candidat.email, mdp: "MauvaisMdp1" }),
    context
  );
  assert.equal(res.status, 401);
});

test("login : refuse un email inconnu", { skip }, async () => {
  const res = await loginHandler(
    fakeRequest({ email: "inconnu@test.local", mdp: "Test12345" }),
    context
  );
  assert.equal(res.status, 401);
});

test("login : refuse un compte bloqué", { skip }, async () => {
  await User.updateOne({ email: candidat.email }, { statut: "bloque" });
  const res = await loginHandler(
    fakeRequest({ email: candidat.email, mdp: candidat.mdp }),
    context
  );
  assert.equal(res.status, 403);
});