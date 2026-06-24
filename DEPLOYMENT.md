# Deploying this project for free

This gets you a real, public, link-able URL for the portfolio/LinkedIn — no
credit card required anywhere. Three free services, in this order:

1. **Neon** — Postgres database (persists indefinitely on free tier, unlike Render's free DB which expires after 30 days)
2. **Render** — hosts the Express/Prisma API
3. **Vercel** — hosts the Next.js frontend

You need a GitHub account with this repo pushed to it before any of these
three will work — they all deploy by connecting to a GitHub repo.

---

## 0. Push this repo to GitHub (do this on your own machine)

This sandbox's filesystem can't run `git` reliably against your mounted
folder, so run these from a terminal on your own PC, inside the
`cleaning-app` folder:

```bash
git init
git add -A
git commit -m "Initial commit: multi-tenant cleaning SaaS platform"
```

Then create a new **empty** repo on github.com (no README/license — you
already have files), and:

```bash
git remote add origin https://github.com/<your-username>/cleaning-saas-platform.git
git branch -M main
git push -u origin main
```

---

## 1. Database — Neon (free Postgres)

1. Go to neon.com → sign up (GitHub login is fastest) → **New project**.
2. Name it `cleaning-saas`, pick a region close to you (e.g. Frankfurt for EU).
3. On the project's **Connection Details** panel, grab two connection
   strings (toggle "Pooled connection" on and off to get both):
   - **Pooled** connection string → this is `DATABASE_URL`
   - **Direct** (unpooled) connection string → this is `DIRECT_URL`
     (Prisma needs the direct one to run migrations safely against Neon's
     connection pooler)
4. Keep this tab open — you'll paste both into Render in step 2.

Free tier: 0.5 GB storage, 100 compute-hours/month — plenty for a portfolio
demo with light traffic.

---

## 2. API — Render (free web service)

1. Go to render.com → sign up with GitHub → authorize access to your new repo.
2. **New** → **Blueprint** → select the `cleaning-saas-platform` repo.
   Render will read `render.yaml` at the repo root and propose the
   `cleaning-api` service automatically.
3. Click **Apply**. It'll ask you to fill in the env vars marked `sync: false`
   in `render.yaml`. Fill in:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the **pooled** Neon connection string from step 1 |
   | `DIRECT_URL` | the **direct** Neon connection string from step 1 |
   | `JWT_ACCESS_SECRET` | run `openssl rand -hex 32` locally, paste the output |
   | `JWT_REFRESH_SECRET` | run `openssl rand -hex 32` again (different value) |
   | `ENCRYPTION_KEY` | run `openssl rand -hex 32` again (different value) |
   | `WEB_URL` | leave as `http://localhost:3000` for now — you'll update this in step 4 |
   | `API_BASE_URL` | leave blank for now — you'll know it after this deploys |

   Stripe/Resend/Google vars can stay empty — the app boots fine without
   them, those features just stay disabled until you add real keys later.

4. Click **Apply**/**Create**. First deploy takes a few minutes — it runs
   `prisma migrate deploy` automatically, so your Neon DB gets all the
   tables created.
5. Once live, copy the URL Render gives you, e.g.
   `https://cleaning-api.onrender.com`. Set `API_BASE_URL` to that value in
   the service's env vars (Settings → Environment).

**Free tier caveat:** the service spins down after 15 minutes idle and takes
~30-60s to wake back up on the next request. Fine for a portfolio demo;
mention it if you link this from a resume so a slow first load doesn't read
as broken.

---

## 3. Frontend — Vercel (free Hobby plan)

1. Go to vercel.com → sign up with GitHub → **Add New** → **Project** →
   import the same repo.
2. In the import screen, set **Root Directory** to `apps/web`. Vercel will
   detect Next.js and use the `vercel.json` already in that folder to build
   correctly inside the pnpm/turborepo monorepo.
3. Add environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://cleaning-api.onrender.com/v1` (your Render URL + `/v1`) |
   | `NEXTAUTH_URL` | leave blank — Vercel sets this automatically |
   | `NEXTAUTH_SECRET` | run `openssl rand -hex 32` once more |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional — leave blank to disable "Sign in with Google" |

4. Click **Deploy**. You'll get a URL like
   `https://cleaning-saas-platform.vercel.app`.

---

## 4. Wire the two together (CORS)

Back in Render → your API service → Environment, set:

```
WEB_URL=https://cleaning-saas-platform.vercel.app
```

and redeploy (Render does this automatically on env var save, or click
**Manual Deploy**). This lets the frontend's actual domain through the API's
CORS check.

---

## 5. Seed some demo data (optional but recommended for a portfolio link)

So recruiters clicking the link see a populated app, not an empty one:

```bash
# from your own machine, with DATABASE_URL pointed at the Neon DB:
DATABASE_URL="<neon connection string>" pnpm --filter @cleaning/api prisma db seed
```

Check `apps/api/prisma/seed.ts` for what demo accounts this creates — the
login page already shows the demo credentials it expects.

---

## Done

You now have:
- A live frontend: `https://your-app.vercel.app`
- A live API: `https://cleaning-api.onrender.com`
- A real Postgres database with real data

That Vercel URL is what goes on LinkedIn, your resume, and the GitHub README.
