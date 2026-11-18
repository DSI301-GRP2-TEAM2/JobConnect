const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidatureController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// US-19 : Liste des candidatures d'une offre
router.get(
  '/:id/candidatures',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.getCandidaturesByOffre
);

module.exports = router;
