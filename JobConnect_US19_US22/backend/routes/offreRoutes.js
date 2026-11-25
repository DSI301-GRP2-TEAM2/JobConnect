const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidatureController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// US-19 
router.get(
  '/:id/candidatures',
  verifyToken,
  authorizeRoles('ENTREPRISE'),
  candidatureController.getCandidaturesByOffre
);

module.exports = router;
