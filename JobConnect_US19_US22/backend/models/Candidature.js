const mongoose = require('mongoose');

const candidatureSchema = new mongoose.Schema({
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offre',
    required: true
  },
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidat',
    required: true
  },
  lettreMotivation: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'ANNULEE'],
    default: 'EN_ATTENTE'
  },
  dateCandidature: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidature', candidatureSchema);
