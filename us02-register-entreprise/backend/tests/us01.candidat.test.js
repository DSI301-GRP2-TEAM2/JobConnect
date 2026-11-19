

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

const candidat = {
  nom: "Dupont",
  prenom: "Jean",
  email: "candidat.us01@test.local",
  mdp: "password123",
};

let server, port;

function request(method, path, body, headers = {}) {
  const http = require("node:http");
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const options = {
      host: "127.0.0.1",
      port,
      path,
      method,
      agent: false,
      headers: {
        ...(data
          ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) }
          : {}),
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json;
        try { json = JSON.parse(raw); } catch { json = undefined; }
        resolve({ status: res.statusCode, headers: res.headers, json, text: raw });
      });
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

test("US-01 : crée un compte candidat valide (201)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", candidat);
  assert.equal(res.status, 201);
  assert.equal(res.json.message, "Compte candidat créé avec succès");
  assert.equal(res.json.user.role, "candidat");
  assert.equal(res.json.user.email, candidat.email.toLowerCase());
  assert.equal(res.json.user.nom, "Dupont");
  assert.equal(res.json.user.prenom, "Jean");
  
  assert.equal(res.json.user.mdp, undefined);
});

test("US-01 : le mot de passe est hashé avec bcrypt", { skip }, async () => {
  const withPassword = await User.findOne({ email: candidat.email }).select("+mdp");
  assert.notEqual(withPassword.mdp, candidat.mdp);
  assert.ok(withPassword.mdp.startsWith("$2"));
});

test("US-01 : refuse un email déjà utilisé (409)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", candidat);
  assert.equal(res.status, 409);
  assert.ok(res.json.error.includes("existe déjà"));
});

test("US-01 : refuse un candidat sans prénom (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "nomprenom@test.local",
    prenom: "",
  });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.json.details));
  assert.ok(res.json.details.some((d) => d.includes("prénom")));
});

test("US-01 : refuse un mot de passe trop court (400, min 8 chars)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "court@test.local",
    mdp: "1234567",
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.details.some((d) => d.includes("8 caractères")));
});

test("US-01 : refuse un email invalide (400)", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "pas-un-email",
  });
  
  assert.equal(res.status, 400);
});

test("US-01 : l'email est stocké en minuscules", { skip }, async () => {
  const res = await request("POST", "/api/auth/register/candidat", {
    ...candidat,
    email: "Mixed.Case@Example.COM",
  });
  assert.equal(res.status, 201);
  const dbUser = await User.findOne({ email: "mixed.case@example.com" });
  assert.ok(dbUser);
});
