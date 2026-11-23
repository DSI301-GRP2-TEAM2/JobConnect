const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }

  const token = authHeader.split(" ")[1];
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET manquant");
    return res.status(500).json({ error: "Erreur serveur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

function requireRole(...allowedRoles) {
  const normalizedRoles = allowedRoles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!normalizedRoles.includes(String(req.user.role).toLowerCase())) {
      return res.status(403).json({ error: "Accès refusé : rôle insuffisant" });
    }

    next();
  };
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function agentAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  const cookieToken =
    getCookie(req, "token") ||
    getCookie(req, "agent_token") ||
    getCookie(req, "jwt");

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).send("Accès refusé : token manquant (cookie requis)");
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).send("Erreur serveur : JWT_SECRET manquant");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || String(decoded.role).toLowerCase() !== "agent") {
      return res.status(403).send("Accès refusé : rôle Agent requis");
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send("Accès refusé : session invalide ou expirée");
  }
}

module.exports = {
  authMiddleware,
  agentAuth,
  requireRole,
};
