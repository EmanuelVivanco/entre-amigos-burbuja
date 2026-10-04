import { database, json } from './_shared.js'

export async function onRequestGet(context) {
  try {
    const { results } = await database(context).prepare(`
      SELECT * FROM (
        SELECT MIN(events.id) AS id, 'sale' AS type, sales.buyer_name AS buyer,
          GROUP_CONCAT(events.ticket_id, ',') AS ticketIds, COUNT(*) AS ticketCount,
          'Venta registrada' AS reason, 'Disponible' AS previousStatus,
          'Vendido' AS newStatus, MIN(events.created_at) AS createdAt
        FROM ticket_events AS events
        JOIN ticket_sales AS sales ON sales.id = events.sale_id
        WHERE events.event_type = 'sale'
        GROUP BY events.sale_id
        UNION ALL
        SELECT id, event_type, buyer_name, ticket_id, 1, reason,
          previous_status, new_status, created_at
        FROM ticket_events
        WHERE event_type = 'cancellation' OR sale_id IS NULL
      ) AS history
      ORDER BY id DESC LIMIT 300
    `).all()
    return json({ events: results })
  } catch (error) {
    return json({ error: error.message || 'No se pudo cargar el historial.' }, 503)
  }
}