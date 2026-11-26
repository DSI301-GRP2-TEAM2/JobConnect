// US-03 : tests fonctionnels de la connexion (API + EJS).
// Suit le style de auth.test.js mais utilise un serveur HTTP pour tester
// à la fois l'API (JSON) et les routes EJS (HTML/redirect).
//
// IMPORTANT : le cleanup ne touche QUE les utilisateurs créés par US-03
// (préfixe `us03.` dans l'email). Cela évite les conflits quand `node --test`
// exécute ce fichier en parallèle avec auth.test.js, us01, us02, etc.
//
// Les emails utilisent le domaine `@us03.local` (pas `@test.local`) car
// auth.test.js fait `User.deleteMany({ email: /@test\.local$/ })` qui
// supprimerait nos utilisateurs de test si on utilisait `@test.local`.
//
// N'a PAS de dépendance sur US-01 ou US-02 : utilise la route générique
// /api/auth/register (qui prend `role` dans le corps) pour créer les utilisateurs
// de test, au lieu des routes spécifiques /api/auth/register/candidat et
// /api/auth/register/entreprise qui n'existent qu'après fusion de US-01/US-02.

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const TEST_URI = process.env.TEST_MONGODB_URI;
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests ignorés";

if (TEST_URI) {
  process.env.MONGODB_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret";
  process.env.CORS_ORIGIN = "http://localhost:4200";
}

const mongoose = require("mongoose");
const User = require("../src/models/User");
const app = require("../src/server");

const candidat = {
  nom: "Dupont",
  prenom: "Jean",
  email: "us03.candidat@us03.local",
  mdp: "password123",
  role: "candidat",
};

const entreprise = {
  nom: "Dupont",
  nomEntreprise: "TechCorp",
  secteur: "IT",
  email: "us03.entreprise@us03.local",
  mdp: "securepass2023",
  role: "entreprise",
};

let server, port;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
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
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json;
        try { json = JSON.parse(raw); } catch { json = undefined; }
        resolve({ status: res.statusCode, headers: res.headers, json, text: raw });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function cleanup() {
  // Ne supprime QUE les users US-03 (préfixe us03. dans l'email).
  await User.deleteMany({ email: /^us03\./i });
}

async function seed() {
  // Utilise la route générique /api/auth/register (existe dans main, pas de
  // dépendance sur US-01/US-02).
  await request("POST", "/api/auth/register", candidat);
  await request("POST", "/api/auth/register", entreprise);
}

test.before(async () => {
  if (!TEST_URI) return;
  await mongoose.connect(TEST_URI);
  await cleanup();
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
  await seed();
});

test.after(async () => {
  if (!TEST_URI) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await cleanup();
  await mongoose.disconnect();
});

// --- Tests API (JSON) ---

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
  const res = await request("POST", "/api/auth/login", { email: "us03.inconnu@us03.local", mdp: "Test12345" });
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

// --- Tests EJS (HTML) ---

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

test("US-03 EJS : GET /me avec cookie valide affiche l'email (200)", { skip }, async () => {
  // Utilise le cookie posé par POST /login (EJS), qui inclut l'email dans le JWT
  // (contrairement au token de l'API /api/auth/login qui n'a que id + role).
  const loginRes = await request("POST", "/login", { email: candidat.email, mdp: candidat.mdp });
  const setCookie = loginRes.headers["set-cookie"];
  const tokenCookie = setCookie.find((c) => c.startsWith("token="));
  const cookie = tokenCookie.split(";")[0]; // "token=<value>"
  const res = await request("GET", "/me", undefined, { cookie });
  assert.equal(res.status, 200);
  assert.ok(res.text.includes(candidat.email));
});

test("US-03 EJS : POST /login avec mauvais mot de passe -> 401 + re-rend le formulaire", { skip }, async () => {
  const res = await request("POST", "/login", { email: candidat.email, mdp: "MauvaisMdp1" });
  assert.equal(res.status, 401);
  assert.ok(res.text.includes("incorrect"));
  assert.ok(res.text.includes('name="email"'));
});

test("US-03 EJS : POST /login d'un compte bloqué -> 403 + message 'Compte bloqué'", { skip }, async () => {
  await User.updateOne({ email: candidat.email }, { statut: "bloque" });
  const res = await request("POST", "/login", { email: candidat.email, mdp: candidat.mdp });
  assert.equal(res.status, 403);
  assert.ok(res.text.includes("Compte bloqué"));
  await User.updateOne({ email: candidat.email }, { statut: "actif" });
});
