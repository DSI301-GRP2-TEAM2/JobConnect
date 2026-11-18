const mongoose = require("mongoose");
const { connect } = require("../db");
const Offer = require("../models/Offer");
require("../models/Category");

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

    const offre = await Offer.findById(id).populate("categorie", "libelle description");

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

async function getOffresEnAttenteHandler(request, context) {
  try {
    await connect();

    const offres = await Offer.find({ statut: "en_attente" })
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

module.exports = {
  getOffresPublieesHandler,
  getOffreByIdHandler,
  getOffresEnAttenteHandler,
};
