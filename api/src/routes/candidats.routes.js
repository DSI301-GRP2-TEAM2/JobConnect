const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const {
  updateProfilCandidatHandler,
  getProfilCandidatHandler,
} = require("../controllers/candidatController");
const {
  uploadMiddleware,
  uploadCvHandler,
  deleteCvHandler,
} = require("../handlers/uploadCv");
const { adapt } = require("../middleware/adapt");

const router = express.Router();

router.get("/me", authMiddleware, requireRole("candidat"), adapt(getProfilCandidatHandler));
router.put("/me", authMiddleware, requireRole("candidat"), adapt(updateProfilCandidatHandler));
router.post("/me/cv", authMiddleware, requireRole("candidat"), uploadMiddleware, adapt(uploadCvHandler));
router.delete("/me/cv", authMiddleware, requireRole("candidat"), adapt(deleteCvHandler));

module.exports = router;
