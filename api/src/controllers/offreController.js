const mongoose = require("mongoose");
const { connect } = require("../db");
const Offer = require("../models/Offer");
require("../models/Category");

async function getOffresEnAttente() {
  await connect();
  return Offer.find({ statut: "en_attente" })
    .populate("categorie", "libelle description")
    .sort({ dateSoumission: -1, dateCreation: -1, _id: -1 });
}

async function getOffresEnAttenteHandler(request, context) {
  try {
    const offres = await getOffresEnAttente();
    return { status: 200, jsonBody: offres };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

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

async function rejectOffre(id, motifRefus) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, error: "Identifiant d'offre invalide" };
  }

  if (!motifRefus || typeof motifRefus !== "string" || !motifRefus.trim()) {
    return { status: 400, error: "Le motif du refus est obligatoire" };
  }

  await connect();

  const offre = await Offer.findOneAndUpdate(
    { _id: id, statut: "en_attente" },
    { $set: { statut: "rejetee", motifRefus: motifRefus.trim() } },
    { returnDocument: "after", runValidators: true }
  );
  if (!offre) {
    if (!await Offer.exists({ _id: id })) return { status: 404, error: "Offre introuvable" };
    return { status: 400, error: "Seule une offre en attente peut être rejetée" };
  }

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

async function approveOffre(id) {
  if (!id || !mongoose.isValidObjectId(id)) return { status: 400, error: "Identifiant d'offre invalide" };
  await connect();
  const offre = await Offer.findOneAndUpdate(
    { _id: id, statut: "en_attente" },
    { $set: { statut: "publiee" } },
    { returnDocument: "after", runValidators: true }
  );
  if (!offre) {
    if (!await Offer.exists({ _id: id })) return { status: 404, error: "Offre introuvable" };
    return { status: 409, error: "Seule une offre en attente peut être approuvée" };
  }
  return { status: 200, offre: { id: offre._id, titre: offre.titre, statut: offre.statut } };
}

async function approveOffreHandler(request, context) {
  try {
    const result = await approveOffre(request.params?.id);
    if (result.error) return { status: result.status, jsonBody: { error: result.error } };
    return { status: 200, jsonBody: { message: "Offre approuvée avec succès", offre: result.offre } };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
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
  getOffresEnAttente,
  getOffresEnAttenteHandler,
  getOffresPublieesHandler,
  rejectOffre,
  rejectOffreHandler,
  approveOffre,
  approveOffreHandler,
};
