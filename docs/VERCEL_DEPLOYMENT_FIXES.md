# Vercel Deployment Fixes

This document explains the issues that were causing crashes on Vercel and how they were resolved.

## Issues Found

### 1. ❌ Prisma Client Not Generated
**Problem:** Vercel builds weren't generating the Prisma client, causing crashes when the app tried to import `@prisma/client`.

**Solution:** Added `postinstall` script to `api/package.json`:
```json
"postinstall": "prisma generate"
```

This ensures the Prisma client is automatically generated after `npm install` during the Vercel build process.

---

### 2. ❌ Missing Global Prefix Exclusion in Vercel Handler
**Problem:** The `vercel.ts` serverless handler had a different global prefix configuration than `main.ts`, causing the `.well-known` endpoint to fail.

**Solution:** Updated `api/src/vercel.ts` to match `main.ts`:
```typescript
app.setGlobalPrefix('api', {
  exclude: ['.well-known/appspecific/com.tesla.3p.public-key.pem'],
});
```

---

### 3. ❌ Missing Vercel Route for `.well-known`
**Problem:** Vercel routing only sent `/api/*` requests to the backend. The `.well-known` route wasn't being routed correctly.

**Solution:** Added explicit route in `vercel.json`:
```json
{
  "src": "/.well-known/(.*)",
  "dest": "api/src/vercel.ts"
}
```

---

### 4. ❌ Missing Sync Endpoint
**Problem:** Vercel Cron was configured to call `/api/sync/cron` every 5 minutes, but the endpoint didn't exist, causing crashes.

**Solution:** Created stub `SyncModule` with a placeholder endpoint:
- `api/src/modules/sync/sync.controller.ts`
- `api/src/modules/sync/sync.module.ts`

Returns `{ success: true, message: 'Sync endpoint not yet implemented' }` to prevent errors until sync logic is implemented.

---

## Files Modified

1. `api/package.json` - Added `postinstall` script
2. `api/src/vercel.ts` - Fixed global prefix configuration
3. `vercel.json` - Added `.well-known` route
4. `api/src/modules/sync/` - Created stub sync module
5. `api/src/app.module.ts` - Registered `SyncModule`

---

## Deployment Checklist

Before deploying to Vercel, ensure:

✅ **Environment Variables Set:**
- `DATABASE_URL` - Vercel Postgres connection string
- `ENCRYPTION_KEY` - 64-character hex string for AES-256-GCM
- `JWT_SECRET` - Secret for JWT tokens
- `APP_PASSWORD` - Password for app login
- `TESLA_CLIENT_ID` - Tesla OAuth client ID
- `TESLA_CLIENT_SECRET` - Tesla OAuth client secret
- `TESLA_PUBLIC_KEY` - Tesla Fleet API public key (PEM format)

✅ **Database Migrated:**
```bash
# Run migrations on Vercel Postgres
npx prisma migrate deploy
```

✅ **Code Pushed to Git:**
```bash
git add .
git commit -m "fix(deploy): resolve Vercel deployment issues"
git push
```

---

## Testing After Deployment

### 1. Test Public Key Endpoint
```bash
curl https://your-domain.vercel.app/.well-known/appspecific/com.tesla.3p.public-key.pem
```
Should return your Tesla public key.

### 2. Test Login
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_PASSWORD"}'
```
Should return a JWT token.

### 3. Test Auth Status
```bash
curl https://your-domain.vercel.app/api/auth/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Should return authentication status.

### 4. Test Sync Cron (Optional)
```bash
curl https://your-domain.vercel.app/api/sync/cron
```
Should return `{ success: true, message: 'Sync endpoint not yet implemented' }`.

---

## Next Steps After Successful Deployment

1. **Register with Tesla Fleet API**
   - See `docs/TESLA_FLEET_REGISTRATION.md`
   - This will resolve the 412 error you were getting

2. **Implement Sync Logic**
   - Update `SyncModule` to fetch and store vehicle/energy data
   - Called automatically every 5 minutes by Vercel Cron

3. **Add Database Migrations**
   - Run migrations after any schema changes
   - Use `npx prisma migrate deploy` on Vercel Postgres

---

## Common Issues

### "Node.js process exited with exit status: 1"
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check Vercel function logs for detailed error

### "Tesla public key not configured"
- Ensure `TESLA_PUBLIC_KEY` environment variable is set
- Include the full PEM format with BEGIN/END lines
- Redeploy after adding the variable

### "412 - Account must be registered"
- Complete Tesla Fleet API registration (see `TESLA_FLEET_REGISTRATION.md`)
- Verify public key is accessible at the `.well-known` endpoint

---

## Summary

All Vercel deployment issues have been resolved:
✅ Prisma client generation automated
✅ `.well-known` endpoint properly configured
✅ Sync endpoint stub created
✅ Routing configured correctly

The app should now deploy successfully to Vercel!
