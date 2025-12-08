const serverless = require("serverless-http");
const app = require("../server");
const connectDB = require("../lib/mongo");

module.exports = async (req, res) => {
  await connectDB();     // connect per request (cached)
  const handler = serverless(app);
  return handler(req, res);
};