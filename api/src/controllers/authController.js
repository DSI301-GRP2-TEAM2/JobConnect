const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connect } = require("../db");
const User = require("../models/User");
const { validateRegister } = require("../validators");

async function registerHandler(request, context) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { errors: ["JSON invalide"] } };
    }

    const { errors, data } = validateRegister(body);
    if (errors) {
      return { status: 400, jsonBody: { errors } };
    }

    await connect();

    if (await User.exists({ email: data.email })) {
      return { status: 409, jsonBody: { error: "Cet email est déjà utilisé" } };
    }

    const hash = await bcrypt.hash(data.mdp, 10);
    const user = await User.create({ ...data, mdp: hash });

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
}

async function loginHandler(request, context) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: "JSON invalide" } };
    }

    const { email, mdp } = body || {};
    if (typeof email !== "string" || typeof mdp !== "string" || !email || !mdp) {
      return { status: 400, jsonBody: { error: "email et mdp sont obligatoires" } };
    }

    if (!process.env.JWT_SECRET) {
      context.error("JWT_SECRET manquant");
      return { status: 500, jsonBody: { error: "Erreur serveur" } };
    }

    await connect();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+mdp");
    const valid = user && (await bcrypt.compare(mdp, user.mdp));

    if (!valid) {
      return { status: 401, jsonBody: { error: "Email ou mot de passe incorrect" } };
    }

    if (user.statut === "bloque") {
      return { status: 403, jsonBody: { error: "Compte bloqué" } };
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

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
}

module.exports = { registerHandler, loginHandler };
