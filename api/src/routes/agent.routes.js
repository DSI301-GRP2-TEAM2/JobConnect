const express = require("express");
const { connect } = require("../db");
const Offer = require("../models/Offer");
const { getCategories } = require("../handlers/getCategories");
const { createCategorie } = require("../handlers/createCategorie");
const { rejectOffre } = require("../handlers/rejectOffre");
const { agentAuth } = require("../middleware/agentAuth");

const router = express.Router();

router.get("/categories", agentAuth, async (req, res) => {
  try {
    const categories = await getCategories();
    res.render("agent/categories", { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

router.get("/categories/nouvelle", agentAuth, (req, res) => {
  res.render("agent/nouvelle-categorie", { error: null, success: null, values: {} });
});

router.post("/categories/nouvelle", agentAuth, async (req, res) => {
  try {
    const result = await createCategorie(req.body);
    if (result.error || result.errors) {
      return res.status(result.status).render("agent/nouvelle-categorie", {
        error: result.error || result.errors.join(". "),
        success: null,
        values: {
          libelle: typeof req.body.libelle === "string" ? req.body.libelle : "",
          description: typeof req.body.description === "string" ? req.body.description : "",
        },
      });
    }
    return res.status(201).render("agent/nouvelle-categorie", {
      error: null,
      success: "Catégorie créée avec succès",
      values: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("agent/nouvelle-categorie", {
      error: "Erreur serveur",
      success: null,
      values: {},
    });
  }
});

router.get("/offres", agentAuth, async (req, res) => {
  try {
    await connect();
    const offres = await Offer.find({ statut: "en_attente" })
      .populate("categorie", "libelle description")
      .sort({ dateCreation: -1 });

    res.render("agent/offres", {
      offres: offres || [],
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

router.post("/offres/:id/reject", agentAuth, async (req, res) => {
  try {
    const motifRefus = req.body?.motifRefus || req.body?.motif;
    const result = await rejectOffre(req.params.id, motifRefus);

    if (result.error) {
      return res.redirect(`/agent/offres?error=${encodeURIComponent(result.error)}`);
    }

    res.redirect(`/agent/offres?success=${encodeURIComponent("Offre rejetée avec succès")}`);
  } catch (err) {
    console.error(err);
    res.redirect("/agent/offres?error=Erreur+serveur");
  }
});

module.exports = router;
