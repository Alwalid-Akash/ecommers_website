require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

const app = require("./app");

// Not fatal: the shop works without the AI assistant, but say so loudly.
const llmKeyName =
  (process.env.LLM_PROVIDER || "gemini").toLowerCase() === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
if (!process.env[llmKeyName]) {
  console.warn(`⚠️  ${llmKeyName} is not set: the AI assistant will answer "unavailable".`);
}

const PORT = process.env.PORT || 3000;

// 0.0.0.0 so the server is reachable from outside a Docker container
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);

  // RAG: build the AI search index in the background (only changed texts are embedded)
  require("./services/rag").scheduleSync("startup");
});
