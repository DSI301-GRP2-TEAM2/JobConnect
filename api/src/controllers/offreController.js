const mongoose = require("mongoose");
const { connect } = require("../db");
const Offer = require("../models/Offer");
require("../models/Category");
require("../models/User");

async function getOffresPublieesHandler(request, context) {
  try {
    await connect();

    const offres = await Offer.find({ statut: "publiee" })
      .populate("categorie", "libelle description")
      .sort({ dateCreation: -1 });

    return {
      status: 200,
      jsonBody: offres,
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

async function getOffreByIdHandler(request, context) {
  try {
    const id = request.params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return { status: 400, jsonBody: { error: "Identifiant d'offre invalide" } };
    }

    await connect();

    const offre = await Offer.findById(id)
      .populate("categorie", "libelle description")
      .populate("entreprise.id", "nom nomEntreprise email siteWeb secteur");

    if (!offre || offre.statut !== "publiee") {
      return { status: 404, jsonBody: { error: "Offre introuvable ou non publiée" } };
    }

    return {
      status: 200,
      jsonBody: offre,
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

async function rejectOffre(id, motifRefus) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, error: "Identifiant d'offre invalide" };
  }

  if (!motifRefus || typeof motifRefus !== "string" || !motifRefus.trim()) {
    return { status: 400, error: "Le motif du refus est obligatoire" };
  }

  await connect();

  const offre = await Offer.findById(id);
  if (!offre) {
    return { status: 404, error: "Offre introuvable" };
  }

  if (offre.statut !== "en_attente") {
    return { status: 400, error: "Seule une offre en attente peut être rejetée" };
  }

  offre.statut = "rejetee";
  offre.motifRefus = motifRefus.trim();
  await offre.save();

  return {
    status: 200,
    success: true,
    offre: {
      id: offre._id,
      titre: offre.titre,
      statut: offre.statut,
      motifRefus: offre.motifRefus,
    },
  };
}

async function rejectOffreHandler(request, context) {
  try {
    const motifRefus = request.body?.motifRefus || request.body?.motif;
    const result = await rejectOffre(request.params?.id, motifRefus);
    if (result.error) {
      return { status: result.status, jsonBody: { error: result.error } };
    }

    return {
      status: 200,
      jsonBody: {
        message: "Offre rejetée avec succès",
        offre: result.offre,
      },
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

module.exports = {
  getOffresPublieesHandler,
  getOffreByIdHandler,
  rejectOffre,
  rejectOffreHandler,
};
