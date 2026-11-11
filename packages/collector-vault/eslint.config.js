import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      curly: ["error", "all"],
      "@typescript-eslint/no-explicit-any": "error",
      "nonblock-statement-body-position": ["error", "below"],
    },
  },
  {
    ignores: ["node_modules", "dist", "coverage", "src/generated/**"],
  },
)
