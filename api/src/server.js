const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const categoriesRoutes = require("./routes/categories.routes");
const agentRoutes = require("./routes/agent.routes");
const offresRoutes = require("./routes/offres.routes");
const candidatsRoutes = require("./routes/candidats.routes");

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

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use(authRoutes);
app.use(categoriesRoutes);
app.use(agentRoutes);
app.use(offresRoutes);
app.use(candidatsRoutes);

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
