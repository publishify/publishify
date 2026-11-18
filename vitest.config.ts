import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "server",
          include: [
            "app/api/test/**/*.test.ts",
            "packages/*/test/**/*.test.ts",
            "scripts/test/**/*.test.mjs",
          ],
        },
      },
      {
        test: {
          name: "client",
          environment: "happy-dom",
          include: ["app/client/src/__tests__/**/*.test.ts"],
          setupFiles: ["app/client/src/__tests__/setup.ts"],
        },
      },
    ],
  },
});
