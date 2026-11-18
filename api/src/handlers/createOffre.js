const mongoose = require("mongoose");
const {connect} = require("../db");
const Offer = require("../models/Offer");
const Category = require("../models/Category");
const User = require("../models/User");

function validateOffre(body) {
    const errors = [];
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {errors: ["Corps de requête invalide"]};
    }
    const titre = typeof body.titre === "string" ? body.titre.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!titre) {
        errors.push("Le titre est obligatoire")
    } else if (titre.length > 200) {
        errors.push("Le titre ne doit pas dépasser 200 caractères")
    }

    if (!description) {
        errors.push("La description est obligatoire")
    } else if (description.length > 10000) {
        errors.push("La description ne doit pas dépasser 10000 caractères")
    }
    if (typeof body.categorie !== "string" || !mongoose.isValidObjectId(body.categorie)) {
        errors.push("Une catégorie valide est obligatoire");
    }
    let salaire;
    if (body.salaire !== undefined && body.salaire !== null && body.salaire !== "") {
        if (typeof body.salaire !== "number" || !Number.isFinite(body.salaire) || body.salaire < 0) {
            errors.push("Le salaire doit être un nombre positif ou nul");
        } else {
            salaire = body.salaire;
        }
    }
    return {errors, data: {titre, description, categorie: body.categorie, ...(salaire === undefined ? {} : {salaire})}};
}

async function createOffre(body, userId) {
    const {errors, data} = validateOffre(body);
    if (errors.length) return {status: 400, errors};
    if (!mongoose.isValidObjectId(userId)) return {status: 401, error: "Session invalide"};

    await connect();
    const [entreprise, categorie] = await Promise.all([
        User.findById(userId).select("role statut nomEntreprise"),
        Category.exists({_id: data.categorie}),
    ]);
    if (!entreprise || entreprise.statut !== "actif" || entreprise.role !== "entreprise") {
        return {status: 403, error: "Compte entreprise non autorisé"};
    }
    if (!categorie) return {
        status: 400, errors: ["La catégorie sélectionnée n'existe pas"]
    };
    if (!entreprise.nomEntreprise || !entreprise.nomEntreprise.trim()) {
        return {status: 400, errors: ["Le nom de l'entreprise est manquant sur le compte"]};
    }
    const offre = await Offer.create({
        ...data,
        entreprise: {id: entreprise._id, nomEntreprise: entreprise.nomEntreprise},
        statut: "brouillon",
    });
    return {
        status: 201,
        offre: {
            id: offre._id,
            titre: offre.titre,
            description: offre.description,
            salaire: offre.salaire ?? null,
            categorie: offre.categorie,
            entreprise: {id: entreprise._id, nomEntreprise: entreprise.nomEntreprise},
            statut: offre.statut,
            dateCreation: offre.dateCreation,
        },
    };
}

async function createOffreHandler(request, context) {
    try {
        const result = await createOffre(request.body, request.user?.id);
        if (result.errors) return {status: result.status, jsonBody: {errors: result.errors}};
        if (result.error) return {status: result.status, jsonBody: {error: result.error}};
        return {status: 201, jsonBody: {message: "Offre enregistrée en brouillon", offre: result.offre}};
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: "Erreur serveur"}};
    }
}

async function getCategoriesEntrepriseHandler(request, context) {
    try {
        if (!mongoose.isValidObjectId(request.user?.id)) {
            return {status: 401, jsonBody: {error: "Session invalide"}};
        }
        await connect();
        const user = await User.findById(request.user.id).select("role statut");
        if (!user || user.role !== "entreprise" || user.statut !== "actif") {
            return {status: 403, jsonBody: {error: "Compte entreprise non autorisé"}};
        }
        const categories = await Category.find({}, "libelle description").sort({libelle: 1});
        return {
            status: 200,
            jsonBody: {
                categories: categories.map(c => ({
                    id: c._id,
                    libelle: c.libelle,
                    description: c.description || ""
                }))
            },
        };
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: "Erreur serveur"}};
    }
}

module.exports = {validateOffre, createOffre, createOffreHandler, getCategoriesEntrepriseHandler};
