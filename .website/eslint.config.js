import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      semi: ["error", "never"],
      "no-extra-semi": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "off",
    },
  },
  {
    ignores: ["node_modules", "dist"],
  }
)
