interface Env {
  DB?: D1Database;
  AI?: Ai;
  AI_MODEL?: string;
  META_VERIFY_TOKEN?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  META_REDIRECT_URI?: string;
  META_API_VERSION?: string;
  TOKEN_ENCRYPTION_KEY?: string;
  HUMAN_REPLY_MIN_MS?: string;
  HUMAN_REPLY_MAX_MS?: string;
  HUMAN_BURST_WAIT_MIN_MS?: string;
  HUMAN_BURST_WAIT_MAX_MS?: string;
  INSTAGRAM_TYPING_ACTIONS?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_MODE?: string;
  PAYPAL_STARTER_PLAN_ID?: string;
  PAYPAL_PRO_PLAN_ID?: string;
  BILLING_ENFORCED?: string;
  BILLING_ADMIN_EMAILS?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  APP_URL?: string;
  EMAIL_VERIFICATION_ENFORCED?: string;
}

type D1Row = Record<string, any>;

type AuthContext = {
  sessionId: string;
  userId: string;
  email: string;
  emailVerified: boolean;
  userName: string;
  organizationId: string;
  organizationName: string;
  organizationPlan: string;
  role: string;
};


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
  known_facts: string;
  open_questions: string;
  next_step: string;
  lead_intent: string;
  reply_mode: string;
  reply_goal: string;
  must_answer: string;
  should_ask_question: boolean;
  question_goal: string;
  should_send_checkout: boolean;
  style_language: string;
  style_address: string;
  style_formality: string;
  style_sentence_length: string;
  style_message_length: string;
  style_emoji_usage: string;
  style_slang: string;
  style_energy: string;
  style_directness: string;
  style_humor: string;
  style_punctuation: string;
  style_notes: string;
};

const API_VERSION_DEFAULT = 'v26.0';
const AI_MODEL_DEFAULT = '@cf/meta/llama-3.1-8b-instruct-fast';
const encoder = new TextEncoder();
const decoder = new TextDecoder();


function sleep(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms))}
function randomInt(min:number,max:number){
  const low=Math.ceil(min),high=Math.floor(max);
  if(high<=low)return low;
  const value=new Uint32Array(1);crypto.getRandomValues(value);
  return low+(value[0]%(high-low+1));
}
function envInt(value:string|undefined,fallback:number){
  const parsed=Number(value);return Number.isFinite(parsed)&&parsed>=0?Math.round(parsed):fallback;
}
function humanTiming(env:Env,leadText:string,replyText:string,turn:SalesTurn){
  const minMs=envInt(env.HUMAN_REPLY_MIN_MS,4200);
  const maxMs=Math.max(minMs,envInt(env.HUMAN_REPLY_MAX_MS,14000));
  const readMs=900+Math.min(2600,Math.max(0,leadText.trim().length)*16)+randomInt(250,900);
  let factor=1;
  const formality=turn.style_formality.toLowerCase();
  const length=turn.style_message_length.toLowerCase();
  const energy=turn.style_energy.toLowerCase();
  if(length.includes('kurz'))factor*=0.9;
  if(length.includes('lang')||length.includes('ausführ'))factor*=1.08;
  if(formality.includes('locker'))factor*=0.94;
  if(formality.includes('formell')||formality.includes('förmlich'))factor*=1.07;
  if(energy.includes('hoch')||energy.includes('schnell')||energy.includes('energet'))factor*=0.92;
  const msPerChar=randomInt(58,82);
  const typingMs=(replyText.trim().length*msPerChar)+randomInt(450,1100);
  const target=Math.round((readMs+typingMs)*factor);
  return Math.max(minMs,Math.min(maxMs,target));
}
function burstWaitMs(env:Env){
  const minMs=envInt(env.HUMAN_BURST_WAIT_MIN_MS,1400);
  const maxMs=Math.max(minMs,envInt(env.HUMAN_BURST_WAIT_MAX_MS,2400));
  return randomInt(minMs,maxMs);
}

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
    known_facts: { type: 'string' },
    open_questions: { type: 'string' },
    next_step: { type: 'string' },
    lead_intent: { type: 'string' },
    reply_mode: { type: 'string' },
    reply_goal: { type: 'string' },
    must_answer: { type: 'string' },
    should_ask_question: { type: 'boolean' },
    question_goal: { type: 'string' },
    should_send_checkout: { type: 'boolean' },
    style_language: { type: 'string' },
    style_address: { type: 'string' },
    style_formality: { type: 'string' },
    style_sentence_length: { type: 'string' },
    style_message_length: { type: 'string' },
    style_emoji_usage: { type: 'string' },
    style_slang: { type: 'string' },
    style_energy: { type: 'string' },
    style_directness: { type: 'string' },
    style_humor: { type: 'string' },
    style_punctuation: { type: 'string' },
    style_notes: { type: 'string' },
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
    'known_facts',
    'open_questions',
    'next_step',
    'lead_intent',
    'reply_mode',
    'reply_goal',
    'must_answer',
    'should_ask_question',
    'question_goal',
    'should_send_checkout',
    'style_language',
    'style_address',
    'style_formality',
    'style_sentence_length',
    'style_message_length',
    'style_emoji_usage',
    'style_slang',
    'style_energy',
    'style_directness',
    'style_humor',
    'style_punctuation',
    'style_notes',
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

const emptyBootstrap = {
  organization: { id: '', name: '', plan: 'starter' },
  instagram: { connected: false, username: '', status: 'not_connected', ready: false },
  billing: {
    provider: 'paypal',
    plan: 'starter',
    status: 'inactive',
    subscriptionId: '',
    currentPeriodEnd: '',
    configured: false,
    webhookConfigured: false,
    mode: 'live',
  },
  metrics: {
    conversationsTotal: 0,
    conversationsThisMonth: 0,
    conversationsToday: 0,
    painPointsKnown: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    checkoutSent: 0,
  },
  conversations: [],
  agent: {
    name: 'Sales Agent',
    active: true,
    offerName: '',
    productKnowledge: '',
    price: '',
    paymentPlan: '',
    paymentMethods: '',
    paymentHint: '',
    showPaymentHintWithPrice: false,
    checkoutCta: '',
    audience: '',
    painPoints: '',
    outcomes: '',
    objections: '',
    checkoutUrl: '',
    bookingUrl: '',
    tone: 'Natürlich, direkt und freundlich.',
    voiceExamples: '',
    salesRules: '',
    guardrails: '',
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


const SESSION_COOKIE = 'dm_sales_session';
const SESSION_DAYS = 30;
// Cloudflare Workers WebCrypto supports PBKDF2 iteration counts up to 100,000.
const PASSWORD_ITERATIONS = 100_000;

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function randomToken(bytes = 32) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return b64(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function passwordHash(password: string, saltB64: string) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: unb64(saltB64),
      iterations: PASSWORD_ITERATIONS,
    },
    baseKey,
    256,
  );

  return b64(new Uint8Array(bits));
}

async function makePassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = b64(salt);
  return {
    salt: saltB64,
    hash: await passwordHash(password, saltB64),
  };
}

function secureEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function sessionCookie(token: string, maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function workspaceSlug(name: string) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}


function emailVerificationEnforced(env: Env) {
  return env.EMAIL_VERIFICATION_ENFORCED === 'true';
}

function emailConfigured(env: Env) {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

function appUrl(request: Request, env: Env) {
  const configured = String(env.APP_URL || '').trim().replace(/\/+$/g, '');
  return configured || new URL(request.url).origin;
}

function escapeHtml(value: unknown) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendTransactionalEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text: string,
) {
  if (!emailConfigured(env)) {
    throw new Error(
      'E-Mail-Service ist nicht konfiguriert. RESEND_API_KEY oder EMAIL_FROM fehlt.',
    );
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `E-Mail konnte nicht gesendet werden: ${response.status} ${await response.text()}`,
    );
  }

  return response.json<any>();
}

async function createAuthToken(
  env: Env,
  userId: string,
  type: 'verify_email' | 'password_reset',
  lifetimeMinutes: number,
) {
  if (!env.DB) throw new Error('Datenbank nicht verfügbar.');

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(
    Date.now() + lifetimeMinutes * 60 * 1000,
  ).toISOString();

  await env.DB
    .prepare(
      `DELETE FROM auth_tokens
       WHERE user_id=? AND type=? AND used_at IS NULL`,
    )
    .bind(userId, type)
    .run();

  await env.DB
    .prepare(
      `INSERT INTO auth_tokens
        (id,user_id,type,token_hash,expires_at)
       VALUES (?,?,?,?,?)`,
    )
    .bind(crypto.randomUUID(), userId, type, tokenHash, expiresAt)
    .run();

  return { token, expiresAt };
}

async function sendVerificationEmail(
  request: Request,
  env: Env,
  userId: string,
  email: string,
  name: string,
) {
  const { token } = await createAuthToken(
    env,
    userId,
    'verify_email',
    24 * 60,
  );

  const link = `${appUrl(request, env)}/?verify=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name || 'dort');

  return sendTransactionalEmail(
    env,
    email,
    'E-Mail-Adresse bestätigen · DM Sales AI',
    `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033">
        <h2 style="margin:0 0 16px">E-Mail-Adresse bestätigen</h2>
        <p>Hi ${safeName},</p>
        <p>bestätige bitte deine E-Mail-Adresse, damit dein DM Sales AI Account vollständig freigeschaltet werden kann.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#0b1626;color:#fff;text-decoration:none;padding:13px 18px;border-radius:8px;font-weight:700">E-Mail bestätigen</a>
        </p>
        <p style="font-size:13px;color:#6c7888">Der Link ist 24 Stunden gültig.</p>
      </div>
    `,
    `Hi ${name || ''},

bestätige bitte deine E-Mail-Adresse für DM Sales AI:

${link}

Der Link ist 24 Stunden gültig.`,
  );
}

async function sendPasswordResetEmail(
  request: Request,
  env: Env,
  userId: string,
  email: string,
  name: string,
) {
  const { token } = await createAuthToken(
    env,
    userId,
    'password_reset',
    60,
  );

  const link = `${appUrl(request, env)}/?reset=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name || 'dort');

  return sendTransactionalEmail(
    env,
    email,
    'Passwort zurücksetzen · DM Sales AI',
    `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033">
        <h2 style="margin:0 0 16px">Passwort zurücksetzen</h2>
        <p>Hi ${safeName},</p>
        <p>über den folgenden Button kannst du ein neues Passwort für deinen DM Sales AI Account festlegen.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#0b1626;color:#fff;text-decoration:none;padding:13px 18px;border-radius:8px;font-weight:700">Neues Passwort festlegen</a>
        </p>
        <p style="font-size:13px;color:#6c7888">Der Link ist 60 Minuten gültig. Wenn du die Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
      </div>
    `,
    `Hi ${name || ''},

hier kannst du dein Passwort für DM Sales AI zurücksetzen:

${link}

Der Link ist 60 Minuten gültig.`,
  );
}

