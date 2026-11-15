const express = require("express");
const cors = require("cors");
const { registerHandler } = require("./handlers/register");
const { loginHandler } = require("./handlers/login");

const app = express();

// CORS_ORIGIN : origines autorisées, séparées par des virgules
// (ex. https://dsi301-grp2-team2.github.io).
// Sans CORS_ORIGIN, aucune origine externe n'est autorisée.
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (origins.length === 0) {
  console.warn("CORS_ORIGIN non défini : les requêtes d'autres origines sont refusées");
}

app.use(cors({ origin: origins.length > 0 ? origins : false }));
app.use(express.json());

const context = {
  error: (...args) => console.error(...args),
  log: (...args) => console.log(...args),
};

// Adapte un handler (request, context) -> { status, jsonBody } à Express,
// sans modifier les handlers ni les tests existants.
function adapt(handler) {
  return async (req, res) => {
    try {
      const result = await handler({ json: async () => req.body }, context);
      res.status(result.status).json(result.jsonBody);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  };
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", adapt(registerHandler));
app.post("/api/auth/login", adapt(loginHandler));

// Erreurs de parsing (JSON invalide) et erreurs inattendues
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ errors: ["JSON invalide"] });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

// Le serveur ne démarre que lancé directement (npm start / npm run dev),
// pas quand les tests importent l'application.
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`API en écoute sur le port ${port}`));
}

module.exports = app;
