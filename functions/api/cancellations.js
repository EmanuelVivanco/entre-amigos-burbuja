import { database, json, readJson } from './_shared.js'

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request)
    const id = body.ticketId
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const disposition = body.disposition
    if (typeof id !== 'string' || !/^\d{2}-[ABCD]$/.test(id) || !reason || reason.length > 160 || !['resell', 'unavailable'].includes(disposition)) {
      return json({ error: 'Revisa el boleto, el motivo y el destino de la cancelación.' }, 400)
    }
    const db = database(context)
    const ticket = await db.prepare('SELECT status, buyer_name, sale_id FROM tickets WHERE id = ?').bind(id).first()
    if (!ticket) return json({ error: 'No se encontró ese boleto.' }, 404)
    if (ticket.status !== 'Vendido') return json({ error: 'El boleto ya no aparece como vendido. Actualiza el mapa.' }, 409)

    const nextStatus = disposition === 'resell' ? 'Disponible' : 'No disponible'
    await db.batch([
      db.prepare('UPDATE tickets SET status = ?, buyer_name = NULL, sale_id = NULL, sold_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(nextStatus, id),
      db.prepare("INSERT INTO ticket_events (ticket_id, event_type, previous_status, new_status, buyer_name, reason, sale_id) VALUES (?, 'cancellation', 'Vendido', ?, ?, ?, ?)").bind(id, nextStatus, ticket.buyer_name, reason, ticket.sale_id),
    ])
    return json({ ok: true, ticketId: id, status: nextStatus })
  } catch (error) {
    const conflict = /vendido|constraint/i.test(error.message || '')
    return json({ error: conflict ? 'El boleto cambió mientras se cancelaba. Actualiza el mapa.' : error.message || 'No se pudo cancelar el boleto.' }, conflict ? 409 : 503)
  }
}
