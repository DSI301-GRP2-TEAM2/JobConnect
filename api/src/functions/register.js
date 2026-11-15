const { app } = require("@azure/functions");
const { registerHandler } = require("../handlers/register");

app.http("register", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/register",
  handler: registerHandler,
});