# Authentication System

## Overview

Tessie Stats uses a **password-based authentication system** to protect the application. All routes except the login page and OAuth callback require authentication.

## How It Works

1. **Login**: User enters password on `/login` page
2. **JWT Issued**: Backend validates password and returns JWT token
3. **Token Storage**: Frontend stores JWT in localStorage
4. **Auto-Inject**: All API requests automatically include JWT in Authorization header
5. **Protected Routes**: Frontend redirects to login if no valid JWT exists
6. **Auto-Logout**: 401 responses automatically clear token and redirect to login

## Setup

### 1. Set App Password

Add `APP_PASSWORD` to your environment variables:

```bash
# .env.local (or Vercel Environment Variables)
APP_PASSWORD=your-secure-password-here
```

**Important:** Use a strong, unique password. This protects your entire dashboard.

### 2. JWT Secret (Already Configured)

The `JWT_SECRET` should already be set from the initial setup:

```bash
JWT_SECRET=your-jwt-secret-key
```

## Usage

### First Time Access

1. Navigate to `http://localhost:3000` (or your deployed URL)
2. You'll be automatically redirected to `/login`
3. Enter the password you set in `APP_PASSWORD`
4. Click "Login"
5. You'll be redirected to the dashboard

### Logout

1. Go to **Settings** page
2. Scroll to **Account Security** card
3. Click **Log Out**
4. You'll be redirected to login page

### Connecting Tesla Account (After Login)

1. Go to **Settings** page
2. Find **Tesla Authentication** card
3. Click **Connect Tesla Account**
4. Log in with your Tesla credentials
5. Authorize the app
6. You'll be redirected back to Settings

## Security Features

- ✅ Password-protected access to entire application
- ✅ JWT-based session management
- ✅ Automatic token injection on all API calls
- ✅ Auto-logout on token expiration (401 responses)
- ✅ Protected routes with redirect to login
- ✅ Tesla refresh token encrypted with AES-256-GCM

## API Endpoints

### Public Endpoints (No Auth Required)
- `POST /api/auth/login` - Login with password
- `GET /api/auth/callback` - OAuth callback (Tesla redirect)

### Protected Endpoints (JWT Required)
- `GET /api/auth/url` - Get Tesla OAuth URL
- `GET /api/auth/status` - Check Tesla token status
- `DELETE /api/auth/token` - Disconnect Tesla account
- All other API endpoints (vehicles, energy, etc.)

## Frontend Components

### Login Page
- Location: `web/src/pages/login.page.tsx`
- Route: `/login`
- Public access (no auth required)

### Protected Routes
All routes except `/login` are wrapped in `<ProtectedRoute>` which:
1. Checks if JWT exists in localStorage
2. Redirects to `/login` if not authenticated
3. Allows access if authenticated

### Auth Service
Location: `web/src/services/auth.service.ts`

Methods:
- `login(password)` - Login and store JWT
- `logout()` - Clear JWT and redirect
- `getToken()` - Get stored JWT
- `isLoggedIn()` - Check if user has valid JWT
- `getStatus()` - Get Tesla connection status
- `getAuthUrl()` - Get Tesla OAuth URL
- `deleteToken()` - Disconnect Tesla account

## Backend Components

### Auth Service
Location: `api/src/modules/auth/auth.service.ts`

Key methods:
- `login(password)` - Validate password and issue JWT
- `getAuthorizationUrl()` - Generate Tesla OAuth URL
- `handleCallback(code)` - Exchange OAuth code for tokens
- `getAuthStatus()` - Check Tesla token validity
- `deleteToken()` - Remove Tesla credentials

### JWT Strategy
Location: `api/src/modules/auth/strategies/jwt.strategy.ts`

- Validates JWT on protected endpoints
- Extracts token from `Authorization: Bearer <token>` header
- Returns user payload on successful validation

### JWT Auth Guard
Location: `api/src/modules/auth/guards/jwt-auth.guard.ts`

- Applied to protected endpoints with `@UseGuards(JwtAuthGuard)`
- Automatically validates JWT before allowing access
- Returns 401 if JWT is invalid or missing

## Environment Variables Summary

```bash
# Required for authentication
APP_PASSWORD=your-secure-password        # App login password
JWT_SECRET=your-jwt-secret-key           # JWT signing key

# Required for Tesla OAuth
TESLA_CLIENT_ID=your-client-id
TESLA_CLIENT_SECRET=your-client-secret

# Required for encryption
ENCRYPTION_KEY=your-32-byte-hex-key      # For encrypting Tesla tokens

# URLs
API_BASE_URL=http://localhost:3001       # Backend URL
FRONTEND_URL=http://localhost:3000       # Frontend URL

# Database
DATABASE_URL=postgresql://...            # Postgres connection string
```

## Troubleshooting

### Can't log in
- Check `APP_PASSWORD` is set in environment variables
- Verify you're using the correct password
- Check browser console for errors

### Redirected to login after logging in
- Check JWT is being stored in localStorage
- Verify `JWT_SECRET` is set correctly
- Check browser console for 401 errors

### Tesla OAuth fails
- Verify `TESLA_CLIENT_ID` and `TESLA_CLIENT_SECRET` are correct
- Check redirect URL matches your Tesla app configuration
- Ensure `API_BASE_URL` and `FRONTEND_URL` are correct

## Testing

Run authentication tests:

```bash
cd api
npm test -- --testPathPattern="auth\.(service|controller)\.spec\.ts"
```

All 20 tests should pass.
