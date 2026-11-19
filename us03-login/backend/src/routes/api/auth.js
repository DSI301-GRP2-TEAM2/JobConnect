const express = require("express");
const router = express.Router();
const authController = require("../../controllers/api/authController");

router.post("/auth/register/candidat", authController.registerCandidat);

router.post("/auth/register/entreprise", authController.registerEntreprise);

router.post("/auth/login", authController.login);

module.exports = router;
