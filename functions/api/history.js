import { database, json } from './_shared.js'

export async function onRequestGet(context) {
  try {
    const { results } = await database(context).prepare(
      'SELECT id, ticket_id AS ticketId, event_type AS type, previous_status AS previousStatus, new_status AS newStatus, buyer_name AS buyer, reason, created_at AS createdAt FROM ticket_events ORDER BY id DESC LIMIT 300'
    ).all()
    return json({ events: results })
  } catch (error) {
    return json({ error: error.message || 'No se pudo cargar el historial.' }, 503)
  }
}
