const express = require("express");
const { registerHandler, registerCandidatHandler, loginHandler } = require("../controllers/authController");
const adapt = require("../middleware/adapt");

const router = express.Router();

router.post("/api/auth/register", adapt(registerHandler));
router.post("/api/auth/register/candidat", adapt(registerCandidatHandler));
router.post("/api/auth/login", adapt(loginHandler));

module.exports = router;
