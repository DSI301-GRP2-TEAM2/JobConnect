const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";
if (TEST_URI) { process.env.MONGODB_URI = TEST_URI; process.env.JWT_SECRET = "test-secret"; }

const mongoose = require("mongoose");
const User = require("../src/models/User");
const { registerHandler } = require("../src/handlers/register");
const context = { error() {}, log() {} };
const fakeRequest = (body) => ({ json: async () => body });

const entreprise = { nom: "TechCorp Solutions", nomEntreprise: "TechCorp Solutions", email: "entreprise.us02@test.local", mdp: "securepass2023", role: "entreprise" };

async function cleanup() { await User.deleteMany({ email: /@test\.local$/ }); }
test.before(async () => { if (!TEST_URI) return; await mongoose.connect(TEST_URI); await cleanup(); });
test.after(async () => { if (!TEST_URI) return; await cleanup(); await mongoose.disconnect(); });

test("US-02 : crée un compte entreprise valide (201)", { skip }, async () => {
  const res = await registerHandler(fakeRequest(entreprise), context);
  assert.equal(res.status, 201);
  assert.equal(res.jsonBody.role, "entreprise");
  assert.equal(res.jsonBody.email, entreprise.email);
  assert.equal(res.jsonBody.mdp, undefined);
});
test("US-02 : le mot de passe est hashé avec bcrypt", { skip }, async () => {
  const withPassword = await User.findOne({ email: entreprise.email }).select("+mdp");
  assert.notEqual(withPassword.mdp, entreprise.mdp);
  assert.ok(withPassword.mdp.startsWith("$2"));
});
test("US-02 : refuse un email déjà utilisé (409)", { skip }, async () => {
  const res = await registerHandler(fakeRequest(entreprise), context);
  assert.equal(res.status, 409);
});
test("US-02 : refuse une entreprise sans nomEntreprise (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...entreprise, email: "sansnom@test.local", nomEntreprise: "" }), context);
  assert.equal(res.status, 400);
});
test("US-02 : accepte un secteur optionnel", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...entreprise, email: "secteur@test.local", secteur: "Technologies de l'Information (IT)" }), context);
  assert.equal(res.status, 201);
  const dbUser = await User.findOne({ email: "secteur@test.local" });
  assert.equal(dbUser.secteur, "Technologies de l'Information (IT)");
});
test("US-02 : accepte un siteWeb optionnel", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...entreprise, email: "siteweb@test.local", siteWeb: "https://techcorp.fr" }), context);
  assert.equal(res.status, 201);
  const dbUser = await User.findOne({ email: "siteweb@test.local" });
  assert.equal(dbUser.siteWeb, "https://techcorp.fr");
});
test("US-02 : refuse un siteWeb invalide (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...entreprise, email: "badurl@test.local", siteWeb: "not-a-url" }), context);
  assert.equal(res.status, 400);
});
test("US-02 : refuse un mot de passe trop court (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...entreprise, email: "court@test.local", mdp: "1234567" }), context);
  assert.equal(res.status, 400);
});
test("US-02 : candidat et entreprise cohabitent dans la collection users", { skip }, async () => {
  await registerHandler(fakeRequest({ nom: "Test", prenom: "Cand", email: "cohab-cand@test.local", mdp: "Test12345", role: "candidat" }), context);
  const roles = await User.distinct("role", { email: /@test\.local$/ });
  assert.ok(roles.includes("candidat"));
  assert.ok(roles.includes("entreprise"));
});
