const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const {
  updateProfilCandidatHandler,
  getProfilCandidatHandler,
} = require("../controllers/candidatController");
const { adapt } = require("../middleware/adapt");

const router = express.Router();

router.get("/me", authMiddleware, requireRole("candidat"), adapt(getProfilCandidatHandler));
router.put("/me", authMiddleware, requireRole("candidat"), adapt(updateProfilCandidatHandler));

module.exports = router;
