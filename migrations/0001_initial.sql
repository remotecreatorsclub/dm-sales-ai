PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS instagram_accounts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  access_token_encrypted TEXT,
  token_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  connected_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, instagram_user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instagram_account_id TEXT,
  name TEXT NOT NULL DEFAULT 'Sales Agent',
  active INTEGER NOT NULL DEFAULT 1,
  offer_name TEXT,
  offer_description TEXT,
  price_text TEXT,
  audience TEXT,
  pain_points TEXT,
  outcomes TEXT,
  objections TEXT,
  qualification_rules TEXT,
  checkout_url TEXT,
  booking_url TEXT,
  tone TEXT NOT NULL DEFAULT 'Natürlich, kurz, menschlich',
  guardrails TEXT,
  system_instructions TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instagram_account_id TEXT NOT NULL,
  external_user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  stage TEXT NOT NULL DEFAULT 'discovery',
  temperature TEXT NOT NULL DEFAULT 'cold',
  score INTEGER NOT NULL DEFAULT 0,
  goal TEXT,
  pain_point TEXT,
  experience TEXT,
  budget TEXT,
  objection TEXT,
  summary TEXT,
  ai_enabled INTEGER NOT NULL DEFAULT 1,
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (instagram_account_id, external_user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instagram_account_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ai_mode TEXT NOT NULL DEFAULT 'active',
  current_stage TEXT NOT NULL DEFAULT 'discovery',
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  external_message_id TEXT,
  direction TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instagram_account_id TEXT,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config_json TEXT NOT NULL DEFAULT '{}',
  action_config_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT,
  organization_id TEXT,
  payload_json TEXT NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_org_stage ON leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_org_score ON leads(organization_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_org_last ON conversations(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_lead_unique ON conversations(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_unique ON messages(external_message_id) WHERE external_message_id IS NOT NULL;
