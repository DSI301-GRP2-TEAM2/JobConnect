const mongoose = require("mongoose");
const {connect} = require("../db");
const Offer = require("../models/Offer");
const User = require("../models/User");

async function submitOffre(offerId, entrepriseId) {
    if (!mongoose.isValidObjectId(offerId)) {
        return {status: 400, error: "Identifiant de l'offre invalide"};
    }
    if (!mongoose.isValidObjectId(entrepriseId)) {
        return {status: 401, error: "Session invalide"};
    }

    await connect();
    const entreprise = await User.findById(entrepriseId).select("role statut");
    if (!entreprise || entreprise.role !== "entreprise" || entreprise.statut !== "actif") {
        return {status: 403, error: "Compte entreprise non autorisé"};
    }

    const offre = await Offer.findOneAndUpdate(
        {_id: offerId, "entreprise.id": entreprise._id, statut: "brouillon"},
        {$set: {statut: "en_attente"}},
        {new: true, runValidators: true}
    );
    if (offre) {
        return {
            status: 200, offre: {
                id: offre._id,
                titre: offre.titre,
                statut: offre.statut,
                categorie: offre.categorie,
                dateCreation: offre.dateCreation,
            }
        };
    }

    const ownOffer = await Offer.findOne({_id: offerId, "entreprise.id": entreprise._id}).select("statut");
    if (!ownOffer) return {status: 404, error: "Offre introuvable"};
    return {status: 409, error: "Seules les offres en brouillon peuvent être soumises à validation"};
}

async function submitOffreHandler(request, context) {
    try {
        const result = await submitOffre(request.params?.id, request.user?.id);
        if (result.error) return {status: result.status, jsonBody: {error: result.error}};
        return {
            status: 200, jsonBody: {
                message: "Offre soumise à validation avec succès",
                offre: result.offre,
            }
        };
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: "Erreur serveur"}};
    }
}

module.exports = {submitOffre, submitOffreHandler};
