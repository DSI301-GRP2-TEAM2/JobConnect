const {connect} = require("../db");
const Category = require("../models/Category");

async function getCategories() {
    await connect();
    const categories = await Category.find({})
        .sort({libelle: 1, _id: 1})
        .lean();
    return categories.map(({_id, libelle, description}) => ({
        id: String(_id),
        libelle,
        description: description || "",
    }));
}

async function getCategoriesHandler(request, context) {
    try {
        const categories = await getCategories();
        return {status: 200, jsonBody: {categories}};
    } catch (err) {
        context?.error?.(err);
        return {status: 500, jsonBody: {error: "Erreur serveur"}};
    }
}

module.exports = {getCategories, getCategoriesHandler};
