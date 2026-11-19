// run-backend-tests.js
// Starts an in-memory MongoDB and runs all *.test.js files in tests/.
// Usage:  node run-backend-tests.js
// No arguments needed - reads TEST_MONGODB_URI? No, it sets it itself.
const { MongoMemoryServer } = require("mongodb-memory-server");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

(async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.TEST_MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.CORS_ORIGIN = "http://localhost:4200";

  const testsDir = path.join(process.cwd(), "tests");
  if (!fs.existsSync(testsDir)) {
    console.error("No tests/ folder found in the current directory.");
    await mongo.stop();
    process.exit(1);
  }
  const testFiles = fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith(".test.js"))
    .map((f) => path.join("tests", f));

  if (testFiles.length === 0) {
    console.error("No .test.js files found in tests/.");
    await mongo.stop();
    process.exit(1);
  }

  console.log("Running " + testFiles.length + " test file(s): " + testFiles.join(", "));

  const result = spawnSync(process.execPath, ["--test", ...testFiles], {
    stdio: "inherit",
    env: process.env,
    timeout: 120000,
  });

  await mongo.stop();
  process.exit(result.status || 0);
})();
