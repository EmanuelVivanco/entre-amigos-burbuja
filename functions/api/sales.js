import { database, json, readJson } from './_shared.js'

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const ids = [...new Set(Array.isArray(body.ticketIds) ? body.ticketIds : [])]
    if (!name || name.length > 80 || !ids.length || ids.length > 120 || ids.some((id) => typeof id !== 'string' || !/^\d{2}-[ABCD]$/.test(id))) {
      return json({ error: 'Revisa el nombre y los boletos seleccionados.' }, 400)
    }

    const db = database(context)
    const placeholders = ids.map(() => '?').join(',')
    const { results } = await db.prepare(`SELECT id, status FROM tickets WHERE id IN (${placeholders})`).bind(...ids).all()
    if (results.length !== ids.length) return json({ error: 'Uno de los boletos no existe.' }, 404)
    if (results.some((ticket) => ticket.status !== 'Disponible')) return json({ error: 'Alguien cambió un boleto. Actualiza el mapa e inténtalo de nuevo.' }, 409)

    const statements = []
    for (const id of ids) {
      statements.push(db.prepare("UPDATE tickets SET status = 'Vendido', buyer_name = ?, sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(name, id))
      statements.push(db.prepare("INSERT INTO ticket_events (ticket_id, event_type, previous_status, new_status, buyer_name, reason) VALUES (?, 'sale', 'Disponible', 'Vendido', ?, 'Venta registrada')").bind(id, name))
    }
    await db.batch(statements)
    return json({ ok: true, count: ids.length })
  } catch (error) {
    const conflict = /disponible|constraint/i.test(error.message || '')
    return json({ error: conflict ? 'Alguien cambió un boleto. Actualiza el mapa e inténtalo de nuevo.' : error.message || 'No se pudo registrar la venta.' }, conflict ? 409 : 503)
  }
}