async function verifyEmailToken(
  request: Request,
  env: Env,
) {
  if (!env.DB) return json({ error: 'D1 Datenbank fehlt.' }, { status: 503 });

  const body = await request.json<{ token?: string }>();
  const token = String(body.token || '').trim();

  if (!token) {
    return json({ error: 'Bestätigungslink ist ungültig.' }, { status: 400 });
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB
    .prepare(
      `SELECT
         t.id,
         t.user_id,
         u.email,
         u.name,
         m.organization_id
       FROM auth_tokens t
       JOIN users u ON u.id=t.user_id
       JOIN memberships m ON m.user_id=u.id
       WHERE t.token_hash=?
         AND t.type='verify_email'
         AND t.used_at IS NULL
         AND t.expires_at > CURRENT_TIMESTAMP
       ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<D1Row>();

  if (!row) {
    return json(
      { error: 'Dieser Bestätigungslink ist ungültig oder abgelaufen.' },
      { status: 400 },
    );
  }

  await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE users
         SET email_verified_at=COALESCE(email_verified_at,CURRENT_TIMESTAMP),
             updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
      .bind(row.user_id),
    env.DB
      .prepare('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(row.id),
  ]);

  const organizationId = String(row.organization_id || '');
  if (!organizationId) {
    return json(
      { error: 'Für dieses Konto wurde kein Workspace gefunden.' },
      { status: 409 },
    );
  }

  // Der einmalige Bestätigungslink beweist den Zugriff auf die E-Mail-Adresse.
  // Deshalb darf er nach erfolgreicher Verifizierung direkt eine frische
  // Session für genau diesen Benutzer + Workspace erstellen.
  const session = await createSession(
    env,
    String(row.user_id),
    organizationId,
  );

  return json(
    {
      ok: true,
      email: String(row.email || ''),
      sessionCreated: true,
    },
    {
      headers: {
        'Set-Cookie': sessionCookie(session.token),
      },
    },
  );
}

async function forgotPassword(
  request: Request,
  env: Env,
) {
  const generic = {
    ok: true,
    message:
      'Falls für diese E-Mail-Adresse ein Konto existiert, wurde ein Link zum Zurücksetzen gesendet.',
  };

  if (!env.DB) return json(generic);

  const body = await request.json<{ email?: string }>();
  const email = normalizeEmail(body.email);

  if (!email) return json(generic);

  const user = await env.DB
    .prepare(
      `SELECT id,email,name,COALESCE(disabled,0) AS disabled
       FROM users
       WHERE email=?
       LIMIT 1`,
    )
    .bind(email)
    .first<D1Row>();

  if (!user || user.disabled) return json(generic);

  try {
    await sendPasswordResetEmail(
      request,
      env,
      String(user.id),
      String(user.email),
      String(user.name || ''),
    );
  } catch (error: any) {
    console.error('Password reset email failed:', error?.message || error);
  }

  return json(generic);
}

async function resetPassword(
  request: Request,
  env: Env,
) {
  if (!env.DB) return json({ error: 'D1 Datenbank fehlt.' }, { status: 503 });

  const body = await request.json<{ token?: string; password?: string }>();
  const token = String(body.token || '').trim();
  const password = String(body.password || '');

  if (!token) {
    return json({ error: 'Reset-Link ist ungültig.' }, { status: 400 });
  }

  if (password.length < 10) {
    return json(
      { error: 'Das Passwort muss mindestens 10 Zeichen lang sein.' },
      { status: 400 },
    );
  }

  if (!/[A-Za-zÄÖÜäöüß]/.test(password) || !/\d/.test(password)) {
    return json(
      { error: 'Das Passwort muss mindestens einen Buchstaben und eine Zahl enthalten.' },
      { status: 400 },
    );
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB
    .prepare(
      `SELECT id,user_id
       FROM auth_tokens
       WHERE token_hash=?
         AND type='password_reset'
         AND used_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<D1Row>();

  if (!row) {
    return json(
      { error: 'Dieser Reset-Link ist ungültig oder abgelaufen.' },
      { status: 400 },
    );
  }

  const { salt, hash } = await makePassword(password);

  await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE users
         SET password_hash=?,
             password_salt=?,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
      .bind(hash, salt, row.user_id),
    env.DB
      .prepare('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(row.id),
    env.DB
      .prepare('DELETE FROM sessions WHERE user_id=?')
      .bind(row.user_id),
  ]);

  return json({ ok: true });
}

async function resendVerification(
  request: Request,
  env: Env,
  auth: AuthContext,
) {
  if (auth.emailVerified) {
    return json({ ok: true, alreadyVerified: true });
  }

  try {
    await sendVerificationEmail(
      request,
      env,
      auth.userId,
      auth.email,
      auth.userName,
    );
    return json({ ok: true });
  } catch (error: any) {
    return json(
      {
        error:
          error?.message ||
          'Bestätigungs-E-Mail konnte nicht gesendet werden.',
      },
      { status: 502 },
    );
  }
}

async function createSession(
  env: Env,
  userId: string,
  organizationId: string,
) {
  if (!env.DB) throw new Error('Datenbank nicht verfügbar.');

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const id = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await env.DB
    .prepare(
      `INSERT INTO sessions
        (id,user_id,organization_id,token_hash,expires_at,last_seen_at)
       VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
    )
    .bind(id, userId, organizationId, tokenHash, expiresAt)
    .run();

  return { token, id, expiresAt };
}

async function authContext(request: Request, env: Env): Promise<AuthContext | null> {
  if (!env.DB) return null;

  const token = cookie(request, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const row = await env.DB
    .prepare(
      `SELECT
         s.id AS session_id,
         s.user_id,
         s.organization_id,
         u.email,
         u.email_verified_at,
         u.name AS user_name,
         o.name AS organization_name,
         o.plan AS organization_plan,
         m.role
       FROM sessions s
       JOIN users u ON u.id=s.user_id
       JOIN organizations o ON o.id=s.organization_id
       JOIN memberships m
         ON m.user_id=s.user_id
        AND m.organization_id=s.organization_id
       WHERE s.token_hash=?
         AND s.expires_at > CURRENT_TIMESTAMP
         AND COALESCE(u.disabled,0)=0
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<D1Row>();

  if (!row) return null;

  // Last-seen is intentionally best effort and does not block requests.
  env.DB
    .prepare('UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(row.session_id)
    .run()
    .catch(() => undefined);

  return {
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    email: String(row.email || ''),
    emailVerified: Boolean(row.email_verified_at),
    userName: String(row.user_name || ''),
    organizationId: String(row.organization_id),
    organizationName: String(row.organization_name || 'Workspace'),
    organizationPlan: String(row.organization_plan || 'starter'),
    role: String(row.role || 'owner'),
  };
}

async function registerUser(
  request: Request,
  env: Env,
) {
  if (!env.DB) {
    return json({ error: 'D1 Datenbank fehlt.' }, { status: 503 });
  }

  const body = await request.json<{
    name?: string;
    email?: string;
    password?: string;
    workspaceName?: string;
  }>();

  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const workspaceName =
    String(body.workspaceName || '').trim() ||
    (name ? `${name}s Workspace` : 'Mein Workspace');

  if (name.length < 2) {
    return json({ error: 'Bitte gib deinen Namen ein.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 });
  }
  if (password.length < 10) {
    return json({ error: 'Das Passwort muss mindestens 10 Zeichen lang sein.' }, { status: 400 });
  }
  if (!/[A-Za-zÄÖÜäöüß]/.test(password) || !/\d/.test(password)) {
    return json(
      { error: 'Das Passwort muss mindestens einen Buchstaben und eine Zahl enthalten.' },
      { status: 400 },
    );
  }
  if (workspaceName.length < 2 || workspaceName.length > 80) {
    return json({ error: 'Der Workspace-Name muss 2–80 Zeichen lang sein.' }, { status: 400 });
  }

  const existing = await env.DB
    .prepare('SELECT id FROM users WHERE email=? LIMIT 1')
    .bind(email)
    .first<D1Row>();

  if (existing) {
    return json(
      { error: 'Für diese E-Mail-Adresse existiert bereits ein Konto.' },
      { status: 409 },
    );
  }

  const userId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const { salt, hash } = await makePassword(password);

  try {
    await env.DB.batch([
      env.DB
        .prepare(
          `INSERT INTO users
            (id,email,name,password_hash,password_salt)
           VALUES (?,?,?,?,?)`,
        )
        .bind(userId, email, name, hash, salt),
      env.DB
        .prepare(
          `INSERT INTO organizations
            (id,name,slug,plan)
           VALUES (?,?,?,'starter')`,
        )
        .bind(organizationId, workspaceName, workspaceSlug(workspaceName)),
      env.DB
        .prepare(
          `INSERT INTO memberships
            (organization_id,user_id,role)
           VALUES (?,?,'owner')`,
        )
        .bind(organizationId, userId),
      env.DB
        .prepare(
          `INSERT INTO ai_agents
            (id,organization_id,name,active,tone)
           VALUES (?,?,'Sales Agent',1,'Natürlich, direkt, freundlich. Kurze Nachrichten. Nie drängen.')`,
        )
        .bind(crypto.randomUUID(), organizationId),
    ]);
  } catch (error: any) {
    console.error('Registration failed:', error?.message || error);
    return json(
      { error: 'Konto konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }

  const session = await createSession(env, userId, organizationId);

  const verificationRequired = emailVerificationEnforced(env);

  if (verificationRequired) {
    try {
      await sendVerificationEmail(
        request,
        env,
        userId,
        email,
        name,
      );
    } catch (error: any) {
      console.error('Verification email failed:', error?.message || error);
    }
  }

  return json(
    {
      ok: true,
      user: {
        id: userId,
        name,
        email,
        role: 'owner',
        emailVerified: !verificationRequired,
      },
      verificationRequired,
      organization: {
        id: organizationId,
        name: workspaceName,
        plan: 'starter',
      },
    },
    {
      status: 201,
      headers: { 'Set-Cookie': sessionCookie(session.token) },
    },
  );
}

async function loginUser(request: Request, env: Env) {
  if (!env.DB) {
    return json({ error: 'D1 Datenbank fehlt.' }, { status: 503 });
  }

  const body = await request.json<{ email?: string; password?: string }>();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    return json({ error: 'E-Mail und Passwort fehlen.' }, { status: 400 });
  }

  const user = await env.DB
    .prepare(
      `SELECT id,email,name,password_hash,password_salt,email_verified_at,COALESCE(disabled,0) AS disabled
       FROM users
       WHERE email=?
       LIMIT 1`,
    )
    .bind(email)
    .first<D1Row>();

  if (
    !user ||
    user.disabled ||
    !user.password_hash ||
    !user.password_salt
  ) {
    // Keep error intentionally generic.
    return json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 401 });
  }

  const candidate = await passwordHash(password, String(user.password_salt));
  if (!secureEqual(candidate, String(user.password_hash))) {
    return json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 401 });
  }

  const membership = await env.DB
    .prepare(
      `SELECT m.organization_id,m.role,o.name,o.plan
       FROM memberships m
       JOIN organizations o ON o.id=m.organization_id
       WHERE m.user_id=?
       ORDER BY m.created_at ASC
       LIMIT 1`,
    )
    .bind(user.id)
    .first<D1Row>();

  if (!membership) {
    return json({ error: 'Für dieses Konto wurde kein Workspace gefunden.' }, { status: 403 });
  }

  const session = await createSession(
    env,
    String(user.id),
    String(membership.organization_id),
  );

  await env.DB
    .prepare('UPDATE users SET last_login_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(user.id)
    .run();

  return json(
    {
      ok: true,
      user: {
        id: String(user.id),
        name: String(user.name || ''),
        email: String(user.email || ''),
        role: String(membership.role || 'owner'),
        emailVerified: Boolean(user.email_verified_at),
      },
      organization: {
        id: String(membership.organization_id),
        name: String(membership.name || 'Workspace'),
        plan: String(membership.plan || 'starter'),
      },
    },
    { headers: { 'Set-Cookie': sessionCookie(session.token) } },
  );
}

async function logoutUser(request: Request, env: Env) {
  if (env.DB) {
    const token = cookie(request, SESSION_COOKIE);
    if (token) {
      const tokenHash = await sha256Hex(token);
      await env.DB
        .prepare('DELETE FROM sessions WHERE token_hash=?')
        .bind(tokenHash)
        .run()
        .catch(() => undefined);
    }
  }

  return json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookie() } },
  );
}

function displayDbTime(value: unknown) {
  const raw = String(value || '');
  if (!raw) return '';
  const time = raw.match(/(?:T|\s)(\d{2}:\d{2})/);
  return time?.[1] || raw;
}

async function workspaceConversations(env: Env, organizationId: string) {
  if (!env.DB) return [];

  const rows = await env.DB
    .prepare(
      `SELECT
         c.id,
         c.ai_mode,
         c.current_stage,
         c.last_message_at,
         l.username,
         l.display_name,
         l.external_user_id,
         l.stage,
         l.temperature,
         l.score,
         l.goal,
         l.pain_point,
         l.experience,
         l.budget,
         l.objection,
         l.summary,
         l.memory_json,
         l.style_profile_json
       FROM conversations c
       JOIN leads l ON l.id=c.lead_id
       WHERE c.organization_id=?
       ORDER BY COALESCE(c.last_message_at,c.updated_at) DESC
       LIMIT 100`,
    )
    .bind(organizationId)
    .all<D1Row>();

  const conversations: any[] = [];

  for (const row of rows.results || []) {
    const messageRows = await env.DB
      .prepare(
        `SELECT id,direction,sender_type,body,created_at
         FROM messages
         WHERE conversation_id=? AND organization_id=?
         ORDER BY created_at ASC
         LIMIT 200`,
      )
      .bind(row.id, organizationId)
      .all<D1Row>();

    const messages = (messageRows.results || []).map((message) => ({
      id: String(message.id),
      from:
        message.direction === 'inbound'
          ? 'lead'
          : message.sender_type === 'human'
            ? 'human'
            : 'ai',
      body: String(message.body || ''),
      time: displayDbTime(message.created_at),
    }));

    const memory: any = parseJsonObject(row.memory_json);
    const style: any = parseJsonObject(row.style_profile_json);
    const displayName =
      String(row.display_name || row.username || '').trim() || 'Instagram Lead';
    const username = String(row.username || '').trim();
    const externalUserId = String(row.external_user_id || '').trim();

    conversations.push({
      id: String(row.id),
      name: displayName,
      username: username ? `@${username.replace(/^@/, '')}` : externalUserId,
      avatar: displayName.slice(0, 1).toUpperCase() || 'L',
      score: Number(row.score || 0),
      temperature: String(row.temperature || 'cold'),
      stage: String(row.stage || row.current_stage || 'discovery'),
      aiMode: row.ai_mode === 'paused' ? 'paused' : 'active',
      lastMessage: messages.at(-1)?.body || '',
      time: displayDbTime(row.last_message_at),
      goal: String(row.goal || 'Unklar'),
      painPoint: String(row.pain_point || 'Unklar'),
      experience: String(row.experience || 'Unklar'),
      budget: String(row.budget || 'Unklar'),
      objection: String(row.objection || 'Unklar'),
      summary: String(row.summary || ''),
      knownFacts: String(memory.knownFacts || memory.known_facts || ''),
      openQuestions: String(memory.openQuestions || memory.open_questions || ''),
      nextStep: String(memory.nextStep || memory.next_step || ''),
      styleProfile: style,
      messages,
    });
  }

  return conversations;
}

async function workspaceMetrics(env: Env, organizationId: string) {
  if (!env.DB) {
    return {
      conversationsTotal: 0,
      conversationsThisMonth: 0,
      conversationsToday: 0,
      painPointsKnown: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      checkoutSent: 0,
    };
  }

  const row = await env.DB
    .prepare(
      `SELECT
         (SELECT COUNT(*)
          FROM conversations
          WHERE organization_id=?) AS conversations_total,

         (SELECT COUNT(*)
          FROM conversations
          WHERE organization_id=?
            AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')) AS conversations_this_month,

         (SELECT COUNT(*)
          FROM conversations
          WHERE organization_id=?
            AND date(COALESCE(last_message_at,created_at))=date('now')) AS conversations_today,

         (SELECT COUNT(*)
          FROM leads
          WHERE organization_id=?
            AND TRIM(COALESCE(pain_point,'')) <> ''
            AND LOWER(TRIM(pain_point)) NOT IN
              ('unklar','noch unklar','unbekannt','noch offen')) AS pain_points_known,

         (SELECT COUNT(*)
          FROM leads
          WHERE organization_id=?
            AND stage IN ('qualification','solution','objection','close')) AS qualified_leads,

         (SELECT COUNT(*)
          FROM leads
          WHERE organization_id=?
            AND temperature='hot') AS hot_leads,

         (SELECT COUNT(DISTINCT m.id)
          FROM messages m
          JOIN conversations c ON c.id=m.conversation_id
          WHERE c.organization_id=?
            AND m.organization_id=?
            AND m.direction='outbound'
            AND COALESCE(
              (SELECT checkout_url
               FROM ai_agents
               WHERE organization_id=?
               ORDER BY updated_at DESC
               LIMIT 1),
              ''
            ) <> ''
            AND instr(
              m.body,
              (SELECT checkout_url
               FROM ai_agents
               WHERE organization_id=?
               ORDER BY updated_at DESC
               LIMIT 1)
            ) > 0) AS checkout_sent`,
    )
    .bind(
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
      organizationId,
    )
    .first<D1Row>();

  return {
    conversationsTotal: Number(row?.conversations_total || 0),
    conversationsThisMonth: Number(row?.conversations_this_month || 0),
    conversationsToday: Number(row?.conversations_today || 0),
    painPointsKnown: Number(row?.pain_points_known || 0),
    qualifiedLeads: Number(row?.qualified_leads || 0),
    hotLeads: Number(row?.hot_leads || 0),
    checkoutSent: Number(row?.checkout_sent || 0),
  };
}

async function bootstrap(
  env: Env,
  auth: AuthContext,
) {
  const data = structuredClone(emptyBootstrap) as any;

  data.user = {
    id: auth.userId,
    name: auth.userName,
    email: auth.email,
    role: auth.role,
    emailVerified: auth.emailVerified,
  };
  data.organization = {
    id: auth.organizationId,
    name: auth.organizationName,
    plan: auth.organizationPlan,
  };
  data.instagram = {
    connected: false,
    username: '',
    status: 'not_connected',
    ready: Boolean(
      env.META_APP_ID &&
      env.META_APP_SECRET &&
      env.META_VERIFY_TOKEN &&
      env.TOKEN_ENCRYPTION_KEY
    ),
  };
  data.metrics = await workspaceMetrics(env, auth.organizationId);
  data.conversations = await workspaceConversations(env, auth.organizationId);

  if (!env.DB) return data;

  const account = await env.DB
    .prepare(
      'SELECT username,status FROM instagram_accounts WHERE organization_id=? ORDER BY connected_at DESC LIMIT 1',
    )
    .bind(auth.organizationId)
    .first<D1Row>();

  if (account) {
    data.instagram = {
      connected: account.status === 'connected',
      username: account.username ? `@${account.username}` : '',
      status: account.status,
      ready: Boolean(
        env.META_APP_ID &&
        env.META_APP_SECRET &&
        env.META_VERIFY_TOKEN &&
        env.TOKEN_ENCRYPTION_KEY
      ),
    };
  }

  const agent = await env.DB
    .prepare(
      'SELECT * FROM ai_agents WHERE organization_id=? ORDER BY updated_at DESC LIMIT 1',
    )
    .bind(auth.organizationId)
    .first<D1Row>();

  if (agent) {
    data.agent = {
      name: agent.name,
      active: Boolean(agent.active),
      offerName: agent.offer_name || '',
      productKnowledge: agent.offer_description || '',
      price: agent.price_text || '',
      paymentPlan: agent.payment_plan_text || '',
      paymentMethods: agent.payment_methods || '',
      paymentHint: agent.payment_hint || '',
      showPaymentHintWithPrice: Boolean(agent.show_payment_hint_with_price),
      checkoutCta: agent.checkout_cta_text || '',
      audience: agent.audience || '',
      painPoints: agent.pain_points || '',
      outcomes: agent.outcomes || '',
      objections: agent.objections || '',
      checkoutUrl: agent.checkout_url || '',
      bookingUrl: agent.booking_url || '',
      tone: agent.tone || '',
      voiceExamples: agent.system_instructions || '',
      salesRules: agent.qualification_rules || '',
      guardrails: agent.guardrails || '',
    };
  }

  const subscription = await env.DB
    .prepare(
      `SELECT provider,provider_customer_id,provider_subscription_id,plan,status,current_period_end
       FROM subscriptions
       WHERE organization_id=?
       LIMIT 1`,
    )
    .bind(auth.organizationId)
    .first<D1Row>();

  data.billing = {
    provider: subscription?.provider || 'paypal',
    plan: subscription?.plan || auth.organizationPlan || 'starter',
    status: subscription?.status || 'inactive',
    subscriptionId: subscription?.provider_subscription_id || '',
    currentPeriodEnd: subscription?.current_period_end || '',
    configured: Boolean(
      env.PAYPAL_CLIENT_ID &&
      env.PAYPAL_CLIENT_SECRET &&
      env.PAYPAL_STARTER_PLAN_ID &&
      env.PAYPAL_PRO_PLAN_ID
    ),
    webhookConfigured: Boolean(env.PAYPAL_WEBHOOK_ID),
    mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
  };

  const access = await workspaceBillingAccess(
    env,
    auth.organizationId,
    auth.email,
  );

  data.access = {
    billingEnforced: access.enforced,
    adminBypass: access.adminBypass,
    paid: access.paid,
    granted: access.granted,
    emailVerificationEnforced: emailVerificationEnforced(env),
    emailVerified: auth.emailVerified,
  };

  return data;
}

async function saveAgent(env: Env, organizationId: string, body: Record<string, unknown>) {
  if (!env.DB) return;

  const existing = await env.DB
    .prepare('SELECT id FROM ai_agents WHERE organization_id=? LIMIT 1')
    .bind(organizationId)
    .first<D1Row>();

  const values = [
    String(body.name || 'Sales Agent'),
    body.active === false ? 0 : 1,
    String(body.offerName || ''),
    String(body.productKnowledge || ''),
    String(body.price || ''),
    String(body.paymentPlan || ''),
    String(body.paymentMethods || ''),
    String(body.paymentHint || ''),
    body.showPaymentHintWithPrice === true ? 1 : 0,
    String(body.checkoutCta || ''),
    String(body.audience || ''),
    String(body.painPoints || ''),
    String(body.outcomes || ''),
    String(body.objections || ''),
    String(body.checkoutUrl || ''),
    String(body.bookingUrl || ''),
    String(body.tone || 'Natürlich, kurz, menschlich'),
    String(body.voiceExamples || ''),
    String(body.salesRules || ''),
    String(body.guardrails || ''),
  ];

  if (existing) {
    await env.DB
      .prepare(
        'UPDATE ai_agents SET name=?,active=?,offer_name=?,offer_description=?,price_text=?,payment_plan_text=?,payment_methods=?,payment_hint=?,show_payment_hint_with_price=?,checkout_cta_text=?,audience=?,pain_points=?,outcomes=?,objections=?,checkout_url=?,booking_url=?,tone=?,system_instructions=?,qualification_rules=?,guardrails=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      )
      .bind(...values, existing.id)
      .run();
  } else {
    await env.DB
      .prepare(
        'INSERT INTO ai_agents (id,organization_id,name,active,offer_name,offer_description,price_text,payment_plan_text,payment_methods,payment_hint,show_payment_hint_with_price,checkout_cta_text,audience,pain_points,outcomes,objections,checkout_url,booking_url,tone,system_instructions,qualification_rules,guardrails) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(crypto.randomUUID(), organizationId, ...values)
      .run();
  }
}

function systemPrompt(agent: D1Row) {
  return `Du führst echte, natürliche Verkaufsgespräche per Instagram-DM.

DEIN OBERSTES PRINZIP:
Die sichtbare Antwort muss sich wie eine echte persönliche DM lesen.
Du bist kein Support-Bot und kein Verkäufer mit Skript.
Du verstehst zuerst, antwortest konkret und führst das Gespräch Schritt für Schritt weiter.

ANGEBOT
Name: ${agent.offer_name || agent.offerName || ''}
Verbindliches Produktwissen / Knowledge Base:
${agent.offer_description || agent.productKnowledge || 'Keine zusätzlichen Produktfakten hinterlegt.'}
Preis: ${agent.price_text || agent.price || ''}
Raten / Preisoptionen: ${agent.payment_plan_text || agent.paymentPlan || 'Nicht hinterlegt'}
Zahlungsarten: ${agent.payment_methods || agent.paymentMethods || 'Nicht hinterlegt'}
Zahlungshinweis: ${agent.payment_hint || agent.paymentHint || 'Nicht hinterlegt'}
Zahlungshinweis direkt bei Preisfrage: ${(agent.show_payment_hint_with_price ?? agent.showPaymentHintWithPrice) ? 'JA' : 'NEIN'}
Checkout CTA: ${agent.checkout_cta_text || agent.checkoutCta || 'Hier kannst du direkt starten:'}
Zielgruppe: ${agent.audience || ''}
Painpoints: ${agent.pain_points || agent.painPoints || ''}
Gewünschte Ergebnisse: ${agent.outcomes || ''}
Typische Einwände: ${agent.objections || ''}
Checkout: ${agent.checkout_url || agent.checkoutUrl || ''}
Termin: ${agent.booking_url || agent.bookingUrl || ''}
Grundton des Unternehmens: ${agent.tone || 'Natürlich, freundlich, direkt und kurz.'}

KONTEXT-ARCHITEKTUR
Du bekommst pro Lead:
1. LEAD MEMORY = die wichtigsten langfristigen Fakten aus dem bisherigen Gespräch.
2. STYLE PROFILE = wie dieser Lead tatsächlich schreibt.
3. LETZTE NACHRICHTEN = die letzten Nachrichten für Ton und unmittelbaren Gesprächsfluss.

Der komplette Rohverlauf bleibt im System gespeichert.
Pro Antwort arbeitest du primär mit Lead Memory + Style Profile + den letzten Nachrichten.
Aktualisiere Lead Memory und Style Profile bei jeder neuen Lead-Nachricht.

LEAD MEMORY
Halte dauerhaft fest:
- Ziel
- aktuelle Situation
- Haupt-Painpoint
- Erfahrung
- Budget, falls genannt
- offene Einwände
- bereits geklärte Punkte
- noch offene sinnvolle Fragen
- kurze Zusammenfassung
- nächster sinnvoller Schritt

Wichtig:
- Nichts erfinden.
- Unbekannt bleibt "Unklar".
- Bereits geklärte Dinge niemals erneut abfragen.
- Neuere klare Aussagen überschreiben ältere widersprüchliche Aussagen.
- known_facts: maximal 8 knappe Stichpunkte.
- open_questions: maximal 4 wirklich relevante offene Punkte.
- summary: maximal 3 kurze Sätze.
- next_step: genau ein konkreter nächster Gesprächsschritt.

ANREDE UND SPRACHE — BINDEND
Die Sprache und Anrede des Leads sind verbindlich für die sichtbare Antwort.

- Wenn der Lead "du", "dein", "dir", "dich" oder klar lockere Formulierungen wie "Hey", "hab", "was genau ist das?" nutzt, antworte mit "du".
- Wenn der Lead ausdrücklich "Sie", "Ihnen", "Ihr" nutzt, antworte mit "Sie".
- Ein klarer aktueller Sprachhinweis aus der letzten Lead-Nachricht hat Vorrang vor einem älteren Style Profile.
- Sprich IMMER direkt mit dem Lead.
- Verwende in einer direkten Antwort keine distanzierte Drittpersonen-Sprache wie:
  "Das ist für Menschen, die ..."
  "Ich helfe ihnen ..."
  "Menschen bekommen ..."
  wenn du stattdessen direkt "du" oder "Sie" sagen kannst.
- Wechsle niemals innerhalb eines Gesprächs grundlos zwischen du und Sie.

STYLE MIRRORING — SEHR WICHTIG
Passe die sichtbare Antwort an den tatsächlichen Kommunikationsstil des Leads an:
- Sprache
- du/Sie
- Formalität
- Satzlänge
- Nachrichtenlänge
- Umgangssprache / Slang
- Emoji-Nutzung
- Energie
- Direktheit
- Humor
- Interpunktion

Regeln:
- Lead schreibt locker → locker antworten.
- Lead schreibt kurz → kurz antworten.
- Lead schreibt ausführlich → etwas ausführlicher antworten.
- Lead nutzt keine Emojis → keine Emojis hineinpressen.
- Lead nutzt gelegentlich Emojis → gelegentlich passende Emojis sind okay.
- Lead schreibt sachlich → sachlich bleiben.
- Lead ist direkt → direkter antworten.
- Style spiegeln, aber nicht karikieren.

NICHT TUN:
- Rechtschreibfehler absichtlich kopieren.
- Slang, Dialekt oder Emojis übertreiben.
- Jede Formulierung des Leads wiederholen.
- Eine künstliche Persona spielen.
- Beleidigungen oder aggressive Sprache eskalieren.
- Den Lead psychologisch manipulieren.

Wenn du zwischen perfekter Grammatik und einer natürlicheren Instagram-DM wählen musst, bevorzuge die natürlichere Formulierung, solange sie klar bleibt.

ERSTKONTAKT — HARTE REGEL
Bei den ersten Nachrichten eines Gesprächs gilt:

- Niemals direkt mit einem Verkaufspitch starten.
- Wenn der Lead fragt "Was ist das?", "Wie funktioniert das?", "Worum geht's?" oder ähnlich:
  1. Beantworte die Frage zuerst in EINEM klaren, einfachen Satz.
  2. Stelle danach höchstens EINE natürliche Discovery-Frage.
- Die erste Antwort darf nicht wie eine Landingpage klingen.
- Keine langen Aufzählungen von Leistungen, Ergebnissen oder Vorteilen.
- Preis, Checkout oder Termin nicht ungefragt im Erstkontakt senden.
- Ziel im Erstkontakt ist Verständnis, nicht Abschluss.

SCHLECHT:
"Das ist mein Angebot für Menschen, die ein digitales Business aufbauen möchten. Ich helfe ihnen, einen klaren Schritt-für-Schritt-Weg zu finden."

BESSER:
"Im Kern geht’s darum, dir einen klaren Weg zu geben, wie du online mit einem eigenen digitalen Angebot starten kannst. Bist du da gerade noch ganz am Anfang?"

Wenn das konkrete Angebot anders ist, übertrage nur das Prinzip und nutze ausschließlich die tatsächlich hinterlegten Angebotsinformationen.

SALES-STUFEN
1. discovery = Situation verstehen
2. painpoint = echtes Problem verstehen
3. goal = konkretes Ziel verstehen
4. qualification = prüfen, ob das Angebot passt
5. solution = passende Lösung erklären
6. objection = offenen Einwand klären
7. close = nächsten sinnvollen Schritt anbieten

GESPRÄCHSREGELN
- Normalerweise 1 bis 2 kurze Sätze.
- Bei sehr kurzen Lead-Nachrichten möglichst maximal 2 kurze Sätze.
- Höchstens eine klare Frage pro Nachricht.
- Nicht jede Nachricht muss mit einer Frage enden.
- Reagiere zuerst auf die konkrete letzte Aussage.
- Keine Interview-Kette.
- Frage nie etwas erneut, das im Memory oder in den letzten Nachrichten bereits geklärt ist.
- Nicht sofort pitchen.
- Das Angebot erst genauer erklären, wenn es zur Frage oder zum Gesprächsstand passt.
- Checkout oder Termin erst bei erkennbarem Fit oder wenn die Person danach fragt.
- Wenn kein Fit erkennbar ist, nicht pushen.
- Kein künstlicher Druck, keine falsche Knappheit, keine Garantien.
- Keine erfundenen Resultate.
- Keine Schuldgefühle oder Angst als Verkaufshebel.
- Sensible persönliche Eigenschaften niemals ableiten oder für den Verkauf verwenden.

NATÜRLICHE DM-STATT-KI-SPRACHE
Vermeide:
- "Ich verstehe, dass ..."
- "Das klingt so, als ob ..."
- "Es ist völlig verständlich, dass ..."
- "Vielen Dank, dass du das teilst."
- "Was bereitet dir dabei die größten Sorgen?"
- "Wie kann ich dich dabei unterstützen?"
- "Lass uns gemeinsam herausfinden ..."
- "Das ist mein Angebot für Menschen, die ..."
- "Ich helfe ihnen ..."

Lieber:
- "Ja, versteh ich."
- "Ah okay."
- "Macht Sinn."
- "Kurz gesagt: ..."
- "Im Kern geht’s darum, ..."
- "Ist es eher X oder Y?"
- "Bist du da noch ganz am Anfang?"
- "Wo hängst du gerade am ehesten?"

OUTPUT
Neben der sichtbaren DM-Antwort musst du den Lead-Zustand und das Style Profile strukturiert aktualisieren.
Der Score ist nur eine interne Fit-/Kaufbereitschaftsschätzung, keine Gewissheit.`;
}


function analysisSystemPrompt(agent: D1Row) {
  return `Du bist die interne Lead-Analyse eines Instagram-Sales-Agents.

DEINE AUFGABE:
Analysiere ausschließlich den Gesprächsverlauf und aktualisiere den strukturierten Lead-Zustand.
Du schreibst NICHT die sichtbare Kundenantwort. Setze das Feld "reply" immer exakt auf "ANALYSIS_ONLY".

ANGEBOT
Name: ${agent.offer_name || agent.offerName || ''}
Verbindliches Produktwissen / Knowledge Base:
${agent.offer_description || agent.productKnowledge || 'Keine zusätzlichen Produktfakten hinterlegt.'}
Preis: ${agent.price_text || agent.price || ''}
Raten / Preisoptionen: ${agent.payment_plan_text || agent.paymentPlan || 'Nicht hinterlegt'}
Zahlungsarten: ${agent.payment_methods || agent.paymentMethods || 'Nicht hinterlegt'}
Zahlungshinweis: ${agent.payment_hint || agent.paymentHint || 'Nicht hinterlegt'}
Zahlungshinweis direkt bei Preisfrage: ${(agent.show_payment_hint_with_price ?? agent.showPaymentHintWithPrice) ? 'JA' : 'NEIN'}
Checkout CTA: ${agent.checkout_cta_text || agent.checkoutCta || 'Hier kannst du direkt starten:'}
Zielgruppe: ${agent.audience || ''}
Painpoints: ${agent.pain_points || agent.painPoints || ''}
Gewünschte Ergebnisse: ${agent.outcomes || ''}
Typische Einwände: ${agent.objections || ''}

EXTRAKTIONSREGELN
- Verwende nur Informationen, die aus den Lead-Nachrichten oder dem bestehenden Memory belegbar sind.
- Nichts erfinden.
- Unbekannt bleibt "Unklar".
- Neuere klare Aussagen überschreiben ältere widersprüchliche Aussagen.
- "known_facts" muss reiner Text mit maximal 8 Zeilen sein. Jede Zeile beginnt mit "- ". KEIN JSON, keine eckigen Klammern.
- "open_questions" muss reiner Text mit maximal 4 Zeilen sein. Jede Zeile beginnt mit "- ". KEIN JSON, keine eckigen Klammern.
- "summary" maximal 3 kurze Sätze.
- "next_step" genau ein konkreter nächster Gesprächsschritt.
- Style Profile ausschließlich aus der Art ableiten, wie der Lead tatsächlich schreibt.

STAGE-LOGIK
- discovery: bisher nur Interesse/Neugier oder Ausgangslage wird geklärt.
- painpoint: ein konkretes Problem/Hindernis wurde erkennbar.
- goal: ein konkretes gewünschtes Ergebnis/Ziel ist klar und steht im Fokus.
- qualification: Ziel + Problem + grundlegender Fit sind ausreichend klar.
- solution: die passende Lösung wird bereits konkret besprochen.
- objection: ein konkreter Kauf-/Umsetzungseinwand ist offen.
- close: der Lead zeigt klare Abschlussbereitschaft oder fragt nach Start/Checkout.

SCORE-RICHTWERT
- 0-10: nur allgemeine Neugier.
- 15-30: relevante Ausgangslage oder grobes Ziel erkennbar.
- 35-55: klares Ziel oder klarer Painpoint + erkennbarer Fit.
- 60-75: konkrete Lösungs-/Preisfragen oder starker Fit.
- 76-90: echter Einwand bei weiterhin erkennbarem Interesse.
- 91-100: klare Abschlussabsicht / fragt nach Start oder Checkout.
Der Score ist eine vorsichtige interne Einschätzung, keine Gewissheit.

GESPRÄCHSPLANUNG — SEHR WICHTIG
Fülle zusätzlich diese Felder aus:

lead_intent:
Beschreibe knapp, was die ALLERLETZTE Lead-Nachricht gerade will, z. B.
- erstkontakt
- produktfrage
- wie_funktioniert_es
- preisfrage
- zahlungsfrage
- einwand
- erfahrung
- ziel
- painpoint
- kurze_zustimmung
- start_absicht
- sonstiges

reply_mode:
Einer dieser Werte:
- answer = direkte Frage sachlich beantworten
- acknowledge = neue Aussage kurz menschlich aufnehmen
- qualify = genau eine wirklich notwendige Information erfragen
- clarify = nur wenn die Nachricht tatsächlich unklar ist
- objection = konkreten Einwand behandeln
- close = bei klarer Start-/Kaufabsicht direkt zum nächsten Schritt führen

reply_goal:
Ein kurzer konkreter Satz, was die nächste sichtbare Antwort erreichen soll.

must_answer:
Wenn der Lead eine direkte Frage stellt, schreibe hier die Information, die zwingend beantwortet werden muss.
Wenn der Lead nur "ja", "ja gerne", "okay", "gern" o. ä. schreibt, bezieht sich das auf die unmittelbar vorherige AI-Frage oder das vorherige Angebot. Dann steht hier, WAS die AI zuvor versprochen hat zu erklären. Thema NICHT wechseln.
Sonst: "Keine".

should_ask_question:
Nur true, wenn eine Frage wirklich nötig ist, um sinnvoll weiterzukommen.
Nicht automatisch nach jeder Nachricht fragen.

question_goal:
Wenn should_ask_question=true: Welche EINE Information soll die Frage klären?
Sonst: "Keine".

should_send_checkout:
Nur true, wenn der Lead klar sagt, dass er starten/kaufen will oder ausdrücklich nach dem Checkout/Start-Link fragt.

WICHTIGE PLANUNGSREGELN:
- Ein kurzes "ja gerne" ist eine Zustimmung zur vorherigen AI-Frage. Erfülle das Versprechen zuerst. Stelle NICHT direkt wieder eine neue Erlaubnisfrage.
- Wenn die letzten zwei AI-Nachrichten bereits Fragen waren, bevorzuge eine wertgebende Antwort ohne neue Frage.
- Wenn der Lead neue inhaltliche Information liefert (z. B. "ich bin noch ganz am Anfang"), darf die nächste Antwort NICHT nur "Okay.", "Ja.", "Genau." oder eine andere leere Bestätigung sein.
- Wenn durch die neue Information ein sinnvoller nächster Punkt offen ist, darf should_ask_question=true sein. Stelle dann genau EINE natürliche Frage.
- Wenn der Lead sagt, dass er ganz am Anfang ist und Ziel/Painpoint noch unklar sind, markiere ihn als Anfänger und frage höchstens nach EINEM der beiden Punkte.
- Frage den Lead nicht nach der Lösung seines eigenen Problems. Beispiel schlecht: "Was denkst du, wäre der erste Schritt?"
- Bei einer konkreten Produktfrage hat die Antwort Vorrang vor weiterer Qualifizierung.
- Bei klarer Startabsicht: close, should_send_checkout=true, keine weitere Qualifizierungsfrage.
- Bei "Ich weiß nicht wo ich anfangen soll" ist das ein Painpoint, kein Anlass für einen sofortigen Produktpitch.

WICHTIG:
Wenn der Lead z. B. sagt "Ich möchte mir neben meinem Job online was aufbauen, weiß aber nicht womit ich anfangen soll", dann sind mindestens Ziel und Painpoint nicht mehr "Unklar".`;
}

function naturalReplySystemPrompt(agent: D1Row, lead: D1Row, firstContact: boolean, retryNote = '') {
  const context = leadContextPrompt(lead);
  const currentStage = safeStage(lead.stage || lead.current_stage);

  return `Du schreibst NUR die nächste sichtbare Instagram-DM eines menschlich wirkenden Verkäufers.
Kein JSON. Keine Analyse. Keine Labels. Nur die Nachricht, die der Lead sehen soll.

ANGEBOT — DAS SIND DIE EINZIG ERLAUBTEN PRODUKTFAKTEN
Name: ${agent.offer_name || agent.offerName || ''}

VERBINDLICHE KNOWLEDGE BASE
${agent.offer_description || agent.productKnowledge || 'Keine zusätzlichen Produktfakten hinterlegt.'}

Preis/Zahlungsoptionen: ${agent.price_text || agent.price || ''}
Zielgruppe: ${agent.audience || ''}
Painpoints: ${agent.pain_points || agent.painPoints || ''}
Gewünschte Ergebnisse: ${agent.outcomes || ''}
Typische Einwände: ${agent.objections || ''}
Checkout: ${agent.checkout_url || agent.checkoutUrl || ''}
Termin: ${agent.booking_url || agent.bookingUrl || ''}
Grundton: ${agent.tone || 'Natürlich, direkt, freundlich und kurz.'}

SCHREIBSTIL-BEISPIELE DES ACCOUNT-INHABERS
${agent.system_instructions || agent.voiceExamples || 'Keine Beispiele hinterlegt.'}

ZUSÄTZLICHE SALES-REGELN
${agent.qualification_rules || agent.salesRules || 'Keine zusätzlichen Regeln hinterlegt.'}

ZUSÄTZLICHE GUARDRAILS
${agent.guardrails || 'Keine zusätzlichen Guardrails hinterlegt.'}

WICHTIG ZU DEN SCHREIBSTIL-BEISPIELEN:
- Nutze sie NUR als Referenz für Rhythmus, Wortwahl, Kürze und Ton.
- Übernimm daraus KEINE Produktfakten, Preise oder Versprechen.
- Kopiere keine Beispielnachricht wörtlich, wenn sie nicht zum aktuellen Kontext passt.

WICHTIGE GROUNDING-REGEL:
- Die Knowledge Base und die übrigen Angebotsfelder sind die einzige Wahrheit für konkrete Produktfragen.
- Erfinde KEINE Produktkategorie, Funktion, Leistung, Verdienstmöglichkeit, Zahlungsoption, Modulzahl oder Eigenschaft, die dort nicht steht.
- Nenne das Angebot NICHT "Tool", "Software", "App", "Plattform", "Coaching", "Kurs" oder ähnliches, wenn genau dieses Wort nicht in den Produktfakten vorkommt.
- Erfinde keine Funktionen wie "Plattform erstellen", "Kunden automatisch ansprechen", "Ads schalten" oder Ähnliches.
- Wenn der Lead eine konkrete Produktfrage stellt, beantworte sie zuerst ausschließlich aus den hinterlegten Fakten.
- Wenn der Lead eine Anzahl oder Liste anspricht, z. B. "Ich dachte es gibt 3 Wege?", verwende exakt die entsprechende Liste aus der Knowledge Base und erfinde keine Ersatzpunkte.
- Wenn die gesuchte Information nicht hinterlegt ist, sage knapp, dass diese konkrete Info im Produktwissen nicht hinterlegt ist. Rate NICHT und ergänze NICHT aus allgemeinem Wissen.
- Eine Produktfrage ist kein Grund, automatisch zu pitchen oder die Sales-Stage künstlich hochzustufen.

${context}

AKTUELLE INTERNE STAGE: ${currentStage}

VERBINDLICHER REPLY-PLAN
Lead-Intent: ${lead.lead_intent || 'sonstiges'}
Reply-Modus: ${lead.reply_mode || 'qualify'}
Ziel dieser Antwort: ${lead.reply_goal || lead.next_step || 'Natürlich weiterführen'}
Zwingend beantworten: ${lead.must_answer || 'Keine'}
Neue Frage stellen: ${lead.should_ask_question === true ? 'JA' : 'NEIN'}
Ziel der Frage: ${lead.question_goal || 'Keine'}
Checkout senden: ${lead.should_send_checkout === true ? 'JA' : 'NEIN'}

Der Reply-Plan ist bindend:
- Wenn "Neue Frage stellen: NEIN", ende NICHT mit einer neuen Frage. Schreibe trotzdem eine inhaltlich vollständige Antwort und nicht nur "Okay." oder "Ja.".
- Wenn "Zwingend beantworten" nicht "Keine" ist, beantworte genau das zuerst.
- Wenn "Checkout senden: JA" und ein Checkout-Link hinterlegt ist, sende ihn direkt und ohne weitere Qualifizierung.
- Wenn Reply-Modus "answer" ist, beantworte die Frage; verkaufe nicht zusätzlich ungefragt.
- Wenn Reply-Modus "acknowledge" ist, reagiere menschlich auf die Aussage, ohne sie als "Problem", "Einwand" oder "großartig" zu labeln.

HARTE REGELN FÜR DIE SICHTBARE DM
1. Antworte IMMER auf die allerletzte Lead-Nachricht, nicht auf eine ältere Nachricht.
2. Wiederhole niemals einfach eine frühere AI-Antwort aus dem Verlauf.
3. Greife neue Informationen des Leads konkret auf.
4. Wenn der Lead eine direkte Frage stellt, beantworte sie zuerst.
5. Maximal 1-2 kurze Sätze und höchstens eine Frage.
6. Keine Landingpage-Sprache, kein Monolog, kein künstlicher Pitch.
7. Verbotene Floskeln: "Kein Problem", "Das ist großartig", "großartiger Startpunkt", "super Startpunkt", "ganz normaler Startpunkt", "ganz normaler Einwand", "Viele Leute wie du", "Ich bin froh", "Ich verstehe, dass", "Vielen Dank", "Lass uns gemeinsam".
8. Sprich direkt mit dem Lead.
9. "du/dein/dir/dich" im Lead => konsequent duzen. "Sie/Ihnen/Ihr" => konsequent siezen.
10. Keine bereits geklärte Frage erneut stellen.
11. Emojis nur, wenn sie zum Stil des Leads passen.
12. Rechtschreibfehler nicht künstlich kopieren.
13. Keine erfundenen Fakten, Garantien, falsche Knappheit oder Druck.
14. Wenn Ziel oder Painpoint gerade erst klar geworden sind, NICHT sofort das Angebot pitchen. Erst noch natürlich qualifizieren.
15. Wenn der Lead nach Preis/Kosten/Raten/Klarna fragt und Preis/Zahlungsoptionen oben hinterlegt sind, nenne diese KONKRET. Sage niemals "variiert", "kommt darauf an" oder "verschiedene Optionen", wenn ein konkreter Preis hinterlegt ist.
15a. Zahlungsinformationen sind vollständig agent-spezifisch. Verwende ausschließlich die oben hinterlegten Felder Preis, Raten/Preisoptionen, Zahlungsarten und Zahlungshinweis.
- Wenn "Zahlungshinweis direkt bei Preisfrage: JA", füge den hinterlegten Zahlungshinweis bei einer allgemeinen Preisfrage direkt hinzu.
- Wenn "NEIN", nenne ihn nur, wenn er zur konkreten Frage passt.
- Erfinde niemals eine Zahlungsart, Rate, Finanzierung, Ersparnis oder Verfügbarkeit.
- Wenn ein Zahlungsfeld leer ist, verschweige es.
16. Bei konkreten Produktfragen wie "Wie verdient man damit?", "Was ist enthalten?" oder "Welche Wege gibt es?" hat die sachlich korrekte Antwort aus der Knowledge Base Vorrang vor einer weiteren Qualifizierungsfrage.
16a. Bei einer sachlichen Informationsfrage beginne DIREKT mit der Antwort. Kein vorgeschaltetes Lob, keine Validierung und kein Empathie-Füllsatz.
Beispiel:
Lead: "Kannst du mir erklären, wie das funktioniert?"
Gut: "Ja. Im RCC gibt's im Kern 3 Wege: ..."
Schlecht: "Ja, das ist ein berechtigter Punkt. Im RCC ..."
17. Sag NICHT "Das ist okay", "Das ist völlig okay", "Das ist ein großes Problem", "Das ist ein berechtigter Punkt", "berechtigter Punkt", "speziell für Menschen wie dich", "umfassendes System" oder "Viele Leute ...". Das wirkt wie Bot-/Sales-Sprache.
18. Verwende "Möchtest du wissen ...?", "Willst du wissen ...?" oder "Soll ich dir erklären ...?" nur ausnahmsweise. Wenn der Lead bereits "ja/ja gerne/okay" auf so eine Frage geantwortet hat, MUSST du die versprochene Information liefern und darfst nicht erneut um Erlaubnis fragen.
19. Wiederhole den Angebotsnamen nicht in jeder Nachricht. Wenn er im direkten Kontext bereits klar ist, sprich natürlicher mit "das", "dabei" oder direkt über den Inhalt.
20. Wiederhole auch Formulierungen wie "Schritt für Schritt" nicht ständig. Variiere natürlich.
21. Keine künstliche Euphorie. Ein normales "Okay", "Ja", "Genau" oder direkte Antwort wirkt menschlicher als Lob.
22. Wenn der Lead sagt, dass er starten/kaufen will, antworte knapp und handlungsorientiert. Kein "Großartig!", kein "Wenn du bereit bist", kein erneuter Pitch.
23. Nutze keine Bewertungsfloskeln wie "guter Ansatz", "super Startpunkt", "völlig okay", "kein Problem" oder "berechtigter Punkt". Reagiere auf den Inhalt statt die Aussage zu bewerten.
24. Vermeide Gesprächsschleifen. Wenn du etwas bereits erklärt hast, frage nicht erneut, ob du es erklären sollst.
25. Eine Nachricht darf auch einfach mit einer Aussage enden. Du musst das Gespräch nicht künstlich mit einer Frage offenhalten.
26. Bei einem Einwand oder einer Sorge: erst konkret darauf eingehen. Kein pauschales Beruhigen.

${firstContact ? `ERSTKONTAKT:
- Nicht pitchen.
- Bei "Was ist das?", "Wie funktioniert das?" oder "Worum geht's?" zuerst in EINEM einfachen Satz erklären, was das Angebot im Kern macht.
- Nutze dabei den echten Angebotsnamen, wenn das natürlich passt.
- Danach höchstens eine natürliche Discovery-Frage.
- Preis/Checkout nicht ungefragt nennen.
- Beispiel-Struktur: "${agent.offer_name || agent.offerName || 'Das Angebot'} hilft dir Schritt für Schritt dabei, [nur belegtes Ergebnis]. Bist du da noch ganz am Anfang?"
- Keine erfundene Bezeichnung wie "Tool" oder "Plattform".` : `LAUFENDES GESPRÄCH:
- Nutze den bisherigen Verlauf.
- Wenn der Lead gerade Ziel oder Problem genannt hat, reagiere genau darauf und qualifiziere weiter.
- Bei Stage discovery/painpoint/goal: NICHT ungefragt pitchen.
- Bei qualification darfst du den Fit vorsichtig herstellen.
- Bei solution darfst du das Angebot konkret erklären.
- Bei objection klärst du genau den Einwand.
- Bei close darfst du einen klaren CTA setzen.`}

GUTE TONALITÄT:
Locker, konkret und wie eine echte DM.
Gut: "Okay, dann ist dein Ziel schon ziemlich klar. Was hast du bisher schon ausprobiert?"
Schlecht: "Das ist ein großartiger Plan! Ich habe ein Paket, das dir helfen könnte."

${retryNote ? `WICHTIGER RETRY-HINWEIS:
${retryNote}
Formuliere die Antwort komplett neu und korrigiere diesen Fehler.` : ''}

Antworte jetzt ausschließlich mit der nächsten sichtbaren DM.`;
}

function normalizeListText(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((item) => `- ${item.replace(/^-+\s*/, '')}`)
      .join('\n');
  }

  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeListText(parsed);
    } catch {
      // Plain text fallback below.
    }
  }

  return raw;
}

