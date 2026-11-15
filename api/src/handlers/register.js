const bcrypt = require("bcryptjs");
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

module.exports = { registerHandler };