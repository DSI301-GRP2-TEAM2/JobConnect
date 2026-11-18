const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests avec base ignorés";

process.env.CORS_ORIGIN = "https://front.test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-12345";
if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
}

const app = require("../src/server");
const User = require("../src/models/User");
const Offer = require("../src/models/Offer");
const Category = require("../src/models/Category");
const Candidature = require("../src/models/Candidature");
const { validateCvFile, validateUpdateProfil, validateCandidature } = require("../src/validators");

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
        resolve({ status: res.statusCode, headers: res.headers, json });
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
const entrepriseToken = makeToken({ id: new mongoose.Types.ObjectId().toString(), role: "entreprise" });

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

// =========================================================================
// Tests sans base de données : Sécurité, Rôles, Validation des US13-US18
// =========================================================================

test("Validators : validateCvFile refuse les formats non autorisés", () => {
  const exe = validateCvFile({ originalname: "virus.exe", mimetype: "application/x-msdownload" });
  assert.ok(exe.errors && exe.errors.length > 0);

  const txt = validateCvFile({ originalname: "notes.txt", mimetype: "text/plain" });
  assert.ok(txt.errors && txt.errors.length > 0);
});

test("Validators : validateCvFile accepte PDF et DOCX", () => {
  const pdf = validateCvFile({ originalname: "mon_cv.pdf", mimetype: "application/pdf", size: 1024 });
  assert.equal(pdf.errors, null);

  const docx = validateCvFile({
    originalname: "mon_cv.docx",
    mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 2048,
  });
  assert.equal(docx.errors, null);
});

test("Validators : validateCvFile refuse un fichier supérieur à 5 Mo", () => {
  const big = validateCvFile({
    originalname: "gros_cv.pdf",
    mimetype: "application/pdf",
    size: 6 * 1024 * 1024,
  });
  assert.ok(big.errors && big.errors.length > 0);
});

test("Validators : validateUpdateProfil valide le format du téléphone", () => {
  const bad = validateUpdateProfil({ telephone: "abc123" });
  assert.ok(bad.errors && bad.errors.length > 0);

  const good = validateUpdateProfil({ nom: "Dupont", prenom: "Jean", telephone: "+33612345678" });
  assert.equal(good.errors, undefined);
  assert.equal(good.data.nom, "Dupont");
});

test("Validators : validateCandidature exige offreId", () => {
  const bad = validateCandidature({});
  assert.ok(bad.errors && bad.errors.length > 0);

  const good = validateCandidature({ offreId: "507f1f77bcf86cd799439011", lettreMotivation: "Motivation" });
  assert.equal(good.errors, undefined);
  assert.equal(good.data.offreId, "507f1f77bcf86cd799439011");
});

test("Sécurité US-13 : PATCH /api/offres/:id/reject requiert un token", async () => {
  const res = await request("PATCH", "/api/offres/507f1f77bcf86cd799439011/reject");
  assert.equal(res.status, 401);
});

test("Sécurité US-13 : PATCH /api/offres/:id/reject refuse un candidat (403)", async () => {
  const res = await request("PATCH", "/api/offres/507f1f77bcf86cd799439011/reject", {}, {
    authorization: `Bearer ${candidatToken}`,
  });
  assert.equal(res.status, 403);
});

test("Sécurité US-14 : GET /api/offres requiert un token candidat", async () => {
  const sansToken = await request("GET", "/api/offres");
  assert.equal(sansToken.status, 401);

  const agent = await request("GET", "/api/offres", undefined, {
    authorization: `Bearer ${agentToken}`,
  });
  assert.equal(agent.status, 403);
});

test("Sécurité US-15 : GET /api/offres/:id refuse sans token", async () => {
  const res = await request("GET", "/api/offres/507f1f77bcf86cd799439011");
  assert.equal(res.status, 401);
});

test("Sécurité US-16 : PUT /api/candidats/me refuse un non-candidat (403)", async () => {
  const res = await request("PUT", "/api/candidats/me", { nom: "Test" }, {
    authorization: `Bearer ${entrepriseToken}`,
  });
  assert.equal(res.status, 403);
});

test("Sécurité US-17 : POST /api/candidats/me/cv refuse sans token", async () => {
  const res = await request("POST", "/api/candidats/me/cv", { filename: "cv.pdf" });
  assert.equal(res.status, 401);
});

test("Sécurité US-18 : POST /api/candidatures refuse sans token", async () => {
  const res = await request("POST", "/api/candidatures", { offreId: "507f1f77bcf86cd799439011" });
  assert.equal(res.status, 401);
});

test("US-13 : PATCH /api/offres/:id/reject avec un ID invalide -> 400", async () => {
  const res = await request("PATCH", "/api/offres/id-invalide/reject", {}, {
    authorization: `Bearer ${agentToken}`,
  });
  assert.equal(res.status, 400);
});

test("US-15 : GET /api/offres/:id avec un ID invalide -> 400", async () => {
  const res = await request("GET", "/api/offres/id-invalide", undefined, {
    authorization: `Bearer ${candidatToken}`,
  });
  assert.equal(res.status, 400);
});

test("US-18 : POST /api/candidatures avec payload invalide -> 400", async () => {
  const res = await request("POST", "/api/candidatures", {}, {
    authorization: `Bearer ${candidatToken}`,
  });
  assert.equal(res.status, 400);
});

// =========================================================================
// Tests avec base de données (exécutés dans la CI GitHub Actions)
// =========================================================================

