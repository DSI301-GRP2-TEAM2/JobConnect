const mongoose = require('mongoose');
const {connect} = require('../db');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Category = require('../models/Category');
const {validateOffre} = require('./createOffre');

async function withCompany(request, context, operation) {
    try {
        const userId = request.user?.id;
        if (!mongoose.isValidObjectId(userId)) return {status: 401, jsonBody: {error: 'Session invalide'}};
        const id = request.params?.id;
        if (id && !mongoose.isValidObjectId(id)) return {status: 400, jsonBody: {error: 'Identifiant invalide'}};
        await connect();
        const user = await User.findById(userId).select('role statut');
        if (!user || user.role !== 'entreprise' || user.statut !== 'actif') return {status: 403, jsonBody: {error: 'Compte entreprise non autorisé'}};
        return await operation({'entreprise.id': user._id}, id);
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: 'Erreur serveur'}};
    }
}

function listOffers(request, context) {
    return withCompany(request, context, async owner => {
        const offres = await Offer.find(owner).populate('categorie', 'libelle').sort({dateCreation: -1});
        return {status: 200, jsonBody: {offres}};
    });
}

function getOffer(request, context) {
    return withCompany(request, context, async (owner, id) => {
        const offre = await Offer.findOne({...owner, _id: id}).populate('categorie', 'libelle');
        return offre ? {status: 200, jsonBody: {offre}} : {status: 404, jsonBody: {error: 'Offre introuvable'}};
    });
}

function updateDraft(request, context) {
    return withCompany(request, context, async (owner, id) => {
        const {errors, data} = validateOffre(request.body);
        if (errors.length) return {status: 400, jsonBody: {errors}};
        if (!await Category.exists({_id: data.categorie})) return {status: 400, jsonBody: {errors: ["La catégorie sélectionnée n'existe pas"]}};
        const update = {$set: data};
        if (data.salaire === undefined) update.$unset = {salaire: 1};
        const offre = await Offer.findOneAndUpdate({...owner, _id: id, statut: 'brouillon'}, update, {new: true, runValidators: true});
        if (offre) return {status: 200, jsonBody: {offre}};
        const existing = await Offer.exists({...owner, _id: id});
        return existing ? {status: 409, jsonBody: {error: 'Seul un brouillon peut être modifié'}} : {status: 404, jsonBody: {error: 'Offre introuvable'}};
    });
}

module.exports = {listOffers, getOffer, updateDraft};
