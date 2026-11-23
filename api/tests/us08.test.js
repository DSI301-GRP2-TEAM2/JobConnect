const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'us08-test-jwt-secret';
if (TEST_URI) process.env.MONGODB_URI = TEST_URI;
const app = require('../src/server');
const {validateOffre} = require('../src/handlers/createOffre');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Offer = require('../src/models/Offer');
const skip = TEST_URI ? false : 'TEST_MONGODB_URI non défini';
let server, port;
const id = () => new mongoose.Types.ObjectId().toString();
const token = (role, userId = id()) => jwt.sign({id: userId, role}, process.env.JWT_SECRET);
const valid = (categorie) => ({
    titre: 'Développeur', description: 'Mission du poste', categorie,
    localisation: 'Paris', typeContrat: 'CDI',
    missionsPrincipales: 'Développer les applications',
    exigencesCandidat: 'Expérience en JavaScript'
});

function request(method, path, body, bearer) {
    return new Promise((resolve, reject) => {
        const data = body === undefined ? null : JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1', port, path, method, agent: false,
            headers: {
                ...(data ? {'content-type': 'application/json', 'content-length': Buffer.byteLength(data)} : {}),
                ...(bearer ? {authorization: `Bearer ${bearer}`} : {})
            }
        }, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(raw);
                } catch {
                }
                resolve({status: res.statusCode, json, raw});
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

test.before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    port = server.address().port;
    if (TEST_URI) await mongoose.connect(TEST_URI);
});
test.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (TEST_URI) await mongoose.disconnect();
});

test('US08: validation des champs', () => {
    assert.ok(validateOffre(null).errors.length);
    assert.ok(validateOffre({titre: '', description: '', categorie: 'bad'}).errors.length >= 3);
    assert.ok(validateOffre({...valid(id()), salaire: -2}).errors.length);
    assert.ok(validateOffre({...valid(id()), salaire: '100'}).errors.length);
    assert.ok(validateOffre({...valid(id()), salaire: Number.POSITIVE_INFINITY}).errors.length);
    assert.deepEqual(validateOffre({...valid(id()), salaire: 0}).errors, []);
    assert.equal(validateOffre({...valid(id()), localisation: ' '}).errors.length, 1);
    assert.equal(validateOffre({...valid(id()), typeContrat: ''}).errors.length, 1);
    assert.equal(validateOffre({...valid(id()), missionsPrincipales: ''}).errors.length, 1);
    assert.equal(validateOffre({...valid(id()), exigencesCandidat: ''}).errors.length, 1);
});
test('US08: la valeur par défaut du modèle est brouillon', () => {
    assert.equal(new Offer({...valid(id()), entreprise: {id: id(), nomEntreprise: 'E'}}).statut, 'brouillon');
});
test('US08: authentification et autorisation', async () => {
    assert.equal((await request('POST', '/api/offres', valid(id()))).status, 401);
    assert.equal((await request('POST', '/api/offres', valid(id()), token('agent'))).status, 403);
    assert.equal((await request('POST', '/api/offres', valid(id()), token('candidat'))).status, 403);
    assert.equal((await request('GET', '/api/offres/categories')).status, 401);
    assert.equal((await request('GET', '/api/offres/categories', undefined, token('agent'))).status, 403);
});
test('US08: champs obligatoires avant toute requête BDD', async () => {
    const response = await request('POST', '/api/offres', {
        titre: '  ',
        description: '',
        categorie: 'bad'
    }, token('entreprise'));
    assert.equal(response.status, 400);
    assert.ok(response.json.errors.length >= 3);
});

test('US08: enregistre un brouillon, ignore les champs propriétaire/statut fournis par le client', {skip}, async () => {
    const companyId = id();
    const categoryId = id();
    let offerId;
    try {
        await User.create({
            _id: companyId,
            nom: 'Company',
            email: `us08-${companyId}@example.test`,
            mdp: 'test',
            role: 'entreprise',
            nomEntreprise: 'Entreprise US08'
        });
        await Category.create({_id: categoryId, description: 'Test category', libelle: `Catégorie US08 ${categoryId}`});
        const response = await request('POST', '/api/offres', {
            ...valid(categoryId),
            salaire: 1200,
            statut: 'publiee',
            entreprise: {id: id(), nomEntreprise: 'Faux'}
        }, token('entreprise', companyId));
        assert.equal(response.status, 201);
        assert.equal(response.json.offre.statut, 'brouillon');
        assert.equal(response.json.offre.entreprise.id, companyId);
        assert.equal(response.json.offre.entreprise.nomEntreprise, 'Entreprise US08');
        offerId = response.json.offre.id;
        const saved = await Offer.findById(offerId);
        assert.equal(saved.statut, 'brouillon');
        assert.equal(saved.entreprise.id.toString(), companyId);
        assert.equal(saved.categorie.toString(), categoryId);
        assert.equal(saved.localisation, 'Paris');
        assert.equal(saved.typeContrat, 'CDI');
        assert.equal(saved.missionsPrincipales, 'Développer les applications');
        assert.equal(saved.exigencesCandidat, 'Expérience en JavaScript');
        const selector = await request('GET', '/api/offres/categories', undefined, token('entreprise', companyId));
        assert.equal(selector.status, 200);
        assert.ok(selector.json.categories.some(c => c.id === categoryId));
        const notExisting = await request('POST', '/api/offres', valid(id()), token('entreprise', companyId));
        assert.equal(notExisting.status, 400);
    } finally {
        if (offerId) await Offer.deleteOne({_id: offerId});
        await Category.deleteOne({_id: categoryId});
        await User.deleteOne({_id: companyId});
    }
});
test('US08: compte bloqué ne peut pas créer une offre', {skip}, async () => {
    const companyId = id(), categoryId = id();
    try {
        await User.create({
            _id: companyId,
            nom: 'Blocked',
            email: `us08-blocked-${companyId}@example.test`,
            mdp: 'test',
            role: 'entreprise',
            statut: 'bloque',
            nomEntreprise: 'B'
        });
        await Category.create({_id: categoryId, description: 'Test category', libelle: `US08 blocked ${categoryId}`});
        const res = await request('POST', '/api/offres', valid(categoryId), token('entreprise', companyId));
        assert.equal(res.status, 403);
    } finally {
        await Category.deleteOne({_id: categoryId});
        await User.deleteOne({_id: companyId});
    }
});
