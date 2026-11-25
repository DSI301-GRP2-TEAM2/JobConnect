const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const uri = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'us12-test-secret';
if (uri) process.env.MONGODB_URI = uri;
const app = require('../src/server');
const Offer = require('../src/models/Offer');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const id = () => new mongoose.Types.ObjectId();
const token = (role, userId = id()) => jwt.sign({id: String(userId), role}, process.env.JWT_SECRET);
let server, base;

test.before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  if (uri) await mongoose.connect(uri);
});
test.after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  if (uri) await mongoose.disconnect();
});

async function request(url, role, method = 'GET', body, userId) {
  const response = await fetch(base + url, {method, redirect: 'manual', headers: {...(role ? {authorization: `Bearer ${token(role, userId)}`} : {}), ...(body ? {'content-type': 'application/json'} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
  return {status: response.status, headers: response.headers, body: await response.text()};
}

test('US12: accès et identifiants vérifiés', async () => {
  const offerId = id();
  assert.equal((await request(`/api/offres/${offerId}/approve`, null, 'PATCH')).status, 401);
  assert.equal((await request(`/api/offres/${offerId}/approve`, 'entreprise', 'PATCH')).status, 403);
  assert.equal((await request(`/agent/offres/${offerId}/examiner`, null)).status, 401);
  assert.equal((await request(`/agent/offres/${offerId}/examiner`, 'candidat')).status, 403);
  assert.equal((await request('/api/offres/invalid/approve', 'agent', 'PATCH')).status, 400);
  assert.equal((await request('/agent/offres/invalid/examiner', 'agent')).status, 400);
});

test('US12: parcours agent EJS de la liste à la publication', {skip: !uri && 'TEST_MONGODB_URI non défini'}, async () => {
  const owner = id(), category = id(), offerId = id();
  const prefix = `US12-ejs-${offerId}`;
  const cookie = `token=${token('agent')}`;
  try {
    await User.create({_id: owner, nom: 'Company', nomEntreprise: 'Company EJS', email: `${prefix}@example.test`, mdp: 'test', role: 'entreprise'});
    await Category.create({_id: category, libelle: prefix, description: 'Test'});
    await Offer.create({_id: offerId, titre: prefix, description: 'Description EJS', statut: 'en_attente', entreprise: {id: owner, nomEntreprise: 'Company EJS'}, categorie: category});
    const list = await fetch(`${base}/agent/offres`, {headers: {cookie}});
    assert.equal(list.status, 200);
    const html = await list.text();
    const detailPath = `/agent/offres/${offerId}/examiner`;
    assert.ok(html.includes(`href="${detailPath}"`));
    const detail = await fetch(base + detailPath, {headers: {cookie}});
    assert.equal(detail.status, 200);
    assert.match(await detail.text(), new RegExp(`/agent/offres/${offerId}/approve`));
    const submit = await fetch(`${base}/agent/offres/${offerId}/approve`, {method: 'POST', headers: {cookie}, redirect: 'manual'});
    assert.equal(submit.status, 302);
    assert.match(submit.headers.get('location'), /success=/);
    const after = await fetch(base + submit.headers.get('location'), {headers: {cookie}});
    assert.equal(after.status, 200);
    const afterHtml = await after.text();
    assert.match(afterHtml, /Offre approuvée avec succès/);
    assert.ok(!afterHtml.includes(prefix));
    assert.equal((await Offer.findById(offerId)).statut, 'publiee');
    const catalogue = JSON.parse((await request('/api/offres', 'candidat')).body);
    assert.ok(catalogue.some(o => o._id === String(offerId)));
  } finally {
    await Offer.deleteOne({_id: offerId});
    await User.deleteOne({_id: owner});
    await Category.deleteOne({_id: category});
  }
});

test('US12: approbation, publication et conflit avec un refus', {skip: !uri && 'TEST_MONGODB_URI non défini'}, async () => {
  const owner = id(), category = id(), ids = [], prefix = `US12-${owner}`;
  try {
    await User.create({_id: owner, nom: 'Company', nomEntreprise: 'Company US12', email: `${prefix}@example.test`, mdp: 'test', role: 'entreprise'});
    await Category.create({_id: category, libelle: prefix, description: 'Test'});
    for (const statut of ['en_attente', 'en_attente', 'brouillon', 'rejetee', 'publiee', 'en_attente']) {
      const offer = await Offer.create({titre: `${prefix}-${ids.length}`, description: 'Description test', missionsPrincipales: 'Missions', profilRecherche: 'Profil', statut, entreprise: {id: owner, nomEntreprise: 'Company US12'}, categorie: category});
      ids.push(offer._id);
    }
    const detail = await request(`/agent/offres/${ids[0]}/examiner`, 'agent');
    assert.equal(detail.status, 200);
    assert.match(detail.body, /Description test/);
    assert.match(detail.body, /Approuver/);
    const approved = await request(`/api/offres/${ids[0]}/approve`, 'agent', 'PATCH');
    assert.equal(approved.status, 200);
    assert.equal(JSON.parse(approved.body).offre.statut, 'publiee');
    assert.equal((await request(`/api/offres/${ids[0]}/approve`, 'agent', 'PATCH')).status, 409);
    assert.doesNotMatch((await request(`/agent/offres/${ids[0]}/examiner`, 'agent')).body, /<button[^>]*>Approuver/);
    for (const offerId of ids.slice(2, 5)) assert.equal((await request(`/api/offres/${offerId}/approve`, 'agent', 'PATCH')).status, 409);
    const formResult = await request(`/agent/offres/${ids[5]}/approve`, 'agent', 'POST');
    assert.equal(formResult.status, 302);
    assert.match(formResult.headers.get('location'), /success=/);
    assert.equal((await Offer.findById(ids[5])).statut, 'publiee');
    assert.equal((await request(`/api/offres/${id()}/approve`, 'agent', 'PATCH')).status, 404);
    const company = JSON.parse((await request('/api/offres/mes-offres', 'entreprise', 'GET', null, owner)).body);
    assert.ok(company.offres.some(o => o._id === String(ids[0]) && o.statut === 'publiee'));
    const catalogue = JSON.parse((await request('/api/offres', 'candidat')).body);
    assert.ok(catalogue.some(o => o._id === String(ids[0])));
    const pending = await request('/agent/offres', 'agent');
    assert.ok(!pending.body.includes(`${prefix}-0`));
    const [approve, reject] = await Promise.all([
      request(`/api/offres/${ids[1]}/approve`, 'agent', 'PATCH'),
      request(`/api/offres/${ids[1]}/reject`, 'agent', 'PATCH', {motifRefus: 'Motif'})
    ]);
    assert.equal([approve, reject].filter(r => r.status === 200).length, 1);
    assert.ok(['publiee', 'rejetee'].includes((await Offer.findById(ids[1])).statut));
  } finally {
    await Offer.deleteMany({_id: {$in: ids}});
    await User.deleteOne({_id: owner});
    await Category.deleteOne({_id: category});
  }
});
