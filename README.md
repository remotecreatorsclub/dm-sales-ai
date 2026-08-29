# DM Sales AI — v0.1

Eine Cloudflare-basierte Web-App/SaaS-Basis für einen Instagram AI Sales Agent.

## Was bereits gebaut ist
- Login/Demo-Gate
- Dashboard mit Sales-Funnel und Hot Leads
- Inbox mit Conversation-Ansicht
- Lead Intelligence: Stage, Painpoint, Ziel, Budget, Einwand, Score
- Human Takeover / AI Pause
- AI-Agent-Konfiguration
- Automationen-Bereich
- Analytics
- Integrationen
- Billing mit Starter/Pro
- Cloudflare Worker API
- D1 Multi-Tenant-Schema
- Instagram Business Login OAuth Start + Callback
- Meta Webhook Verify + Webhook Receiver
- Inbound DM → Lead → Conversation → Message
- OpenAI Responses API Sales-Turn mit strukturiertem Output
- Automatische Lead-/Stage-Aktualisierung
- Instagram Send API für AI- und manuelle Antworten
- AES-GCM-Verschlüsselung für Instagram Access Tokens

## Stack
- React + Vite
- Cloudflare Vite Plugin
- Cloudflare Workers
- Cloudflare D1
- OpenAI Responses API
- Meta Instagram API with Instagram Login

## Lokal starten
```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Ohne Secrets läuft die Web-App im Demo-Modus.

## D1 aktivieren
```bash
npx wrangler d1 create dm-sales-ai
```
Danach die ausgegebene Bindung als `DB` in `wrangler.jsonc` eintragen und den kommentierten D1-Beispielblock ersetzen. Anschließend:
```bash
npx wrangler d1 migrations apply dm-sales-ai --local
npx wrangler d1 migrations apply dm-sales-ai --remote
```

## Secrets / Variablen
Siehe `.dev.vars.example`. Für Produktion Secrets mit Wrangler setzen, z. B.:
```bash
npx wrangler secret put META_APP_SECRET
npx wrangler secret put TOKEN_ENCRYPTION_KEY
npx wrangler secret put OPENAI_API_KEY
```
`TOKEN_ENCRYPTION_KEY` muss aus 32 zufälligen Bytes bestehen und Base64-codiert sein:
```bash
openssl rand -base64 32
```

## Meta Callback / Webhook
OAuth Callback:
`https://DEINE-DOMAIN/api/meta/oauth/callback`

Webhook:
`https://DEINE-DOMAIN/api/meta/webhook`

Benötigte Instagram-Berechtigungen im aktuellen Build:
- `instagram_business_basic`
- `instagram_business_manage_messages`
- `instagram_business_manage_comments`

## AI
Standardmodell im Beispiel: `gpt-5.6-luna`. Der Modellname ist über `OPENAI_MODEL` austauschbar. Responses werden mit `store:false` angefordert.

## Deploy
```bash
npm run deploy
```

## Wichtig für v0.2
Die App verwendet aktuell einen Demo-Workspace (`org_demo`) als Übergangsschicht. Der nächste Produktionsschritt ist echte Benutzer-/Session-Authentifizierung und saubere Organisation-Zuordnung beim OAuth-State. Das Datenmodell dafür ist bereits vorhanden.
