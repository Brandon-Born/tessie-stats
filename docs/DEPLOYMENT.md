# Deployment Guide

## Overview

Tessie Stats is deployed to Vercel using:
- **API:** NestJS as serverless functions
- **Web:** React as static build
- **Database:** Vercel Postgres
- **Cron:** Vercel Cron for scheduled sync

---

## Prerequisites

Before deploying, ensure you have:

1. ✅ Vercel account connected to GitHub
2. ✅ Vercel Postgres database created
3. ✅ Tesla API credentials
4. ✅ Encryption key generated
5. ✅ All environment variables ready

See [PREREQUISITES.md](../PREREQUISITES.md) for details.

---

## Initial Deployment

### Step 1: Connect Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the monorepo structure

### Step 2: Configure Build Settings

**Root Directory:** Leave empty (monorepo root)

**Build Command:**
```bash
npm run build
```

**Output Directory:** Leave default

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your Postgres URL | All |
| `ENCRYPTION_KEY` | 64-char hex string | All |
| `JWT_SECRET` | Your JWT secret | All |
| `TESLA_CLIENT_ID` | Your Tesla client ID | All |
| `TESLA_CLIENT_SECRET` | Your Tesla client secret | All |
| `NODE_ENV` | `production` | Production |

### Step 4: Link Postgres

1. Go to your Vercel project
2. Click "Storage" tab
3. Connect your Vercel Postgres database
4. Environment variables will be auto-added

### Step 5: Deploy

Click "Deploy" or push to your main branch.

---

## Vercel Configuration

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/dist/main.js",
      "use": "@vercel/node"
    },
    {
      "src": "web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/dist/main.js"
    },
    {
      "src": "/(.*)",
      "dest": "web/$1"
    }
  ],
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Database Setup

### Run Migrations

After first deployment:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:migrate
```

Or use Vercel's console:
1. Go to project → Functions
2. Find migration endpoint
3. Trigger manually

### Seed Initial Data

```bash
npm run db:seed
```

---

## Cron Jobs

### Sync Job

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Schedule:** Every 5 minutes

**Endpoint:** `/api/sync/cron`

### Verify Cron

1. Go to Vercel Dashboard → Project → Crons
2. Check execution history
3. View logs for errors

---

## Monitoring

### Vercel Analytics

Enable in project settings for:
- Request volume
- Function duration
- Error rates

### Logging

View function logs:
1. Go to Vercel Dashboard → Project → Logs
2. Filter by function or time range
3. Search for errors

### Alerts

Set up alerts for:
- Function errors
- High latency
- Cron failures

---

## Updating

### Automatic Deployments

Push to `main` branch triggers automatic deployment.

### Manual Deployment

```bash
vercel --prod
```

### Preview Deployments

Push to any branch for preview URL.

---

## Rollback

### Via Dashboard

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Via CLI

```bash
vercel rollback
```

---

## Environment Variables

### Managing Secrets

**Add variable:**
```bash
vercel env add VARIABLE_NAME
```

**List variables:**
```bash
vercel env ls
```

**Remove variable:**
```bash
vercel env rm VARIABLE_NAME
```

### Environment-Specific

- **Development:** `.env.local` (local only)
- **Preview:** Vercel preview environment
- **Production:** Vercel production environment

---

## Troubleshooting

### Build Failures

**"Module not found"**
- Check dependencies in package.json
- Run `npm install` locally to verify

**"TypeScript errors"**
- Run `npm run typecheck` locally
- Fix all type errors before pushing

### Runtime Errors

**"Function timeout"**
- Check function execution time
- Optimize database queries
- Consider splitting long operations

**"Database connection error"**
- Verify DATABASE_URL is set
- Check Postgres is running
- Verify network access

### Cron Not Running

**"Cron not triggering"**
- Verify cron syntax in vercel.json
- Check deployment includes cron config
- View cron logs for errors

---

## Performance Optimization

### Cold Starts

Minimize by:
- Keeping functions small
- Lazy loading heavy dependencies
- Using connection pooling

### Database

- Use connection pooling (built into Vercel Postgres)
- Index frequently queried columns
- Optimize N+1 queries

### Caching

- Use Vercel Edge Cache for static data
- Implement response caching headers
- Cache Tesla API responses appropriately

---

## Security Checklist

Before production:

- [ ] All secrets in environment variables
- [ ] No sensitive data in logs
- [ ] HTTPS only
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak internals
- [ ] Dependencies up to date
- [ ] Security headers configured

---

## Costs

### Vercel (Hobby Plan)

- Serverless functions: 100GB-hours/month
- Bandwidth: 100GB/month
- Builds: 6000 minutes/month

### Vercel Postgres (Hobby)

- Storage: 256MB
- Compute hours: 60/month
- Data transfer: 256MB/month

### Tesla API

- Free tier: 1000 requests/day

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [NestJS on Vercel](https://docs.nestjs.com/faq/serverless)
