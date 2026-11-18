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

test("US-17 Sécurité : POST /api/candidats/me/cv sans token -> 401", async () => {
  const res = await request("POST", "/api/candidats/me/cv", { filename: "mon_cv.pdf" });
  assert.equal(res.status, 401);
});

test("US-17 Sécurité : POST /api/candidats/me/cv avec rôle non candidat -> 403", async () => {
  const res = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "mon_cv.pdf" },
    { authorization: `Bearer ${agentToken}` }
  );
  assert.equal(res.status, 403);
});

test("US-17 Validation : POST /api/candidats/me/cv avec format non autorisé (ex: .exe) -> 400", async () => {
  const res = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "virus.exe" },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-17 Validation : POST /api/candidats/me/cv avec fichier trop volumineux (> 5 Mo) -> 400", async () => {
  const res = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "cv_lourd.pdf", size: 6 * 1024 * 1024 },
    { authorization: `Bearer ${candidatToken}` }
  );
  assert.equal(res.status, 400);
});

test("US-17 Fonctionnel : POST /api/candidats/me/cv enregistre un CV PDF valide", { skip }, async () => {
  await User.deleteMany({ email: "cv-us17@test.com" });

  const candidat = await User.create({
    nom: "Martin",
    prenom: "Sophie",
    email: "cv-us17@test.com",
    mdp: "Test12345",
    role: "candidat",
  });

  const token = makeToken({ id: candidat._id.toString(), role: "candidat" });

  const res = await request(
    "POST",
    "/api/candidats/me/cv",
    { filename: "cv_sophie_martin.pdf", mimetype: "application/pdf" },
    { authorization: `Bearer ${token}` }
  );

  assert.equal(res.status, 200);
  assert.ok(res.json.cv.includes("cv_sophie_martin.pdf"));

  const user = await User.findById(candidat._id);
  assert.ok(user.cv.includes("cv_sophie_martin.pdf"));

  await User.deleteMany({ email: "cv-us17@test.com" });
});
