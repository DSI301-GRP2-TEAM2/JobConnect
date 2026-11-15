const { app } = require("@azure/functions");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connect } = require("../db");
const User = require("../models/User");

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: async (request, context) => {
    try {
      const { email, mdp } = await request.json();

      if (!email || !mdp) {
        return {
          status: 400,
          jsonBody: { error: "email et mdp sont obligatoires" },
        };
      }

      if (!process.env.JWT_SECRET) {
        context.error("JWT_SECRET manquant");
        return { status: 500, jsonBody: { error: "Erreur serveur" } };
      }

      await connect();

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      const valid = user && (await bcrypt.compare(mdp, user.mdp));

      if (!valid) {
        return {
          status: 401,
          jsonBody: { error: "Email ou mot de passe incorrect" },
        };
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return {
        status: 200,
        jsonBody: {
          token,
          user: { id: user._id, nom: user.nom, email: user.email, role: user.role },
        },
      };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "Erreur serveur" } };
    }
  },
});