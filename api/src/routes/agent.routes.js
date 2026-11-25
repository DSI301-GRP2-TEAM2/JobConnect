const express = require("express");
const {
  renderCategories,
  renderNouvelleCategorie,
  submitNouvelleCategorie,
  renderOffres,
  submitRejectOffre,
} = require("../controllers/agentController");
const { agentAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/agent/categories", agentAuth, renderCategories);
router.get("/agent/categories/nouvelle", agentAuth, renderNouvelleCategorie);
router.post("/agent/categories/nouvelle", agentAuth, submitNouvelleCategorie);
router.get("/agent/offres", agentAuth, renderOffres);
router.post("/agent/offres/:id/reject", agentAuth, submitRejectOffre);

module.exports = router;