function cleanNaturalReply(value: unknown) {
  let raw = String(value ?? '').trim();
  if (!raw) return '';

  raw = stripCodeFence(raw);

  // Defensive fallback if a model unexpectedly returns {"reply":"..."}.
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.reply === 'string') raw = parsed.reply.trim();
    } catch {
      // Keep raw text.
    }
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  return raw;
}

function safeStage(value: unknown): SalesTurn['stage'] {
  const stage = String(value || '');
  return ['discovery','painpoint','goal','qualification','solution','objection','close'].includes(stage)
    ? stage as SalesTurn['stage']
    : 'discovery';
}

function safeTemperature(value: unknown): SalesTurn['temperature'] {
  const temp = String(value || '');
  return ['cold','warm','hot'].includes(temp)
    ? temp as SalesTurn['temperature']
    : 'cold';
}

function fallbackTurnFromLead(lead: D1Row, reply: string): SalesTurn {
  const memory = parseJsonObject(lead.memory_json || lead.memoryJson);
  const style = parseJsonObject(lead.style_profile_json || lead.styleProfile);

  return {
    reply,
    stage: safeStage(lead.stage || lead.current_stage),
    temperature: safeTemperature(lead.temperature),
    score: Math.max(0, Math.min(100, Number(lead.score || 0))),
    goal: String(memory.goal || lead.goal || 'Unklar'),
    pain_point: String(memory.painPoint || memory.pain_point || lead.pain_point || lead.painPoint || 'Unklar'),
    experience: String(memory.experience || lead.experience || 'Unklar'),
    budget: String(memory.budget || lead.budget || 'Unklar'),
    objection: String(memory.objection || lead.objection || 'Unklar'),
    summary: String(memory.summary || lead.summary || ''),
    known_facts: normalizeListText(memory.knownFacts || memory.known_facts || ''),
    open_questions: normalizeListText(memory.openQuestions || memory.open_questions || ''),
    next_step: String(memory.nextStep || memory.next_step || lead.next_step || 'Natürlich weiter verstehen'),
    lead_intent: String(lead.lead_intent || 'sonstiges'),
    reply_mode: String(lead.reply_mode || 'qualify'),
    reply_goal: String(lead.reply_goal || ''),
    must_answer: String(lead.must_answer || 'Keine'),
    should_ask_question: Boolean(lead.should_ask_question),
    question_goal: String(lead.question_goal || 'Keine'),
    should_send_checkout: Boolean(lead.should_send_checkout),
    style_language: String(style.language || 'Noch erkennen'),
    style_address: String(style.address || 'Noch erkennen'),
    style_formality: String(style.formality || 'Noch erkennen'),
    style_sentence_length: String(style.sentenceLength || style.sentence_length || 'Noch erkennen'),
    style_message_length: String(style.messageLength || style.message_length || 'Noch erkennen'),
    style_emoji_usage: String(style.emojiUsage || style.emoji_usage || 'Noch erkennen'),
    style_slang: String(style.slang || 'Noch erkennen'),
    style_energy: String(style.energy || 'Noch erkennen'),
    style_directness: String(style.directness || 'Noch erkennen'),
    style_humor: String(style.humor || 'Noch erkennen'),
    style_punctuation: String(style.punctuation || 'Noch erkennen'),
    style_notes: String(style.notes || ''),
  };
}

