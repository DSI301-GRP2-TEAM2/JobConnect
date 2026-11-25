const { createCategorie, getCategories } = require("./categorieController");
const { rejectOffre } = require("./offreController");

async function renderCategories(req, res) {
  try {
    const categories = await getCategories();
    res.render("agent/categories", { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
}

function renderNouvelleCategorie(req, res) {
  res.render("agent/nouvelle-categorie", { error: null, success: null, values: {} });
}

async function submitNouvelleCategorie(req, res) {
  try {
    const result = await createCategorie(req.body);
    if (result.error || result.errors) {
      return res.status(result.status).render("agent/nouvelle-categorie", {
        error: result.error || result.errors.join(". "),
        success: null,
        values: { libelle: typeof req.body.libelle === "string" ? req.body.libelle : "", description: typeof req.body.description === "string" ? req.body.description : "" },
      });
    }
    return res.status(201).render("agent/nouvelle-categorie", {
      error: null, success: "Catégorie créée avec succès", values: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("agent/nouvelle-categorie", {
      error: "Erreur serveur", success: null, values: {},
    });
  }
}

async function renderOffres(req, res) {
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
}

async function submitRejectOffre(req, res) {
  try {
    const motifRefus = req.body?.motifRefus || req.body?.motif;
    const result = await rejectOffre(req.params.id, motifRefus);

    if (result.error) {
      return res.redirect(
        `/agent/offres?error=${encodeURIComponent(result.error)}`
      );
    }

    res.redirect(
      `/agent/offres?success=${encodeURIComponent("Offre rejetée avec succès")}`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/agent/offres?error=Erreur+serveur");
  }
}

async function examinerOffre(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).send("Identifiant d'offre invalide");
  try {
    await connect();
    const offre = await Offer.findById(req.params.id).populate("categorie", "libelle");
    if (!offre) return res.status(404).send("Offre introuvable");
    return res.render("agent/examiner-offre", { offre });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erreur serveur");
  }
}

async function submitApproveOffre(req, res) {
  try {
    const result = await approveOffre(req.params.id);
    const key = result.error ? "error" : "success";
    const message = result.error || "Offre approuvée avec succès";
    return res.redirect(`/agent/offres?${key}=${encodeURIComponent(message)}`);
  } catch (err) {
    console.error(err);
    return res.redirect("/agent/offres?error=Erreur+serveur");
  }
}

module.exports = {
  renderCategories,
  renderNouvelleCategorie,
  submitNouvelleCategorie,
  renderOffres,
  submitRejectOffre,
  examinerOffre,
  submitApproveOffre,
};
