// Test settings. Reuses vite.config.js (React plugin) and adds:
// - jsdom: a simulated browser, so components can render without Chrome
// - setup.js: runs before every test file
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./test/setup.js"],
      include: ["test/**/*.test.{js,jsx}"], // all tests live in frontend/test/
      clearMocks: true, // forget mock calls between tests
    },
  })
);
