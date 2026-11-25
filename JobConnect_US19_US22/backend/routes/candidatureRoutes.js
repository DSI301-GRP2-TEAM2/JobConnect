const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidatureController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// US-22 (doit être placée avant /:id)
router.get(
  '/mes-candidatures',
  verifyToken,
  authorizeRoles('CANDIDAT'),
  candidatureController.getMesCandidatures
);

// US-20 
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.getDossierCandidat
);

// US-21 
router.patch(
  '/:id/statut',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.updateCandidatureStatut
);

module.exports = router;
