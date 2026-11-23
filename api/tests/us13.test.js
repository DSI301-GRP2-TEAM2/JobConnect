const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests BDD ignorés";

process.env.CORS_ORIGIN = "https://front.test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-12345";
if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
}

const app = require("../src/server");
const Offer = require("../src/models/Offer");
const Category = require("../src/models/Category");
const User = require("../src/models/User");

let server;
let port;

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
        resolve({ status: res.statusCode, headers: res.headers, raw, json });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

const agentToken = makeToken({ id: new mongoose.Types.ObjectId().toString(), role: "agent" });
const candidatToken = makeToken({ id: new mongoose.Types.ObjectId().toString(), role: "candidat" });

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  port = server.address().port;
  if (TEST_URI) {
    await mongoose.connect(TEST_URI);
  }
});

test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (TEST_URI) {
    await mongoose.disconnect();
  }
});

// -------------------------------------------------------------
// Tests de sécurité et d'accès non autorisé (sans BDD)
// -------------------------------------------------------------

test("US-13 API Sécurité : PATCH /api/offres/:id/reject sans token -> 401", async () => {
  const res = await request("PATCH", "/api/offres/507f1f77bcf86cd799439011/reject");
  assert.equal(res.status, 401);
});

test("US-13 API Sécurité : PATCH /api/offres/:id/reject avec rôle candidat -> 403", async () => {
  const res = await request(
    "PATCH",
    "/api/offres/507f1f77bcf86cd799439011/reject",
    {},
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 403);
});

test("US-13 API Validation : PATCH /api/offres/:id/reject avec identifiant invalide -> 400", async () => {
  const res = await request(
    "PATCH",
    "/api/offres/invalid-id/reject",
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-13 EJS Sécurité : GET /agent/offres sans token ni cookie -> 401", async () => {
  const res = await request("GET", "/agent/offres");
  assert.equal(res.status, 401);
});

test("US-13 EJS Sécurité : GET /agent/offres avec token dans l'URL uniquement est refusé -> 401", async () => {
  const res = await request("GET", `/agent/offres?token=${agentToken}`);
  assert.equal(res.status, 401);
});

test("US-13 EJS Sécurité : GET /agent/offres avec cookie candidat -> 403", async () => {
  const res = await request("GET", "/agent/offres", undefined, {
    cookie: `token=${candidatToken}`,
  });
  assert.equal(res.status, 403);
});

test("US-13 EJS Sécurité : POST /agent/offres/:id/reject sans token ni cookie -> 401", async () => {
  const res = await request("POST", "/agent/offres/507f1f77bcf86cd799439011/reject");
  assert.equal(res.status, 401);
});

test("US-13 EJS Sécurité : POST /agent/offres/:id/reject avec cookie candidat -> 403", async () => {
  const res = await request(
    "POST",
    "/agent/offres/507f1f77bcf86cd799439011/reject",
    {},
    { cookie: `token=${candidatToken}` }
  );
  assert.equal(res.status, 403);
});

// -------------------------------------------------------------
// Tests fonctionnels avec base de données (exécutés dans GitHub Actions)
// -------------------------------------------------------------

test("US-13 EJS : GET /agent/offres avec cookie agent valide répond 200 et affiche la vue", { skip }, async () => {
  const res = await request("GET", "/agent/offres", undefined, {
    cookie: `token=${agentToken}`,
  });
  assert.equal(res.status, 200);
  assert.ok(res.raw.includes("Offres en attente de validation"));
  assert.ok(res.raw.includes("agent.css"));
});

test("US-13 Fonctionnel : L'agent refuse une offre en attente via l'API", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US13 API/ });

  const cat = await Category.create({ libelle: "Cat US13 API", description: "Desc" });
  const entreprise = await User.create({
    nom: "Ent US13",
    nomEntreprise: "Ent US13 SAS",
    email: "ent-api@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offre = await Offer.create({
    titre: "Test US13 API Refus",
    description: "Poste à rejeter",
    salaire: 38000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  // 1. Refus par l'agent
  const res = await request(
    "PATCH",
    `/api/offres/${offre._id}/reject`,
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 200);
  assert.equal(res.json.offre.statut, "rejetee");

  // 2. Vérification que le statut en BDD est passé à rejetee
  const check = await Offer.findById(offre._id);
  assert.equal(check.statut, "rejetee");

  // 3. Tentative de rejeter à nouveau -> 400
  const resDouble = await request(
    "PATCH",
    `/api/offres/${offre._id}/reject`,
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(resDouble.status, 400);

  await Offer.deleteMany({ titre: /Test US13 API/ });
  await User.deleteMany({ email: "ent-api@test.com" });
  await Category.deleteMany({ libelle: "Cat US13 API" });
});

test("US-13 Fonctionnel : L'agent refuse une offre via l'interface EJS avec cookie (redirection sans token dans l'URL)", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US13 EJS/ });

  const cat = await Category.create({ libelle: "Cat US13 EJS", description: "Desc" });
  const entreprise = await User.create({
    nom: "Ent EJS",
    nomEntreprise: "Ent EJS SAS",
    email: "ent-ejs@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offre = await Offer.create({
    titre: "Test US13 EJS Refus",
    description: "Poste à refuser via form EJS",
    salaire: 42000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  // Action POST sur /agent/offres/:id/reject avec cookie token agent -> 302 Redirection sans token en URL
  const res = await request(
    "POST",
    `/agent/offres/${offre._id}/reject`,
    {},
    { cookie: `token=${agentToken}` }
  );
  assert.equal(res.status, 302);
  assert.ok(res.headers.location.includes("success"));
  assert.ok(!res.headers.location.includes("token"));

  const check = await Offer.findById(offre._id);
  assert.equal(check.statut, "rejetee");

  await Offer.deleteMany({ titre: /Test US13 EJS/ });
  await User.deleteMany({ email: "ent-ejs@test.com" });
  await Category.deleteMany({ libelle: "Cat US13 EJS" });
});

test("US-13 Fonctionnel : Refus d'une offre avec motif de refus", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US13 Motif/ });

  const cat = await Category.create({ libelle: "Cat US13 Motif", description: "Desc" });
  const entreprise = await User.create({
    nom: "Ent Motif",
    nomEntreprise: "Ent Motif SAS",
    email: "ent-motif@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offre = await Offer.create({
    titre: "Test US13 Motif Refus",
    description: "Poste avec motif de refus",
    salaire: 39000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  const motif = "La description du poste manque de précisions concernant la rémunération.";
  const res = await request(
    "PATCH",
    `/api/offres/${offre._id}/reject`,
    { motifRefus: motif },
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 200);
  assert.equal(res.json.offre.statut, "rejetee");
  assert.equal(res.json.offre.motifRefus, motif);

  const check = await Offer.findById(offre._id);
  assert.equal(check.statut, "rejetee");
  assert.equal(check.motifRefus, motif);

  await Offer.deleteMany({ titre: /Test US13 Motif/ });
  await User.deleteMany({ email: "ent-motif@test.com" });
  await Category.deleteMany({ libelle: "Cat US13 Motif" });
});
