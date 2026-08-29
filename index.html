interface Env {
  DB?: D1Database;
  AI?: Ai;
  DEMO_MODE?: string;
  AI_MODEL?: string;
  META_VERIFY_TOKEN?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  META_REDIRECT_URI?: string;
  META_API_VERSION?: string;
  TOKEN_ENCRYPTION_KEY?: string;
}

type D1Row = Record<string, any>;

type SalesTurn = {
  reply: string;
  stage: 'discovery' | 'painpoint' | 'goal' | 'qualification' | 'solution' | 'objection' | 'close';
  temperature: 'cold' | 'warm' | 'hot';
  score: number;
  goal: string;
  pain_point: string;
  experience: string;
  budget: string;
  objection: string;
  summary: string;
};

const API_VERSION_DEFAULT = 'v26.0';
const AI_MODEL_DEFAULT = '@cf/google/gemma-4-26b-a4b-it';
const DEMO_ORG = 'org_demo';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SALES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: { type: 'string' },
    stage: {
      type: 'string',
      enum: ['discovery', 'painpoint', 'goal', 'qualification', 'solution', 'objection', 'close'],
    },
    temperature: { type: 'string', enum: ['cold', 'warm', 'hot'] },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    goal: { type: 'string' },
    pain_point: { type: 'string' },
    experience: { type: 'string' },
    budget: { type: 'string' },
    objection: { type: 'string' },
    summary: { type: 'string' },
  },
  required: [
    'reply',
    'stage',
    'temperature',
    'score',
    'goal',
    'pain_point',
    'experience',
    'budget',
    'objection',
    'summary',
  ],
} as const;

const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });

const demoBootstrap = {
  organization: { id: DEMO_ORG, name: 'Demo Workspace', plan: 'pro' },
  instagram: { connected: false, username: '@deinaccount', status: 'Demo-Modus' },
  metrics: {
    conversationsToday: 47,
    qualifiedLeads: 18,
    hotLeads: 9,
    checkoutSent: 6,
    conversions: 2,
  },
  conversations: [
    {
      id: 'conv_1',
      name: 'Sabrina',
      username: '@sabrina.moves',
      avatar: 'S',
      score: 84,
      temperature: 'hot',
      stage: 'objection',
      aiMode: 'active',
      lastMessage: 'Ich habe nur Angst, dass ich das technisch nicht hinbekomme.',
      time: '09:02',
      goal: 'Nebenberuflich ein Online-Business starten',
      painPoint: 'Überfordert von Technik und den ersten Schritten',
      experience: 'Anfängerin',
      budget: '1.000–2.000 €',
      objection: 'Angst vor Technik',
      messages: [
        {
          id: 'm1',
          from: 'lead',
          body: 'Hi, ich hab dein Reel gesehen. Wie funktioniert das genau?',
          time: '08:51',
        },
        {
          id: 'm2',
          from: 'ai',
          body: 'Hey Sabrina 👋 Kommt ein bisschen darauf an, wo du gerade stehst. Hast du schon etwas online aufgebaut oder würdest du komplett bei null starten?',
          time: '08:52',
        },
        {
          id: 'm3',
          from: 'lead',
          body: 'Komplett bei null. Ich will neben meinem Job etwas aufbauen.',
          time: '08:55',
        },
        {
          id: 'm4',
          from: 'ai',
          body: 'Verstanden. Was hält dich aktuell am meisten davon ab, wirklich anzufangen?',
          time: '08:56',
        },
        {
          id: 'm5',
          from: 'lead',
          body: 'Ich weiß nicht womit und Technik ist gar nicht mein Ding.',
          time: '08:58',
        },
        {
          id: 'm6',
          from: 'ai',
          body: 'Dann ist das Hauptproblem gerade weniger Motivation, sondern dass dir ein klarer Weg fehlt und du Angst hast, an der Technik hängen zu bleiben – richtig?',
          time: '08:59',
        },
        {
          id: 'm7',
          from: 'lead',
          body: 'Ja genau. Ich habe nur Angst, dass ich das technisch nicht hinbekomme.',
          time: '09:02',
        },
      ],
    },
    {
      id: 'conv_2',
      name: 'Marvin',
      username: '@marvin.builds',
      avatar: 'M',
      score: 67,
      temperature: 'warm',
      stage: 'qualification',
      aiMode: 'active',
      lastMessage: 'Mein Ziel wären erstmal 1.000 € zusätzlich.',
      time: '08:44',
      goal: '1.000 € zusätzlich',
      painPoint: 'Keine planbare Leadquelle',
      experience: 'Hat bereits Angebot',
      budget: '500–1.000 €',
      objection: 'Noch offen',
      messages: [],
    },
    {
      id: 'conv_3',
      name: 'Laura',
      username: '@laura.digital',
      avatar: 'L',
      score: 39,
      temperature: 'cold',
      stage: 'discovery',
      aiMode: 'paused',
      lastMessage: 'Ich schaue mich erstmal nur um 😊',
      time: 'Gestern',
      goal: 'Noch unklar',
      painPoint: 'Noch unklar',
      experience: 'Unbekannt',
      budget: 'Unbekannt',
      objection: 'Kein akuter Bedarf',
      messages: [],
    },
  ],
  agent: {
    name: 'Sales Agent',
    active: true,
    offerName: 'Dein Hauptangebot',
    price: '1.197 €',
    audience: 'Menschen, die ein digitales Business aufbauen möchten',
    painPoints:
      'Kein klarer Startpunkt\nTechnik-Überforderung\nFehlende Strategie\nAngst, Geld zu verschwenden',
    outcomes:
      'Klarer Schritt-für-Schritt-Weg\nEigenes digitales Angebot\nPlanbarer Verkaufsprozess',
    objections: 'Zu teuer\nKeine Zeit\nZu technisch\nAngst, dass es nicht funktioniert',
    checkoutUrl: 'https://example.com/checkout',
    bookingUrl: 'https://example.com/call',
    tone: 'Natürlich, direkt, freundlich. Kurze Nachrichten. Nie drängen.',
  },
};

