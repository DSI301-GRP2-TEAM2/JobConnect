const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'us09-test-jwt-secret';
if (TEST_URI) process.env.MONGODB_URI = TEST_URI;
const app = require('../src/server');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Offer = require('../src/models/Offer');
const {submitOffre} = require('../src/handlers/submitOffre');
const skip = TEST_URI ? false : 'TEST_MONGODB_URI non défini';
let server, port;
const id = () => new mongoose.Types.ObjectId().toString();
const token = (role, userId = id()) => jwt.sign({id: userId, role}, process.env.JWT_SECRET);

function request(method, path, bearer) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1', port, path, method, agent: false,
            headers: bearer ? {authorization: `Bearer ${bearer}`} : {}
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

test('US09 : authentification et restriction du rôle Entreprise', async () => {
    assert.equal((await request('PATCH', `/api/offres/${id()}/submit`)).status, 401);
    assert.equal((await request('PATCH', `/api/offres/${id()}/submit`, token('agent'))).status, 403);
    assert.equal((await request('PATCH', `/api/offres/${id()}/submit`, token('candidat'))).status, 403);
});

test('US09 : identifiants invalides rejetés avant requête à la base', async () => {
    assert.equal((await request('PATCH', '/api/offres/not-an-id/submit', token('entreprise'))).status, 400);
    assert.equal((await submitOffre(id(), 'invalid-user-id')).status, 401);
});

test('US09 : seule une offre brouillon de son propriétaire peut être soumise', {skip}, async () => {
    const ownerId = id(), otherId = id(), categoryId = id();
    let draft, published;
    try {
        await User.create([
            {
                _id: ownerId,
                nom: 'Company A',
                email: `us09-a-${ownerId}@example.test`,
                mdp: 'test',
                role: 'entreprise',
                nomEntreprise: 'A'
            },
            {
                _id: otherId,
                nom: 'Company B',
                email: `us09-b-${otherId}@example.test`,
                mdp: 'test',
                role: 'entreprise',
                nomEntreprise: 'B'
            },
        ]);
        await Category.create({_id: categoryId, libelle: `US09 category ${categoryId}`});
        draft = await Offer.create({
            titre: 'Draft US09', description: 'A draft', categorie: categoryId,
            entreprise: {id: ownerId, nomEntreprise: 'A'}, statut: 'brouillon'
        });
        published = await Offer.create({
            titre: 'Published US09', description: 'An approved offer', categorie: categoryId,
            entreprise: {id: ownerId, nomEntreprise: 'A'}, statut: 'publiee'
        });

        const foreign = await request('PATCH', `/api/offres/${draft.id}/submit`, token('entreprise', otherId));
        assert.equal(foreign.status, 404);
        assert.equal((await Offer.findById(draft.id)).statut, 'brouillon');

        const approved = await request('PATCH', `/api/offres/${published.id}/submit`, token('entreprise', ownerId));
        assert.equal(approved.status, 409);
        assert.equal((await Offer.findById(published.id)).statut, 'publiee');

        const missing = await request('PATCH', `/api/offres/${id()}/submit`, token('entreprise', ownerId));
        assert.equal(missing.status, 404);

        const result = await request('PATCH', `/api/offres/${draft.id}/submit`, token('entreprise', ownerId));
        assert.equal(result.status, 200);
        assert.equal(result.json.offre.statut, 'en_attente');
        assert.equal((await Offer.findById(draft.id)).statut, 'en_attente');
        assert.equal((await request('PATCH', `/api/offres/${draft.id}/submit`, token('entreprise', ownerId))).status, 409);

        const agentListing = await request('GET', '/agent/offres', token('agent'));
        assert.equal(agentListing.status, 200);
        assert.match(agentListing.raw, /Draft US09/);
    } finally {
        if (draft) await Offer.deleteOne({_id: draft.id});
        if (published) await Offer.deleteOne({_id: published.id});
        await Category.deleteOne({_id: categoryId});
        await User.deleteMany({_id: {$in: [ownerId, otherId]}});
    }
});

test('US09 : un compte entreprise bloqué ne peut pas soumettre', {skip}, async () => {
    const ownerId = id(), categoryId = id();
    let draft;
    try {
        await User.create({
            _id: ownerId, nom: 'Blocked Co', email: `us09-blocked-${ownerId}@example.test`,
            mdp: 'test', role: 'entreprise', statut: 'bloque', nomEntreprise: 'Blocked'
        });
        await Category.create({_id: categoryId, libelle: `US09 blocked ${categoryId}`});
        draft = await Offer.create({
            titre: 'Draft US09', description: 'Draft', categorie: categoryId,
            entreprise: {id: ownerId, nomEntreprise: 'Blocked'}, statut: 'brouillon'
        });
        assert.equal((await request('PATCH', `/api/offres/${draft.id}/submit`, token('entreprise', ownerId))).status, 403);
        assert.equal((await Offer.findById(draft.id)).statut, 'brouillon');
    } finally {
        if (draft) await Offer.deleteOne({_id: draft.id});
        await Category.deleteOne({_id: categoryId});
        await User.deleteOne({_id: ownerId});
    }
});