test("US-13 à US-18 Parcours complet BDD", { skip }, async () => {
  // 1. Nettoyage
  await User.deleteMany({ email: /@us-test\.com$/ });
  await Offer.deleteMany({ titre: /US Test/ });
  await Category.deleteMany({ libelle: "Cat US Test" });

  // 2. Création de données de test
  const cat = await Category.create({ libelle: "Cat US Test", description: "Test Cat" });
  const entreprise = await User.create({
    nom: "Societe",
    nomEntreprise: "Societe US Test",
    email: "entreprise@us-test.com",
    mdp: "Test12345",
    role: "entreprise",
  });
  const candidat = await User.create({
    nom: "Martin",
    prenom: "Lucie",
    email: "lucie@us-test.com",
    mdp: "Test12345",
    role: "candidat",
  });
  const agent = await User.create({
    nom: "Agent",
    email: "agent@us-test.com",
    mdp: "Test12345",
    role: "agent",
  });

  const cToken = makeToken({ id: candidat._id.toString(), role: "candidat" });
  const aToken = makeToken({ id: agent._id.toString(), role: "agent" });

  // Création d'une offre en attente
  const offreAttente = await Offer.create({
    titre: "US Test Offre En Attente",
    description: "Description poste",
    salaire: 40000,
    statut: "en_attente",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  // Création d'une offre publiée
  const offrePubliee = await Offer.create({
    titre: "US Test Offre Développeur Node.js",
    description: "Super job Node.js",
    salaire: 45000,
    statut: "publiee",
    entreprise: { id: entreprise._id, nomEntreprise: entreprise.nomEntreprise },
    categorie: cat._id,
  });

  // ---- Test US-13 : L'agent refuse l'offre en attente ----
  const resReject = await request("PATCH", `/api/offres/${offreAttente._id}/reject`, {}, {
    authorization: `Bearer ${aToken}`,
  });
  assert.equal(resReject.status, 200);
  assert.equal(resReject.json.offre.statut, "rejetee");

  const checkOffer = await Offer.findById(offreAttente._id);
  assert.equal(checkOffer.statut, "rejetee");

  // Tentative de refuser à nouveau -> 400
  const resRejectAgain = await request("PATCH", `/api/offres/${offreAttente._id}/reject`, {}, {
    authorization: `Bearer ${aToken}`,
  });
  assert.equal(resRejectAgain.status, 400);

  // ---- Test US-14 : Le candidat consulte les offres publiées ----
  const resOffres = await request("GET", "/api/offres", undefined, {
    authorization: `Bearer ${cToken}`,
  });
  assert.equal(resOffres.status, 200);
  assert.ok(Array.isArray(resOffres.json));
  // Vérifie que seule l'offre publiée est retournée, et pas la rejetée
  const titres = resOffres.json.map((o) => o.titre);
  assert.ok(titres.includes("US Test Offre Développeur Node.js"));
  assert.ok(!titres.includes("US Test Offre En Attente"));

  // ---- Test US-15 : Le candidat consulte le détail de l'offre publiée ----
  const resDetail = await request("GET", `/api/offres/${offrePubliee._id}`, undefined, {
    authorization: `Bearer ${cToken}`,
  });
  assert.equal(resDetail.status, 200);
  assert.equal(resDetail.json.titre, "US Test Offre Développeur Node.js");

  // Tentative de consulter l'offre rejetée -> 404
  const resDetailRejetee = await request("GET", `/api/offres/${offreAttente._id}`, undefined, {
    authorization: `Bearer ${cToken}`,
  });
  assert.equal(resDetailRejetee.status, 404);

  // ---- Test US-16 : Le candidat complète son profil ----
  const resProfil = await request(
    "PUT",
    "/api/candidats/me",
    { nom: "Martin-Dupont", prenom: "Lucie Marie", telephone: "+33698765432", adresse: "Paris" },
    { authorization: `Bearer ${cToken}` }
  );
  assert.equal(resProfil.status, 200);
  assert.equal(resProfil.json.user.nom, "Martin-Dupont");
  assert.equal(resProfil.json.user.telephone, "+33698765432");

  // ---- Test US-17 : Le candidat téléverse son CV ----
  const resCv = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "lucie_martin_cv.pdf", mimetype: "application/pdf" },
    { authorization: `Bearer ${cToken}` }
  );
  assert.equal(resCv.status, 200);
  assert.ok(resCv.json.cv.includes("lucie_martin_cv.pdf"));

  // Format interdit (.exe) -> 400
  const resCvBad = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "bad_file.exe", mimetype: "application/x-msdownload" },
    { authorization: `Bearer ${cToken}` }
  );
  assert.equal(resCvBad.status, 400);

  // ---- Test US-18 : Le candidat soumet sa candidature ----
  const resCand = await request(
    "POST",
    "/api/candidatures",
    { offreId: offrePubliee._id.toString(), lettreMotivation: "Je suis très motivée par ce poste !" },
    { authorization: `Bearer ${cToken}` }
  );
  assert.equal(resCand.status, 201);
  assert.equal(resCand.json.candidature.statut, "en_attente");
  assert.ok(resCand.json.candidature.cvFichier.includes("lucie_martin_cv.pdf"));

  // Tentative de postuler une 2e fois à la même offre -> 409 Conflit
  const resCandDouble = await request(
    "POST",
    "/api/candidatures",
    { offreId: offrePubliee._id.toString(), lettreMotivation: "Encore moi" },
    { authorization: `Bearer ${cToken}` }
  );
  assert.equal(resCandDouble.status, 409);

  // Nettoyage final
  await Candidature.deleteMany({ candidat: candidat._id });
  await Offer.deleteMany({ titre: /US Test/ });
  await User.deleteMany({ email: /@us-test\.com$/ });
  await Category.deleteMany({ libelle: "Cat US Test" });
});