async function runNaturalReply(
  env: Env,
  agent: D1Row,
  lead: D1Row,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  firstContact: boolean,
  retryNote = '',
) {
  if (!env.AI) return '';

  try {
    const latestLead = [...history].reverse().find((m) => m.role === 'user')?.content || '';
    const previousAI = [...history].reverse().find((m) => m.role === 'assistant')?.content || '';
    const recentAI = history.filter((m) => m.role === 'assistant').slice(-2);
    const recentQuestionCount = recentAI.filter((m) => /\?\s*$/.test(m.content.trim())).length;
    const shortConsent = /^\s*(ja|ja gern|ja gerne|gerne|gern|okay|ok|klar|genau|mach|bitte|yes|sure)[.! ]*$/i.test(latestLead);

    const continuity = `UNMITTELBARER GESPRÄCHSKONTEXT
Vorherige AI-Nachricht: ${previousAI || 'Keine'}
Letzte Lead-Nachricht: ${latestLead || 'Keine'}
Fragen in den letzten 2 AI-Nachrichten: ${recentQuestionCount}

${shortConsent && previousAI ? `WICHTIG: Die letzte Lead-Nachricht ist eine kurze Zustimmung zur vorherigen AI-Nachricht. Erfülle jetzt exakt das, was du unmittelbar davor angeboten oder gefragt hast. Wechsle NICHT das Thema und stelle NICHT wieder eine Erlaubnisfrage.` : ''}
${recentQuestionCount >= 2 ? 'Die letzten AI-Nachrichten waren bereits sehr frage-lastig. Gib jetzt möglichst erst echten Inhalt/Wert und stelle nur dann eine Frage, wenn der Reply-Plan sie zwingend verlangt.' : ''}`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: naturalReplySystemPrompt(agent, lead, firstContact, retryNote) },
      { role: 'system', content: continuity },
      ...history,
    ];

    const result: any = await env.AI.run(
      aiModel(env) as any,
      {
        messages,
        temperature: retryNote ? 0.30 : 0.55,
        max_tokens: 170,
      } as any,
    );

    return cleanNaturalReply(extractWorkersAIValue(result));
  } catch (error) {
    console.error('Natural reply generation failed:', error);
    return '';
  }
}

function parseJsonObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function leadContextPrompt(lead: D1Row) {
  const memory: Record<string, any> = {
    goal: lead.goal || 'Unklar',
    painPoint: lead.pain_point || lead.painPoint || 'Unklar',
    experience: lead.experience || 'Unklar',
    budget: lead.budget || 'Unklar',
    objection: lead.objection || 'Unklar',
    summary: lead.summary || '',
    ...parseJsonObject(lead.memory_json || lead.memoryJson),
  };

  const style = parseJsonObject(lead.style_profile_json || lead.styleProfile);

  return `LEAD MEMORY
Ziel: ${memory.goal || 'Unklar'}
Painpoint: ${memory.painPoint || memory.pain_point || 'Unklar'}
Erfahrung: ${memory.experience || 'Unklar'}
Budget: ${memory.budget || 'Unklar'}
Einwand: ${memory.objection || 'Unklar'}
Zusammenfassung: ${memory.summary || 'Noch keine Zusammenfassung'}
Bereits geklärt:
${memory.knownFacts || memory.known_facts || 'Noch nichts belastbar gespeichert'}
Noch offen:
${memory.openQuestions || memory.open_questions || 'Noch offen'}
Nächster sinnvoller Schritt:
${memory.nextStep || memory.next_step || lead.next_step || 'Natürlich weiter verstehen'}

STYLE PROFILE
Sprache: ${style.language || 'Noch erkennen'}
Anrede: ${style.address || 'Noch erkennen'}
Formalität: ${style.formality || 'Noch erkennen'}
Satzlänge: ${style.sentenceLength || style.sentence_length || 'Noch erkennen'}
Nachrichtenlänge: ${style.messageLength || style.message_length || 'Noch erkennen'}
Emoji-Nutzung: ${style.emojiUsage || style.emoji_usage || 'Noch erkennen'}
Slang: ${style.slang || 'Noch erkennen'}
Energie: ${style.energy || 'Noch erkennen'}
Direktheit: ${style.directness || 'Noch erkennen'}
Humor: ${style.humor || 'Noch erkennen'}
Interpunktion: ${style.punctuation || 'Noch erkennen'}
Notizen: ${style.notes || 'Keine'}

Nutze dieses Memory als langfristigen Kontext. Nutze die folgenden letzten Nachrichten für den aktuellen Gesprächsfluss und zur Aktualisierung des Style Profiles.`;
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
    const str = (key: string, fallback = 'Unklar') =>
      String(row[key] ?? fallback).trim() || fallback;

    return {
      reply: str('reply', ''),
      stage: String(row.stage) as SalesTurn['stage'],
      temperature: String(row.temperature) as SalesTurn['temperature'],
      score: Math.round(numericScore),
      goal: str('goal'),
      pain_point: str('pain_point'),
      experience: str('experience'),
      budget: str('budget'),
      objection: str('objection'),
      summary: str('summary', ''),
      known_facts: normalizeListText(row.known_facts),
      open_questions: normalizeListText(row.open_questions),
      next_step: str('next_step', ''),
      lead_intent: str('lead_intent', 'sonstiges'),
      reply_mode: str('reply_mode', 'qualify'),
      reply_goal: str('reply_goal', ''),
      must_answer: str('must_answer', 'Keine'),
      should_ask_question: Boolean(row.should_ask_question),
      question_goal: str('question_goal', 'Keine'),
      should_send_checkout: Boolean(row.should_send_checkout),
      style_language: str('style_language', 'Noch erkennen'),
      style_address: str('style_address', 'Noch erkennen'),
      style_formality: str('style_formality', 'Noch erkennen'),
      style_sentence_length: str('style_sentence_length', 'Noch erkennen'),
      style_message_length: str('style_message_length', 'Noch erkennen'),
      style_emoji_usage: str('style_emoji_usage', 'Noch erkennen'),
      style_slang: str('style_slang', 'Noch erkennen'),
      style_energy: str('style_energy', 'Noch erkennen'),
      style_directness: str('style_directness', 'Noch erkennen'),
      style_humor: str('style_humor', 'Noch erkennen'),
      style_punctuation: str('style_punctuation', 'Noch erkennen'),
      style_notes: str('style_notes', ''),
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
        temperature: 0.2,
        max_tokens: 950,
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
          'Antworte ausschließlich mit gültigem JSON ohne Markdown. Pflichtfelder: reply, stage, temperature, score, goal, pain_point, experience, budget, objection, summary, known_facts, open_questions, next_step, lead_intent, reply_mode, reply_goal, must_answer, should_ask_question, question_goal, should_send_checkout, style_language, style_address, style_formality, style_sentence_length, style_message_length, style_emoji_usage, style_slang, style_energy, style_directness, style_humor, style_punctuation, style_notes. stage: discovery|painpoint|goal|qualification|solution|objection|close. temperature: cold|warm|hot. score: 0-100.',
      },
    ];

    const result: any = await env.AI.run(
      model as any,
      {
        messages: fallbackMessages,
        temperature: 0.15,
        max_tokens: 950,
      } as any,
    );

    return parseSalesTurn(extractWorkersAIValue(result));
  } catch (error) {
    console.error('Workers AI failed:', error);
    return null;
  }
}

type HistoryMessage = {
  from: 'lead' | 'ai' | 'human';
  body: string;
  time?: string;
};

function turnMemoryJson(turn: SalesTurn) {
  return JSON.stringify({
    goal: turn.goal,
    painPoint: turn.pain_point,
    experience: turn.experience,
    budget: turn.budget,
    objection: turn.objection,
    summary: turn.summary,
    knownFacts: turn.known_facts,
    openQuestions: turn.open_questions,
    nextStep: turn.next_step,
  });
}

function turnStyleJson(turn: SalesTurn) {
  return JSON.stringify({
    language: turn.style_language,
    address: turn.style_address,
    formality: turn.style_formality,
    sentenceLength: turn.style_sentence_length,
    messageLength: turn.style_message_length,
    emojiUsage: turn.style_emoji_usage,
    slang: turn.style_slang,
    energy: turn.style_energy,
    directness: turn.style_directness,
    humor: turn.style_humor,
    punctuation: turn.style_punctuation,
    notes: turn.style_notes,
  });
}

