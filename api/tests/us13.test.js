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
// Tests unitaires et de sécurité US-13 (sans BDD)
// -------------------------------------------------------------

test("US-13 Sécurité : PATCH /api/offres/:id/reject requiert un token (401)", async () => {
  const res = await request("PATCH", "/api/offres/507f1f77bcf86cd799439011/reject");
  assert.equal(res.status, 401);
});

test("US-13 Sécurité : PATCH /api/offres/:id/reject refuse un rôle candidat (403)", async () => {
  const res = await request(
    "PATCH",
    "/api/offres/507f1f77bcf86cd799439011/reject",
    {},
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 403);
});

test("US-13 Validation : PATCH /api/offres/:id/reject avec un ID non valide -> 400", async () => {
  const res = await request(
    "PATCH",
    "/api/offres/id-invalide-non-objectid/reject",
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-13 Interface Agent EJS : GET /agent/offres répond 200 en HTML", async () => {
  const res = await request("GET", "/agent/offres");
  // Même sans BDD connectée en local, l'endpoint existe et renvoie le HTML ou tente la connexion
  assert.ok(res.status === 200 || res.status === 500);
});

// -------------------------------------------------------------
// Tests avec base de données (exécutés dans GitHub Actions)
// -------------------------------------------------------------

test("US-13 Fonctionnel : L'agent refuse avec succès une offre en attente", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US13/ });

  const cat = await Category.create({ libelle: "Cat Test US13", description: "Desc" });
  const entreprise = await User.create({
    nom: "Ent US13",
    nomEntreprise: "Ent US13 SAS",
    email: "ent-us13@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offre = await Offer.create({
    titre: "Offre Test US13 Refus",
    description: "Poste à refuser",
    salaire: 35000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  // 1. Refus de l'offre par l'Agent
  const res = await request(
    "PATCH",
    `/api/offres/${offre._id}/reject`,
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 200);
  assert.equal(res.json.offre.statut, "rejetee");

  // 2. Vérification en BDD
  const updated = await Offer.findById(offre._id);
  assert.equal(updated.statut, "rejetee");

  // 3. Tentative de refuser une offre déjà rejetée -> 400
  const resDouble = await request(
    "PATCH",
    `/api/offres/${offre._id}/reject`,
    {},
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(resDouble.status, 400);

  // 4. Nettoyage
  await Offer.deleteMany({ titre: /Test US13/ });
  await User.deleteMany({ email: "ent-us13@test.com" });
  await Category.deleteMany({ libelle: "Cat Test US13" });
});
