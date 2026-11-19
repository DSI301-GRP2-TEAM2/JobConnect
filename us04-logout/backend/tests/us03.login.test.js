
const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
  process.env.CORS_ORIGIN = "http://localhost:4200";
}

const mongoose = require("mongoose");
const { User } = require("../src/models/user");
const { connectDB, disconnectDB } = require("../src/config/db");
const app = require("../src/app");

const candidat = {
  nom: "Dupont", prenom: "Jean",
  email: "login-candidat@test.local",
  mdp: "password123",
};
const entreprise = {
  nom: "Dupont", nomEntreprise: "TechCorp",
  secteur: "Technologies de l'Information (IT)",
  email: "login-entreprise@test.local",
  mdp: "securepass2023",
};

let server, port;
function request(method, path, body, headers = {}) {
  const http = require("node:http");
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
    const options = {
      host: "127.0.0.1", port, path, method, agent: false,
      headers: {
        ...(data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {}),
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => { let json; try { json = JSON.parse(raw); } catch { json = undefined; } resolve({ status: res.statusCode, headers: res.headers, json, text: raw }); });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  
  await request("POST", "/api/auth/register/candidat", candidat);
  await request("POST", "/api/auth/register/entreprise", entreprise);
}

test.before(async () => {
  if (!TEST_URI) return;
  await connectDB(TEST_URI);
  await User.deleteMany({});
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
  await seed();
});

test.after(async () => {
  if (!TEST_URI) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await User.deleteMany({});
  await disconnectDB();
});

test("US-03 API : login candidat valide -> 200 + token avec role=candidat", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", { email: candidat.email, mdp: candidat.mdp });
  assert.equal(res.status, 200);
  assert.ok(res.json.token);
  assert.equal(res.json.user.role, "candidat");
  const payload = JSON.parse(Buffer.from(res.json.token.split(".")[1], "base64").toString());
  assert.equal(payload.role, "candidat");
});

test("US-03 API : login entreprise valide -> 200 + role=entreprise", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", { email: entreprise.email, mdp: entreprise.mdp });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.role, "entreprise");
});

test("US-03 API : login avec mauvais mot de passe -> 401", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", { email: candidat.email, mdp: "MauvaisMdp1" });
  assert.equal(res.status, 401);
  assert.equal(res.json.error, "Email ou mot de passe incorrect");
});

test("US-03 API : login avec email inconnu -> 401", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", { email: "inconnu@test.local", mdp: "Test12345" });
  assert.equal(res.status, 401);
});

test("US-03 API : login sans email ou mdp -> 400", { skip }, async () => {
  const res = await request("POST", "/api/auth/login", { email: candidat.email });
  assert.equal(res.status, 400);
});

test("US-03 API : login d'un compte bloqué -> 403", { skip }, async () => {
  await User.updateOne({ email: candidat.email }, { statut: "bloque" });
  const res = await request("POST", "/api/auth/login", { email: candidat.email, mdp: candidat.mdp });
  assert.equal(res.status, 403);
  assert.equal(res.json.error, "Compte bloqué");
  await User.updateOne({ email: candidat.email }, { statut: "actif" });
});

test("US-03 EJS : GET /login renvoie le formulaire HTML", { skip }, async () => {
  const res = await request("GET", "/login");
  assert.equal(res.status, 200);
  assert.ok(res.text.includes('name="email"'));
  assert.ok(res.text.includes('name="mdp"'));
  assert.ok(res.text.includes("JobConnect"));
});

test("US-03 EJS : POST /login valide redirige vers /me (302) et pose un cookie", { skip }, async () => {
  const res = await request("POST", "/login", { email: candidat.email, mdp: candidat.mdp });
  
  
  
  
  
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/me");
  const setCookie = res.headers["set-cookie"];
  assert.ok(setCookie);
  assert.ok(setCookie.some((c) => c.startsWith("token=")));
});

test("US-03 EJS : GET /me sans cookie redirige vers /login (302)", { skip }, async () => {
  const res = await request("GET", "/me");
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
});

test("US-03 EJS : GET /me avec cookie valide affiche l'email (200) ou redirige (US-05)", { skip }, async () => {
  const login = await request("POST", "/api/auth/login", { email: candidat.email, mdp: candidat.mdp });
  const res = await request("GET", "/me", undefined, { cookie: `token=${login.json.token}` });
  
  
  
  if (res.status === 200) {
    assert.ok(res.text.includes(candidat.email));
  } else if (res.status === 302) {
    assert.ok(["/candidat", "/entreprise", "/agent", "/me"].includes(res.headers.location));
  } else {
    assert.fail(`Unexpected status ${res.status}`);
  }
});
