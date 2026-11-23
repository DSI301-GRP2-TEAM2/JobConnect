const mongoose = require("mongoose");
const { connect } = require("../db");
const Offer = require("../models/Offer");

async function rejectOffre(id, motifRefus) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, error: "Identifiant d'offre invalide" };
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
  if (motifRefus && typeof motifRefus === "string") {
    offre.motifRefus = motifRefus.trim();
  }
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
  rejectOffre,
  rejectOffreHandler,
};
