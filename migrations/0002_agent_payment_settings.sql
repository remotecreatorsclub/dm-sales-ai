-- DM Sales AI v1.4
-- Agent-spezifische Zahlungs- und Checkout-Einstellungen.
-- Diese Migration ist generisch und enthält keine RCC-spezifischen Werte.

ALTER TABLE ai_agents ADD COLUMN payment_plan_text TEXT DEFAULT '';
ALTER TABLE ai_agents ADD COLUMN payment_methods TEXT DEFAULT '';
ALTER TABLE ai_agents ADD COLUMN payment_hint TEXT DEFAULT '';
ALTER TABLE ai_agents ADD COLUMN show_payment_hint_with_price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_agents ADD COLUMN checkout_cta_text TEXT DEFAULT '';
