const express = require("express");
const { registerHandler } = require("../handlers/register");
const { loginHandler } = require("../handlers/login");
const { adapt } = require("../middleware/adapt");

const router = express.Router();

router.post("/register", adapt(registerHandler));
router.post("/login", adapt(loginHandler));

module.exports = router;
