const {connect} = require("../db");
const Category = require("../models/Category");

function validateCategorie(body) {
    const libelle = body?.libelle;
    const description = body?.description;
    const errors = [];

    if (typeof libelle !== "string" || !libelle.trim()) {
        errors.push("Le nom de la catégorie est obligatoire");
    } else if (libelle.trim().length > 100) {
        errors.push("Le nom de la catégorie ne doit pas dépasser 100 caractères");
    }
    if (description !== undefined && (typeof description !== "string" || description.trim().length > 500)) {
        errors.push("La description doit être un texte de 500 caractères maximum");
    }
    return {
        errors,
        libelle: typeof libelle === "string" ? libelle.trim().replace(/\s+/g, " ") : "",
        description: typeof description === "string" ? description.trim() : ""
    };
}

async function createCategorie(body) {
    const {errors, libelle, description} = validateCategorie(body);
    if (errors.length) return {status: 400, errors};

    await connect();

    const existing = await Category.findOne({libelle}).collation({locale: "fr", strength: 2});
    if (existing) return {status: 409, error: "Cette catégorie existe déjà"};

    try {
        const categorie = await Category.create({libelle, description});
        return {
            status: 201,
            categorie: {id: categorie._id, libelle: categorie.libelle, description: categorie.description}
        };
    } catch (err) {
        if (err.code === 11000) return {status: 409, error: "Cette catégorie existe déjà"};
        throw err;
    }
}

async function createCategorieHandler(request, context) {
    try {
        const result = await createCategorie(request.body);
        if (result.errors) return {status: result.status, jsonBody: {errors: result.errors}};
        if (result.error) return {status: result.status, jsonBody: {error: result.error}};
        return {status: 201, jsonBody: {message: "Catégorie créée avec succès", categorie: result.categorie}};
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: "Erreur serveur"}};
    }
}

module.exports = {validateCategorie, createCategorie, createCategorieHandler};