function apiVersion(env: Env) {
  return env.META_API_VERSION || API_VERSION_DEFAULT;
}

function aiModel(env: Env) {
  return env.AI_MODEL || AI_MODEL_DEFAULT;
}

function redirectUri(request: Request, env: Env) {
  return env.META_REDIRECT_URI || `${new URL(request.url).origin}/api/meta/oauth/callback`;
}

function cookie(request: Request, name: string) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

function b64(bytes: Uint8Array) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function unb64(value: string) {
  const raw = atob(value);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function encryptionKey(base64Key: string) {
  const bytes = unb64(base64Key);
  if (bytes.byteLength !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY muss Base64-codiert genau 32 Bytes enthalten.');
  }
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptToken(token: string, keyB64: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(keyB64);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(token),
  );
  return `v1.${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}

async function decryptToken(value: string, keyB64: string) {
  const [version, ivB64, cipherB64] = value.split('.');
  if (version !== 'v1' || !ivB64 || !cipherB64) {
    throw new Error('Ungültiges Tokenformat.');
  }
  const key = await encryptionKey(keyB64);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(ivB64) },
    key,
    unb64(cipherB64),
  );
  return decoder.decode(plain);
}

async function bootstrap(env: Env) {
  const data = structuredClone(demoBootstrap) as any;

  if (!env.DB) return data;

  const account = await env.DB
    .prepare(
      'SELECT username,status FROM instagram_accounts WHERE organization_id=? ORDER BY connected_at DESC LIMIT 1',
    )
    .bind(DEMO_ORG)
    .first<D1Row>();

  if (account) {
    data.instagram = {
      connected: account.status === 'connected',
      username: `@${account.username}`,
      status: account.status,
    };
  }

  const agent = await env.DB
    .prepare(
      'SELECT * FROM ai_agents WHERE organization_id=? ORDER BY updated_at DESC LIMIT 1',
    )
    .bind(DEMO_ORG)
    .first<D1Row>();

  if (agent) {
    data.agent = {
      name: agent.name,
      active: Boolean(agent.active),
      offerName: agent.offer_name || '',
      price: agent.price_text || '',
      audience: agent.audience || '',
      painPoints: agent.pain_points || '',
      outcomes: agent.outcomes || '',
      objections: agent.objections || '',
      checkoutUrl: agent.checkout_url || '',
      bookingUrl: agent.booking_url || '',
      tone: agent.tone || '',
    };
  }

  return data;
}

async function saveAgent(env: Env, body: Record<string, unknown>) {
  if (!env.DB) return;

  await env.DB
    .prepare("INSERT OR IGNORE INTO organizations (id,name,slug,plan) VALUES (?,?,?,'pro')")
    .bind(DEMO_ORG, 'Demo Workspace', 'demo-workspace')
    .run();

  const existing = await env.DB
    .prepare('SELECT id FROM ai_agents WHERE organization_id=? LIMIT 1')
    .bind(DEMO_ORG)
    .first<D1Row>();

  const values = [
    String(body.name || 'Sales Agent'),
    body.active === false ? 0 : 1,
    String(body.offerName || ''),
    String(body.price || ''),
    String(body.audience || ''),
    String(body.painPoints || ''),
    String(body.outcomes || ''),
    String(body.objections || ''),
    String(body.checkoutUrl || ''),
    String(body.bookingUrl || ''),
    String(body.tone || 'Natürlich, kurz, menschlich'),
  ];

  if (existing) {
    await env.DB
      .prepare(
        'UPDATE ai_agents SET name=?,active=?,offer_name=?,price_text=?,audience=?,pain_points=?,outcomes=?,objections=?,checkout_url=?,booking_url=?,tone=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      )
      .bind(...values, existing.id)
      .run();
  } else {
    await env.DB
      .prepare(
        'INSERT INTO ai_agents (id,organization_id,name,active,offer_name,price_text,audience,pain_points,outcomes,objections,checkout_url,booking_url,tone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(crypto.randomUUID(), DEMO_ORG, ...values)
      .run();
  }
}

function systemPrompt(agent: D1Row) {
  return `Du bist ein KI-Sales-Agent für Instagram-DMs.

Deine Aufgabe ist NICHT, Menschen sofort zu pitchen. Du führst ein natürliches Gespräch, verstehst zuerst die Situation, erkennst echte Bedürfnisse und prüfst den Fit. Erst dann darfst du eine passende Lösung oder einen CTA anbieten.

ANGEBOT
Name: ${agent.offer_name || agent.offerName || ''}
Preis: ${agent.price_text || agent.price || ''}
Zielgruppe: ${agent.audience || ''}
Painpoints: ${agent.pain_points || agent.painPoints || ''}
Gewünschte Ergebnisse: ${agent.outcomes || ''}
Typische Einwände: ${agent.objections || ''}
Checkout: ${agent.checkout_url || agent.checkoutUrl || ''}
Termin: ${agent.booking_url || agent.bookingUrl || ''}
Tonalität: ${agent.tone || 'Natürlich, freundlich, direkt und kurz.'}

SALES-STUFEN
1. discovery: Situation verstehen
2. painpoint: Problem konkretisieren
3. goal: Ziel verstehen
4. qualification: Fit, Erfahrung und Rahmen verstehen
5. solution: passende Lösung erklären
6. objection: echten Einwand behandeln
7. close: nur bei ausreichendem Fit zum nächsten Schritt führen

REGELN
- Meist 1 bis 4 kurze Sätze wie in einer echten Instagram-DM.
- Höchstens eine klare Frage pro Nachricht.
- Nicht dieselbe Frage mehrfach stellen, wenn sie schon beantwortet wurde.
- Keine erfundenen Fakten, Garantien oder Ergebnisse.
- Keine falsche Knappheit, Drohungen, Schuldgefühle oder Angst-Druck.
- Sensible persönliche Eigenschaften niemals ableiten oder für den Verkauf verwenden.
- Painpoints dienen dazu, Relevanz zu verstehen, nicht Schwächen auszunutzen.
- Wenn kein Fit erkennbar ist, nicht pushen.
- Checkout oder Termin nur senden, wenn der Lead ausreichend qualifiziert ist oder ausdrücklich danach fragt.
- Der Score ist eine interne Fit-/Kaufbereitschaftsschätzung, keine Gewissheit.
- Unbekannte Daten mit "Unklar" ausgeben.

Du musst neben der Antwort auch den aktuellen Lead-Zustand strukturiert einschätzen.`;
}

function extractWorkersAIValue(result: any): unknown {
  if (result == null) return null;

  if (result.response !== undefined) return result.response;

  const content = result?.choices?.[0]?.message?.content;
  if (content !== undefined) return content;

  if (typeof result === 'string') return result;

  return result;
}

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseSalesTurn(value: unknown): SalesTurn | null {
  try {
    const candidate =
      typeof value === 'string' ? JSON.parse(stripCodeFence(value)) : value;

    if (!candidate || typeof candidate !== 'object') return null;

    const row = candidate as Record<string, unknown>;
    const allowedStages = [
      'discovery',
      'painpoint',
      'goal',
      'qualification',
      'solution',
      'objection',
      'close',
    ];
    const allowedTemps = ['cold', 'warm', 'hot'];

    if (typeof row.reply !== 'string' || !row.reply.trim()) return null;
    if (!allowedStages.includes(String(row.stage))) return null;
    if (!allowedTemps.includes(String(row.temperature))) return null;

    const numericScore = Math.max(0, Math.min(100, Number(row.score || 0)));

    return {
      reply: row.reply.trim(),
      stage: String(row.stage) as SalesTurn['stage'],
      temperature: String(row.temperature) as SalesTurn['temperature'],
      score: Math.round(numericScore),
      goal: String(row.goal || 'Unklar'),
      pain_point: String(row.pain_point || 'Unklar'),
      experience: String(row.experience || 'Unklar'),
      budget: String(row.budget || 'Unklar'),
      objection: String(row.objection || 'Unklar'),
      summary: String(row.summary || ''),
    };
  } catch {
    return null;
  }
}

async function runWorkersAI(
  env: Env,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<SalesTurn | null> {
  if (!env.AI) return null;

  const model = aiModel(env);

  try {
    const result: any = await env.AI.run(
      model as any,
      {
        messages,
        temperature: 0.35,
        max_completion_tokens: 650,
        response_format: {
          type: 'json_schema',
          json_schema: SALES_SCHEMA,
        },
      } as any,
    );

    const parsed = parseSalesTurn(extractWorkersAIValue(result));
    if (parsed) return parsed;
  } catch (error) {
    console.warn('Workers AI JSON mode failed, retrying with JSON instruction.', error);
  }

  try {
    const fallbackMessages = [
      ...messages,
      {
        role: 'system' as const,
        content:
          'Antworte jetzt ausschließlich mit einem gültigen JSON-Objekt ohne Markdown. Felder: reply, stage, temperature, score, goal, pain_point, experience, budget, objection, summary. stage muss discovery|painpoint|goal|qualification|solution|objection|close sein. temperature muss cold|warm|hot sein. score muss 0 bis 100 sein.',
      },
    ];

    const result: any = await env.AI.run(
      model as any,
      {
        messages: fallbackMessages,
        temperature: 0.25,
        max_completion_tokens: 650,
      } as any,
    );

    return parseSalesTurn(extractWorkersAIValue(result));
  } catch (error) {
    console.error('Workers AI failed:', error);
    return null;
  }
}

async function generateSalesTurn(
  env: Env,
  agent: D1Row,
  _lead: D1Row,
  history: D1Row[],
): Promise<SalesTurn | null> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt(agent) },
  ];

  for (const message of history.slice(-16)) {
    messages.push({
      role: message.direction === 'inbound' ? 'user' : 'assistant',
      content: String(message.body || ''),
    });
  }

  return runWorkersAI(env, messages);
}

async function generateDemoDraft(
  env: Env,
  body: { stage?: string; painPoint?: string; objection?: string; message?: string },
) {
  const agent = (demoBootstrap.agent || {}) as D1Row;
  const currentMessage =
    body.message ||
    `Mein aktueller Painpoint ist: ${body.painPoint || 'Unklar'}. Mein Einwand ist: ${body.objection || 'Unklar'}.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt(agent) },
    {
      role: 'system',
      content: `Die aktuelle Stage ist ungefähr: ${body.stage || 'discovery'}. Erzeuge die nächste sinnvolle DM-Antwort.`,
    },
    { role: 'user', content: currentMessage },
  ];

  return runWorkersAI(env, messages);
}

