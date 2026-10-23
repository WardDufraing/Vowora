import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["apps/**/*.unit.test.ts", "packages/**/*.unit.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["apps/**/*.component.test.tsx"],
          setupFiles: ["./test/setup.ts"],
        },
      },
    ],
  },
});
