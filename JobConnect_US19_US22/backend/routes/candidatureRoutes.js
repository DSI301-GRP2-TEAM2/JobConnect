const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidatureController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// US-22 : Liste des candidatures du candidat connecté (doit être placée avant /:id)
router.get(
  '/mes-candidatures',
  verifyToken,
  authorizeRoles('CANDIDAT'),
  candidatureController.getMesCandidatures
);

// US-20 : Dossier complet d'un candidat
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.getDossierCandidat
);

// US-21 : Accepter ou refuser une candidature
router.patch(
  '/:id/statut',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.updateCandidatureStatut
);

module.exports = router;
