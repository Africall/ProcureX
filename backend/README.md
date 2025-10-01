# ProcureX Backend

This is a small Express + SQLite backend intended for enterprise-like features: server-side pagination, search, sort, filter, and validation.

Run (from `backend` folder):

```powershell
npm install
npm run dev
```

The API will be available at `http://localhost:4001/api/items`.

Google OAuth setup
1. Go to Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth 2.0 Client ID.
2. Set the Authorized redirect URI to `http://localhost:4001/auth/google/callback`.
3. Put the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (see `.env.example`).

When OAuth completes the backend will set an HTTP-only cookie (`procurex_token`) with a JWT. The frontend should then be able to access protected routes.

## Tests

Run the backend integration tests (uses Vitest + Supertest):

```powershell
npm test
```

These tests run the Express app in-memory (no real network server) and validate security flows like CSRF protection, password changes, and session revocation.

## Profile endpoints

- GET `/api/auth/profile` (auth required): returns `{ id, displayName, email }` for the current user.
- PUT `/api/auth/profile` (auth + CSRF required): accepts `{ displayName?: string, email?: string }` and updates profile.
	- Validates email format and uniqueness.
	- Updates `updatedAt` timestamp.
