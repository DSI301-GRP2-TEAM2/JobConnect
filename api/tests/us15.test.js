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

const candidatToken = makeToken({ id: new mongoose.Types.ObjectId().toString(), role: "candidat" });
const agentToken = makeToken({ id: new mongoose.Types.ObjectId().toString(), role: "agent" });

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

test("US-15 Sécurité : GET /api/offres/:id sans token -> 401", async () => {
  const res = await request("GET", "/api/offres/507f1f77bcf86cd799439011");
  assert.equal(res.status, 401);
});

test("US-15 Sécurité : GET /api/offres/:id avec rôle non candidat -> 403", async () => {
  const res = await request("GET", "/api/offres/507f1f77bcf86cd799439011", undefined, {
    authorization: `Bearer ${agentToken}`,
  });
  assert.equal(res.status, 403);
});

test("US-15 Validation : GET /api/offres/:id avec identifiant invalide -> 400", async () => {
  const res = await request("GET", "/api/offres/not-a-valid-objectid", undefined, {
    authorization: `Bearer ${candidatToken}`,
  });
  assert.equal(res.status, 400);
});

test("US-15 Fonctionnel : GET /api/offres/:id retourne 404 si l'offre n'existe pas", { skip }, async () => {
  const nonExistentId = new mongoose.Types.ObjectId().toString();
  const res = await request("GET", `/api/offres/${nonExistentId}`, undefined, {
    authorization: `Bearer ${candidatToken}`,
  });
  assert.equal(res.status, 404);
});

test("US-15 Fonctionnel : GET /api/offres/:id retourne 404 pour une offre existante mais non publiée", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US15 Non Publiee/ });

  const cat = await Category.create({ libelle: "Cat US15 NP", description: "Desc NP" });
  const entreprise = await User.create({
    nom: "Ent US15 NP",
    nomEntreprise: "Ent US15 NP Tech",
    email: "ent-us15-np@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offreEnAttente = await Offer.create({
    titre: "Test US15 Non Publiee",
    description: "Poste en attente de modération",
    salaire: 38000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  const res = await request("GET", `/api/offres/${offreEnAttente._id}`, undefined, {
    authorization: `Bearer ${candidatToken}`,
  });

  assert.equal(res.status, 404);

  await Offer.deleteMany({ titre: /Test US15 Non Publiee/ });
  await User.deleteMany({ email: "ent-us15-np@test.com" });
  await Category.deleteMany({ libelle: "Cat US15 NP" });
});

test("US-15 Fonctionnel : GET /api/offres/:id retourne 200 et les détails pour une offre publiée", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US15/ });

  const cat = await Category.create({ libelle: "Cat US15", description: "Desc US15" });
  const entreprise = await User.create({
    nom: "Ent US15",
    nomEntreprise: "Ent US15 Tech",
    email: "ent-us15@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offre = await Offer.create({
    titre: "Test US15 Offre Detail",
    description: "Description complète du poste proposé",
    missionsPrincipales: "Développement Angular et Node.js",
    profilRecherche: "Bac+5, 3 ans d'expérience minimum",
    salaire: 50000,
    statut: "publiee",
    localisation: "Paris (75008) - Hybride",
    typeContrat: "CDI",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  const res = await request("GET", `/api/offres/${offre._id}`, undefined, {
    authorization: `Bearer ${candidatToken}`,
  });

  assert.equal(res.status, 200);
  assert.equal(res.json.titre, "Test US15 Offre Detail");
  assert.equal(res.json.statut, "publiee");
  assert.equal(res.json.salaire, 50000);
  assert.equal(res.json.localisation, "Paris (75008) - Hybride");
  assert.equal(res.json.typeContrat, "CDI");
  assert.equal(res.json.missionsPrincipales, "Développement Angular et Node.js");
  assert.equal(res.json.profilRecherche, "Bac+5, 3 ans d'expérience minimum");

  await Offer.deleteMany({ titre: /Test US15/ });
  await User.deleteMany({ email: "ent-us15@test.com" });
  await Category.deleteMany({ libelle: "Cat US15" });
});
