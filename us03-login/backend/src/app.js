
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { attachUser } = require("./middleware/auth");
const apiAuthRouter = require("./routes/api/auth");
const apiItemsRouter = require("./routes/api/items");
const webAuthRouter = require("./routes/web/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(attachUser);

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", apiAuthRouter);
app.use("/api", apiItemsRouter);

app.use(webAuthRouter);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "Route API introuvable" });
  }
  res.status(404).render("not-found");
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.originalUrl.startsWith("/api")) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
  res.status(500).render("error", { message: "Erreur serveur" });
});

module.exports = app;
