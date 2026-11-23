const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { getOffresPublieesHandler } = require("../handlers/getOffres");
const { rejectOffreHandler } = require("../handlers/rejectOffre");
const { adapt } = require("../middleware/adapt");

const router = express.Router();

router.get("/", authMiddleware, requireRole("candidat"), adapt(getOffresPublieesHandler));
router.patch("/:id/reject", authMiddleware, requireRole("agent"), adapt(rejectOffreHandler));

module.exports = router;