async function generateSalesTurn(
  env: Env,
  agent: D1Row,
  lead: D1Row,
  history: D1Row[],
  bootstrapMemory = false,
): Promise<SalesTurn | null> {
  const contextHistory = bootstrapMemory ? history : history.slice(-10);

  const analysisMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: analysisSystemPrompt(agent) },
    { role: 'system', content: leadContextPrompt(lead) },
  ];

  const replyHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let leadMessageCount = 0;
  let latestLead = '';

  for (const message of contextHistory) {
    const body = String(message.body || '').trim();
    if (!body) continue;

    const isLead = message.direction === 'inbound';
    if (isLead) {
      leadMessageCount += 1;
      latestLead = body;
    }

    const role = isLead ? 'user' as const : 'assistant' as const;
    analysisMessages.push({ role, content: body });
    replyHistory.push({ role, content: body });
  }

  analysisMessages.push({
    role: 'system',
    content:
      'Analysiere jetzt den aktuellen Stand nach der allerletzten Lead-Nachricht. ' +
      'Setze reply exakt auf ANALYSIS_ONLY. Aktualisiere Lead-Zustand, Memory, Style UND den verbindlichen Reply-Plan. ' +
      'Ein kurzes "ja/ja gerne/okay" bezieht sich auf die unmittelbar vorherige AI-Nachricht. Thema nicht wechseln.',
  });

  const firstContact = leadMessageCount <= 1;

  // Erst verstehen/planen, dann schreiben. Niemals parallel.
  const analysis = await runWorkersAI(env, analysisMessages);
  const turn = analysis || fallbackTurnFromLead(lead, 'ANALYSIS_ONLY');
  const analyzedLead = analyzedLeadFromTurn(turn);

  const validated = await generateValidatedNaturalReply(
    env,
    agent,
    analyzedLead,
    replyHistory,
    latestLead,
    firstContact,
  );
  let naturalReply = validated.reply;
  let violation = validated.violation;

  const checkoutUrl = String(agent.checkout_url || agent.checkoutUrl || '').trim();
  const wantsToStart = /\b(ich .*starten|würde .*starten|will .*starten|möchte .*starten|kaufen|bestellen|checkout|link zum starten|wo kann ich starten|wie kann ich starten)\b/i.test(latestLead);
  if (wantsToStart && checkoutUrl) {
    const checkoutCta = String(agent.checkout_cta_text || agent.checkoutCta || 'Hier kannst du direkt starten:').trim();
    naturalReply = `${checkoutCta} ${checkoutUrl}`.trim();
    violation = '';
  }

  const priceText = String(agent.price_text || agent.price || '').trim();
  if (violation && /\b(kostet|kosten|preis|wie viel|wieviel|rate|raten|ratenzahlung)\b/i.test(latestLead) && priceText) {
    const paymentPlan = String(agent.payment_plan_text || agent.paymentPlan || '').trim();
    const paymentHint = String(agent.payment_hint || agent.paymentHint || '').trim();
    const showHint = Boolean(agent.show_payment_hint_with_price ?? agent.showPaymentHintWithPrice);
    naturalReply = [priceText, paymentPlan, showHint ? paymentHint : ''].filter(Boolean).join(' ');
    violation = '';
  }

  if (violation) {
    const paymentMethods = String(agent.payment_methods || agent.paymentMethods || '').trim();
    const paymentHint = String(agent.payment_hint || agent.paymentHint || '').trim();
    const mentionedMethod = paymentMethods
      .split(/[\n,;|]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .find((method) => new RegExp(`\\b${method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(latestLead));

    if (mentionedMethod) {
      naturalReply = [paymentMethods, paymentHint].filter(Boolean).join(' ');
      violation = '';
    }
  }

  if (!naturalReply) return null;
  turn.reply = sanitizeOutgoingAiText(naturalReply);
  if (!turn.reply || turn.reply === 'ANALYSIS_ONLY') return null;
  return turn;
}

async function activeWorkspaceAgent(env: Env, organizationId: string): Promise<D1Row> {
  if (env.DB) {
    try {
      const saved = await env.DB
        .prepare(
          'SELECT * FROM ai_agents WHERE organization_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1',
        )
        .bind(organizationId)
        .first<D1Row>();

      if (saved) return saved;
    } catch (error) {
      console.warn('Gespeicherter Agent konnte nicht geladen werden.', error);
    }
  }

  return (emptyBootstrap.agent || {}) as D1Row;
}


function isUnknownValue(value: unknown) {
  const v = String(value ?? '').trim().toLowerCase();
  return !v || ['unklar','unbekannt','noch erkennen','noch unbekannt','n/a','-'].includes(v);
}

function lastLeadText(history: HistoryMessage[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.from === 'lead') return String(history[i].body || '').trim();
  }
  return '';
}

function inferStyleFromHistory(history: HistoryMessage[]) {
  const leadTexts = history
    .filter((message) => message.from === 'lead')
    .map((message) => String(message.body || '').trim())
    .filter(Boolean);

  const joined = leadTexts.join(' ');
  const lower = joined.toLowerCase();
  const avgLen = leadTexts.length
    ? leadTexts.reduce((sum, item) => sum + item.length, 0) / leadTexts.length
    : 0;

  const usesSie = /\b(sie|ihnen|ihr|ihre|ihren)\b/.test(lower);
  const usesDu = /\b(du|dir|dich|dein|deine|deinen|deinem)\b/.test(lower) ||
    /\bhey\b/.test(lower);
  const hasEmoji = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(joined);
  const locker = /\b(hey|ehrlich|null|halt|bisschen|irgendwie|mega|puh|gar nicht|komplett)\b/.test(lower);

  return {
    language: /[äöüß]|\b(ich|und|aber|was|wie|nicht|mein|meine|mir)\b/.test(lower) ? 'deutsch' : 'Unbekannt',
    address: usesSie && !usesDu ? 'Sie' : usesDu ? 'du' : 'Unbekannt',
    formality: locker || usesDu ? 'locker' : usesSie ? 'formell' : 'Unbekannt',
    sentenceLength: avgLen && avgLen < 90 ? 'kurz' : avgLen ? 'mittel' : 'Unbekannt',
    messageLength: avgLen && avgLen < 100 ? 'kurz' : avgLen ? 'mittel' : 'Unbekannt',
    emojiUsage: hasEmoji ? 'gelegentlich' : 'keine',
    slang: locker ? 'leicht' : 'kaum',
    energy: 'ruhig',
    directness: 'direkt',
    humor: 'neutral',
    punctuation: 'normal',
    notes: 'Natürlich und knapp antworten.',
  };
}

function mergeUniqueLines(...values: unknown[]) {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const value of values) {
    const normalized = normalizeListText(value);
    for (const raw of normalized.split('\n')) {
      const item = raw.replace(/^-+\s*/, '').trim();
      if (!item) continue;
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`- ${item}`);
    }
  }

  return lines.slice(0, 8).join('\n');
}

function stabilizeAnalysis(
  turn: SalesTurn,
  previousLead: D1Row,
  history: HistoryMessage[],
) {
  const priorMemory = parseJsonObject(previousLead.memory_json || previousLead.memoryJson);
  const inferredStyle = inferStyleFromHistory(history);

  if (isUnknownValue(turn.goal) && !isUnknownValue(priorMemory.goal)) {
    turn.goal = String(priorMemory.goal);
  }
  if (isUnknownValue(turn.pain_point) && !isUnknownValue(priorMemory.painPoint || priorMemory.pain_point)) {
    turn.pain_point = String(priorMemory.painPoint || priorMemory.pain_point);
  }
  if (isUnknownValue(turn.experience) && !isUnknownValue(priorMemory.experience)) {
    turn.experience = String(priorMemory.experience);
  }
  if (isUnknownValue(turn.budget) && !isUnknownValue(priorMemory.budget)) {
    turn.budget = String(priorMemory.budget);
  }
  if (isUnknownValue(turn.objection) && !isUnknownValue(priorMemory.objection)) {
    turn.objection = String(priorMemory.objection);
  }

  const factLines: string[] = [];
  if (!isUnknownValue(turn.goal)) factLines.push(`- Ziel: ${turn.goal}`);
  if (!isUnknownValue(turn.pain_point)) factLines.push(`- Painpoint: ${turn.pain_point}`);
  if (!isUnknownValue(turn.experience)) factLines.push(`- Erfahrung: ${turn.experience}`);
  if (!isUnknownValue(turn.budget)) factLines.push(`- Budget: ${turn.budget}`);
  if (!isUnknownValue(turn.objection)) factLines.push(`- Einwand: ${turn.objection}`);

  turn.known_facts = mergeUniqueLines(
    priorMemory.knownFacts || priorMemory.known_facts,
    turn.known_facts,
    factLines.join('\n'),
  );

  const open: string[] = [];
  if (isUnknownValue(turn.goal)) open.push('- Konkretes Ziel verstehen');
  if (isUnknownValue(turn.pain_point)) open.push('- Größtes Hindernis verstehen');
  if (!isUnknownValue(turn.goal) && !isUnknownValue(turn.pain_point) && isUnknownValue(turn.experience)) {
    open.push('- Bisherige Erfahrung verstehen');
  }
  if (!isUnknownValue(turn.goal) && !isUnknownValue(turn.pain_point) && !isUnknownValue(turn.experience) && isUnknownValue(turn.objection)) {
    open.push('- Prüfen, ob noch ein echter Einwand offen ist');
  }
  turn.open_questions = open.slice(0, 4).join('\n');

  if (isUnknownValue(turn.style_language)) turn.style_language = inferredStyle.language;
  if (isUnknownValue(turn.style_address)) turn.style_address = inferredStyle.address;
  if (isUnknownValue(turn.style_formality)) turn.style_formality = inferredStyle.formality;
  if (isUnknownValue(turn.style_sentence_length)) turn.style_sentence_length = inferredStyle.sentenceLength;
  if (isUnknownValue(turn.style_message_length)) turn.style_message_length = inferredStyle.messageLength;
  if (isUnknownValue(turn.style_emoji_usage)) turn.style_emoji_usage = inferredStyle.emojiUsage;
  if (isUnknownValue(turn.style_slang)) turn.style_slang = inferredStyle.slang;
  if (isUnknownValue(turn.style_energy)) turn.style_energy = inferredStyle.energy;
  if (isUnknownValue(turn.style_directness)) turn.style_directness = inferredStyle.directness;
  if (isUnknownValue(turn.style_humor)) turn.style_humor = inferredStyle.humor;
  if (isUnknownValue(turn.style_punctuation)) turn.style_punctuation = inferredStyle.punctuation;
  if (!turn.style_notes) turn.style_notes = inferredStyle.notes;

  const stageOrder = ['discovery','painpoint','goal','qualification','solution','objection','close'];
  const currentIndex = Math.max(0, stageOrder.indexOf(turn.stage));
  let floorIndex = 0;
  if (!isUnknownValue(turn.pain_point)) floorIndex = Math.max(floorIndex, 1);
  if (!isUnknownValue(turn.goal)) floorIndex = Math.max(floorIndex, 2);
  if (!isUnknownValue(turn.goal) && !isUnknownValue(turn.pain_point) && !isUnknownValue(turn.experience)) {
    floorIndex = Math.max(floorIndex, 3);
  }
  turn.stage = stageOrder[Math.max(currentIndex, floorIndex)] as SalesTurn['stage'];

  let scoreFloor = 5;
  if (!isUnknownValue(turn.goal) || !isUnknownValue(turn.pain_point)) scoreFloor = 20;
  if (!isUnknownValue(turn.goal) && !isUnknownValue(turn.pain_point)) scoreFloor = 35;
  if (!isUnknownValue(turn.goal) && !isUnknownValue(turn.pain_point) && !isUnknownValue(turn.experience)) scoreFloor = 45;
  if (!isUnknownValue(turn.objection)) scoreFloor = Math.max(scoreFloor, 65);
  turn.score = Math.max(turn.score, scoreFloor);

  turn.temperature = turn.score >= 70 ? 'hot' : turn.score >= 30 ? 'warm' : 'cold';

  if (isUnknownValue(turn.goal)) {
    turn.next_step = 'Ziel konkretisieren';
  } else if (isUnknownValue(turn.pain_point)) {
    turn.next_step = 'Größtes Hindernis verstehen';
  } else if (isUnknownValue(turn.experience)) {
    turn.next_step = 'Bisherige Erfahrung verstehen';
  } else if (!isUnknownValue(turn.objection)) {
    turn.next_step = 'Einwand konkret klären';
  } else if (turn.stage === 'qualification') {
    turn.next_step = 'Fit prüfen und erst dann die passende Lösung erklären';
  }

  return turn;
}

function analyzedLeadFromTurn(turn: SalesTurn): D1Row {
  return {
    stage: turn.stage,
    current_stage: turn.stage,
    temperature: turn.temperature,
    score: turn.score,
    goal: turn.goal,
    pain_point: turn.pain_point,
    experience: turn.experience,
    budget: turn.budget,
    objection: turn.objection,
    summary: turn.summary,
    next_step: turn.next_step,
    lead_intent: turn.lead_intent,
    reply_mode: turn.reply_mode,
    reply_goal: turn.reply_goal,
    must_answer: turn.must_answer,
    should_ask_question: turn.should_ask_question,
    question_goal: turn.question_goal,
    should_send_checkout: turn.should_send_checkout,
    memory_json: turnMemoryJson(turn),
    style_profile_json: turnStyleJson(turn),
  };
}

function compactDigits(value: string) {
  return value.replace(/\D/g, '');
}


function cleanConversationReply(value: string, shouldAskQuestion = true) {
  let reply = String(value || '').trim();
  if (!reply) return '';

  const cannedOpenings = [
    /^(?:hey[,! ]*)?das ist (?:völlig )?okay[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist (?:ein )?super startpunkt[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist (?:ein )?großartiger startpunkt[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist ein guter ansatz[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist ein berechtigter punkt[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist ein großes problem[.!]\s*/i,
    /^(?:hey[,! ]*)?das ist kein problem[.!]\s*/i,
    /^(?:hey[,! ]*)?kein problem[.!]\s*/i,
    /^(?:hey[,! ]*)?(?:großartig|perfekt|super)[.!]\s*/i,
    /^(?:hey[,! ]*)?vielen dank[^.!?]*[.!]\s*/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of cannedOpenings) {
      const next = reply.replace(pattern, '').trim();
      if (next !== reply) {
        reply = next;
        changed = true;
      }
    }
  }

  reply = reply
    .replace(/^Ich denke, wir sollten erstmal schauen,/i, 'Dann schauen wir erstmal,')
    .replace(/^Ich denke, wir sollten erstmal /i, 'Dann ')
    .replace(/^Affiliate-Marketing kann tatsächlich /i, 'Affiliate-Marketing kann ')
    .replace(/\bDas könnte für dich eine bessere Option sein\.?$/i, '')
    .trim();

  // German prices sometimes come back as "1. 197 €". Normalize only obvious thousands formatting.
  reply = reply
    .replace(/(\d)\.\s+(\d{3})(?=\D|$)/g, '$1.$2')
    .replace(/(\d)\s+\.\s*(\d{3})(?=\D|$)/g, '$1.$2');

  // Do NOT cut sentences here. Abbreviations such as "bzw." and "z. B." were previously
  // mistaken for sentence endings and produced broken replies like "Reichweite bzw.".
  // Length is validated separately and retried by the conversation validator.

  return reply;
}

async function generateValidatedNaturalReply(
  env: Env,
  agent: D1Row,
  lead: D1Row,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  latestLead: string,
  firstContact: boolean,
) {
  let retryNote = '';
  let lastReply = '';
  let lastViolation = '';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await runNaturalReply(env, agent, lead, history, firstContact, retryNote);
    const reply = cleanConversationReply(raw, lead.should_ask_question !== false);

    if (!reply) {
      retryNote = 'Die vorige Antwort war leer. Schreibe kurz und konkret auf die letzte Lead-Nachricht.';
      continue;
    }

    const violation = naturalReplyViolation(
      reply, agent, latestLead, firstContact, lead, history,
    );

    lastReply = reply;
    lastViolation = violation;

    if (!violation) return { reply, violation: '' };

    retryNote =
      `${violation}\nKeine Standardfloskel und keine leere Ein-Wort-Bestätigung als Ersatz verwenden. Direkt, knapp und wie eine echte Instagram-DM formulieren.`;
  }

  const finalReply = cleanConversationReply(lastReply, lead.should_ask_question !== false);
  const finalViolation = finalReply
    ? naturalReplyViolation(finalReply, agent, latestLead, firstContact, lead, history)
    : lastViolation || 'Keine valide Antwort erzeugt.';

  return { reply: finalReply, violation: finalViolation };
}

function sanitizeOutgoingAiText(value: string) {
  let text = String(value || '').trim();
  if (!text) return '';

  // Instagram DMs are plain text. Convert Markdown links to normal URLs.
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) => {
      const cleanLabel = String(label || '').trim();
      const cleanUrl = String(url || '').trim();
      if (!cleanLabel || cleanLabel === cleanUrl || /^https?:\/\//i.test(cleanLabel)) {
        return cleanUrl;
      }
      return `${cleanLabel}: ${cleanUrl}`;
    },
  );

  // Remove common Markdown decoration that should never be visible in an Instagram DM.
  text = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([.!?,;:_-])/g, '$1')
    .replace(/(\d)\.\s+(\d{3})(?=\D|$)/g, '$1.$2')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function sentenceCountForDm(value: string) {
  let safe = String(value || '');

  // Protect common German abbreviations and thousands separators from sentence splitting.
  safe = safe
    .replace(/\b(bzw|ca|etc|inkl|zzgl|ggf|evtl|bspw|usw)\./gi, (_m, word) => `${word}§`)
    .replace(/\bz\.\s*b\./gi, 'z§ B§')
    .replace(/\bd\.\s*h\./gi, 'd§ h§')
    .replace(/\bu\.\s*a\./gi, 'u§ a§')
    .replace(/(\d)\.(\d{3})(?=\D|$)/g, '$1§$2')
    .replace(/https?:\/\/\S+/gi, (url) => url.replace(/[.!?]/g, '§'));

  return safe
    .split(/[.!?]+(?:\s|$)/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function isEmptyAcknowledgement(value: string) {
  return /^(okay|ok|ja|genau|klar|mhm|hm|verstehe|macht sinn)[.! ]*$/i.test(
    String(value || '').trim(),
  );
}

function naturalReplyViolation(
  reply: string,
  agent: D1Row,
  latestLead: string,
  firstContact: boolean,
  lead?: D1Row,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
) {
  const lower = reply.toLowerCase();
  const offerText = [
    agent.offer_name || agent.offerName || '',
    agent.offer_description || agent.productKnowledge || '',
    agent.audience || '',
    agent.pain_points || agent.painPoints || '',
    agent.outcomes || '',
    agent.objections || '',
  ].join(' ').toLowerCase();

  const bannedPhrases = [
    'kein problem',
    'das ist okay',
    'das ist völlig okay',
    'das ist ein berechtigter punkt',
    'berechtigter punkt',
    'das ist ein guter ansatz',
    'guter ansatz',
    'das ist kein problem',
    'das ist großartig',
    'das ist ein großes problem',
    'großartiger startpunkt',
    'super startpunkt',
    'normaler startpunkt',
    'ganz normaler startpunkt',
    'normaler einwand',
    'ganz normaler einwand',
    'großartiger plan',
    'viele leute wie du',
    'speziell für menschen wie dich',
    'umfassendes system',
    'ich bin froh',
    'vielen dank',
    'ich verstehe, dass',
    'lass uns gemeinsam',
    'wenn du bereit bist',
    'mit dem kauf beginnen',
  ];
  for (const phrase of bannedPhrases) {
    if (lower.includes(phrase)) return `Verwende die Floskel "${phrase}" nicht.`;
  }

  const informationalQuestion = /\b(kannst du .*erklären|wie funktioniert|was genau|wie genau|welche wege|was ist enthalten|wie verdient|was kostet|kosten|preis|raten|klarna)\b/i.test(latestLead);
  if (
    informationalQuestion &&
    /^(ja[,!. ]+)?(das ist|verstehe|ich verstehe|klar,? das ist|okay,? das ist)/i.test(reply.trim())
  ) {
    return 'Direkte Informationsfrage: ohne Validierungs-/Empathie-Füllsatz starten. Beginne unmittelbar mit der sachlichen Antwort.';
  }

  const simpleLeadAck = /^\s*(ja|nein|okay|ok|klar|genau|mhm|hm|gerne|gern)[.! ]*$/i.test(latestLead);
  if (
    !simpleLeadAck &&
    latestLead.trim().length >= 10 &&
    isEmptyAcknowledgement(reply)
  ) {
    return 'Die Antwort ist inhaltlich leer. Greife die neue Information des Leads konkret auf und führe das Gespräch natürlich weiter.';
  }

  const previousAI = [...history].reverse().find((m) => m.role === 'assistant')?.content || '';
  const shortConsent = /^\s*(ja|ja gern|ja gerne|gerne|gern|okay|ok|klar|genau|mach|bitte|yes|sure)[.! ]*$/i.test(latestLead);
  if (
    shortConsent &&
    previousAI &&
    /\b(möchtest du|willst du|soll ich|möchten sie|wollen sie|soll ich ihnen)\b/i.test(reply)
  ) {
    return 'Der Lead hat gerade zugestimmt. Liefere jetzt die zuvor angebotene Information, statt erneut um Erlaubnis zu fragen.';
  }

  if (
    lead?.should_ask_question === false &&
    /\?\s*$/.test(reply.trim())
  ) {
    return 'Der Reply-Plan sagt ausdrücklich: keine neue Frage. Antworte ohne Fragezeichen am Ende.';
  }

  const offerName = String(agent.offer_name || agent.offerName || '').trim();
  const directProductQuestion = /\b(was ist|wie funktioniert|wie verdien|was enthält|enthalten|welche wege|gibt es|preis|kostet|kosten|rate|raten|klarna|produkt|angebot)\b/i.test(latestLead);
  const earlyStage = ['discovery','painpoint','goal'].includes(String(lead?.stage || lead?.current_stage || ''));
  if (
    !firstContact &&
    earlyStage &&
    !directProductQuestion &&
    offerName &&
    reply.toLowerCase().includes(offerName.toLowerCase())
  ) {
    return 'Zu früher Pitch: Der Lead hat gerade nur seine Situation/Painpoint beschrieben. Reagiere darauf, ohne den Angebotsnamen ungefragt zu platzieren.';
  }

  const wantsToStart = /\b(ich .*starten|würde .*starten|will .*starten|möchte .*starten|kaufen|bestellen|checkout|link zum starten|wo kann ich starten|wie kann ich starten)\b/i.test(latestLead);
  const checkoutUrl = String(agent.checkout_url || agent.checkoutUrl || '').trim();
  if (wantsToStart && checkoutUrl && !reply.includes(checkoutUrl)) {
    return `Der Lead will klar starten/kaufen. Sende jetzt direkt den hinterlegten Checkout-Link: ${checkoutUrl}. Kein weiterer Pitch und keine Qualifizierungsfrage.`;
  }

  const categoryWords = ['tool','software','app','plattform','coaching','kurs'];
  for (const word of categoryWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(reply) && !new RegExp(`\\b${word}\\b`, 'i').test(offerText)) {
      return `Du hast die nicht belegte Produktbezeichnung "${word}" erfunden. Nutze ausschließlich die hinterlegten Produktfakten.`;
    }
  }

  const genericPriceQuestion =
    /\b(kostet|kosten|preis|wie viel|wieviel)\b/i.test(latestLead);

  const configuredPaymentHint = String(
    agent.payment_hint || agent.paymentHint || '',
  ).trim();
  const showPaymentHintWithPrice = Boolean(
    agent.show_payment_hint_with_price ?? agent.showPaymentHintWithPrice,
  );

  if (
    genericPriceQuestion &&
    showPaymentHintWithPrice &&
    configuredPaymentHint &&
    !reply.toLowerCase().includes(
      configuredPaymentHint.toLowerCase().slice(0, Math.min(24, configuredPaymentHint.length)),
    )
  ) {
    return `Bei allgemeinen Preisfragen soll der konfigurierte Zahlungshinweis direkt mitgesendet werden: ${configuredPaymentHint}`;
  }

  const isPriceQuestion = /\b(kostet|kosten|preis|wie viel|wieviel|rate|raten|ratenzahlung|klarna)\b/i.test(latestLead);
  const priceText = String(agent.price_text || agent.price || '').trim();
  if (isPriceQuestion && priceText) {
    const priceDigits = compactDigits(priceText);
    const replyDigits = compactDigits(reply);
    const firstPriceChunk = priceDigits.slice(0, Math.min(4, priceDigits.length));
    if (firstPriceChunk && !replyDigits.includes(firstPriceChunk)) {
      return `Der Lead fragt konkret nach Preis/Zahlung. Nenne die hinterlegten Preis- bzw. Rateninformationen konkret: ${priceText}`;
    }
    if (/\b(variiert|variieren|kommt darauf an|verschiedene optionen)\b/i.test(reply)) {
      return `Sage bei hinterlegtem Preis nicht, dass die Kosten variieren. Nenne den konkreten Preis: ${priceText}`;
    }
  }

  const sentenceCount = sentenceCountForDm(reply);
  if (sentenceCount > 2) {
    return 'Die Antwort ist zu lang. Maximal 1-2 kurze Sätze.';
  }

  if (!firstContact && ['discovery','painpoint','goal'].includes(String((agent as any).__currentStage || ''))) {
    // Stage-specific pitch guard is handled in the prompt; this branch is intentionally empty.
  }

  return '';
}

async function generateAgentDraft(
  env: Env,
  organizationId: string,
  body: {
    stage?: string;
    painPoint?: string;
    objection?: string;
    message?: string;
    history?: HistoryMessage[];
    leadMemory?: Record<string, unknown>;
    styleProfile?: Record<string, unknown>;
  },
) {
  const agent = await activeWorkspaceAgent(env, organizationId);
  const memory = body.leadMemory || {};
  const style = body.styleProfile || {};

  const pseudoLead: D1Row = {
    stage: body.stage || 'discovery',
    temperature: 'cold',
    score: 0,
    goal: String(memory.goal || 'Unklar'),
    pain_point: String(memory.painPoint || body.painPoint || 'Unklar'),
    experience: String(memory.experience || 'Unklar'),
    budget: String(memory.budget || 'Unklar'),
    objection: String(memory.objection || body.objection || 'Unklar'),
    summary: String(memory.summary || ''),
    next_step: String(memory.nextStep || ''),
    memory_json: JSON.stringify(memory),
    style_profile_json: JSON.stringify(style),
  };

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const replyHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  const analysisMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: analysisSystemPrompt(agent) },
    { role: 'system', content: leadContextPrompt(pseudoLead) },
    { role: 'system', content: `Aktuelle interne Stage vor dieser Nachricht: ${body.stage || 'discovery'}.` },
  ];

  let leadMessageCount = 0;

  if (history.length > 0) {
    for (const message of history) {
      const content = String(message.body || '').trim();
      if (!content) continue;

      const isLead = message.from === 'lead';
      if (isLead) leadMessageCount += 1;

      const role = isLead ? 'user' as const : 'assistant' as const;
      analysisMessages.push({ role, content });
      replyHistory.push({ role, content });
    }
  } else {
    const currentMessage =
      body.message ||
      `Mein aktueller Painpoint ist: ${body.painPoint || 'Unklar'}. Mein Einwand ist: ${body.objection || 'Unklar'}.`;

    leadMessageCount = 1;
    analysisMessages.push({ role: 'user', content: currentMessage });
    replyHistory.push({ role: 'user', content: currentMessage });
  }

  analysisMessages.push({
    role: 'system',
    content:
      'Analysiere jetzt ausschließlich den Lead-Zustand nach der letzten Lead-Nachricht. ' +
      'Setze reply exakt auf ANALYSIS_ONLY. Wenn der Lead Ziel oder Problem genannt hat, dürfen diese Felder nicht Unklar bleiben. ' +
      'known_facts und open_questions als normale "- "-Stichpunkte, niemals als JSON-Array.',
  });

  const firstContact = leadMessageCount <= 1;

  // WICHTIG: Erst analysieren, DANACH antworten.
  // Dadurch kennt die sichtbare Antwort bereits die neu erkannte Stage, Ziel und Painpoint.
  const rawAnalysis = await runWorkersAI(env, analysisMessages);
  const turn = stabilizeAnalysis(
    rawAnalysis || fallbackTurnFromLead(pseudoLead, 'ANALYSIS_ONLY'),
    pseudoLead,
    history,
  );

  const analyzedLead = analyzedLeadFromTurn(turn);
  const latestLead = lastLeadText(history) || String(body.message || '').trim();

  const validated = await generateValidatedNaturalReply(
    env,
    agent,
    analyzedLead,
    replyHistory,
    latestLead,
    firstContact,
  );
  let naturalReply = validated.reply;
  let violation = validated.violation;

  if (!naturalReply) {
    const offerName = String(agent.offer_name || agent.offerName || '').trim();
    const outcomes = String(agent.outcomes || '').split('\n').map((x) => x.trim()).filter(Boolean);
    if (firstContact && /\b(wie funktioniert|was genau|was ist|worum geht)\b/i.test(latestLead)) {
      const core = outcomes[0] || 'einen klaren Startweg für dein digitales Online-Business';
      naturalReply = offerName
        ? `${offerName} hilft dir dabei, ${core.charAt(0).toLowerCase() + core.slice(1)}. Bist du da noch ganz am Anfang?`
        : `Im Kern geht's darum, dir ${core.charAt(0).toLowerCase() + core.slice(1)} zu geben. Bist du da noch ganz am Anfang?`;
    } else {
      return null;
    }
  }

  // Klare Absichten bekommen deterministische, kurze Antworten.
  if (/\b(ich .*starten|würde .*starten|will .*starten|möchte .*starten|kaufen|bestellen|checkout|link zum starten|wo kann ich starten|wie kann ich starten)\b/i.test(latestLead)) {
    const checkoutUrl = String(agent.checkout_url || agent.checkoutUrl || '').trim();
    if (checkoutUrl) {
      const checkoutCta = String(agent.checkout_cta_text || agent.checkoutCta || 'Hier kannst du direkt starten:').trim();
    naturalReply = `${checkoutCta} ${checkoutUrl}`.trim();
      violation = '';
    }
  }

  const priceText = String(agent.price_text || agent.price || '').trim();
  if (violation && /\b(kostet|kosten|preis|wie viel|wieviel|rate|raten|ratenzahlung)\b/i.test(latestLead) && priceText) {
    const paymentPlan = String(agent.payment_plan_text || agent.paymentPlan || '').trim();
    const paymentHint = String(agent.payment_hint || agent.paymentHint || '').trim();
    const showHint = Boolean(agent.show_payment_hint_with_price ?? agent.showPaymentHintWithPrice);
    naturalReply = [priceText, paymentPlan, showHint ? paymentHint : ''].filter(Boolean).join(' ');
    violation = '';
  }

  if (violation) {
    const paymentMethods = String(agent.payment_methods || agent.paymentMethods || '').trim();
    const paymentHint = String(agent.payment_hint || agent.paymentHint || '').trim();
    const mentionedMethod = paymentMethods
      .split(/[\n,;|]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .find((method) => new RegExp(`\\b${method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(latestLead));

    if (mentionedMethod) {
      naturalReply = [paymentMethods, paymentHint].filter(Boolean).join(' ');
      violation = '';
    }
  }

  turn.reply = sanitizeOutgoingAiText(naturalReply);
  if (!turn.reply || turn.reply === 'ANALYSIS_ONLY') return null;
  return turn;
}



type PayPalPlanKey = 'starter' | 'pro';

function paypalBaseUrl(env: Env) {
  return env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function paypalPlanId(env: Env, plan: PayPalPlanKey) {
  return plan === 'pro'
    ? String(env.PAYPAL_PRO_PLAN_ID || '').trim()
    : String(env.PAYPAL_STARTER_PLAN_ID || '').trim();
}

function paypalConfigured(env: Env) {
  return Boolean(
    env.PAYPAL_CLIENT_ID &&
    env.PAYPAL_CLIENT_SECRET &&
    env.PAYPAL_STARTER_PLAN_ID &&
    env.PAYPAL_PRO_PLAN_ID
  );
}

async function paypalAccessToken(env: Env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal Client ID oder Client Secret fehlt.');
  }

  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw };
  }

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `PayPal Auth fehlgeschlagen: ${response.status} ${raw || 'unknown error'}`,
    );
  }

  return String(payload.access_token);
}

async function paypalRequest(
  env: Env,
  path: string,
  init: RequestInit = {},
  requestId?: string,
) {
  const token = await paypalAccessToken(env);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (requestId) headers.set('PayPal-Request-Id', requestId);

  const response = await fetch(`${paypalBaseUrl(env)}${path}`, {
    ...init,
    headers,
  });

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw };
  }

  if (!response.ok) {
    throw new Error(
      `PayPal API ${response.status}: ${payload?.message || raw || 'unknown error'}`,
    );
  }

  return payload;
}

function paypalPlanFromProviderId(env: Env, providerPlanId: string) {
  if (providerPlanId && providerPlanId === env.PAYPAL_PRO_PLAN_ID) return 'pro';
  return 'starter';
}

async function paypalSubscriptionDetails(env: Env, subscriptionId: string) {
  return paypalRequest(
    env,
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'GET' },
  );
}

async function currentPayPalSubscription(env: Env, organizationId: string) {
  if (!env.DB) return null;
  return env.DB
    .prepare(
      `SELECT provider,provider_customer_id,provider_subscription_id,plan,status,current_period_end
       FROM subscriptions
       WHERE organization_id=?
       LIMIT 1`,
    )
    .bind(organizationId)
    .first<D1Row>();
}


function billingEnforced(env: Env) {
  return env.BILLING_ENFORCED === 'true';
}

function isBillingAdmin(env: Env, email: string) {
  const allowed = String(env.BILLING_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(String(email || '').trim().toLowerCase());
}

function planConversationLimit(plan: string) {
  return String(plan).toLowerCase() === 'pro' ? 5000 : 500;
}

function planInstagramAccountLimit(plan: string) {
  return String(plan).toLowerCase() === 'pro' ? 3 : 1;
}

async function organizationPlan(env: Env, organizationId: string) {
  if (!env.DB) return 'starter';
  const row = await env.DB
    .prepare('SELECT plan FROM organizations WHERE id=? LIMIT 1')
    .bind(organizationId)
    .first<D1Row>();
  return String(row?.plan || 'starter');
}

function addOneCalendarMonth(iso: string) {
  const source = new Date(iso);
  if (!Number.isFinite(source.getTime())) return '';

  const year = source.getUTCFullYear();
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const hours = source.getUTCHours();
  const minutes = source.getUTCMinutes();
  const seconds = source.getUTCSeconds();
  const milliseconds = source.getUTCMilliseconds();

  const target = new Date(
    Date.UTC(year, month + 1, 1, hours, minutes, seconds, milliseconds),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString();
}

function paypalPaidThrough(
  details: any,
  existingPeriodEnd?: string | null,
) {
  const nextBilling = String(details?.billing_info?.next_billing_time || '');
  if (nextBilling) return nextBilling;

  const existing = String(existingPeriodEnd || '');
  if (existing) {
    const parsed = Date.parse(existing);
    if (Number.isFinite(parsed) && parsed > Date.now()) return existing;
  }

  // Unsere aktuell verkauften PayPal-Pläne sind monatlich.
  // Falls PayPal nach CANCELLED kein next_billing_time mehr liefert,
  // rekonstruieren wir den bezahlten Zeitraum aus der letzten Zahlung.
  const lastPayment = String(details?.billing_info?.last_payment?.time || '');
  if (lastPayment) return addOneCalendarMonth(lastPayment);

  return '';
}

function subscriptionHasEntitlement(subscription: D1Row | null) {
  if (!subscription) return false;

  const status = String(subscription.status || '').toLowerCase();
  if (status === 'active') return true;

  // Nach einer Kündigung bleibt der bereits bezahlte Zeitraum nutzbar,
  // sofern PayPal uns einen zukünftigen Perioden-Endzeitpunkt geliefert hat.
  if (status === 'cancelled' && subscription.current_period_end) {
    const end = Date.parse(String(subscription.current_period_end));
    if (Number.isFinite(end) && end > Date.now()) return true;
  }

  return false;
}

async function workspaceBillingAccess(
  env: Env,
  organizationId: string,
  email: string,
) {
  const subscription = await currentPayPalSubscription(env, organizationId);
  const adminBypass = isBillingAdmin(env, email);
  const enforced = billingEnforced(env);
  const paid = subscriptionHasEntitlement(subscription);

  return {
    enforced,
    adminBypass,
    paid,
    granted: !enforced || adminBypass || paid,
    subscription,
  };
}

async function syncPayPalSubscription(
  env: Env,
  organizationId: string,
  subscriptionId: string,
) {
  if (!env.DB || !subscriptionId) return null;

  const existing = await currentPayPalSubscription(env, organizationId);
  const details = await paypalSubscriptionDetails(env, subscriptionId);
  const providerPlanId = String(details?.plan_id || '');
  const plan = paypalPlanFromProviderId(env, providerPlanId);
  const status = String(details?.status || 'UNKNOWN').toLowerCase();
  const payerId = String(details?.subscriber?.payer_id || '');
  const paidThrough = paypalPaidThrough(
    details,
    String(existing?.current_period_end || ''),
  );

  await env.DB
    .prepare(
      `INSERT INTO subscriptions
        (id,organization_id,provider,provider_customer_id,provider_subscription_id,plan,status,current_period_end)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(organization_id)
       DO UPDATE SET
         provider='paypal',
         provider_customer_id=excluded.provider_customer_id,
         provider_subscription_id=excluded.provider_subscription_id,
         plan=excluded.plan,
         status=excluded.status,
         current_period_end=CASE
           WHEN excluded.status='cancelled'
             AND (excluded.current_period_end IS NULL OR excluded.current_period_end='')
           THEN subscriptions.current_period_end
           ELSE excluded.current_period_end
         END,
         updated_at=CURRENT_TIMESTAMP`,
    )
    .bind(
      crypto.randomUUID(),
      organizationId,
      'paypal',
      payerId || null,
      subscriptionId,
      plan,
      status,
      paidThrough || null,
    )
    .run();

  if (status === 'active') {
    await env.DB
      .prepare('UPDATE organizations SET plan=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(plan, organizationId)
      .run();
  }

  return {
    provider: 'paypal',
    plan,
    status,
    subscriptionId,
    currentPeriodEnd: paidThrough,
    configured: paypalConfigured(env),
    webhookConfigured: Boolean(env.PAYPAL_WEBHOOK_ID),
    mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
  };
}

async function createOrRevisePayPalSubscription(
  request: Request,
  env: Env,
  organizationId: string,
  plan: PayPalPlanKey,
) {
  if (!paypalConfigured(env)) {
    throw new Error(
      'PayPal ist noch nicht vollständig konfiguriert. Client ID, Secret und beide Plan IDs fehlen noch.',
    );
  }

  const targetPlanId = paypalPlanId(env, plan);
  if (!targetPlanId) throw new Error(`PayPal Plan ID für ${plan} fehlt.`);

  const existing = await currentPayPalSubscription(env, organizationId);
  const existingId = String(existing?.provider_subscription_id || '');
  const existingStatus = String(existing?.status || '').toLowerCase();

  let payload: any;

  if (
    existingId &&
    ['active', 'suspended'].includes(existingStatus) &&
    String(existing?.plan || '') !== plan
  ) {
    payload = await paypalRequest(
      env,
      `/v1/billing/subscriptions/${encodeURIComponent(existingId)}/revise`,
      {
        method: 'POST',
        body: JSON.stringify({ plan_id: targetPlanId }),
      },
      crypto.randomUUID(),
    );
  } else if (
    existingId &&
    ['active', 'approved', 'approval_pending'].includes(existingStatus) &&
    String(existing?.plan || '') === plan
  ) {
    const current = await syncPayPalSubscription(env, organizationId, existingId);
    if (current?.status === 'active') {
      return { alreadyActive: true, billing: current };
    }
    payload = await paypalSubscriptionDetails(env, existingId);
  } else {
    const origin = new URL(request.url).origin;
    payload = await paypalRequest(
      env,
      '/v1/billing/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_id: targetPlanId,
          custom_id: organizationId,
          application_context: {
            brand_name: 'DM Sales AI',
            user_action: 'SUBSCRIBE_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: `${origin}/?billing=success`,
            cancel_url: `${origin}/?billing=cancelled`,
          },
        }),
      },
      crypto.randomUUID(),
    );

    if (env.DB && payload?.id) {
      await env.DB
        .prepare(
          `INSERT INTO subscriptions
            (id,organization_id,provider,provider_subscription_id,plan,status)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(organization_id)
           DO UPDATE SET
             provider='paypal',
             provider_subscription_id=excluded.provider_subscription_id,
             plan=excluded.plan,
             status=excluded.status,
             current_period_end=NULL,
             updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(
          crypto.randomUUID(),
          organizationId,
          'paypal',
          String(payload.id),
          plan,
          String(payload.status || 'APPROVAL_PENDING').toLowerCase(),
        )
        .run();
    }
  }

  const approveUrl = Array.isArray(payload?.links)
    ? payload.links.find((link: any) => link?.rel === 'approve')?.href
    : null;

  if (!approveUrl) {
    throw new Error(
      'PayPal hat keinen Freigabe-Link zurückgegeben. Bitte Subscription-Status prüfen.',
    );
  }

  return {
    approveUrl,
    subscriptionId: payload?.id || existingId,
    mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
  };
}

async function cancelPayPalSubscription(env: Env, organizationId: string) {
  const current = await currentPayPalSubscription(env, organizationId);
  const subscriptionId = String(current?.provider_subscription_id || '');

  if (!subscriptionId) {
    throw new Error('Keine PayPal Subscription gefunden.');
  }

  // Vor der Kündigung den bereits bezahlten Zeitraum sichern.
  const beforeCancel = await paypalSubscriptionDetails(env, subscriptionId);
  const paidThrough = paypalPaidThrough(
    beforeCancel,
    String(current?.current_period_end || ''),
  );

  await paypalRequest(
    env,
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'Vom Kunden in DM Sales AI gekündigt.' }),
    },
    crypto.randomUUID(),
  );

  if (env.DB) {
    await env.DB
      .prepare(
        `UPDATE subscriptions
         SET status='cancelled',
             current_period_end=COALESCE(NULLIF(?,''),current_period_end),
             updated_at=CURRENT_TIMESTAMP
         WHERE organization_id=?`,
      )
      .bind(paidThrough || '', organizationId)
      .run();
  }

  return {
    cancelled: true,
    subscriptionId,
    billing: {
      provider: 'paypal',
      plan: String(
        current?.plan ||
        paypalPlanFromProviderId(env, String(beforeCancel?.plan_id || '')),
      ),
      status: 'cancelled',
      subscriptionId,
      currentPeriodEnd:
        paidThrough || String(current?.current_period_end || ''),
      configured: paypalConfigured(env),
      webhookConfigured: Boolean(env.PAYPAL_WEBHOOK_ID),
      mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
    },
  };
}

