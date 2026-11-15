const express = require("express");
const cors = require("cors");
const { connect } = require("./db");
const { registerHandler } = require("./handlers/register");
const { loginHandler } = require("./handlers/login");

const app = express();

// CORS_ORIGIN : adresse(s) du front end, séparées par des virgules
const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "*";

app.use(cors({ origin: origins }));
app.use(express.json());

// Adapte un handler (request, context) à une route Express
function adapt(handler) {
  return async (req, res) => {
    try {
      const request = {
        method: req.method,
        params: req.params,
        query: req.query,
        headers: { get: (name) => req.get(name) },
        json: async () => req.body,
      };
      const context = {
        log: (...args) => console.log(...args),
        error: (...args) => console.error(...args),
      };
      const result = await handler(request, context);
      res.status(result.status || 200).json(result.jsonBody ?? {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  };
}

// Routes
app.get("/api/health", async (req, res) => {
  try {
    await connect();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Connexion à la base impossible" });
  }
});

app.post("/api/auth/register", adapt(registerHandler));
app.post("/api/auth/login", adapt(loginHandler));

// Route inconnue
app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Erreurs (par exemple un JSON invalide dans le corps de la requête)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON invalide" });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`API en écoute sur le port ${PORT}`));
}

module.exports = app;