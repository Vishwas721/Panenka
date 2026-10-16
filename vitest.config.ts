import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts", "mcp/**/*.test.ts"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    fileParallelism: false,
    globalSetup: ["tests/setup/global-setup.ts"],
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://panenka:panenka_dev_password@127.0.0.1:5434/panenka_test",
    },
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
