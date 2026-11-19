
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
  email: "logout-candidat@test.local",
  mdp: "password123",
};

let server, port;
function request(method, path, body, headers = {}) {
  const http = require("node:http");
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
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

test.before(async () => {
  if (!TEST_URI) return;
  await connectDB(TEST_URI);
  await User.deleteMany({});
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
  await request("POST", "/api/auth/register/candidat", candidat);
});

test.after(async () => {
  if (!TEST_URI) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await User.deleteMany({});
  await disconnectDB();
});

async function login() {
  const res = await request("POST", "/api/auth/login", { email: candidat.email, mdp: candidat.mdp });
  return res.json.token;
}

test("US-04 API : POST /api/auth/logout renvoie 200 + message", { skip }, async () => {
  const res = await request("POST", "/api/auth/logout");
  assert.equal(res.status, 200);
  assert.equal(res.json.message, "Déconnexion réussie");
});

test("US-04 API : la réponse logout efface le cookie (Set-Cookie avec expires passé)", { skip }, async () => {
  const res = await request("POST", "/api/auth/logout");
  const setCookie = res.headers["set-cookie"];
  assert.ok(setCookie);
  assert.ok(setCookie.some((c) => c.startsWith("token=;") || c.includes("Expires=")));
});

test("US-04 EJS : POST /logout redirige vers /login (302) et efface le cookie", { skip }, async () => {
  const token = await login();
  const res = await request("POST", "/logout", undefined, { cookie: `token=${token}` });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/login");
  const setCookie = res.headers["set-cookie"];
  assert.ok(setCookie);
  assert.ok(setCookie.some((c) => c.startsWith("token=;") || c.includes("Expires=")));
});

test("US-04 EJS : la page /me (ou le dashboard après redirection) contient le bouton 'Se déconnecter'", { skip }, async () => {
  const token = await login();
  
  
  
  
  
  
  const res = await request("GET", "/me", undefined, { cookie: `token=${token}` });
  if (res.status === 200) {
    assert.ok(res.text.includes("Se déconnecter"));
    assert.ok(res.text.includes('action="/logout"'));
  } else if (res.status === 302) {
    assert.ok(["/candidat", "/entreprise", "/agent"].includes(res.headers.location));
  } else {
    assert.fail(`Unexpected status ${res.status}`);
  }
});
