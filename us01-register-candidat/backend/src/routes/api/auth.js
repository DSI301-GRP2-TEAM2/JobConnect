const express = require("express");
const router = express.Router();
const authController = require("../../controllers/api/authController");

router.post("/auth/register/candidat", authController.registerCandidat);

module.exports = router;
