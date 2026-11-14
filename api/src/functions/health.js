const { app } = require("@azure/functions");
const mongoose = require("mongoose");

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: async (request, context) => {
    try {
      await connect();
      return { status: 200, jsonBody: { status: "ok", db: "connected" } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { status: "error", message: err.message } };
    }
  },
});