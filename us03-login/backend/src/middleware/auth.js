const { verifyToken } = require("../utils/auth");

const getToken = (req) => {
  let token = req.cookies?.token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith("Bearer ")) {
    token = header.slice(7);
  }
  return token;
};

const attachUser = (req, res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      
    }
  }
  next();
};

const auth = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  next();
};

module.exports = { attachUser, auth, requireAuth, getToken };
