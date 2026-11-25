const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const adapt = require("../middleware/adapt");
const {
  updateProfilCandidatHandler,
  getProfilCandidatHandler,
} = require("../controllers/candidatController");

const router = express.Router();

router.get("/api/candidats/me", authMiddleware, requireRole("candidat"), adapt(getProfilCandidatHandler));
router.put("/api/candidats/me", authMiddleware, requireRole("candidat"), adapt(updateProfilCandidatHandler));

module.exports = router;
