const { connect } = require("../db");
const Offer = require("../models/Offer");
require("../models/Category");

async function getOffresPublieesHandler(request, context) {
  try {
    await connect();

    const offres = await Offer.find({ statut: "publiee" })
      .populate("categorie", "libelle description")
      .populate("entreprise", "nomEntreprise email")
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
};
