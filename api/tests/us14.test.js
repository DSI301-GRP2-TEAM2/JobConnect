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

test("US-14 Sécurité : GET /api/offres sans token -> 401", async () => {
  const res = await request("GET", "/api/offres");
  assert.equal(res.status, 401);
});

test("US-14 Sécurité : GET /api/offres avec rôle non candidat (agent) -> 403", async () => {
  const res = await request("GET", "/api/offres", undefined, {
    authorization: `Bearer ${agentToken}`,
  });
  assert.equal(res.status, 403);
});

test("US-14 Fonctionnel : GET /api/offres retourne uniquement les offres au statut 'publiee'", { skip }, async () => {
  await Offer.deleteMany({ titre: /Test US14/ });

  const cat = await Category.create({ libelle: "Cat US14", description: "Desc Cat US14" });
  const entreprise = await User.create({
    nom: "Ent US14",
    nomEntreprise: "Ent US14 Tech",
    email: "ent-us14@test.com",
    mdp: "Test12345",
    role: "entreprise",
  });

  const offrePubliee = await Offer.create({
    titre: "Test US14 Offre Publiee",
    description: "Poste ouvert aux candidats",
    salaire: 45000,
    statut: "publiee",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
    lieu: "Paris (75008) - Hybride",
    typeContrat: "CDI",
  });

  await Offer.create({
    titre: "Test US14 Offre En Attente",
    description: "Poste non validé",
    salaire: 40000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  await Offer.create({
    titre: "Test US14 Offre Rejetee",
    description: "Poste rejeté par modération",
    salaire: 35000,
    statut: "rejetee",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  const res = await request("GET", "/api/offres", undefined, {
    authorization: `Bearer ${candidatToken}`,
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));

  const titres = res.json.map((o) => o.titre);
  assert.ok(titres.includes("Test US14 Offre Publiee"));
  assert.ok(!titres.includes("Test US14 Offre En Attente"));
  assert.ok(!titres.includes("Test US14 Offre Rejetee"));

  const offreTest = res.json.find((o) => o.titre === "Test US14 Offre Publiee");
  assert.ok(offreTest);
  assert.equal(offreTest.lieu, "Paris (75008) - Hybride");
  assert.equal(offreTest.typeContrat, "CDI");

  await Offer.deleteMany({ titre: /Test US14/ });
  await User.deleteMany({ email: "ent-us14@test.com" });
  await Category.deleteMany({ libelle: "Cat US14" });
});
