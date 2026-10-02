PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 30),
  seat_letter TEXT NOT NULL CHECK (seat_letter IN ('A', 'B', 'C', 'D')),
  status TEXT NOT NULL CHECK (status IN ('Disponible', 'Vendido', 'No disponible')),
  buyer_name TEXT,
  sold_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (table_number, seat_letter),
  CHECK ((status = 'Vendido' AND buyer_name IS NOT NULL) OR status != 'Vendido')
);

CREATE TABLE IF NOT EXISTS ticket_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('sale', 'cancellation')),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  buyer_name TEXT,
  reason TEXT,
  actor TEXT NOT NULL DEFAULT 'Acceso público',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ticket_events_ticket_created
  ON ticket_events(ticket_id, created_at DESC);

-- Deterministic DEMO inventory; applied only when the migration runs.
WITH RECURSIVE inventory(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM inventory WHERE n < 120
)
INSERT OR IGNORE INTO tickets (id, table_number, seat_letter, status, buyer_name)
SELECT printf('%02d-%s', ((n - 1) / 4) + 1, substr('ABCD', ((n - 1) % 4) + 1, 1)),
       ((n - 1) / 4) + 1,
       substr('ABCD', ((n - 1) % 4) + 1, 1),
       'Disponible',
       NULL
FROM inventory;

CREATE TRIGGER IF NOT EXISTS ticket_sale_requires_available
BEFORE UPDATE OF status ON tickets
WHEN NEW.status = 'Vendido' AND OLD.status != 'Disponible'
BEGIN
  SELECT RAISE(ABORT, 'Este boleto ya no está disponible');
END;

CREATE TRIGGER IF NOT EXISTS ticket_cancellation_requires_sold
BEFORE UPDATE OF status ON tickets
WHEN NEW.status IN ('Disponible', 'No disponible') AND OLD.status != 'Vendido' AND OLD.status != NEW.status
BEGIN
  SELECT RAISE(ABORT, 'Este boleto no está vendido');
END;
