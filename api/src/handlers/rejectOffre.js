const mongoose = require("mongoose");
const { connect } = require("../db");
const Offer = require("../models/Offer");

async function rejectOffreHandler(request, context) {
  try {
    const id = request.params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return { status: 400, jsonBody: { error: "Identifiant d'offre invalide" } };
    }

    await connect();

    const offre = await Offer.findById(id);
    if (!offre) {
      return { status: 404, jsonBody: { error: "Offre introuvable" } };
    }

    if (offre.statut !== "en_attente") {
      return {
        status: 400,
        jsonBody: { error: "Seule une offre en attente peut être rejetée" },
      };
    }

    offre.statut = "rejetee";
    await offre.save();

    return {
      status: 200,
      jsonBody: {
        message: "Offre rejetée avec succès",
        offre: {
          id: offre._id,
          titre: offre.titre,
          statut: offre.statut,
        },
      },
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

module.exports = { rejectOffreHandler };
