const { app } = require("@azure/functions");
const { loginHandler } = require("../handlers/login");

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: loginHandler,
});