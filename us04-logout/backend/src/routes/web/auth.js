
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middleware/auth");
const authController = require("../../controllers/web/authController");

router.get("/", (req, res) => {
  res.redirect(req.user ? "/me" : "/login");
});

router.get("/login", authController.showLogin);
router.post("/login", authController.login);

router.get("/me", requireAuth, authController.showMe);

router.post("/logout", requireAuth, authController.logout);

module.exports = router;
