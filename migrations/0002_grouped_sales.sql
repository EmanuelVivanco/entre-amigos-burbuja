PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ticket_sales (
  id TEXT PRIMARY KEY,
  buyer_name TEXT NOT NULL CHECK (length(trim(buyer_name)) BETWEEN 1 AND 80),
  seat_count INTEGER NOT NULL CHECK (seat_count BETWEEN 1 AND 120),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tickets ADD COLUMN sale_id TEXT REFERENCES ticket_sales(id);
ALTER TABLE ticket_events ADD COLUMN sale_id TEXT REFERENCES ticket_sales(id);

CREATE INDEX IF NOT EXISTS tickets_sale_id ON tickets(sale_id);
CREATE INDEX IF NOT EXISTS ticket_events_sale_id ON ticket_events(sale_id, created_at DESC);

INSERT INTO ticket_sales (id, buyer_name, seat_count, created_at)
SELECT lower(hex(randomblob(16))), buyer_name, COUNT(*), COALESCE(sold_at, CURRENT_TIMESTAMP)
FROM tickets
WHERE status = 'Vendido' AND buyer_name IS NOT NULL
GROUP BY buyer_name, sold_at;

UPDATE tickets
SET sale_id = (
  SELECT id FROM ticket_sales
  WHERE ticket_sales.buyer_name = tickets.buyer_name
    AND ticket_sales.created_at = COALESCE(tickets.sold_at, CURRENT_TIMESTAMP)
  LIMIT 1
)
WHERE status = 'Vendido' AND buyer_name IS NOT NULL;

UPDATE ticket_events
SET sale_id = (
  SELECT sale_id FROM tickets WHERE tickets.id = ticket_events.ticket_id
)
WHERE event_type = 'sale' AND sale_id IS NULL;
