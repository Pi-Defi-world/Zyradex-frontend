# Demo App Frontend

A Next.js 15 application that consumes the Pi DEX backend to offer portfolio tracking, liquidity management, and swap tooling.

## Prerequisites

- Node.js 18+
- npm 10+
- Running instance of the Pi DEX backend (see `backend.md`)

## Installation

```bash
pnpm install
```

This project relies on the following environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

```bash
pnpm run dev
```

## Admin Authentication

Administrative actions (minting tokens, managing fees, etc.) require a backend JWT. Authenticate via the **Admin Access** card in `Settings`:

1. Launch the app within Pi Browser (or with the Pi SDK available).
2. Click **Sign in as admin**. The Pi SDK prompts for authentication.
3. The frontend exchanges the Pi access token with `/v1/users/signin` and stores the returned JWT.
4. Admin-only hooks automatically attach the bearer token using `setAuthToken`.

To revoke access, use **Sign out of admin** in the same card.

## Account Import

Profile → Account Service allows a user to call `/v1/account/import` by providing either a secret key or mnemonic. The backend responds with the derived public key, which the frontend stores locally (no secrets are persisted). This is the recommended way to register the wallet used across dashboard, swap, and liquidity tools.

## QA Checklist

Manual checks to verify the integration:

- **Dashboard** loads live balances and operations for the authenticated wallet (`/v1/account/*`).
- **Swap** quotes and executes against `/v1/swap` endpoints.
- **Liquidity** lists pools, allows deposit/withdraw via `/v1/liquidity-pools/*`.
- **Mint Token** requires admin login, then POSTs to `/v1/tokens/mint`.
- **Trustline** submits to `/v1/tokens/trustline`.
- **Settings → Admin Access** signs in/out and persists session tokens.

After significant changes run the lint suite:

```bash
npm run lint
```

## Notable Dependencies

- `axios` – HTTP client for API modules.
- `jwt-decode` – Validates admin JWT expiry for session management.
- `lucide-react` – Icon set used across the UI.
