
const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
}

const mongoose = require("mongoose");
const { User } = require("../src/models/user");
const { connectDB, disconnectDB } = require("../src/config/db");
const app = require("../src/app");

const entreprise = {
  nom: "Dupont",               
  nomEntreprise: "TechCorp Solutions",
  secteur: "Technologies de l'Information (IT)",
  email: "entreprise.us02@test.local",
  mdp: "securepass2023",
};

let server, port;

function request(method, path, body) {
  const http = require("node:http");
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const options = {
      host: "127.0.0.1", port, path, method, agent: false,
      headers: data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {},
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => { let json; try { json = JSON.parse(raw); } catch { json = undefined; } resolve({ status: res.statusCode, json, text: raw }); });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

test.before(async () => {
  if (!TEST_URI) return;
  await connectDB(TEST_URI);
  await User.deleteMany({});
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
});

test.after(async () => {
  if (!TEST_URI) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await User.deleteMany({});
  await disconnectDB();
});

test("US-02 : crée un compte entreprise valide (201)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", entreprise);
  assert.equal(res.status, 201);
  assert.equal(res.json.message, "Compte entreprise créé avec succès");
  assert.equal(res.json.user.role, "entreprise");
  assert.equal(res.json.user.nomEntreprise, "TechCorp Solutions");
  assert.equal(res.json.user.secteur, "Technologies de l'Information (IT)");
  assert.equal(res.json.user.mdp, undefined);
});

test("US-02 : le mot de passe est hashé avec bcrypt", { skip }, async () => {
  const withPassword = await User.findOne({ email: entreprise.email }).select("+mdp");
  assert.notEqual(withPassword.mdp, entreprise.mdp);
  assert.ok(withPassword.mdp.startsWith("$2"));
});

test("US-02 : refuse un email déjà utilisé (409)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", entreprise);
  assert.equal(res.status, 409);
});

test("US-02 : refuse une entreprise sans nomEntreprise (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", {
    ...entreprise,
    email: "sansnom@test.local",
    nomEntreprise: "",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.details.some((d) => d.includes("nom de l'entreprise")));
});

test("US-02 : refuse une entreprise sans secteur (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", {
    ...entreprise,
    email: "sanssecteur@test.local",
    secteur: "",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.details.some((d) => d.includes("secteur")));
});

test("US-02 : refuse un mot de passe trop court (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", {
    ...entreprise,
    email: "court@test.local",
    mdp: "1234567",
  });
  assert.equal(res.status, 400);
});

test("US-02 : accepte les champs optionnels siteWeb et description", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/entreprise", {
    ...entreprise,
    email: "optionnel@test.local",
    siteWeb: "https://techcorp.fr",
    description: "We build software.",
  });
  assert.equal(res.status, 201);
  const dbUser = await User.findOne({ email: "optionnel@test.local" });
  assert.equal(dbUser.siteWeb, "https://techcorp.fr");
  assert.equal(dbUser.description, "We build software.");
});

test("US-02 : candidat et entreprise cohabitent dans la collection users", { skip }, async () => {
  await request("POST", "/api/auth/register/candidat", {
    nom: "Cand", prenom: "X",
    email: "cohab-cand@test.local",
    mdp: "password123",
  });
  const count = await User.countDocuments({ email: /@test\.local$/ });
  
  assert.ok(count >= 2);
  const roles = await User.distinct("role", { email: /@test\.local$/ });
  assert.ok(roles.includes("candidat"));
  assert.ok(roles.includes("entreprise"));
});
