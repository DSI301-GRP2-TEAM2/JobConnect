const { app } = require("@azure/functions");
const bcrypt = require("bcryptjs");
const { connect } = require("../db");
const User = require("../models/User");

app.http("register", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/register",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { nom, email, mdp, role } = body;

      if (!nom || !email || !mdp || !role) {
        return {
          status: 400,
          jsonBody: { error: "nom, email, mdp et role sont obligatoires" },
        };
      }

      // Les agents ne peuvent pas s'inscrire eux-mêmes
      if (!["candidat", "entreprise"].includes(role)) {
        return {
          status: 400,
          jsonBody: { error: "role doit être candidat ou entreprise" },
        };
      }

      if (mdp.length < 8) {
        return {
          status: 400,
          jsonBody: { error: "Le mot de passe doit contenir au moins 8 caractères" },
        };
      }

      await connect();

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return { status: 409, jsonBody: { error: "Cet email est déjà utilisé" } };
      }

      const hash = await bcrypt.hash(mdp, 10);

      const user = await User.create({
        nom,
        email,
        mdp: hash,
        role,
        prenom: body.prenom,
        telephone: body.telephone,
        adresse: body.adresse,
        nomEntreprise: body.nomEntreprise,
        secteur: body.secteur,
        siteWeb: body.siteWeb,
      });

      return {
        status: 201,
        jsonBody: { id: user._id, nom: user.nom, email: user.email, role: user.role },
      };
    } catch (err) {
      context.error(err);
      if (err.code === 11000) {
        return { status: 409, jsonBody: { error: "Cet email est déjà utilisé" } };
      }
      return { status: 500, jsonBody: { error: "Erreur serveur" } };
    }
  },
});