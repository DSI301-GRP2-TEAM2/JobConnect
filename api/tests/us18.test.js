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
const Candidature = require("../src/models/Candidature");

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

const fakeCandidatId = new mongoose.Types.ObjectId().toString();
const candidatToken = makeToken({ id: fakeCandidatId, role: "candidat" });
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

test("US-18 Sécurité : POST /api/candidatures sans token -> 401", async () => {
  const res = await request("POST", "/api/candidatures", { offreId: "507f1f77bcf86cd799439011" });
  assert.equal(res.status, 401);
});

test("US-18 Sécurité : POST /api/candidatures avec rôle non candidat -> 403", async () => {
  const res = await request(
    "POST",
    "/api/candidatures",
    { offreId: "507f1f77bcf86cd799439011" },
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 403);
});

test("US-18 Validation : POST /api/candidatures sans offreId -> 400", async () => {
  const res = await request(
    "POST",
    "/api/candidatures",
    { lettreMotivation: "Motivation" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-18 Validation : POST /api/candidatures avec ID offre invalide -> 400", async () => {
  const res = await request(
    "POST",
    "/api/candidatures",
    { offreId: "invalid-objectid" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-18 Fonctionnel : POST /api/candidatures soumet une candidature et refuse le doublon (409)", { skip }, async () => {
  await Candidature.deleteMany({});
  await Offer.deleteMany({ titre: /Test US18/ });
  await User.deleteMany({ email: /us18@test\.com/ });

  const cat = await Category.create({ libelle: "Cat US18", description: "Desc US18" });
  const entreprise = await User.create({
    nom: "Ent US18",
    nomEntreprise: "Ent US18 Tech",
    email: "ent-us18@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const candidat = await User.create({
    nom: "Candidat US18",
    prenom: "Luc",
    email: "candidat-us18@test.com",
    mdp: "Test12345",
    role: "candidat",
    cv: "/uploads/cv-luc.pdf",
  });

  const offre = await Offer.create({
    titre: "Test US18 Offre Candidature",
    description: "Poste ouvert aux candidatures",
    salaire: 48000,
    statut: "publiee",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  const token = makeToken({ id: candidat._id.toString(), role: "candidat" });

  const res1 = await request(
    "POST",
    "/api/candidatures",
    {
      offreId: offre._id.toString(),
      lettreMotivation: "Je suis très motivé par ce poste.",
    },
    { authorization: `Bearer ${token}` }
  );

  assert.equal(res1.status, 201);
  assert.equal(res1.json.candidature.statut, "en_attente");
  assert.equal(res1.json.candidature.cvFichier, "/uploads/cv-luc.pdf");

  const res2 = await request(
    "POST",
    "/api/candidatures",
    {
      offreId: offre._id.toString(),
      lettreMotivation: "Deuxième tentative",
    },
    { authorization: `Bearer ${token}` }
  );

  assert.equal(res2.status, 409);

  const mesRes = await request("GET", "/api/candidatures/mes-candidatures", undefined, {
    authorization: `Bearer ${token}`,
  });

  assert.equal(mesRes.status, 200);
  assert.ok(Array.isArray(mesRes.json));
  assert.equal(mesRes.json.length, 1);

  await Candidature.deleteMany({});
  await Offer.deleteMany({ titre: /Test US18/ });
  await User.deleteMany({ email: /us18@test\.com/ });
  await Category.deleteMany({ libelle: "Cat US18" });
});
