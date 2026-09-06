import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      semi: ["error", "never"],
      "no-extra-semi": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-empty": "off",
      curly: ["error", "all"],
      "nonblock-statement-body-position": ["error", "below"],
    },
  },
  {
    ignores: ["node_modules", "dist", "coverage"],
  }
)
