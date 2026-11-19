const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Provide it via env var or pass it explicitly to connectDB().");
  }
  if (isConnected) return mongoose.connection;
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  isConnected = true;
  console.log("MongoDB connected");
  return mongoose.connection;
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("MongoDB disconnected");
};

module.exports = { connectDB, disconnectDB };
