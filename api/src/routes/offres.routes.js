const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const adapt = require("../middleware/adapt");
const { getOffresPublieesHandler, rejectOffreHandler } = require("../controllers/offreController");

const router = express.Router();
const catalogueRouter = express.Router();

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
