const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TEST_URI = process.env.TEST_MONGODB_URI;
if (TEST_URI) process.env.MONGODB_URI = TEST_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || "us07-test-secret";

const app = require("../src/server");
const Category = require("../src/models/Category");
const { getCategoriesHandler } = require("../src/handlers/getCategories");

let server;
let port;
const token = (role) => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
const agentToken = token("agent");
const entrepriseToken = token("entreprise");

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path, agent: false, headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        let json;
        try { json = JSON.parse(body); } catch { /* Réponse HTML */ }
        resolve({ status: res.statusCode, json, body });
      });
    });
    req.on("error", reject);
  });
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  port = server.address().port;
  if (TEST_URI) {
    await mongoose.connect(TEST_URI);
    await Category.init();
  }
});

test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (TEST_URI) await mongoose.disconnect();
});

test("US07 API : accès réservé aux agents", async () => {
  assert.equal((await request("/api/categories")).status, 401);
  assert.equal((await request("/api/categories", { authorization: `Bearer ${entrepriseToken}` })).status, 403);
});

test("US07 EJS : accès réservé aux agents", async () => {
  assert.equal((await request("/agent/categories")).status, 401);
  assert.equal((await request("/agent/categories", { cookie: `token=${entrepriseToken}` })).status, 403);
});

test("US07 contrôleur : erreur serveur capturée", async () => {
  // Without a database URI, getCategories fails and must return an HTTP 500 payload.
  if (process.env.MONGODB_URI) return;
  const result = await getCategoriesHandler({}, { error() {} });
  assert.equal(result.status, 500);
  assert.equal(result.jsonBody.error, "Erreur serveur");
});

test("US07 BDD : liste vide et catégories triées", { skip: !TEST_URI && "TEST_MONGODB_URI non défini" }, async () => {
  const marker = `US07-${new mongoose.Types.ObjectId()}`;
  let created = [];
  try {
    // Empty-state validation using a temporary collection cleanup by marker and direct controller data.
    const before = await request("/api/categories", { authorization: `Bearer ${agentToken}` });
    assert.equal(before.status, 200);
    assert.ok(Array.isArray(before.json.categories));
    if (before.json.categories.length === 0) {
      const emptyHtml = await request("/agent/categories", { cookie: `token=${agentToken}` });
      assert.equal(emptyHtml.status, 200);
      assert.match(emptyHtml.body, /Aucune catégorie enregistrée/);
    }

    created = await Category.insertMany([
      { libelle: `${marker} Zulu`, description: "Dernière catégorie" },
      { libelle: `${marker} Alpha`, description: "Première catégorie" },
    ]);

    const response = await request("/api/categories", { authorization: `Bearer ${agentToken}` });
    assert.equal(response.status, 200);
    const matches = response.json.categories.filter((c) => c.libelle.startsWith(marker));
    assert.deepEqual(matches.map((c) => c.libelle), [`${marker} Alpha`, `${marker} Zulu`]);
    assert.equal(matches[0].description, "Première catégorie");
    assert.ok(matches[0].id);

    const view = await request("/agent/categories", { cookie: `token=${agentToken}` });
    assert.equal(view.status, 200);
    assert.ok(view.body.includes(`${marker} Alpha`));
    assert.ok(view.body.includes(`${marker} Zulu`));
    assert.ok(view.body.includes('href="/agent/categories/nouvelle"'));
  } finally {
    if (created.length) await Category.deleteMany({ _id: { $in: created.map((c) => c._id) } });
  }
});
