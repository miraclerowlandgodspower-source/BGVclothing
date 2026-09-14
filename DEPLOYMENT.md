# Baggy Clothing on Vercel

## Deploy the storefront and API together

For the `bg-vclothing` project connected to this repository:

- Production branch: `main`.
- Root Directory: the repository root (leave blank), **not** `backend`.
- Framework Preset: Other. No custom build command or output directory is needed.
- The root `vercel.json` explicitly builds the backend and publishes only storefront assets.
- Requests to `/api/*` run `backend/server.js` on the same domain as the website.
- Keep both `backend/package.json` and `backend/package-lock.json`; the Node builder uses them for backend dependencies.

The existing `backend/vercel.json` remains usable for a separate backend-only project,
but the storefront no longer needs that project's hostname.

## Set environment variables before deploying

In the **bg-vclothing project's** Settings > Environment Variables, set:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string with newly rotated credentials |
| `PAYSTACK_SECRET_KEY` | Your newly rotated Paystack secret key |
| `FRONTEND_URL` | `https://bg-vclothing.vercel.app` |

Apply them to Production. For Preview, use a separate test database, a Paystack
test key and the appropriate preview frontend URL. Do not use production payment
credentials for automated tests. Redeploy after environment-variable changes.

For MongoDB Atlas, ensure the database user is valid and network access permits
your Vercel deployment. Use the narrowest network rules your hosting setup supports.
Do not put secrets in `config.js`, `vercel.json`, or any committed `.env` file.

## Credential cleanup is required

`backend/.env` was previously committed to the public repository. Removing it from
the current branch does **not** remove old commits or invalidate exposed credentials.
Rotate the MongoDB database-user password and Paystack secret key if they were real,
and update your local `.env` and Vercel settings. History cleanup, if desired, is a
separate coordinated operation; this fix does not rewrite Git history.

## Verify a deployment without creating users, orders, or charges

- `/` and `/login.html` should display the storefront.
- `/api/health` should return JSON with `status: "ok"` (API routing/liveness).
- `/api/health/ready` should return `status: "ready"` (database connection).
- A `503` from readiness means the API is running but database configuration or
  connectivity still needs attention. Check Vercel environment settings and Atlas.
- `/api/does-not-exist` should return a JSON `404`, not an HTML page.
- Backend source files and `.env` files must not be downloadable from the website.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and fill in your local settings.
2. Run `npm ci` in `backend`, then `npm start`.
3. Open `index.html` with VS Code Live Server. `config.js` calls port 3000 locally
   and the current website domain on Vercel.
4. Run `npm test` in `backend` for deployment regression tests. Tests use mocked
   database connections and never call Paystack or the production database.

Configuration reference: https://vercel.com/docs/project-configuration/vercel-json
