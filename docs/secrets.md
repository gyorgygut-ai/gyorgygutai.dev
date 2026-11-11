# Deployment secrets

The root `.env` stores encrypted Cloudflare deployment credentials. Keep it tracked and encrypted. `.env.local` is ignored and contains `DOTENV_PRIVATE_KEY`; never commit or print its contents.

The contracts package owns the variable names and Zod validation:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

`npm run build`, `npm run test`, and `npm run dev` do not decrypt or require Cloudflare credentials. Deployment scripts load dotenvx values and call `getCloudflareDeploymentEnv()` before invoking Wrangler.

## Add or rotate a secret

1. Add its name and Zod rule in `packages/contracts/src/`.
2. Encrypt it into the tracked `.env` with dotenvx.
3. Keep the private key in `.env.local`.
4. Test validation using synthetic fixtures; never print real secret values.

## Deploy

```sh
npm run deploy:website
npm run deploy:pdf
```

The `env:load` command reads `DOTENV_PRIVATE_KEY` from `.env.local` through shell command substitution, then runs dotenvx. Only deployment commands use this script.
