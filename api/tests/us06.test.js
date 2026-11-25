const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TEST_URI = process.env.TEST_MONGODB_URI
const skip = TEST_URI ? false : "TEST_MONGODB_URI non défini : tests BDD ignorés";
process.env.JWT_SECRET = process.env.JWT_SECRET || "us06-test-secret";
if (TEST_URI) process.env.MONGODB_URI = TEST_URI;
const app = require("../src/server");
const Category = require("../src/models/Category");
const {validateCategorie} = require("../src/controllers/categorieController");
let server, port;
const token = (role) => jwt.sign({id: new mongoose.Types.ObjectId().toString(), role}, process.env.JWT_SECRET);
const agentToken = token("agent"), candidatToken = token("candidat");

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = body === undefined ? undefined : JSON.stringify(body);
        const req = http.request({
            hostname: "127.0.0.1", port, path, method, agent: false, headers: {
                ...(data ? {
                    "content-type": "application/json",
                    "content-length": Buffer.byteLength(data)
                } : {}), ...headers,
            }
        }, (res) => {
            let raw = "";
            res.on("data", chunk => raw += chunk);
            res.on("end", () => {
                let json;
                try {
                    json = JSON.parse(raw);
                } catch { /* EJS */
                }
                resolve({status: res.statusCode, json, raw});
            });
        });
        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

test.before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    port = server.address().port;
    if (TEST_URI) {
        await mongoose.connect(TEST_URI);
        await Category.init();
    }
});
test.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (TEST_URI) await mongoose.disconnect();
});

test("US06 validation : nom obligatoire, espaces, longueur et description", () => {
    assert.ok(validateCategorie({libelle: "  "}).errors.length);
    assert.ok(validateCategorie({libelle: 123}).errors.length);
    assert.ok(validateCategorie({libelle: "x".repeat(101)}).errors.length);
    assert.ok(validateCategorie({libelle: "Développement", description: 42}).errors.length);
    assert.ok(validateCategorie({libelle: "Développement"}).errors.length);
    assert.ok(validateCategorie({libelle: "Développement", description: "   "}).errors.length);
    assert.deepEqual(validateCategorie({libelle: "Développement", description: "Texte"}).errors, []);
    assert.deepEqual(validateCategorie({libelle: "  Data   Engineering  "}).libelle, "Data Engineering");
});

test("US06 API : sans JWT -> 401", async () => {
    const res = await request("POST", "/api/categories", {libelle: "Data"});
    assert.equal(res.status, 401);
});
test("US06 API : rôle candidat -> 403", async () => {
    const res = await request("POST", "/api/categories", {libelle: "Data"}, {authorization: `Bearer ${candidatToken}`});
    assert.equal(res.status, 403);
});
test("US06 API : nom invalide -> 400", async () => {
    const res = await request("POST", "/api/categories", {libelle: "  "}, {authorization: `Bearer ${agentToken}`});
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.json.errors));
});
test("US06 EJS : accès non authentifié -> 401 et candidat -> 403", async () => {
    assert.equal((await request("GET", "/agent/categories/nouvelle")).status, 401);
    assert.equal((await request("GET", "/agent/categories/nouvelle", undefined, {cookie: `token=${candidatToken}`})).status, 403);
    assert.equal((await request("POST", "/agent/categories/nouvelle")).status, 401);
});
test("US06 EJS : formulaire agent affiché", async () => {
    const res = await request("GET", "/agent/categories/nouvelle", undefined, {cookie: `token=${agentToken}`});
    assert.equal(res.status, 200);
    assert.match(res.raw, /Créer une catégorie/);
    assert.match(res.raw, /name="libelle"/);
    assert.match(res.raw, /name="description"[^>]*required/);
});
test("US06 BDD : création, catalogue et doublon insensible à la casse", {skip}, async () => {
    const name = `US06 Developpement ${new mongoose.Types.ObjectId()}`;
    try {
        const first = await request("POST", "/api/categories", {
            libelle: `  ${name}  `,
            description: "Test"
        }, {authorization: `Bearer ${agentToken}`});
        assert.equal(first.status, 201);
        assert.equal(first.json.categorie.libelle, name);
        assert.ok(await Category.findById(first.json.categorie.id));
        const duplicate = await request("POST", "/api/categories", {libelle: name.toLowerCase(), description: "Test"}, {authorization: `Bearer ${agentToken}`});
        assert.equal(duplicate.status, 409);
        const htmlDuplicate = await request("POST", "/agent/categories/nouvelle", {libelle: name, description: "Test"}, {cookie: `token=${agentToken}`});
        assert.equal(htmlDuplicate.status, 409);
    } finally {
        await Category.deleteMany({libelle: name});
    }
});
