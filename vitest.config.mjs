import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

// Cria o equivalente ao __dirname no formato moderno (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});