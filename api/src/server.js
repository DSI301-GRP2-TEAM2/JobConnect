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
const { createCategorie, createCategorieHandler } = require("./handlers/createCategorie");
const { getCategories, getCategoriesHandler } = require("./handlers/getCategories");
const { getOffresPublieesHandler } = require("./handlers/getOffres");
const { createOffreHandler, getCategoriesEntrepriseHandler } = require("./handlers/createOffre");
const { submitOffreHandler } = require("./handlers/submitOffre");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

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
      if (result.status === 200 && result.jsonBody?.token && result.jsonBody?.user?.role === "agent") {
        res.cookie("token", result.jsonBody.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
      res.status(result.status).json(result.jsonBody);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
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

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", adapt(registerHandler));
app.post("/api/auth/login", adapt(loginHandler));

app.get("/api/categories", authMiddleware, requireRole("agent"), adapt(getCategoriesHandler));
app.get("/api/offres/categories", authMiddleware, requireRole("entreprise"), adapt(getCategoriesEntrepriseHandler));
app.post("/api/offres", authMiddleware, requireRole("entreprise"), adapt(createOffreHandler));
app.patch("/api/offres/:id/submit", authMiddleware, requireRole("entreprise"), adapt(submitOffreHandler));

app.get("/agent/categories", agentAuth, async (req, res) => {
  try {
    const categories = await getCategories();
    res.render("agent/categories", { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

app.post("/api/categories", authMiddleware, requireRole("agent"), adapt(createCategorieHandler));

app.get("/agent/categories/nouvelle", agentAuth, (req, res) => {
  res.render("agent/nouvelle-categorie", { error: null, success: null, values: {} });
});

app.post("/agent/categories/nouvelle", agentAuth, async (req, res) => {
  try {
    const result = await createCategorie(req.body);
    if (result.error || result.errors) {
      return res.status(result.status).render("agent/nouvelle-categorie", {
        error: result.error || result.errors.join(". "),
        success: null,
        values: { libelle: typeof req.body.libelle === "string" ? req.body.libelle : "", description: typeof req.body.description === "string" ? req.body.description : "" },
      });
    }
    return res.status(201).render("agent/nouvelle-categorie", {
      error: null, success: "Catégorie créée avec succès", values: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("agent/nouvelle-categorie", {
      error: "Erreur serveur", success: null, values: {},
    });
  }
});

app.get("/agent/offres", agentAuth, async (req, res) => {
  try {
    await connect();
    const offres = await Offer.find({ statut: "en_attente" })
      .populate("categorie", "libelle description")
      .sort({ dateCreation: -1 });

    res.render("agent/offres", {
      offres: offres || [],
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

    if (result.error) {
      return res.redirect(
        `/agent/offres?error=${encodeURIComponent(result.error)}`
      );
    }

    res.redirect(
      `/agent/offres?success=${encodeURIComponent("Offre rejetée avec succès")}`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/agent/offres?error=Erreur+serveur");
  }
});

app.patch(
  "/api/offres/:id/reject",
  authMiddleware,
  requireRole("agent"),
  adapt(rejectOffreHandler)
);

app.get(
  "/api/offres",
  authMiddleware,
  requireRole("candidat"),
  adapt(getOffresPublieesHandler)
);

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
