-- DM Sales AI v1.6
-- Persistente Lead Memory + Style Profile für echte Instagram-Konversationen.
-- Einmalig in Cloudflare D1 ausführen.

ALTER TABLE leads ADD COLUMN memory_json TEXT DEFAULT '{}';
ALTER TABLE leads ADD COLUMN style_profile_json TEXT DEFAULT '{}';
ALTER TABLE leads ADD COLUMN next_step TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN memory_updated_at TEXT;
