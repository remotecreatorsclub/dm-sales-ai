# DM Sales AI

DM Sales AI ist eine Cloudflare-basierte SaaS-Anwendung für AI-gestützte Instagram-DM-Verkaufsgespräche.

## Produktionsfunktionen

- Registrierung und Login mit sicheren HttpOnly/Secure Sessions
- E-Mail-Verifizierung und Passwort-Reset
- Multi-Tenant-Workspaces
- PayPal Starter-/Pro-Abonnements mit Webhook-Synchronisierung
- Serverseitiger Subscription Gate
- AI Sales Agent mit Knowledge Base, Sales-Regeln und Guardrails
- Test-Chat für den konfigurierten Agent
- Instagram OAuth, Webhook Receiver und Send API
- Inbox, Leads und Lead Intelligence
- Human Takeover / AI Pause
- Lead Memory und Style Profile
- Echtes Dashboard und Analytics auf Workspace-Daten
- AES-GCM-Verschlüsselung für Instagram Access Tokens
- Monatliche Planlimits für neue AI-Konversationen
- Instagram-Account-Limits nach Plan

## Stack

- React + Vite
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Workers AI
- Meta Instagram API
- PayPal Subscriptions
- Resend für transaktionale E-Mails

## Benötigte Runtime-Secrets / Variablen

### Meta
- `META_APP_ID`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN`
- `TOKEN_ENCRYPTION_KEY`
- optional `META_REDIRECT_URI`
- optional `META_API_VERSION`

### PayPal
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_STARTER_PLAN_ID`
- `PAYPAL_PRO_PLAN_ID`
- `PAYPAL_MODE=live`
- `BILLING_ENFORCED=true`
- optional `BILLING_ADMIN_EMAILS`

### E-Mail
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_URL`
- `EMAIL_VERIFICATION_ENFORCED=true`

### AI / Pacing
- AI Binding: `AI`
- `AI_MODEL`
- `HUMAN_REPLY_MIN_MS`
- `HUMAN_REPLY_MAX_MS`
- `HUMAN_BURST_WAIT_MIN_MS`
- `HUMAN_BURST_WAIT_MAX_MS`
- `INSTAGRAM_TYPING_ACTIONS`

## Datenbank

Remote-Migrationen:

```bash
npx wrangler d1 migrations apply dm-sales-ai --remote
```

## Build prüfen

```bash
npm install
npm run typecheck
npm run build
```

## Deploy

```bash
npm run deploy
```

## Produktions-Check vor öffentlichem Launch

1. `/api/health` zeigt `database: true`, `ai: true`, `paypal.configured: true`.
2. `meta: true`, bevor Kunden Instagram verbinden.
3. `emailAuth.configured: true` und erst dann `EMAIL_VERIFICATION_ENFORCED=true`.
4. Starter- und Pro-Checkout mit einem externen PayPal-Konto testen.
5. Instagram OAuth, eingehende DM, AI-Antwort und Human Takeover Ende-zu-Ende testen.
