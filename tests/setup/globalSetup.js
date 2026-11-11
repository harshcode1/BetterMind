// Starts ONE in-memory MongoDB for the whole test run. Each Jest worker gets its own database
// name (see env.js), so test files running in parallel do not see each other's data.
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const server = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = server;
  process.env.TEST_MONGO_BASE_URI = server.getUri(); // e.g. mongodb://127.0.0.1:PORT/
};
