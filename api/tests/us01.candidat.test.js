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

const candidat = { nom: "Dupont", prenom: "Jean", email: "candidat.us01@test.local", mdp: "password123", role: "candidat" };

async function cleanup() { await User.deleteMany({ email: /@test\.local$/ }); }
test.before(async () => { if (!TEST_URI) return; await mongoose.connect(TEST_URI); await cleanup(); });
test.after(async () => { if (!TEST_URI) return; await cleanup(); await mongoose.disconnect(); });

test("US-01 : crée un compte candidat valide (201)", { skip }, async () => {
  const res = await registerHandler(fakeRequest(candidat), context);
  assert.equal(res.status, 201);
  assert.equal(res.jsonBody.role, "candidat");
  assert.equal(res.jsonBody.email, candidat.email);
  assert.equal(res.jsonBody.mdp, undefined);
});
test("US-01 : le mot de passe est hashé avec bcrypt", { skip }, async () => {
  const withPassword = await User.findOne({ email: candidat.email }).select("+mdp");
  assert.notEqual(withPassword.mdp, candidat.mdp);
  assert.ok(withPassword.mdp.startsWith("$2"));
});
test("US-01 : refuse un email déjà utilisé (409)", { skip }, async () => {
  const res = await registerHandler(fakeRequest(candidat), context);
  assert.equal(res.status, 409);
});
test("US-01 : refuse un candidat sans prénom (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...candidat, email: "nomprenom@test.local", prenom: "" }), context);
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.jsonBody.errors));
});
test("US-01 : refuse un mot de passe trop court (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...candidat, email: "court@test.local", mdp: "1234567" }), context);
  assert.equal(res.status, 400);
});
test("US-01 : refuse un email invalide (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...candidat, email: "pas-un-email" }), context);
  assert.equal(res.status, 400);
});
test("US-01 : refuse le rôle agent via /register (400)", { skip }, async () => {
  const res = await registerHandler(fakeRequest({ ...candidat, email: "agent@test.local", role: "agent" }), context);
  assert.equal(res.status, 400);
});
