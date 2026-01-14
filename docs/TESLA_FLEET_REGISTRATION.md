# Tesla Fleet API Registration Guide

## Overview

Tesla Fleet API requires partner applications to be registered before they can access vehicle and energy data. This is a one-time setup process.

## Prerequisites

- ✅ Completed Tesla OAuth flow
- ✅ Application deployed to a public domain (Vercel)
- ✅ Public key hosted at the required endpoint

---

## Step 1: Generate EC Key Pair

Tesla requires an EC public key using the `secp256r1` curve (also called `prime256v1`).

### Generate Keys

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem

# Extract public key
openssl ec -in private-key.pem -pubout -out public-key.pem

# View the public key (this is what you'll add to TESLA_PUBLIC_KEY)
cat public-key.pem
```

### Store Keys Securely

1. **Private Key**: 
   - Store securely (do NOT commit to git)
   - Will be needed for signing vehicle commands in the future
   - Keep it safe - you can't regenerate it

2. **Public Key**:
   - Copy the entire contents (including BEGIN/END lines)
   - Add to your environment variables as `TESLA_PUBLIC_KEY`

---

## Step 2: Configure Environment Variable

Add your public key to Vercel environment variables:

```bash
TESLA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...your-key-here...
-----END PUBLIC KEY-----"
```

**Important:** Include the entire PEM format including the header/footer lines.

For local development, add to `.env.local`:
```bash
TESLA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...your key...
-----END PUBLIC KEY-----"
```

---

## Step 3: Verify Endpoint

Once deployed, verify the endpoint is accessible:

```bash
curl https://your-domain.vercel.app/.well-known/appspecific/com.tesla.3p.public-key.pem
```

You should see your public key returned in PEM format.

---

## Step 4: Register with Tesla Fleet API

### Get Your Access Token

After completing Tesla OAuth in your app, you'll have an access token. You need to use this for registration.

### Make Registration Call

```bash
curl -X POST https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "your-domain.vercel.app"
  }'
```

**Replace:**
- `YOUR_ACCESS_TOKEN` - The access token from Tesla OAuth
- `your-domain.vercel.app` - Your actual Vercel deployment URL

### Expected Response

Success response:
```json
{
  "response": {
    "public_key": "...",
    "domain": "your-domain.vercel.app"
  }
}
```

Error responses:
- **412**: Public key not accessible or invalid
- **400**: Domain mismatch with allowed_origins
- **401**: Invalid access token

---

## Step 5: Update Allowed Origins

In your Tesla Developer Portal (https://developer.tesla.com):

1. Go to your application settings
2. Find "Allowed Origins"
3. Add your Vercel domain: `https://your-domain.vercel.app`
4. Make sure it matches the domain you're registering

---

## Implementation Details

### Our Endpoint

Location: `api/src/modules/well-known/well-known.controller.ts`

The endpoint:
- Serves the public key from `TESLA_PUBLIC_KEY` environment variable
- Returns PEM format with correct content type
- Public access (no authentication required)

### How It Works

1. Tesla makes a request to `https://your-domain/.well-known/appspecific/com.tesla.3p.public-key.pem`
2. Our controller reads `TESLA_PUBLIC_KEY` from environment
3. Returns the PEM-encoded public key
4. Tesla validates and stores it for your account

---

## Troubleshooting

### "Public key not found" error
- Verify `TESLA_PUBLIC_KEY` is set in environment variables
- Check the endpoint is accessible: `curl https://your-domain/.well-known/appspecific/com.tesla.3p.public-key.pem`
- Ensure the key includes `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`

### "Domain mismatch" error
- The domain in registration request must match an allowed_origin in Tesla Developer Portal
- Check for `www` prefix mismatches (e.g., `www.domain.com` vs `domain.com`)

### "Invalid token" error
- The access token might have expired (they last ~8 hours)
- Get a fresh token by going through Tesla OAuth again
- Use the cached token immediately after OAuth completes

---

## Testing Registration Status

You can verify registration worked by trying to access Tesla API:

```bash
curl https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

If registered successfully, you'll get a list of vehicles (or empty array if no vehicles).

If not registered, you'll get:
```json
{
  "error": "Account must be registered in the current region..."
}
```

---

## Environment Variables Summary

After completing this setup, you should have:

```bash
# Tesla OAuth
TESLA_CLIENT_ID=your-client-id
TESLA_CLIENT_SECRET=your-client-secret

# Tesla Fleet API Registration (NEW)
TESLA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...your public key...
-----END PUBLIC KEY-----"

# OPTIONAL: Store private key for vehicle commands (future use)
# TESLA_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----..."
```

---

## Next Steps After Registration

Once registered:
1. ✅ Your dashboard will immediately start showing vehicle data
2. ✅ Powerwall/Solar data will be accessible
3. ✅ You can implement vehicle commands (lock, climate, etc.)

Registration is permanent for your application - you only need to do it once!
