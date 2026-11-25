const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const adapt = require("../middleware/adapt");
const { getOffresPublieesHandler, getOffresEnAttenteHandler, rejectOffreHandler } = require("../controllers/offreController");
const { createOffreHandler, getCategoriesEntrepriseHandler } = require("../controllers/createOffre");
const { submitOffreHandler } = require("../controllers/submitOffre");
const { companyOffres } = require("../controllers/companyOffres");

const router = express.Router();
const catalogueRouter = express.Router();

router.get("/api/offres/en-attente", authMiddleware, requireRole("agent"), adapt(getOffresEnAttenteHandler));

router.get("/api/offres/categories", authMiddleware, requireRole("entreprise"), adapt(getCategoriesEntrepriseHandler));
router.post("/api/offres", authMiddleware, requireRole("entreprise"), adapt(createOffreHandler));
router.patch("/api/offres/:id/submit", authMiddleware, requireRole("entreprise"), adapt(submitOffreHandler));
router.get("/api/offres/mes-offres", authMiddleware, requireRole("entreprise"), adapt(companyOffres));
router.get("/api/entreprise/offres/:id", authMiddleware, requireRole("entreprise"), adapt(companyOffres));
router.patch("/api/entreprise/offres/:id", authMiddleware, requireRole("entreprise"), adapt(companyOffres));

router.patch(
  "/api/offres/:id/reject",
  authMiddleware,
  requireRole("agent"),
  adapt(rejectOffreHandler)
);

catalogueRouter.get(
  "/",
  authMiddleware,
  requireRole("candidat"),
  async (req, res) => {
    const result = await getOffresPublieesHandler(req, console);
    res.status(result.status).json(result.jsonBody);
  }
);

router.use("/api/offres", catalogueRouter);

module.exports = router;
