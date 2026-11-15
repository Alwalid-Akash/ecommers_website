const { z } = require("zod");

const assistantSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(500, "Message is too long"),

  // History comes from the browser, so it's untrusted: only plain text from
  // "user" or "assistant" (never "system" or "tool"), and a size limit.
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(10)
    .default([]),
});

module.exports = { assistantSchema };
