const mongoose = require("mongoose");
const { connect } = require("../db");
const Candidature = require("../models/Candidature");
const Offer = require("../models/Offer");
const User = require("../models/User");
const { validateCandidature } = require("../validators");

async function createCandidatureHandler(request, context) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return { status: 401, jsonBody: { error: "Non authentifié" } };
    }

    let body;
    try {
      body = request.body || (await request.json?.());
    } catch {
      return { status: 400, jsonBody: { error: "JSON invalide" } };
    }

    const { errors, data } = validateCandidature(body);
    if (errors) {
      return { status: 400, jsonBody: { errors } };
    }

    if (!mongoose.Types.ObjectId.isValid(data.offreId)) {
      return { status: 400, jsonBody: { error: "Identifiant d'offre invalide" } };
    }

    await connect();

    const offre = await Offer.findById(data.offreId);
    if (!offre || offre.statut !== "publiee") {
      return {
        status: 400,
        jsonBody: { error: "L'offre sélectionnée n'est pas disponible pour postuler" },
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, jsonBody: { error: "Candidat introuvable" } };
    }

    const alreadyApplied = await Candidature.findOne({
      candidat: userId,
      offre: data.offreId,
    });
    if (alreadyApplied) {
      return {
        status: 409,
        jsonBody: { error: "Vous avez déjà postulé à cette offre" },
      };
    }

    const candidature = await Candidature.create({
      candidat: userId,
      offre: data.offreId,
      lettreMotivation: data.lettreMotivation || "",
      cvFichier: user.cv || "",
      statut: "en_attente",
    });

    return {
      status: 201,
      jsonBody: {
        message: "Candidature soumise avec succès",
        candidature,
      },
    };
  } catch (err) {
    context?.error?.(err);
    if (err.code === 11000) {
      return {
        status: 409,
        jsonBody: { error: "Vous avez déjà postulé à cette offre" },
      };
    }
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

async function getMesCandidaturesHandler(request, context) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return { status: 401, jsonBody: { error: "Non authentifié" } };
    }

    await connect();

    const candidatures = await Candidature.find({ candidat: userId })
      .populate("offre", "titre description salaire entreprise statut")
      .sort({ datePostulation: -1 });

    return {
      status: 200,
      jsonBody: candidatures,
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

module.exports = {
  createCandidatureHandler,
  getMesCandidaturesHandler,
};
