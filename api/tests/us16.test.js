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
const User = require("../src/models/User");
const { validateUpdateProfil } = require("../src/validators");

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

test("US-16 Sécurité : PUT /api/candidats/me sans token -> 401", async () => {
  const res = await request("PUT", "/api/candidats/me", { prenom: "Nouveau" });
  assert.equal(res.status, 401);
});

test("US-16 Sécurité : PUT /api/candidats/me avec rôle non candidat -> 403", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { prenom: "Nouveau" },
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 403);
});

test("US-16 Sécurité : GET /api/candidats/me sans token -> 401", async () => {
  const res = await request("GET", "/api/candidats/me");
  assert.equal(res.status, 401);
});

test("US-16 Sécurité : GET /api/candidats/me avec rôle non candidat -> 403", async () => {
  const res = await request("GET", "/api/candidats/me", undefined, {
    authorization: `Bearer ${agentToken}`,
  });
  assert.equal(res.status, 403);
});

test("US-16 Validation : PUT /api/candidats/me avec téléphone invalide -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { telephone: "abc" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Validation : PUT /api/candidats/me avec '0 1 2' (trop peu de chiffres) -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { telephone: "0 1 2" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Validation : PUT /api/candidats/me avec '0   1   2' (3 chiffres avec espaces) -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { telephone: "0   1   2" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Validation : PUT /api/candidats/me avec prénom vide -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { prenom: "" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Validation : PUT /api/candidats/me avec prénom composé uniquement d'espaces -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    { prenom: "    " },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Validation : validateUpdateProfil refuse un numéro avec moins de 8 chiffres même avec des espaces", () => {
  const resShort = validateUpdateProfil({ telephone: "0 1 2" });
  assert.ok(resShort.errors && resShort.errors.includes("numéro de téléphone invalide"));

  const resSpaces = validateUpdateProfil({ telephone: "0   1   2" });
  assert.ok(resSpaces.errors && resSpaces.errors.includes("numéro de téléphone invalide"));
});

test("US-16 Validation : validateUpdateProfil accepte un numéro valide avec espaces ('06 12 34 56 78')", () => {
  const res = validateUpdateProfil({ telephone: "06 12 34 56 78" });
  assert.equal(res.errors, undefined);
  assert.equal(res.data.telephone, "06 12 34 56 78");
});

test("US-16 Validation : validateUpdateProfil garde le téléphone optionnel (chaîne vide ou espaces)", () => {
  const resEmpty = validateUpdateProfil({ telephone: "", nom: "Dupont" });
  assert.equal(resEmpty.errors, undefined);
  assert.equal(resEmpty.data.telephone, "");

  const resSpaces = validateUpdateProfil({ telephone: "     ", nom: "Dupont" });
  assert.equal(resSpaces.errors, undefined);
  assert.equal(resSpaces.data.telephone, "");
});

test("US-16 Validation : validateUpdateProfil refuse un prénom vide ou uniquement composé d'espaces", () => {
  const resEmpty = validateUpdateProfil({ prenom: "" });
  assert.ok(resEmpty.errors && resEmpty.errors.includes("prenom ne peut pas être vide"));

  const resSpaces = validateUpdateProfil({ prenom: "   " });
  assert.ok(resSpaces.errors && resSpaces.errors.includes("prenom ne peut pas être vide"));
});

test("US-16 Validation : PUT /api/candidats/me sans modifications -> 400", async () => {
  const res = await request(
    "PUT",
    "/api/candidats/me",
    {},
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-16 Fonctionnel : PUT /api/candidats/me met à jour le profil et GET le retourne", { skip }, async () => {
  await User.deleteMany({ email: "profil-us16@test.com" });

  const candidat = await User.create({
    nom: "Dupont",
    prenom: "Jean",
    email: "profil-us16@test.com",
    mdp: "Test12345",
    role: "candidat",
  });

  const token = makeToken({ id: candidat._id.toString(), role: "candidat" });

  const updateRes = await request(
    "PUT",
    "/api/candidats/me",
    {
      prenom: "Jean-Marc",
      telephone: "+33612345678",
      titre: "Développeur Full Stack",
      ville: "Paris (75011)",
      competences: ["React", "Node.js"],
      bio: "Développeur passionné",
    },
    { authorization: `Bearer ${token}` }
  );

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.json.user.prenom, "Jean-Marc");
  assert.equal(updateRes.json.user.telephone, "+33612345678");
  assert.equal(updateRes.json.user.titre, "Développeur Full Stack");
  assert.equal(updateRes.json.user.ville, "Paris (75011)");

  const getRes = await request("GET", "/api/candidats/me", undefined, {
    authorization: `Bearer ${token}`,
  });

  assert.equal(getRes.status, 200);
  assert.equal(getRes.json.prenom, "Jean-Marc");
  assert.equal(getRes.json.titre, "Développeur Full Stack");
  assert.equal(getRes.json.ville, "Paris (75011)");

  const updateSpacePhone = await request(
    "PUT",
    "/api/candidats/me",
    { telephone: "    " },
    { authorization: `Bearer ${token}` }
  );
  assert.equal(updateSpacePhone.status, 200);
  assert.equal(updateSpacePhone.json.user.telephone, "");

  await User.deleteMany({ email: "profil-us16@test.com" });
});
