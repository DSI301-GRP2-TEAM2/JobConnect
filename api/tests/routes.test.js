const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

// À définir avant d'importer server.js (lu au chargement du module)
process.env.CORS_ORIGIN = "https://front.test";
if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
}

const mongoose = require("mongoose");
const User = require("../src/models/User");
const app = require("../src/server");

let server;
let port;

// Requête HTTP réelle vers le serveur Express de test
function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data =
      body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
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
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        let json;
        try {
          json = JSON.parse(raw);
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode, headers: res.headers, json });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const candidat = {
  nom: "Test",
  prenom: "Candidat",
  email: "candidat@routes.test",
  mdp: "Test12345",
  role: "candidat",
};

async function cleanup() {
  await User.deleteMany({ email: /@routes\.test$/ });
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  port = server.address().port;
  if (TEST_URI) {
    await mongoose.connect(TEST_URI);
    await cleanup();
  }
});

test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (TEST_URI) {
    await cleanup();
    await mongoose.disconnect();
  }
});

// ---------- sans base de données ----------

test("GET /api/health répond ok", async () => {
  const res = await request("GET", "/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, { status: "ok" });
});

test("POST /api/auth/register : JSON invalide -> 400", async () => {
  const res = await request("POST", "/api/auth/register", "{pas du json");
  assert.equal(res.status, 400);
  assert.deepEqual(res.json, { errors: ["JSON invalide"] });
});

test("POST /api/auth/register : email invalide -> 400", async () => {
  const res = await request("POST", "/api/auth/register", {
    ...candidat,
    email: "pas-un-email",
  });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.json.errors));
});

test("POST /api/auth/login : champs manquants -> 400", async () => {
  const res = await request("POST", "/api/auth/login", {});
  assert.equal(res.status, 400);
});

test("CORS : l'origine configurée est autorisée", async () => {
  const res = await request("GET", "/api/health", undefined, {
    origin: "https://front.test",
  });
  assert.equal(res.headers["access-control-allow-origin"], "https://front.test");
});

test("CORS : une autre origine n'est pas autorisée", async () => {
  const res = await request("GET", "/api/health", undefined, {
    origin: "https://autre-site.test",
  });
  assert.equal(res.headers["access-control-allow-origin"], undefined);
});

// ---------- avec base de données ----------

test("POST /api/auth/register crée un candidat", { skip }, async () => {
  const res = await request("POST", "/api/auth/register", candidat);
  assert.equal(res.status, 201);
  assert.equal(res.json.role, "candidat");
  assert.equal(res.json.mdp, undefined);
});

test("POST /api/auth/register : email déjà utilisé -> 409", { skip }, async () => {
  const res = await request("POST", "/api/auth/register", candidat);
  assert.equal(res.status, 409);
});

test("POST /api/auth/login retourne un token", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", {
    email: candidat.email,
    mdp: candidat.mdp,
  });
  assert.equal(res.status, 200);
  assert.ok(res.json.token);
});

test("POST /api/auth/login : mauvais mot de passe -> 401", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", {
    email: candidat.email,
    mdp: "MauvaisMdp1",
  });
  assert.equal(res.status, 401);
});
