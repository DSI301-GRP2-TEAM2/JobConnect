const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const path = require('node:path');

const uri = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'us11-test-secret';
if (uri) process.env.MONGODB_URI = uri;
const app = require('../src/server');
const Offer = require('../src/models/Offer');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const token = role => jwt.sign({id: new mongoose.Types.ObjectId().toString(), role}, process.env.JWT_SECRET);
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

test('US11: accès réservé aux agents', async () => {
  assert.equal((await fetch(base + '/agent/offres')).status, 401);
  assert.equal((await fetch(base + '/agent/offres', {headers: {authorization: `Bearer ${token('entreprise')}`}})).status, 403);
  assert.equal((await fetch(base + '/agent/offres', {headers: {authorization: 'Bearer invalid'}})).status, 401);
});

test('US11: vue vide et données échappées', async () => {
  const view = path.join(__dirname, '../src/views/agent/offres.ejs');
  const empty = await ejs.renderFile(view, {offres: [], error: null, success: null});
  assert.match(empty, /Aucune offre en attente/);
  const html = await ejs.renderFile(view, {offres: [{_id: new mongoose.Types.ObjectId(), titre: '<script>alert(1)</script>', description: 'Détails', entreprise: {nomEntreprise: 'Entreprise'}, categorie: null, salaire: 0}], error: null, success: null});
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /Non précisée/);
  assert.match(html, /0 €/);
});

test('US11: soumission visible et seuls les emplois en attente sont affichés', {skip: !uri && 'TEST_MONGODB_URI non défini'}, async () => {
  const owner = new mongoose.Types.ObjectId(), category = new mongoose.Types.ObjectId();
  const prefix = `US11-${owner}`;
  const ids = [];
  try {
    await User.create({_id: owner, nom: 'Test', nomEntreprise: 'Entreprise US11', email: `${prefix}@example.test`, mdp: 'test', role: 'entreprise'});
    await Category.create({_id: category, libelle: prefix, description: 'Test'});
    for (const statut of ['brouillon', 'publiee', 'rejetee']) {
      const offer = await Offer.create({titre: `${prefix}-${statut}`, description: 'Description', statut, entreprise: {id: owner, nomEntreprise: 'Entreprise US11'}, categorie: category, localisation: 'Tunis', typeContrat: 'CDI', missionsPrincipales: 'Missions test', profilRecherche: 'Profil test'});
      ids.push(offer._id);
    }
    const before = new Date();
    const companyToken = jwt.sign({id: String(owner), role: 'entreprise'}, process.env.JWT_SECRET);
    const result = await fetch(`${base}/api/offres/${ids[0]}/submit`, {method: 'PATCH', headers: {authorization: `Bearer ${companyToken}`}});
    assert.equal(result.status, 200);
    const saved = await Offer.findById(ids[0]);
    assert.equal(saved.statut, 'en_attente');
    assert.ok(saved.dateSoumission >= before && saved.dateSoumission <= new Date());
    const response = await fetch(base + '/agent/offres', {headers: {authorization: `Bearer ${token('agent')}`}});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`${prefix}-brouillon`));
    assert.ok(!html.includes(`${prefix}-publiee`) && !html.includes(`${prefix}-rejetee`));
    assert.ok(html.includes('Entreprise US11') && html.includes('Missions test') && html.includes('Profil test'));
    assert.ok(html.includes('Examiner'));
  } finally {
    await Offer.deleteMany({_id: {$in: ids}});
    await User.deleteOne({_id: owner});
    await Category.deleteOne({_id: category});
  }
});
