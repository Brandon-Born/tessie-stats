# Prerequisites - What You Need to Provide

This document outlines everything you need to set up before development can begin.

---

## 📋 Checklist

Use this checklist to track your setup progress:

- [ ] Tesla Developer Account created
- [ ] Tesla App registered and approved
- [ ] Tesla API credentials obtained
- [ ] Vercel account created
- [ ] Vercel Postgres database provisioned
- [ ] Environment variables configured
- [ ] Local development environment ready

---

## 1. Tesla Developer Account & API Access

### Step 1: Register as a Tesla Developer

1. Go to [Tesla Developer Portal](https://developer.tesla.com/)
2. Sign in with your Tesla account
3. Accept the developer agreement
4. Complete the registration process

### Step 2: Create an Application

1. In the developer portal, create a new application
2. Fill in the required information:
   - **Application Name:** Tessie Stats (or your preferred name)
   - **Description:** Personal Tesla and Powerwall dashboard
   - **Purpose:** Personal use
   - **Redirect URI:** `https://your-app-domain.vercel.app/auth/callback` (update after Vercel deployment)

3. Note down these credentials (you'll need them):
   - **Client ID**
   - **Client Secret**

### Step 3: Request API Access

Tesla requires approval for API access. For personal use apps:
1. Submit your application for review
2. Wait for approval (typically 1-7 days)
3. Once approved, your app can make API calls

### Required Scopes

Your Tesla app needs these OAuth scopes:
- `openid` - Authentication
- `offline_access` - Refresh tokens
- `vehicle_device_data` - Vehicle telemetry
- `vehicle_cmds` - Wake vehicle
- `energy_device_data` - Powerwall data

---

## 2. Tesla Refresh Token

After your app is approved, you'll need to obtain a refresh token:

### Option A: Using Tesla's OAuth Flow

1. Construct the authorization URL:
```
https://auth.tesla.com/oauth2/v3/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=openid%20offline_access%20vehicle_device_data%20vehicle_cmds%20energy_device_data&
  state=random_state_string
```

2. Navigate to this URL in your browser
3. Log in with your Tesla account
4. Authorize the application
5. You'll be redirected to your callback URL with a `code` parameter
6. Exchange the code for tokens:

```bash
curl -X POST https://auth.tesla.com/oauth2/v3/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

7. Save the `refresh_token` from the response

### Option B: Using a Helper Tool

There are community tools that can help with this process. Search for "Tesla token generator" for options.

> ⚠️ **Security Warning:** Only use trusted tools. Your refresh token grants full access to your Tesla account.

---

## 3. Vercel Setup

### Step 1: Create Vercel Account

1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub (recommended for easy deployment)
3. Verify your email

### Step 2: Provision Vercel Postgres

1. In Vercel dashboard, go to **Storage**
2. Click **Create Database**
3. Select **Postgres**
4. Choose the free tier (Hobby plan)
5. Name your database (e.g., `tessie-stats-db`)
6. Select your preferred region
7. Click **Create**

After creation, Vercel will provide you with:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

You only need `POSTGRES_URL` (or `DATABASE_URL` - they're the same).

---

## 4. Generate Encryption Key

The encryption key is used to securely store your Tesla refresh token.

### Generate a 32-byte (256-bit) key:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Python:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

This will output a 64-character hexadecimal string. Save it securely.

---

## 5. Environment Variables Summary

You'll need to provide these values for deployment:

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `DATABASE_URL` | Vercel Postgres connection string | Vercel Storage dashboard |
| `ENCRYPTION_KEY` | 64-char hex string for token encryption | Generate (see above) |
| `JWT_SECRET` | Secret for JWT token signing | Generate any secure random string |
| `TESLA_CLIENT_ID` | Your Tesla app client ID | Tesla Developer Portal |
| `TESLA_CLIENT_SECRET` | Your Tesla app client secret | Tesla Developer Portal |

### Example `.env.local` file:

```env
# Database
DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require

# Security
ENCRYPTION_KEY=a1b2c3d4e5f6... (64 characters)
JWT_SECRET=your-super-secret-jwt-key-here

# Tesla API
TESLA_CLIENT_ID=your-tesla-client-id
TESLA_CLIENT_SECRET=your-tesla-client-secret

# App Settings
NODE_ENV=development
LOG_LEVEL=debug
SYNC_INTERVAL_MINUTES=5
```

---

## 6. Local Development Environment

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package manager |
| Git | Latest | Version control |
| VS Code / Cursor | Latest | IDE with AI assistance |

### Recommended VS Code/Cursor Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prisma (if using Prisma ORM)
- Thunder Client (API testing)

### Install Node.js

**Windows (using winget):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**macOS (using Homebrew):**
```bash
brew install node@20
```

**Verify installation:**
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

## 7. Initial Repository Setup

After cloning/creating the repository:

```bash
# Install root dependencies
npm install

# Install API dependencies
cd api && npm install && cd ..

# Install web dependencies
cd web && npm install && cd ..

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Then verify setup
npm run validate
```

---

## 8. Tesla API Limits & Considerations

### Rate Limits (as of 2024)

| Tier | Requests/Day | Requests/Minute |
|------|--------------|-----------------|
| Free | 1000 | 10 |
| Paid | Higher | Higher |

### Important Notes

1. **Vehicle Wake:** Waking a vehicle uses battery. The app should minimize wake operations.

2. **Data Freshness:** When a vehicle is asleep, you get cached data. For fresh data, you must wake it.

3. **Powerwall Data:** Energy data is generally available without waking devices.

4. **Historical Data:** Tesla provides limited historical data through the API. Consider storing data locally for long-term analytics.

5. **API Changes:** Tesla may change their API without notice. Monitor the developer portal for updates.

---

## 9. Support Resources

- [Tesla Fleet API Documentation](https://developer.tesla.com/docs/fleet-api)
- [Tesla Developer Forum](https://developer.tesla.com/community)
- [Vercel Documentation](https://vercel.com/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)

---

## ❓ Common Issues

### "Application not approved"
- Ensure all required fields are filled correctly
- Personal use applications are usually approved quickly
- Contact Tesla developer support if delayed

### "Invalid refresh token"
- Tokens expire after extended periods of non-use
- Re-authenticate to get a new token
- Ensure your app has the required scopes

### "Rate limit exceeded"
- Reduce polling frequency
- Implement exponential backoff
- Consider upgrading to a paid tier

### "Vehicle offline"
- Vehicle must be awake for some data
- Use wake command sparingly
- Cache data to reduce API calls

---

## ✅ Ready to Proceed?

Once you have:
1. ✅ Tesla API credentials (client ID & secret)
2. ✅ Vercel Postgres database URL
3. ✅ Generated encryption key
4. ✅ Local development environment set up

You're ready to begin development! The AI coding agents can now start implementing features.
