const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const { connect } = require("./db");
const Offer = require("./models/Offer");
require("./models/Category");

const { authMiddleware, requireRole } = require("./middleware/auth");
const { registerHandler } = require("./handlers/register");
const { loginHandler } = require("./handlers/login");
const { rejectOffre, rejectOffreHandler } = require("./handlers/rejectOffre");

const app = express();

// Configuration du moteur EJS pour les vues Agent
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fichiers statiques (CSS pour les vues EJS)
app.use(express.static(path.join(__dirname, "public")));

// CORS_ORIGIN
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (origins.length === 0) {
  console.warn("CORS_ORIGIN non défini : les requêtes d'autres origines sont refusées");
}

app.use(cors({ origin: origins.length > 0 ? origins : false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const context = {
  error: (...args) => console.error(...args),
  log: (...args) => console.log(...args),
};

// Adapte un handler (request, context) -> { status, jsonBody } à Express
function adapt(handler) {
  return async (req, res) => {
    try {
      const requestObj = {
        json: async () => req.body,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user,
        headers: req.headers,
      };
      const result = await handler(requestObj, context);
      res.status(result.status).json(result.jsonBody);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  };
}

// Middleware de protection des routes EJS Agent (supporte Bearer header, query et body)
function agentAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.query.token || req.body?.token;

  if (!token) {
    return res.status(401).send("Accès refusé : token manquant");
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
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).send("Accès refusé : token invalide ou expiré");
  }
}

// ---------------- Routes publiques ----------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", adapt(registerHandler));
app.post("/api/auth/login", adapt(loginHandler));

// ---------------- Vues et actions Agent EJS (US-13 protégées) ----------------
app.get("/agent/offres", agentAuth, async (req, res) => {
  try {
    await connect();
    const offres = await Offer.find({ statut: "en_attente" })
      .populate("categorie", "libelle description")
      .sort({ dateCreation: -1 });

    res.render("agent/offres", {
      offres: offres || [],
      token: req.token,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

app.post("/agent/offres/:id/reject", agentAuth, async (req, res) => {
  try {
    const result = await rejectOffre(req.params.id);
    const tokenParam = req.token ? `&token=${encodeURIComponent(req.token)}` : "";

    if (result.error) {
      return res.redirect(
        `/agent/offres?error=${encodeURIComponent(result.error)}${tokenParam}`
      );
    }

    res.redirect(
      `/agent/offres?success=${encodeURIComponent("Offre rejetée avec succès")}${tokenParam}`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/agent/offres?error=Erreur+serveur");
  }
});

// ---------------- API JSON US-13 : Refuser une offre (Agent) ----------------
app.patch(
  "/api/offres/:id/reject",
  authMiddleware,
  requireRole("agent"),
  adapt(rejectOffreHandler)
);

// Erreurs de parsing (JSON invalide) et erreurs inattendues
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ errors: ["JSON invalide"] });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`API en écoute sur le port ${port}`));
}

module.exports = app;
