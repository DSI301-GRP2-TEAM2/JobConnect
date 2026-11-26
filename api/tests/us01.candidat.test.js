const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
}

const mongoose = require("mongoose");
const User = require("../src/models/User");
const app = require("../src/server");

const candidat = {
  nom: "Dupont",
  prenom: "Jean",
  email: "us01.candidat@us01.local",
  mdp: "password123",
};

let server, port;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const options = {
      host: "127.0.0.1",
      port,
      path,
      method,
      agent: false,
      headers: data
        ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) }
        : {},
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json;
        try { json = JSON.parse(raw); } catch { json = undefined; }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function cleanup() {
  await User.deleteMany({ email: /^us01\./i });
}

test.before(async () => {
  if (!TEST_URI) return;
  await mongoose.connect(TEST_URI);
  await cleanup();
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
});

test.after(async () => {
  if (!TEST_URI) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await cleanup();
  await mongoose.disconnect();
});

test("US-01 HTTP : POST /api/auth/register/candidat crée un compte (201)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", candidat);
  assert.equal(res.status, 201);
  assert.equal(res.json.message, "Compte candidat créé avec succès");
  assert.equal(res.json.user.role, "candidat");
  assert.equal(res.json.user.email, candidat.email.toLowerCase());
  assert.equal(res.json.user.nom, "Dupont");
  assert.equal(res.json.user.prenom, "Jean");
  assert.equal(res.json.user.mdp, undefined);
});

test("US-01 HTTP : le mot de passe est hashé avec bcrypt", { skip }, async () => {
  const withPassword = await User.findOne({ email: candidat.email }).select("+mdp");
  assert.ok(withPassword);
  assert.notEqual(withPassword.mdp, candidat.mdp);
  assert.ok(withPassword.mdp.startsWith("$2"));
});

test("US-01 HTTP : le candidat peut se connecter après inscription", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", {
    email: candidat.email,
    mdp: candidat.mdp,
  });
  assert.equal(res.status, 200);
  assert.ok(res.json.token);
  assert.equal(res.json.user.role, "candidat");
  assert.equal(res.json.user.email, candidat.email.toLowerCase());
});

test("US-01 HTTP : refuse un email déjà utilisé (409)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", candidat);
  assert.equal(res.status, 409);
  assert.ok(res.json.error.includes("existe déjà"));
});

test("US-01 HTTP : refuse un candidat sans prénom (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "us01.sansprenom@us01.local",
    prenom: "",
  });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.json.errors));
  assert.ok(res.json.errors.some((e) => e.includes("prenom")));
});

test("US-01 HTTP : refuse un nom avec seulement des espaces (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "us01.spaces@us01.local",
    nom: "   ",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.some((e) => e.includes("nom")));
});

test("US-01 HTTP : refuse un mot de passe vide (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "us01.empty@us01.local",
    mdp: "",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.some((e) => e.includes("mdp") && e.includes("obligatoire")));
});

test("US-01 HTTP : refuse un mot de passe trop court (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "us01.court@us01.local",
    mdp: "1234567",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.some((e) => e.includes("8 caractères")));
});

test("US-01 HTTP : l'email est stocké en minuscules", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "US01.Mixed@US01.LOCAL",
  });
  assert.equal(res.status, 201);
  const dbUser = await User.findOne({ email: "us01.mixed@us01.local" });
  assert.ok(dbUser);
});

test("US-01 HTTP : refuse si le client envoie role=agent (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "us01.agent@us01.local",
    role: "agent",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.some((e) => e.includes("rôle")));
});
