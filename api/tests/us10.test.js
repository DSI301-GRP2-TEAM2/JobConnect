const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const uri = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'us10-test-secret';
if (uri) process.env.MONGODB_URI = uri;
const app = require('../src/server');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Offer = require('../src/models/Offer');

test('US10: liste privée, modification et soumission du brouillon', { skip: !uri && 'TEST_MONGODB_URI non défini' }, async () => {
  await mongoose.connect(uri);
  const ids = Array.from({ length: 3 }, () => new mongoose.Types.ObjectId());
  const [owner, other, category] = ids;
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = id => jwt.sign({ id: String(id), role: 'entreprise' }, process.env.JWT_SECRET);
  const call = async (path, id, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { authorization: `Bearer ${token(id)}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const data = { titre: 'US10 draft', description: 'Description', localisation: 'Paris', typeContrat: 'CDI', missionsPrincipales: 'Développer', exigencesCandidat: 'Expérience', categorie: String(category) };
  let offerId;
  try {
    await User.create([{ _id: owner, nom: 'Owner', email: `us10-${owner}@example.test`, mdp: 'test', role: 'entreprise', nomEntreprise: 'Owner' }, { _id: other, nom: 'Other', email: `us10-${other}@example.test`, mdp: 'test', role: 'entreprise', nomEntreprise: 'Other' }]);
    await Category.create({ _id: category, description: 'Test category', libelle: `US10 ${category}` });
    const created = await call('/api/offres', owner, 'POST', data);
    assert.equal(created.status, 201); offerId = created.body.offre.id;
    assert.equal((await call('/api/entreprise/offres', owner)).body.offres.length, 1);
    assert.equal((await call('/api/entreprise/offres', other)).body.offres.length, 0);
    assert.equal((await call(`/api/entreprise/offres/${offerId}`, other)).status, 404);
    assert.equal((await call(`/api/entreprise/offres/${offerId}`, owner)).body.offre.titre, data.titre);
    assert.equal((await call(`/api/entreprise/offres/${offerId}`, other, 'PATCH', data)).status, 404);
    assert.equal((await call(`/api/entreprise/offres/${offerId}`, owner, 'PATCH', { ...data, titre: 'Updated' })).body.offre.titre, 'Updated');
    assert.equal((await call(`/api/offres/${offerId}/submit`, owner, 'PATCH')).body.offre.statut, 'en_attente');
    assert.equal((await call(`/api/entreprise/offres/${offerId}`, owner, 'PATCH', data)).status, 409);
    assert.equal((await call('/api/entreprise/offres', owner)).body.offres[0].statut, 'en_attente');
  } finally {
    if (offerId) await Offer.deleteOne({ _id: offerId });
    await Category.deleteOne({ _id: category });
    await User.deleteMany({ _id: { $in: [owner, other] } });
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
});
