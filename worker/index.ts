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
  HUMAN_REPLY_MIN_MS?: string;
  HUMAN_REPLY_MAX_MS?: string;
  HUMAN_BURST_WAIT_MIN_MS?: string;
  HUMAN_BURST_WAIT_MAX_MS?: string;
  INSTAGRAM_TYPING_ACTIONS?: string;
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
  known_facts: string;
  open_questions: string;
  next_step: string;
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
const DEMO_ORG = 'org_demo';
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
      summary: 'Komplette Anfängerin. Möchte nebenberuflich starten. Motivation ist da, aber fehlender Startpunkt und Technik bremsen sie.',
      knownFacts: '- startet komplett bei null\n- möchte nebenberuflich aufbauen\n- Motivation ist vorhanden\n- Technik und fehlender klarer Startpunkt bremsen sie',
      openQuestions: '- Welche konkrete technische Aufgabe macht ihr am meisten Sorgen?\n- In welchem Zeitraum möchte sie starten?',
      nextStep: 'Technik-Einwand konkretisieren. Danach zeigen, wie ein klarer Ablauf genau diese Unsicherheit reduziert.',
      styleProfile: {
        language: 'Deutsch',
        address: 'du',
        formality: 'locker',
        sentenceLength: 'kurz',
        messageLength: 'kurz',
        emojiUsage: 'selten',
        slang: 'kaum',
        energy: 'ruhig',
        directness: 'direkt',
        humor: 'neutral',
        punctuation: 'normal',
        notes: 'Natürlich, knapp und ohne formelle Sales-Sprache antworten.',
      },
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
      summary: 'Hat bereits ein Angebot und möchte planbar zusätzliche 1.000 € verdienen.',
      knownFacts: '- hat bereits ein Angebot\n- Ziel: 1.000 € zusätzlich\n- braucht eine planbare Leadquelle',
      openQuestions: '- Wie verkauft er aktuell?\n- Wie viele Leads bekommt er derzeit?',
      nextStep: 'Aktuellen Verkaufsprozess verstehen und herausfinden, wo genau Leads fehlen.',
      styleProfile: {
        language: 'Deutsch',
        address: 'du',
        formality: 'locker',
        sentenceLength: 'kurz',
        messageLength: 'kurz',
        emojiUsage: 'keine',
        slang: 'kaum',
        energy: 'sachlich',
        directness: 'direkt',
        humor: 'neutral',
        punctuation: 'normal',
        notes: 'Kurz und konkret antworten.',
      },
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
      summary: 'Schaut sich aktuell nur um. Noch kein klares Ziel oder akuter Bedarf.',
      knownFacts: '- schaut sich nur um',
      openQuestions: '- Was interessiert sie überhaupt?\n- Gibt es ein konkretes Ziel?',
      nextStep: 'Keinen Druck machen. Locker herausfinden, was sie überhaupt spannend findet.',
      styleProfile: {
        language: 'Deutsch',
        address: 'du',
        formality: 'locker',
        sentenceLength: 'kurz',
        messageLength: 'kurz',
        emojiUsage: 'gelegentlich',
        slang: 'kaum',
        energy: 'locker',
        directness: 'weich',
        humor: 'leicht',
        punctuation: 'normal',
        notes: 'Locker und unverbindlich bleiben.',
      },
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
  return `Du führst echte, natürliche Verkaufsgespräche per Instagram-DM.

DEIN OBERSTES PRINZIP:
Die sichtbare Antwort muss sich wie eine echte persönliche DM lesen.
Du bist kein Support-Bot und kein Verkäufer mit Skript.
Du verstehst zuerst, antwortest konkret und führst das Gespräch Schritt für Schritt weiter.

ANGEBOT
Name: ${agent.offer_name || agent.offerName || ''}
Preis: ${agent.price_text || agent.price || ''}
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
  const memory = {
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
      known_facts: str('known_facts', ''),
      open_questions: str('open_questions', ''),
      next_step: str('next_step', ''),
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
        temperature: 0.35,
        max_tokens: 800,
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
          'Antworte ausschließlich mit gültigem JSON ohne Markdown. Pflichtfelder: reply, stage, temperature, score, goal, pain_point, experience, budget, objection, summary, known_facts, open_questions, next_step, style_language, style_address, style_formality, style_sentence_length, style_message_length, style_emoji_usage, style_slang, style_energy, style_directness, style_humor, style_punctuation, style_notes. stage: discovery|painpoint|goal|qualification|solution|objection|close. temperature: cold|warm|hot. score: 0-100.',
      },
    ];

    const result: any = await env.AI.run(
      model as any,
      {
        messages: fallbackMessages,
        temperature: 0.25,
        max_tokens: 800,
      } as any,
    );

    return parseSalesTurn(extractWorkersAIValue(result));
  } catch (error) {
    console.error('Workers AI failed:', error);
    return null;
  }
}

type DemoHistoryMessage = {
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
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt(agent) },
    { role: 'system', content: leadContextPrompt(lead) },
  ];

  // Hybrid-Kontext: Lead Memory + Style Profile + die letzten 10 echten Nachrichten.
  // Bei einem bestehenden Lead ohne Memory darf einmalig der komplette Rohverlauf zum Backfill genutzt werden.
  // Danach bleibt der komplette Rohverlauf zwar in D1 gespeichert, wird aber nicht mehr bei jedem Turn an die KI geschickt.
  const contextHistory = bootstrapMemory ? history : history.slice(-10);
  for (const message of contextHistory) {
    const body = String(message.body || '').trim();
    if (!body) continue;

    messages.push({
      role: message.direction === 'inbound' ? 'user' : 'assistant',
      content: body,
    });
  }

  messages.push({
    role: 'system',
    content:
      'Antworte jetzt auf die letzte Lead-Nachricht. Aktualisiere gleichzeitig Lead Memory und Style Profile. ' +
      'Spiegle den Stil natürlich, ohne künstliche Imitation. Frage nichts erneut, was bereits geklärt ist.',
  });

  return runWorkersAI(env, messages);
}

async function activeDemoAgent(env: Env): Promise<D1Row> {
  if (env.DB) {
    try {
      const saved = await env.DB
        .prepare(
          'SELECT * FROM ai_agents WHERE organization_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1',
        )
        .bind(DEMO_ORG)
        .first<D1Row>();

      if (saved) return saved;
    } catch (error) {
      console.warn('Gespeicherter Test-Agent konnte nicht geladen werden; Demo-Fallback wird genutzt.', error);
    }
  }

  return (demoBootstrap.agent || {}) as D1Row;
}

async function generateDemoDraft(
  env: Env,
  body: {
    stage?: string;
    painPoint?: string;
    objection?: string;
    message?: string;
    history?: DemoHistoryMessage[];
    leadMemory?: Record<string, unknown>;
    styleProfile?: Record<string, unknown>;
  },
) {
  const agent = await activeDemoAgent(env);
  const memory = body.leadMemory || {};
  const style = body.styleProfile || {};

  const pseudoLead: D1Row = {
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

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt(agent) },
    { role: 'system', content: leadContextPrompt(pseudoLead) },
    {
      role: 'system',
      content: `Aktuelle interne Stage: ${body.stage || 'discovery'}.`,
    },
  ];

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const leadMessageCount = history.filter((message) => message.from === 'lead').length;

  messages.push({
    role: 'system',
    content:
      leadMessageCount <= 1
        ? 'Dies ist Erstkontakt bzw. die erste Lead-Nachricht. HARTE REGEL: Frage zuerst kurz beantworten, nicht pitchen, direkt zum Lead sprechen und danach höchstens eine natürliche Discovery-Frage stellen.'
        : 'Dies ist ein laufendes Gespräch. Nutze Memory und Verlauf, wiederhole keine bereits geklärten Fragen und halte die erkannte Anrede konsequent ein.',
  });

  if (history.length > 0) {
    for (const message of history) {
      const content = String(message.body || '').trim();
      if (!content) continue;

      messages.push({
        role: message.from === 'lead' ? 'user' : 'assistant',
        content,
      });
    }
  } else {
    const currentMessage =
      body.message ||
      `Mein aktueller Painpoint ist: ${body.painPoint || 'Unklar'}. Mein Einwand ist: ${body.objection || 'Unklar'}.`;

    messages.push({ role: 'user', content: currentMessage });
  }

  messages.push({
    role: 'system',
    content:
      'Erzeuge jetzt die nächste natürliche DM-Antwort. Aktualisiere Memory und Style Profile aus den vorhandenen Informationen. ' +
      'Berücksichtige ausschließlich belegte Lead-Aussagen. Die erkannte du/Sie-Anrede ist bindend. ' +
      'Sprich direkt zum Lead, vermeide distanzierte Drittpersonen-Pitches und frage nichts erneut, was bereits geklärt ist.',
  });

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

  if (ctx && jobs.length) {
    ctx.waitUntil(Promise.allSettled(jobs).then(() => undefined));
  } else {
    await Promise.allSettled(jobs);
  }
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

async function handleApi(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
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
      humanPacing: true,
      humanReplyMinMs: envInt(env.HUMAN_REPLY_MIN_MS, 4200),
      humanReplyMaxMs: envInt(env.HUMAN_REPLY_MAX_MS, 14000),
      instagramTypingActions: env.INSTAGRAM_TYPING_ACTIONS !== 'false',
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
      history?: DemoHistoryMessage[];
      leadMemory?: Record<string, unknown>;
      styleProfile?: Record<string, unknown>;
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
    return handleWebhook(request, env, ctx);
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
      history?: DemoHistoryMessage[];
      leadMemory?: Record<string, unknown>;
      styleProfile?: Record<string, unknown>;
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
