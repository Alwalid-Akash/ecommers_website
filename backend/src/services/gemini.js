// Everything needed to talk to Google Gemini, in one file.
//
// How the chatbot uses it (see assistantController.js):
//   const chat = createChat({ system, history, message, tools });
//   const { text, toolCalls } = await chat.send();   // 1. ask Gemini
//   chat.addToolResults(results);                    // 2. give it the search results
//   await chat.send();                               // 3. ask again → final answer
//
// How RAG uses it (see rag.js):
//   const [vector] = await embed(["warm winter jacket"], { kind: "query" });

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 25_000; // give up on a slow answer after 25 seconds

// An error from Gemini. `busy` = temporary problem, worth trying again.
class AIError extends Error {
  constructor(message, { busy = false, status } = {}) {
    super(message);
    this.busy = busy;
    this.status = status; // HTTP status from Google, e.g. 404 or 503
  }
}

// ─────────────────────────────────────────────────────────────
// 1) One HTTP request to Gemini
// ─────────────────────────────────────────────────────────────
// `method` is "generateContent" (chat) or "batchEmbedContents" (embeddings).
async function callGemini(model, body, method = "generateContent") {
  let response;

  try {
    response = await fetch(`${API_URL}/${model}:${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY, // works with "AQ." and "AIza" keys
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Timeout or no internet connection
    const reason = error.name === "TimeoutError" ? "timed out" : error.message;
    throw new AIError(`${model} ${reason}`, { busy: true });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Google sends its error as { error: {...} } or [{ error: {...} }]
    const googleError = (Array.isArray(data) ? data[0] : data)?.error;
    throw new AIError(`${model} failed (${response.status}): ${googleError?.message || "unknown error"}`, {
      busy: [429, 500, 502, 503, 504].includes(response.status), // rate limit / overloaded
      status: response.status,
    });
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// 2) Chat history → Gemini's format
//    The browser uses "user"/"assistant"; Gemini uses "user"/"model".
//    Gemini wants the chat to start with "user" and alternate,
//    so two messages in a row from the same side are merged.
// ─────────────────────────────────────────────────────────────
function toContents(history, message) {
  const contents = [];

  for (const { role, content } of [...history, { role: "user", content: message }]) {
    const geminiRole = role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];

    if (last && last.role === geminiRole) {
      last.parts.push({ text: content });
    } else {
      contents.push({ role: geminiRole, parts: [{ text: content }] });
    }
  }

  while (contents[0]?.role === "model") contents.shift();
  return contents;
}

// ─────────────────────────────────────────────────────────────
// 3) A chat = one customer question, possibly several rounds with tools
// ─────────────────────────────────────────────────────────────
function createChat({ system, history = [], message, tools = [] }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIError("GEMINI_API_KEY is not set");
  }

  const mainModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";   // fast
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash";

  let model = mainModel;
  let started = false; // has Gemini answered at least once?
  const contents = toContents(history, message);

  const requestBody = () => ({
    systemInstruction: { parts: [{ text: system }] }, // the assistant's rules
    contents,                                          // the conversation so far
    tools: [{ functionDeclarations: tools }],          // what Gemini may ask us to run
    generationConfig: {
      maxOutputTokens: 2048,
      // Gemini 3 models "think" before answering: keep it short = faster.
      ...(/^gemini-[3-9]/.test(model) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
    },
  });

  return {
    get model() {
      return model;
    },

    async send() {
      let data;

      try {
        data = await callGemini(model, requestBody());
      } catch (error) {
        // Before Gemini's first answer we may switch to the fallback model
        // (if the main one is busy, slow or no longer available).
        // After that we must stay on the same model: Gemini signs its tool
        // calls, and those signatures only work with the model that made them.
        const canSwitch = !started && model !== fallbackModel && (error.busy || error.status === 404);

        if (!canSwitch && !error.busy) throw error; // e.g. wrong key: retrying won't help

        if (canSwitch) model = fallbackModel;
        console.warn(`⚠️  ${error.message} → trying ${model}`);
        data = await callGemini(model, requestBody()); // second and last try
      }

      const answer = data.candidates?.[0]?.content;

      if (!answer?.parts?.length) {
        // e.g. blocked by Google's safety filters
        return { text: "Sorry, I couldn't answer that. Please try rephrasing your question.", toolCalls: [] };
      }

      // Save Gemini's answer EXACTLY as received: it contains hidden
      // "thought signatures" that Gemini checks on the next request.
      contents.push({ ...answer, role: "model" });
      started = true;

      // Did Gemini ask us to run tools?
      const toolCalls = answer.parts
        .filter((part) => part.functionCall)
        .map((part) => ({
          id: part.functionCall.id,
          name: part.functionCall.name,
          args: part.functionCall.args ?? {},
        }));

      // The visible answer (skip Gemini's internal "thought" parts)
      const text = answer.parts
        .filter((part) => part.text && !part.thought)
        .map((part) => part.text)
        .join("")
        .trim();

      return { text, toolCalls };
    },

    // Send the tool results back to Gemini, matched to its requests by id.
    addToolResults(results) {
      contents.push({
        role: "user",
        parts: results.map(({ id, name, result }) => ({
          functionResponse: { id, name, response: result },
        })),
      });
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 4) Embeddings for RAG: text → a vector (a list of numbers)
//    Texts with a similar MEANING get similar vectors, even when they share
//    no words ("warm jacket" ≈ "winter coat"). pgvector compares them.
// ─────────────────────────────────────────────────────────────

// Settings: vector size (must match vector(768) in config/rag.sql)
// and how many texts we send to Google in one request.
const EMBEDDING_DIMENSIONS = 768;
const EMBED_BATCH_SIZE = 50;

// Which embedding model to use (can be changed in .env)
const embeddingModel = () => process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

// Tells the model what the text is for, with the prefix Google recommends:
//   kind "query":    a customer question, e.g. "gift for a coffee lover"
//   kind "document": a stored text, e.g. { title: "Coffee Maker", text: "..." }
function embeddingInput(item, kind) {
  return kind === "query"
    ? `task: search result | query: ${item}`
    : `title: ${item.title || "none"} | text: ${item.text}`;
}

// Turns a list of texts into a list of vectors (same order).
async function embed(items, { kind }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIError("GEMINI_API_KEY is not set");
  }

  const model = embeddingModel();
  const vectors = [];

  // Send the texts in groups of 50
  for (let start = 0; start < items.length; start += EMBED_BATCH_SIZE) {
    const batch = items.slice(start, start + EMBED_BATCH_SIZE);

    const data = await callGemini(
      model,
      {
        // One request per text, so each text gets its own vector
        requests: batch.map((item) => ({
          model: `models/${model}`,
          content: { parts: [{ text: embeddingInput(item, kind) }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      },
      "batchEmbedContents"
    );

    // Safety check: every vector must have exactly 768 numbers
    for (const embedding of data.embeddings ?? []) {
      if (embedding.values?.length !== EMBEDDING_DIMENSIONS) {
        throw new AIError(`${model} returned a vector of the wrong size`);
      }
      vectors.push(embedding.values);
    }
  }

  // Safety check: one vector per text
  if (vectors.length !== items.length) {
    throw new AIError(`${model} returned ${vectors.length} vectors for ${items.length} texts`);
  }
  return vectors;
}

module.exports = { createChat, AIError, embed, embeddingModel, EMBEDDING_DIMENSIONS };
