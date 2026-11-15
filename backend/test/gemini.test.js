// Tests services/gemini.js against a fake Google (no network, no real key).
process.env.GEMINI_API_KEY = "AQ.test-key";
process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
process.env.GEMINI_FALLBACK_MODEL = "gemini-3.8-flash";

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createChat, AIError } = require("../src/services/gemini");

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const realFetch = global.fetch;
const realWarn = console.warn;

// fakeGoogle([[status, body], ...]) answers each request with the next response.
let sent;
const fakeGoogle = (responses) => async (url, options) => {
  sent.push({ url, headers: options.headers, body: JSON.parse(options.body) });
  const [status, body] = responses[Math.min(sent.length - 1, responses.length - 1)];
  return new Response(JSON.stringify(body), { status });
};
const modelOf = (request) => request.url.split("/").pop().replace(":generateContent", "");

const textAnswer = (text) => [200, { candidates: [{ content: { role: "model", parts: [{ text }] } }] }];
const toolCall = (name, args) => [200, { candidates: [{ content: { role: "model", parts: [
  { functionCall: { id: "call-1", name, args }, thoughtSignature: "SIG-abc" },
] } }] }];
const busy = [503, [{ error: { code: 503, message: "high demand" } }]];
const retired = [404, { error: { code: 404, message: "no longer available to new users" } }];

const TOOLS = [{ name: "list_categories", description: "List categories" }];
const newChat = (extra = {}) => createChat({ system: "RULES", message: "hi", tools: TOOLS, ...extra });

beforeEach(() => {
  sent = [];
  console.warn = () => {};
});
afterEach(() => {
  global.fetch = realFetch;
  console.warn = realWarn;
});

test("calls Gemini's native endpoint with the key in x-goog-api-key", async () => {
  global.fetch = fakeGoogle([textAnswer("Hello!")]);

  const answer = await newChat().send();

  assert.deepEqual(answer, { text: "Hello!", toolCalls: [] });
  assert.equal(sent[0].url, `${API}/gemini-3.5-flash-lite:generateContent`);
  assert.equal(sent[0].headers["x-goog-api-key"], "AQ.test-key");
});

test("sends the rules, the conversation and the tools", async () => {
  global.fetch = fakeGoogle([textAnswer("ok")]);

  await newChat({
    history: [
      { role: "assistant", content: "Welcome!" }, // a chat can't start with the model → dropped
      { role: "user", content: "a" },
      { role: "user", content: "b" },              // merged with "a"
      { role: "assistant", content: "c" },
    ],
  }).send();

  const body = sent[0].body;
  assert.deepEqual(body.systemInstruction, { parts: [{ text: "RULES" }] });
  assert.deepEqual(body.contents.map((c) => c.role), ["user", "model", "user"]);
  assert.deepEqual(body.contents[0].parts, [{ text: "a" }, { text: "b" }]);
  assert.deepEqual(body.tools, [{ functionDeclarations: TOOLS }]);
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
});

test("tool calls round-trip, and Gemini's thought signature is sent back unchanged", async () => {
  global.fetch = fakeGoogle([toolCall("list_categories", {}), textAnswer("We sell books")]);

  const chat = newChat();
  const first = await chat.send();
  assert.deepEqual(first.toolCalls, [{ id: "call-1", name: "list_categories", args: {} }]);

  chat.addToolResults([{ id: "call-1", name: "list_categories", result: { categories: ["Books"] } }]);
  const second = await chat.send();
  assert.equal(second.text, "We sell books");

  const [, modelTurn, toolTurn] = sent[1].body.contents;
  assert.equal(modelTurn.parts[0].thoughtSignature, "SIG-abc");
  assert.deepEqual(toolTurn, {
    role: "user",
    parts: [{ functionResponse: { id: "call-1", name: "list_categories", response: { categories: ["Books"] } } }],
  });
});

test("hides Gemini's internal 'thought' parts", async () => {
  global.fetch = fakeGoogle([[200, { candidates: [{ content: { parts: [
    { text: "secret reasoning", thought: true },
    { text: "Visible answer" },
  ] } }] }]]);

  assert.equal((await newChat().send()).text, "Visible answer");
});

test("main model busy → tries the fallback model", async () => {
  global.fetch = fakeGoogle([busy, textAnswer("from fallback")]);

  const chat = newChat();
  assert.equal((await chat.send()).text, "from fallback");
  assert.deepEqual(sent.map(modelOf), ["gemini-3.5-flash-lite", "gemini-3.8-flash"]);
  assert.equal(chat.model, "gemini-3.8-flash");
});

test("main model retired (404) → tries the fallback model", async () => {
  global.fetch = fakeGoogle([retired, textAnswer("ok")]);

  await newChat().send();
  assert.deepEqual(sent.map(modelOf), ["gemini-3.5-flash-lite", "gemini-3.8-flash"]);
});

test("busy in the middle of a conversation → retries the SAME model once", async () => {
  global.fetch = fakeGoogle([toolCall("list_categories", {}), busy, textAnswer("done")]);

  const chat = newChat();
  await chat.send();
  chat.addToolResults([{ id: "call-1", name: "list_categories", result: {} }]);
  assert.equal((await chat.send()).text, "done");

  assert.deepEqual(sent.map(modelOf), ["gemini-3.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.5-flash-lite"]);
});

test("gives up after two tries and says it's busy", async () => {
  global.fetch = fakeGoogle([busy]);

  await assert.rejects(newChat().send(), (error) => {
    assert.ok(error instanceof AIError);
    assert.equal(error.busy, true);
    return true;
  });
  assert.equal(sent.length, 2);
});

test("a wrong key (401) is not retried", async () => {
  global.fetch = fakeGoogle([[401, { error: { code: 401, message: "API key not valid" } }]]);

  await assert.rejects(newChat().send(), (error) => error.status === 401 && error.busy === false);
  assert.equal(sent.length, 1);
});

test("timeouts and lost connections count as 'busy' and are retried", async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    throw new TypeError("fetch failed");
  };

  await assert.rejects(newChat().send(), (error) => error.busy === true);
  assert.equal(calls, 2);
});

test("an empty or blocked answer gives a polite message instead of an error", async () => {
  global.fetch = fakeGoogle([[200, { promptFeedback: { blockReason: "SAFETY" } }]]);

  assert.match((await newChat().send()).text, /rephras/);
});

test("a missing API key gives a clear error", () => {
  const key = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    assert.throws(() => newChat(), /GEMINI_API_KEY is not set/);
  } finally {
    process.env.GEMINI_API_KEY = key;
  }
});