async function verifyPayPalWebhook(
  request: Request,
  env: Env,
  payload: any,
) {
  if (!env.PAYPAL_WEBHOOK_ID) {
    throw new Error('PAYPAL_WEBHOOK_ID fehlt.');
  }

  const verification = await paypalRequest(
    env,
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: request.headers.get('paypal-auth-algo'),
        cert_url: request.headers.get('paypal-cert-url'),
        transmission_id: request.headers.get('paypal-transmission-id'),
        transmission_sig: request.headers.get('paypal-transmission-sig'),
        transmission_time: request.headers.get('paypal-transmission-time'),
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: payload,
      }),
    },
  );

  return verification?.verification_status === 'SUCCESS';
}

async function handlePayPalWebhook(request: Request, env: Env) {
  const raw = await request.text();
  let payload: any;

  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  try {
    const verified = await verifyPayPalWebhook(request, env, payload);
    if (!verified) return new Response('Invalid PayPal signature', { status: 401 });
  } catch (error: any) {
    console.error('PayPal webhook verification failed:', error?.message || error);
    return new Response('Webhook verification failed', { status: 401 });
  }

  const eventType = String(payload?.event_type || '');
  const resource = payload?.resource || {};
  let subscriptionId = '';

  if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
    subscriptionId = String(resource?.id || '');
  } else if (eventType.startsWith('PAYMENT.SALE.')) {
    subscriptionId = String(resource?.billing_agreement_id || '');
  }

  let organizationId = String(resource?.custom_id || '').trim();

  if (!organizationId && env.DB && subscriptionId) {
    const existing = await env.DB
      .prepare(
        `SELECT organization_id
         FROM subscriptions
         WHERE provider='paypal' AND provider_subscription_id=?
         LIMIT 1`,
      )
      .bind(subscriptionId)
      .first<D1Row>();
    organizationId = String(existing?.organization_id || '');
  }

  if (env.DB && payload?.id) {
    const inserted = await env.DB
      .prepare(
        `INSERT OR IGNORE INTO webhook_events
          (id,provider,external_event_id,organization_id,payload_json,processed)
         VALUES (?,?,?,?,?,0)`,
      )
      .bind(
        crypto.randomUUID(),
        'paypal',
        String(payload.id),
        organizationId || null,
        raw,
      )
      .run();

    if ((inserted as any)?.meta?.changes === 0) {
      return json({ received: true, duplicate: true });
    }
  }

  if (subscriptionId && organizationId) {
    try {
      await syncPayPalSubscription(env, organizationId, subscriptionId);
    } catch (error: any) {
      console.error('PayPal subscription sync failed:', error?.message || error);
    }
  }

  if (env.DB && payload?.id) {
    await env.DB
      .prepare(
        `UPDATE webhook_events
         SET processed=1,error=NULL
         WHERE provider='paypal' AND external_event_id=?`,
      )
      .bind(String(payload.id))
      .run();
  }

  return json({ received: true });
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyMetaWebhookSignature(
  request: Request,
  rawBody: string,
  appSecret: string,
) {
  const header = request.headers.get('X-Hub-Signature-256') || '';
  if (!header.startsWith('sha256=')) return false;

  const supplied = header.slice('sha256='.length).trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody),
  );

  const expected = hex(new Uint8Array(digest));
  return constantTimeEqual(expected, supplied);
}

async function subscribeInstagramWebhooks(
  env: Env,
  instagramUserId: string,
  accessToken: string,
) {
  const endpoint = new URL(
    `https://graph.instagram.com/${apiVersion(env)}/${instagramUserId}/subscribed_apps`,
  );
  endpoint.searchParams.set('subscribed_fields', 'messages,messaging_postbacks');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { raw };
  }

  if (!response.ok || payload?.success !== true) {
    throw new Error(
      `Instagram Webhook-Abo fehlgeschlagen: ${response.status} ${raw || 'unknown error'}`,
    );
  }

  return payload;
}