function oauthStart(request: Request, env: Env) {
  if (!env.META_APP_ID) {
    return json(
      { error: 'META_APP_ID fehlt noch. Trage die Meta-App-ID als Worker-Variable ein.' },
      { status: 400 },
    );
  }

  const state = crypto.randomUUID().replaceAll('-', '');
  const params = new URLSearchParams({
    force_reauth: 'true',
    client_id: env.META_APP_ID,
    redirect_uri: redirectUri(request, env),
    response_type: 'code',
    state,
    scope:
      'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
  });

  return json(
    { url: `https://www.instagram.com/oauth/authorize?${params}` },
    {
      headers: {
        'Set-Cookie': `ig_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      },
    },
  );
}

async function oauthCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state || state !== cookie(request, 'ig_oauth_state')) {
    return new Response('Ungültiger OAuth-State.', { status: 400 });
  }

  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    return new Response('Meta App-ID/Secret fehlen.', { status: 500 });
  }

  const form = new FormData();
  form.set('client_id', env.META_APP_ID);
  form.set('client_secret', env.META_APP_SECRET);
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', redirectUri(request, env));
  form.set('code', code);

  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: form,
  });

  if (!shortRes.ok) {
    return new Response(`Instagram Token Exchange fehlgeschlagen: ${await shortRes.text()}`, {
      status: 502,
    });
  }

  const short: any = await shortRes.json();

  const longUrl = new URL('https://graph.instagram.com/access_token');
  longUrl.searchParams.set('grant_type', 'ig_exchange_token');
  longUrl.searchParams.set('client_secret', env.META_APP_SECRET);
  longUrl.searchParams.set('access_token', short.access_token);

  const longRes = await fetch(longUrl);
  if (!longRes.ok) {
    return new Response(`Long-lived Token fehlgeschlagen: ${await longRes.text()}`, {
      status: 502,
    });
  }

  const long: any = await longRes.json();
  const accessToken = long.access_token;

  const profileUrl = new URL(`https://graph.instagram.com/${apiVersion(env)}/me`);
  profileUrl.searchParams.set('fields', 'id,username');
  profileUrl.searchParams.set('access_token', accessToken);

  const profileRes = await fetch(profileUrl);
  if (!profileRes.ok) {
    return new Response(`Instagram Profil konnte nicht geladen werden: ${await profileRes.text()}`, {
      status: 502,
    });
  }

  const profile: any = await profileRes.json();

  if (env.DB) {
    if (!env.TOKEN_ENCRYPTION_KEY) {
      return new Response(
        'TOKEN_ENCRYPTION_KEY fehlt. Access Tokens werden nicht unverschlüsselt gespeichert.',
        { status: 500 },
      );
    }

    const encrypted = await encryptToken(accessToken, env.TOKEN_ENCRYPTION_KEY);
    const expiresAt = new Date(
      Date.now() + Number(long.expires_in || 5184000) * 1000,
    ).toISOString();

    await env.DB
      .prepare("INSERT OR IGNORE INTO organizations (id,name,slug,plan) VALUES (?,?,?,'pro')")
      .bind(DEMO_ORG, 'Demo Workspace', 'demo-workspace')
      .run();

    await env.DB
      .prepare(
        `INSERT INTO instagram_accounts
          (id,organization_id,instagram_user_id,username,access_token_encrypted,token_expires_at,status,connected_at)
         VALUES (?,?,?,?,?,?,'connected',CURRENT_TIMESTAMP)
         ON CONFLICT(organization_id,instagram_user_id)
         DO UPDATE SET
           username=excluded.username,
           access_token_encrypted=excluded.access_token_encrypted,
           token_expires_at=excluded.token_expires_at,
           status='connected',
           connected_at=CURRENT_TIMESTAMP,
           updated_at=CURRENT_TIMESTAMP`,
      )
      .bind(
        crypto.randomUUID(),
        DEMO_ORG,
        String(profile.id),
        String(profile.username || 'instagram'),
        encrypted,
        expiresAt,
      )
      .run();
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/?instagram=connected',
      'Set-Cookie':
        'ig_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}

async function sendInstagramText(
  env: Env,
  encryptedToken: string,
  recipientId: string,
  text: string,
) {
  if (!env.TOKEN_ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY fehlt.');
  }

  const accessToken = await decryptToken(encryptedToken, env.TOKEN_ENCRYPTION_KEY);
  const endpoint = `https://graph.instagram.com/${apiVersion(env)}/me/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    throw new Error(`Instagram Send API: ${response.status} ${await response.text()}`);
  }

  return response.json<any>();
}

async function processInboundMessage(
  env: Env,
  accountId: string,
  senderId: string,
  externalMessageId: string | undefined,
  text: string,
) {
  if (!env.DB || !text.trim()) return;

  const account = await env.DB
    .prepare(
      "SELECT * FROM instagram_accounts WHERE instagram_user_id=? AND status='connected' LIMIT 1",
    )
    .bind(accountId)
    .first<D1Row>();

  if (!account) return;

  await env.DB
    .prepare(
      `INSERT INTO leads
        (id,organization_id,instagram_account_id,external_user_id,last_message_at)
       VALUES (?,?,?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(instagram_account_id,external_user_id)
       DO UPDATE SET last_message_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`,
    )
    .bind(
      crypto.randomUUID(),
      account.organization_id,
      account.id,
      senderId,
    )
    .run();

  const lead = await env.DB
    .prepare(
      'SELECT * FROM leads WHERE instagram_account_id=? AND external_user_id=?',
    )
    .bind(account.id, senderId)
    .first<D1Row>();

  if (!lead) return;

  await env.DB
    .prepare(
      `INSERT INTO conversations
        (id,organization_id,instagram_account_id,lead_id,last_message_at)
       VALUES (?,?,?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(lead_id)
       DO UPDATE SET last_message_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`,
    )
    .bind(
      crypto.randomUUID(),
      account.organization_id,
      account.id,
      lead.id,
    )
    .run();

  const conversation = await env.DB
    .prepare('SELECT * FROM conversations WHERE lead_id=?')
    .bind(lead.id)
    .first<D1Row>();

  if (!conversation) return;

  await env.DB
    .prepare(
      `INSERT OR IGNORE INTO messages
        (id,organization_id,conversation_id,external_message_id,direction,sender_type,body,status)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      account.organization_id,
      conversation.id,
      externalMessageId || null,
      'inbound',
      'lead',
      text,
      'received',
    )
    .run();

  if (conversation.ai_mode === 'paused') return;

  const agent = await env.DB
    .prepare(
      'SELECT * FROM ai_agents WHERE organization_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1',
    )
    .bind(account.organization_id)
    .first<D1Row>();

  if (!agent) return;

  const rows = await env.DB
    .prepare(
      'SELECT direction,sender_type,body,created_at FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 16',
    )
    .bind(conversation.id)
    .all<D1Row>();

  const history = (rows.results || []).reverse();
  const turn = await generateSalesTurn(env, agent, lead, history);

  if (!turn?.reply?.trim()) return;

  await env.DB
    .prepare(
      'UPDATE leads SET stage=?,temperature=?,score=?,goal=?,pain_point=?,experience=?,budget=?,objection=?,summary=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    )
    .bind(
      turn.stage,
      turn.temperature,
      turn.score,
      turn.goal,
      turn.pain_point,
      turn.experience,
      turn.budget,
      turn.objection,
      turn.summary,
      lead.id,
    )
    .run();

  await env.DB
    .prepare(
      'UPDATE conversations SET current_stage=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    )
    .bind(turn.stage, conversation.id)
    .run();

  try {
    const sent = await sendInstagramText(
      env,
      account.access_token_encrypted,
      senderId,
      turn.reply,
    );

    await env.DB
      .prepare(
        `INSERT INTO messages
          (id,organization_id,conversation_id,external_message_id,direction,sender_type,body,status)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind(
        crypto.randomUUID(),
        account.organization_id,
        conversation.id,
        sent?.message_id || null,
        'outbound',
        'ai',
        turn.reply,
        'sent',
      )
      .run();
  } catch (error: any) {
    console.error('Auto send failed:', error?.message || error);
  }
}

async function handleWebhook(request: Request, env: Env) {
  const raw = await request.text();
  let payload: any;

  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ received: true });
  }

  if (env.DB) {
    try {
      await env.DB
        .prepare(
          'INSERT INTO webhook_events (id,provider,external_event_id,payload_json) VALUES (?,?,?,?)',
        )
        .bind(crypto.randomUUID(), 'meta', null, raw)
        .run();
    } catch {
      // Webhook soll trotzdem mit 200 quittiert werden.
    }
  }

  const jobs: Promise<void>[] = [];

  for (const entry of payload?.entry || []) {
    const accountId = String(entry?.id || '');

    for (const event of entry?.messaging || []) {
      if (event?.message?.is_echo) continue;

      const senderId = String(event?.sender?.id || '');
      const recipientId = String(event?.recipient?.id || accountId);
      const text = event?.message?.text;

      if (senderId && text) {
        jobs.push(
          processInboundMessage(
            env,
            recipientId || accountId,
            senderId,
            event?.message?.mid,
            text,
          ),
        );
      }
    }
  }

  await Promise.allSettled(jobs);
  return json({ received: true });
}

async function manualReply(env: Env, conversationId: string, message: string) {
  if (!env.DB) {
    return {
      sent: true,
      id: crypto.randomUUID(),
      message,
      demo: true,
    };
  }

  const row = await env.DB
    .prepare(
      `SELECT
         c.organization_id,
         c.id AS conversation_id,
         l.external_user_id,
         ia.access_token_encrypted
       FROM conversations c
       JOIN leads l ON l.id=c.lead_id
       JOIN instagram_accounts ia ON ia.id=c.instagram_account_id
       WHERE c.id=?
       LIMIT 1`,
    )
    .bind(conversationId)
    .first<D1Row>();

  if (!row) {
    return {
      sent: true,
      id: crypto.randomUUID(),
      message,
      demo: true,
    };
  }

  const sent = await sendInstagramText(
    env,
    row.access_token_encrypted,
    row.external_user_id,
    message,
  );

  await env.DB
    .prepare(
      "UPDATE conversations SET ai_mode='paused',updated_at=CURRENT_TIMESTAMP WHERE id=?",
    )
    .bind(conversationId)
    .run();

  await env.DB
    .prepare(
      `INSERT INTO messages
        (id,organization_id,conversation_id,external_message_id,direction,sender_type,body,status)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      row.organization_id,
      conversationId,
      sent?.message_id || null,
      'outbound',
      'human',
      message,
      'sent',
    )
    .run();

  return {
    sent: true,
    id: sent?.message_id || crypto.randomUUID(),
    message,
    aiMode: 'paused',
  };
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/health') {
    return json({
      ok: true,
      service: 'dm-sales-ai',
      demo: env.DEMO_MODE !== 'false',
      database: Boolean(env.DB),
      ai: Boolean(env.AI),
      aiProvider: 'cloudflare-workers-ai',
      aiModel: aiModel(env),
      meta: Boolean(env.META_APP_ID && env.META_APP_SECRET),
    });
  }

  if (path === '/api/bootstrap' && request.method === 'GET') {
    return json(await bootstrap(env));
  }

  if (path === '/api/ai/test' && request.method === 'POST') {
    if (!env.AI) {
      return json({ error: 'Workers AI Binding fehlt.' }, { status: 503 });
    }

    const body = await request.json<{
      message?: string;
      stage?: string;
      painPoint?: string;
      objection?: string;
    }>();

    if (!body.message?.trim()) {
      return json({ error: 'message fehlt.' }, { status: 400 });
    }

    const turn = await generateDemoDraft(env, body);

    if (!turn) {
      return json({ error: 'Die KI konnte keine valide Antwort erzeugen.' }, { status: 502 });
    }

    return json({ ok: true, provider: 'cloudflare', model: aiModel(env), ...turn });
  }

  if (path === '/api/meta/status' && request.method === 'GET') {
    return json({
      connected: false,
      ready: Boolean(env.META_APP_ID && env.META_APP_SECRET),
      mode: env.DEMO_MODE !== 'false' ? 'demo' : 'production',
    });
  }

  if (
    path === '/api/meta/oauth/start' &&
    (request.method === 'POST' || request.method === 'GET')
  ) {
    return oauthStart(request, env);
  }

  if (path === '/api/meta/oauth/callback' && request.method === 'GET') {
    return oauthCallback(request, env);
  }

  if (path === '/api/meta/webhook' && request.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (
      mode === 'subscribe' &&
      env.META_VERIFY_TOKEN &&
      token === env.META_VERIFY_TOKEN &&
      challenge
    ) {
      return new Response(challenge);
    }

    return new Response('Forbidden', { status: 403 });
  }

  if (path === '/api/meta/webhook' && request.method === 'POST') {
    return handleWebhook(request, env);
  }

  if (path === '/api/agent/settings' && request.method === 'POST') {
    const body = await request.json<Record<string, unknown>>();
    await saveAgent(env, body);
    return json({
      saved: true,
      agent: body,
      mode: env.DB ? 'database' : 'demo',
    });
  }

  const replyMatch = path.match(/^\/api\/conversations\/([^/]+)\/reply$/);
  if (replyMatch && request.method === 'POST') {
    const body = await request.json<{ message?: string }>();

    if (!body.message?.trim()) {
      return json({ error: 'Nachricht fehlt.' }, { status: 400 });
    }

    try {
      return json(
        await manualReply(
          env,
          decodeURIComponent(replyMatch[1]),
          body.message.trim(),
        ),
      );
    } catch (error: any) {
      return json({ error: error?.message || 'Senden fehlgeschlagen.' }, { status: 502 });
    }
  }

  const aiModeMatch = path.match(/^\/api\/conversations\/([^/]+)\/ai-mode$/);
  if (aiModeMatch && request.method === 'POST') {
    const body = await request.json<{ mode?: string }>();
    const mode = body.mode === 'paused' ? 'paused' : 'active';

    if (env.DB) {
      await env.DB
        .prepare(
          'UPDATE conversations SET ai_mode=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
        )
        .bind(mode, decodeURIComponent(aiModeMatch[1]))
        .run();
    }

    return json({ saved: true, mode });
  }

  if (path === '/api/agent/draft' && request.method === 'POST') {
    const body = await request.json<{
      stage?: string;
      painPoint?: string;
      objection?: string;
      message?: string;
    }>();

    if (!env.AI) {
      return json({
        draft:
          'Workers AI ist noch nicht verbunden. Prüfe den AI-Binding-Eintrag in wrangler.jsonc.',
        demo: true,
      });
    }

    const turn = await generateDemoDraft(env, body);

    if (!turn) {
      return json(
        { error: 'KI-Antwort konnte nicht erzeugt werden.' },
        { status: 502 },
      );
    }

    return json({
      draft: turn.reply,
      analysis: {
        stage: turn.stage,
        temperature: turn.temperature,
        score: turn.score,
        goal: turn.goal,
        painPoint: turn.pain_point,
        experience: turn.experience,
        budget: turn.budget,
        objection: turn.objection,
        summary: turn.summary,
      },
      provider: 'cloudflare-workers-ai',
      model: aiModel(env),
    });
  }

  return json({ error: 'Not found' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
