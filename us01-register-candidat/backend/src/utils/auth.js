const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const generateToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { generateToken, verifyToken, SECRET, EXPIRES_IN };
