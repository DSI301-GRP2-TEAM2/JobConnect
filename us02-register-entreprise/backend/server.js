require("dotenv").config();
const app = require("./src/app");
const { connectDB, disconnectDB } = require("./src/config/db");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`JobConnect backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