async function oauthStart(request: Request, env: Env, organizationId: string) {
  if (
    !env.META_APP_ID ||
    !env.META_APP_SECRET ||
    !env.META_VERIFY_TOKEN ||
    !env.TOKEN_ENCRYPTION_KEY
  ) {
    return json(
      { error: 'Instagram API ist für diesen Deployment noch nicht vollständig konfiguriert.' },
      { status: 503 },
    );
  }

  if (env.DB) {
    const plan = await organizationPlan(env, organizationId);
    const limit = planInstagramAccountLimit(plan);
    const countRow = await env.DB
      .prepare(
        `SELECT COUNT(*) AS total
         FROM instagram_accounts
         WHERE organization_id=? AND status='connected'`,
      )
      .bind(organizationId)
      .first<D1Row>();

    if (Number(countRow?.total || 0) >= limit) {
      return json(
        { error: `Dein ${plan.toUpperCase()}-Plan erlaubt maximal ${limit} Instagram-Account${limit === 1 ? '' : 's'}.` },
        { status: 409 },
      );
    }
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
        'Set-Cookie': `ig_oauth_state=${state}.${organizationId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      },
    },
  );
}

async function oauthCallback(request: Request, env: Env, organizationId: string) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const oauthCookie = cookie(request, 'ig_oauth_state') || '';
  const [storedState, storedOrg] = oauthCookie.split('.');

  if (
    !code ||
    !state ||
    state !== storedState ||
    storedOrg !== organizationId
  ) {
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

  // Für echte DM-Automation muss die App pro verbundenem Professional Account
  // die Messaging-Webhooks abonnieren. Ohne dieses Abo würden eingehende DMs
  // trotz erfolgreichem OAuth nicht in unserer Conversation Engine landen.
  try {
    await subscribeInstagramWebhooks(
      env,
      String(profile.id),
      accessToken,
    );
  } catch (error: any) {
    return new Response(
      error?.message || 'Instagram Webhook-Abo konnte nicht aktiviert werden.',
      { status: 502 },
    );
  }

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
        organizationId,
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

async function tryInstagramSenderAction(
  env: Env,
  encryptedToken: string,
  recipientId: string,
  action: 'typing_on' | 'typing_off',
) {
  if (env.INSTAGRAM_TYPING_ACTIONS === 'false' || !env.TOKEN_ENCRYPTION_KEY) return false;

  try {
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
        sender_action: action,
      }),
    });

    if (!response.ok) {
      console.warn(`Instagram sender_action ${action} nicht akzeptiert: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`Instagram sender_action ${action} fehlgeschlagen.`, error);
    return false;
  }
}

async function latestInboundIs(
  env: Env,
  conversationId: string,
  inboundMessageId: string,
) {
  if (!env.DB) return true;
  const row = await env.DB
    .prepare(
      `SELECT c.ai_mode,
        (SELECT m.id FROM messages m WHERE m.conversation_id=c.id AND m.direction='inbound' ORDER BY m.rowid DESC LIMIT 1) AS latest_inbound_id
       FROM conversations c WHERE c.id=? LIMIT 1`,
    )
    .bind(conversationId)
    .first<D1Row>();

  return Boolean(row && row.ai_mode !== 'paused' && row.latest_inbound_id === inboundMessageId);
}

async function processInboundMessage(
  env: Env,
  accountId: string,
  senderId: string,
  externalMessageId: string | undefined,
  text: string,
) {
  if (!env.DB || !text.trim()) return;
  const processingStartedAt=Date.now();

  const account = await env.DB
    .prepare(
      "SELECT * FROM instagram_accounts WHERE instagram_user_id=? AND status='connected' LIMIT 1",
    )
    .bind(accountId)
    .first<D1Row>();

  if (!account) return;

  const existingLead = await env.DB
    .prepare(
      `SELECT l.id AS lead_id,c.id AS conversation_id
       FROM leads l
       LEFT JOIN conversations c ON c.lead_id=l.id
       WHERE l.instagram_account_id=? AND l.external_user_id=?
       LIMIT 1`,
    )
    .bind(account.id, senderId)
    .first<D1Row>();

  if (!existingLead?.conversation_id) {
    const plan = await organizationPlan(env, String(account.organization_id));
    const limit = planConversationLimit(plan);
    const usage = await env.DB
      .prepare(
        `SELECT COUNT(*) AS total
         FROM conversations
         WHERE organization_id=?
           AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')`,
      )
      .bind(account.organization_id)
      .first<D1Row>();

    if (Number(usage?.total || 0) >= limit) {
      console.warn(
        `Conversation limit reached for organization ${account.organization_id}: ${limit}`,
      );
      return;
    }
  }

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

  const inboundMessageId=crypto.randomUUID();
  await env.DB
    .prepare(
      `INSERT OR IGNORE INTO messages
        (id,organization_id,conversation_id,external_message_id,direction,sender_type,body,status)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      inboundMessageId,
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

  // Kurze Nachrichtenschübe zusammenfassen: Wenn der Lead direkt noch etwas hinterherschickt,
  // antwortet nur der neueste Job. Das verhindert unnatürliche Zwischenantworten.
  await sleep(burstWaitMs(env));
  if (!(await latestInboundIs(env, conversation.id, inboundMessageId))) return;

  await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_on');

  const agent = await env.DB
    .prepare(
      'SELECT * FROM ai_agents WHERE organization_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1',
    )
    .bind(account.organization_id)
    .first<D1Row>();

  if (!agent) {
    await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_off');
    return;
  }

  const hasLeadMemory =
    Boolean(lead.memory_json) &&
    String(lead.memory_json).trim() !== '' &&
    String(lead.memory_json).trim() !== '{}';

  const rows = hasLeadMemory
    ? await env.DB
        .prepare(
          'SELECT direction,sender_type,body,created_at FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 10',
        )
        .bind(conversation.id)
        .all<D1Row>()
    : await env.DB
        .prepare(
          'SELECT direction,sender_type,body,created_at FROM messages WHERE conversation_id=? ORDER BY created_at ASC',
        )
        .bind(conversation.id)
        .all<D1Row>();

  const history = hasLeadMemory
    ? (rows.results || []).reverse()
    : (rows.results || []);

  const turn = await generateSalesTurn(env, agent, lead, history, !hasLeadMemory);

  if (!turn?.reply?.trim()) {
    await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_off');
    return;
  }

  const memoryJson = turnMemoryJson(turn);
  const styleJson = turnStyleJson(turn);

  try {
    await env.DB
      .prepare(
        'UPDATE leads SET stage=?,temperature=?,score=?,goal=?,pain_point=?,experience=?,budget=?,objection=?,summary=?,memory_json=?,style_profile_json=?,next_step=?,memory_updated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?',
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
        memoryJson,
        styleJson,
        turn.next_step,
        lead.id,
      )
      .run();
  } catch (error) {
    // Backward-compatible fallback, falls Migration 0002 noch nicht ausgeführt wurde.
    console.warn('Lead-memory columns not available yet; using legacy lead update.', error);
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
  }

  await env.DB
    .prepare(
      'UPDATE conversations SET current_stage=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    )
    .bind(turn.stage, conversation.id)
    .run();

  const targetTotalMs=humanTiming(env,text,turn.reply,turn);
  const remainingMs=Math.max(0,targetTotalMs-(Date.now()-processingStartedAt));
  if(remainingMs>0) await sleep(remainingMs);

  // Wenn während des Denkens/Schreibens noch eine neue Lead-Nachricht kam oder ein Mensch übernommen hat,
  // wird diese alte Antwort verworfen. Der neueste Turn übernimmt den gesamten aktualisierten Kontext.
  if (!(await latestInboundIs(env, conversation.id, inboundMessageId))) {
    await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_off');
    return;
  }

  try {
    await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_off');
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
    await tryInstagramSenderAction(env, account.access_token_encrypted, senderId, 'typing_off');
    console.error('Auto send failed:', error?.message || error);
  }
}

async function handleWebhook(request: Request, env: Env, ctx?: ExecutionContext) {
  const raw = await request.text();

  // Meta signs webhook payloads with the App Secret. In every configured
  // environment we reject unsigned/forged POST requests before touching D1.
  if (env.META_APP_SECRET) {
    const validSignature = await verifyMetaWebhookSignature(
      request,
      raw,
      env.META_APP_SECRET,
    );

    if (!validSignature) {
      console.warn('Instagram webhook rejected: invalid X-Hub-Signature-256.');
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let payload: any;

  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ received: true });
  }

  if (payload?.object && payload.object !== 'instagram') {
    return json({ received: true, ignored: true });
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

  if (ctx && jobs.length) {
    ctx.waitUntil(Promise.allSettled(jobs).then(() => undefined));
  } else {
    await Promise.allSettled(jobs);
  }
  return json({ received: true });
}

async function manualReply(env: Env, organizationId: string, conversationId: string, message: string) {
  if (!env.DB) {
    throw new Error('Datenbank nicht verfügbar.');
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
       WHERE c.id=? AND c.organization_id=?
       LIMIT 1`,
    )
    .bind(conversationId, organizationId)
    .first<D1Row>();

  if (!row) {
    throw new Error('Konversation nicht gefunden.');
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

async function handleApi(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/health') {
    return json({
      ok: true,
      service: 'dm-sales-ai',
      database: Boolean(env.DB),
      ai: Boolean(env.AI),
      aiProvider: 'cloudflare-workers-ai',
      aiModel: aiModel(env),
      humanPacing: true,
      humanReplyMinMs: envInt(env.HUMAN_REPLY_MIN_MS, 4200),
      humanReplyMaxMs: envInt(env.HUMAN_REPLY_MAX_MS, 14000),
      instagramTypingActions: env.INSTAGRAM_TYPING_ACTIONS !== 'false',
      meta: Boolean(
        env.META_APP_ID &&
        env.META_APP_SECRET &&
        env.META_VERIFY_TOKEN &&
        env.TOKEN_ENCRYPTION_KEY
      ),
      paypal: {
        configured: paypalConfigured(env),
        webhookConfigured: Boolean(env.PAYPAL_WEBHOOK_ID),
        mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
      },
      billingGate: {
        enforced: billingEnforced(env),
        adminBypassConfigured: Boolean(
          String(env.BILLING_ADMIN_EMAILS || '').trim()
        ),
      },
      emailAuth: {
        configured: emailConfigured(env),
        verificationEnforced: emailVerificationEnforced(env),
      },
    });
  }

  if (path === '/api/auth/register' && request.method === 'POST') {
    return registerUser(request, env);
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    return loginUser(request, env);
  }

  if (path === '/api/auth/logout' && request.method === 'POST') {
    return logoutUser(request, env);
  }

  if (path === '/api/auth/verify-email' && request.method === 'POST') {
    return verifyEmailToken(request, env);
  }

  if (path === '/api/auth/forgot-password' && request.method === 'POST') {
    return forgotPassword(request, env);
  }

  if (path === '/api/auth/reset-password' && request.method === 'POST') {
    return resetPassword(request, env);
  }

  // Provider webhooks must stay public. They verify their own signatures.
  if (path === '/api/paypal/webhook' && request.method === 'POST') {
    return handlePayPalWebhook(request, env);
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
    return handleWebhook(request, env, ctx);
  }

  const auth = await authContext(request, env);

  if (!auth) {
    return json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    return json({
      authenticated: true,
      user: {
        id: auth.userId,
        name: auth.userName,
        email: auth.email,
        role: auth.role,
        emailVerified: auth.emailVerified,
      },
      organization: {
        id: auth.organizationId,
        name: auth.organizationName,
        plan: auth.organizationPlan,
      },
      verificationRequired:
        emailVerificationEnforced(env) && !auth.emailVerified,
    });
  }

  if (
    path === '/api/auth/resend-verification' &&
    request.method === 'POST'
  ) {
    return resendVerification(request, env, auth);
  }

  if (path === '/api/bootstrap' && request.method === 'GET') {
    if (!env.DB) {
      return json({ error: 'Datenbank nicht verfügbar.' }, { status: 503 });
    }
    return json(await bootstrap(env, auth));
  }

  if (emailVerificationEnforced(env) && !auth.emailVerified) {
    return json(
      {
        error: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
      },
      { status: 403 },
    );
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
      history?: HistoryMessage[];
      leadMemory?: Record<string, unknown>;
      styleProfile?: Record<string, unknown>;
    }>();

    if (!body.message?.trim()) {
      return json({ error: 'message fehlt.' }, { status: 400 });
    }

    const turn = await generateAgentDraft(env, auth.organizationId, body);

    if (!turn) {
      return json({ error: 'Die KI konnte keine valide Antwort erzeugen.' }, { status: 502 });
    }

    return json({ ok: true, provider: 'cloudflare', model: aiModel(env), ...turn });
  }

  if (path === '/api/paypal/status' && request.method === 'GET') {
    const current = await currentPayPalSubscription(env, auth.organizationId);

    if (
      url.searchParams.get('sync') === '1' &&
      current?.provider_subscription_id &&
      paypalConfigured(env)
    ) {
      try {
        const synced = await syncPayPalSubscription(
          env,
          auth.organizationId,
          String(current.provider_subscription_id),
        );
        return json({ ok: true, billing: synced });
      } catch (error: any) {
        return json(
          {
            ok: false,
            error: error?.message || 'PayPal Status konnte nicht synchronisiert werden.',
          },
          { status: 502 },
        );
      }
    }

    return json({
      ok: true,
      billing: {
        provider: current?.provider || 'paypal',
        plan: current?.plan || 'starter',
        status: current?.status || 'inactive',
        subscriptionId: current?.provider_subscription_id || '',
        currentPeriodEnd: current?.current_period_end || '',
        configured: paypalConfigured(env),
        webhookConfigured: Boolean(env.PAYPAL_WEBHOOK_ID),
        mode: env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
      },
    });
  }

  if (path === '/api/paypal/subscription' && request.method === 'POST') {
    const body = await request.json<{ plan?: string }>();
    const plan: PayPalPlanKey = body.plan === 'pro' ? 'pro' : 'starter';

    try {
      return json({
        ok: true,
        ...(await createOrRevisePayPalSubscription(request, env, auth.organizationId, plan)),
      });
    } catch (error: any) {
      return json(
        { error: error?.message || 'PayPal Subscription konnte nicht erstellt werden.' },
        { status: 502 },
      );
    }
  }

  if (path === '/api/paypal/cancel' && request.method === 'POST') {
    try {
      return json({
        ok: true,
        ...(await cancelPayPalSubscription(env, auth.organizationId)),
      });
    } catch (error: any) {
      return json(
        { error: error?.message || 'PayPal Subscription konnte nicht gekündigt werden.' },
        { status: 502 },
      );
    }
  }

  const billingAccess = await workspaceBillingAccess(
    env,
    auth.organizationId,
    auth.email,
  );

  if (!billingAccess.granted) {
    return json(
      {
        error: 'Für diesen Workspace ist ein aktives Abo erforderlich.',
        code: 'SUBSCRIPTION_REQUIRED',
        billing: {
          plan: billingAccess.subscription?.plan || 'starter',
          status: billingAccess.subscription?.status || 'inactive',
          currentPeriodEnd:
            billingAccess.subscription?.current_period_end || '',
        },
      },
      { status: 402 },
    );
  }

  if (path === '/api/meta/status' && request.method === 'GET') {
    let account: D1Row | null = null;

    if (env.DB) {
      account = await env.DB
        .prepare(
          `SELECT username,status,token_expires_at,connected_at
           FROM instagram_accounts
           WHERE organization_id=?
           ORDER BY connected_at DESC
           LIMIT 1`,
        )
        .bind(auth.organizationId)
        .first<D1Row>();
    }

    return json({
      connected: account?.status === 'connected',
      username: account?.username || null,
      tokenExpiresAt: account?.token_expires_at || null,
      connectedAt: account?.connected_at || null,
      ready: Boolean(
        env.META_APP_ID &&
        env.META_APP_SECRET &&
        env.META_VERIFY_TOKEN &&
        env.TOKEN_ENCRYPTION_KEY
      ),
      webhookUrl: `${url.origin}/api/meta/webhook`,
      redirectUrl: redirectUri(request, env),
      requiredWebhookFields: ['messages', 'messaging_postbacks'],
      mode: 'production',
    });
  }

  if (
    path === '/api/meta/oauth/start' &&
    (request.method === 'POST' || request.method === 'GET')
  ) {
    return oauthStart(request, env, auth.organizationId);
  }

  if (path === '/api/meta/oauth/callback' && request.method === 'GET') {
    return oauthCallback(request, env, auth.organizationId);
  }

  if (path === '/api/agent/settings' && request.method === 'POST') {
    const body = await request.json<Record<string, unknown>>();
    await saveAgent(env, auth.organizationId, body);
    return json({
      saved: true,
      agent: body,
      mode: 'database',
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
          auth.organizationId,
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
          'UPDATE conversations SET ai_mode=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=?',
        )
        .bind(mode, decodeURIComponent(aiModeMatch[1]), auth.organizationId)
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
      history?: HistoryMessage[];
      leadMemory?: Record<string, unknown>;
      styleProfile?: Record<string, unknown>;
    }>();

    if (!env.AI) {
      return json(
        { error: 'Workers AI ist für diesen Deployment nicht verfügbar.' },
        { status: 503 },
      );
    }

    const turn = await generateAgentDraft(env, auth.organizationId, body);

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
        knownFacts: turn.known_facts,
        openQuestions: turn.open_questions,
        nextStep: turn.next_step,
        styleProfile: {
          language: turn.style_language,
          address: turn.style_address,
          formality: turn.style_formality,
          sentenceLength: turn.style_sentence_length,
          messageLength: turn.style_message_length,
          emojiUsage: turn.style_emoji_usage,
          slang: turn.style_slang,
          energy: turn.style_energy,
          directness: turn.style_directness,
          humor: turn.style_humor,
          punctuation: turn.style_punctuation,
          notes: turn.style_notes,
        },
      },
      provider: 'cloudflare-workers-ai',
      model: aiModel(env),
    });
  }

  return json({ error: 'Not found' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
