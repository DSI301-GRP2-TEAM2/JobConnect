const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { getCategoriesHandler } = require("../handlers/getCategories");
const { createCategorieHandler } = require("../handlers/createCategorie");
const { adapt } = require("../middleware/adapt");

const router = express.Router();

router.get("/", authMiddleware, requireRole("agent"), adapt(getCategoriesHandler));
router.post("/", authMiddleware, requireRole("agent"), adapt(createCategorieHandler));

module.exports = router;
