const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { connect } = require("./db");
const Offer = require("./models/Offer");
require("./models/Category");

const { authMiddleware, requireRole } = require("./middleware/auth");
const { registerHandler } = require("./handlers/register");
const { loginHandler } = require("./handlers/login");
const { rejectOffreHandler } = require("./handlers/rejectOffre");
const {
  getOffresPublieesHandler,
  getOffreByIdHandler,
  getOffresEnAttenteHandler,
} = require("./handlers/getOffres");
const {
  updateProfilCandidatHandler,
  getProfilCandidatHandler,
} = require("./handlers/profilCandidat");
const { uploadMiddleware, uploadCvHandler } = require("./handlers/uploadCv");
const {
  createCandidatureHandler,
  getMesCandidaturesHandler,
} = require("./handlers/candidatures");

const app = express();

// Configuration du moteur de templates EJS pour la partie AGENT
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// CORS_ORIGIN : origines autorisées, séparées par des virgules
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

// Servir les fichiers statiques de CV téléversés
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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
        file: req.file,
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

// ---------------- Routes publiques ----------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", adapt(registerHandler));
app.post("/api/auth/login", adapt(loginHandler));

// ---------------- Interface AGENT avec EJS (US-13) ----------------
app.get("/agent/offres", async (req, res) => {
  try {
    await connect();
    const offres = await Offer.find({ statut: "en_attente" })
      .populate("categorie", "libelle description")
      .sort({ dateCreation: -1 });

    res.render("agent/offres", {
      offres,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur lors du chargement des offres");
  }
});

app.post("/agent/offres/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect("/agent/offres?error=Identifiant+d'offre+invalide");
    }

    await connect();
    const offre = await Offer.findById(id);
    if (!offre) {
      return res.redirect("/agent/offres?error=Offre+introuvable");
    }

    if (offre.statut !== "en_attente") {
      return res.redirect("/agent/offres?error=Seule+une+offre+en+attente+peut+être+rejetée");
    }

    offre.statut = "rejetee";
    await offre.save();

    res.redirect("/agent/offres?success=L'offre+a+été+rejetée+avec+succès+(US-13)");
  } catch (err) {
    console.error(err);
    res.redirect("/agent/offres?error=Erreur+serveur+lors+du+refus");
  }
});

// ---------------- API JSON US-13 : Refuser une offre (Agent) ----------------
app.patch(
  "/api/offres/:id/reject",
  authMiddleware,
  requireRole("agent"),
  adapt(rejectOffreHandler)
);

app.get(
  "/api/offres/en-attente",
  authMiddleware,
  requireRole("agent"),
  adapt(getOffresEnAttenteHandler)
);

// ---------------- API JSON US-14 : Liste des offres publiées (Candidat) ----------------
app.get(
  "/api/offres",
  authMiddleware,
  requireRole("candidat"),
  adapt(getOffresPublieesHandler)
);

// ---------------- API JSON US-15 : Détail d'une offre (Candidat) ----------------
app.get(
  "/api/offres/:id",
  authMiddleware,
  requireRole("candidat"),
  adapt(getOffreByIdHandler)
);

// ---------------- API JSON US-16 : Profil candidat (Candidat) ----------------
app.get(
  "/api/candidats/me",
  authMiddleware,
  requireRole("candidat"),
  adapt(getProfilCandidatHandler)
);
app.put(
  "/api/candidats/me",
  authMiddleware,
  requireRole("candidat"),
  adapt(updateProfilCandidatHandler)
);

// ---------------- API JSON US-17 : Téléversement CV (Candidat) ----------------
app.post(
  "/api/candidats/me/cv",
  authMiddleware,
  requireRole("candidat"),
  uploadMiddleware,
  adapt(uploadCvHandler)
);

// ---------------- API JSON US-18 : Soumission candidature (Candidat) ----------------
app.post(
  "/api/candidatures",
  authMiddleware,
  requireRole("candidat"),
  adapt(createCandidatureHandler)
);

app.get(
  "/api/candidatures/mes-candidatures",
  authMiddleware,
  requireRole("candidat"),
  adapt(getMesCandidaturesHandler)
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
