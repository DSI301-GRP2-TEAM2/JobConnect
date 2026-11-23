const express = require("express");
const { createCategorieHandler, getCategoriesHandler } = require("../controllers/categorieController");
const { authMiddleware, requireRole } = require("../middleware/auth");
const adapt = require("../middleware/adapt");

const router = express.Router();

router.get("/api/categories", authMiddleware, requireRole("agent"), adapt(getCategoriesHandler));
router.post("/api/categories", authMiddleware, requireRole("agent"), adapt(createCategorieHandler));

module.exports = router;
