# CookiePulse

Lightweight **Cookie Chain** (SVM) cApp for the [Superteam Cookie Chain bounty](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app).

Connect **Nightly**, view your address + native **COOK** balance, send a memo + tiny self-check transaction, watch confirmations/errors via toasts, and browse recent signatures (`getSignaturesForAddress`).

## Features

- Vite + React + TypeScript
- `@solana/wallet-adapter` with **Nightly** (`@solana/wallet-adapter-nightly`)
- Cookie Chain RPC: `https://rpc.cookiescan.io`
- Balance via `getBalance`
- **Send memo / self-check tx** (SPL Memo + 1-lamport self-transfer)
- Confirmation polling + error toasts
- Activity panel via `getSignaturesForAddress`
- Optional Nightly `changeNetwork` to Cookie Chain genesis hash

## Prerequisites

1. **Node.js** 20+ (22+ recommended)
2. **Nightly** browser extension — [nightly.app](https://nightly.app)
3. Point Nightly at Cookie Chain:
   - RPC: `https://rpc.cookiescan.io`
   - WebSocket (if prompted): `wss://rpc.cookiescan.io`
   - Genesis hash: `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`
4. A tiny amount of native COOK for fees

Nightly also supports programmatic network switch via `window.nightly.solana.changeNetwork` — CookiePulse calls this before sending a pulse tx when the extension exposes it.

## Setup

```bash
git clone https://github.com/RobertKodes/cookiepulse.git
cd cookiepulse
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), click **Select Wallet** / connect, choose **Nightly**.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Local Vite dev server    |
| `npm run build`   | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |

## Network / explorer

| Resource   | URL |
| ---------- | --- |
| RPC        | https://rpc.cookiescan.io |
| API (DAS)  | https://api.cookiescan.io |
| Explorer   | https://cookiescan.io |
| Docs       | https://docs.cookiechain.wtf |
| Website    | https://www.cookiechain.wtf |

## Deploy (Vercel / static)

This is a static SPA (`vite build` → `dist`).

### Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

Or CLI:

```bash
npm i -g vercel
vercel --prod
```

### Any static host (Netlify, Cloudflare Pages, GitHub Pages)

Upload / point at `dist` after `npm run build`. For SPA routing (single index), ensure fallback to `index.html` if you add client routes later (currently not required).

### Env

No secrets required. Optional override:

```bash
# .env (Vite)
VITE_COOKIE_RPC=https://rpc.cookiescan.io
```

(RPC is hardcoded to Cookie Chain by default in `src/config.ts`.)

## Nightly notes

- Prefer the **Nightly** entry in the wallet modal (adapter is registered explicitly).
- Nightly also registers via **Wallet Standard**, so it may appear even without the legacy adapter.
- If the wrong SVM network is selected in the extension, add custom RPC `https://rpc.cookiescan.io` or approve CookiePulse’s network-switch prompt.
- Other Solana-compatible wallets may connect, but **Nightly is required** for this bounty checklist.

## Project layout

```
src/
  config.ts              # RPC, genesis, explorer, memo program
  WalletContext.tsx      # ConnectionProvider + Nightly adapter
  components/Dashboard.tsx
  components/ActivityPanel.tsx
  components/Toast.tsx
```

## License

MIT
