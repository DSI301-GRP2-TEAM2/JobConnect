const { connect } = require("../db");
const User = require("../models/User");
const { validateUpdateProfil } = require("../validators");

async function updateProfilCandidatHandler(request, context) {
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

    const { errors, data } = validateUpdateProfil(body);
    if (errors) {
      return { status: 400, jsonBody: { errors } };
    }

    if (!data || Object.keys(data).length === 0) {
      return { status: 400, jsonBody: { error: "Aucune information fournie pour la mise à jour" } };
    }

    await connect();

    const user = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    }).select("-mdp");

    if (!user) {
      return { status: 404, jsonBody: { error: "Candidat introuvable" } };
    }

    return {
      status: 200,
      jsonBody: {
        message: "Profil mis à jour avec succès",
        user,
      },
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

async function getProfilCandidatHandler(request, context) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return { status: 401, jsonBody: { error: "Non authentifié" } };
    }

    await connect();

    const user = await User.findById(userId).select("-mdp");
    if (!user) {
      return { status: 404, jsonBody: { error: "Candidat introuvable" } };
    }

    return {
      status: 200,
      jsonBody: user,
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

module.exports = {
  updateProfilCandidatHandler,
  getProfilCandidatHandler,
};
