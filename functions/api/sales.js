import { database, json, readJson } from './_shared.js'

export async function onRequestGet(context) {
  try {
    const { results } = await database(context).prepare(`
      SELECT sales.id, sales.buyer_name AS buyer, sales.created_at AS createdAt,
        COUNT(events.id) AS seatCount,
        GROUP_CONCAT(events.ticket_id, ',') AS ticketIds
      FROM ticket_sales AS sales
      LEFT JOIN ticket_events AS events
        ON events.sale_id = sales.id AND events.event_type = 'sale'
      GROUP BY sales.id
      ORDER BY sales.created_at DESC
      LIMIT 300
    `).all()
    return json({ sales: results.map((sale) => ({
      ...sale,
      ticketIds: sale.ticketIds ? sale.ticketIds.split(',') : [],
    })) })
  } catch (error) {
    return json({ error: error.message || 'No se pudieron cargar los boletos emitidos.' }, 503)
  }
}

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

    const saleId = crypto.randomUUID()
    const statements = [db.prepare('INSERT INTO ticket_sales (id, buyer_name, seat_count) VALUES (?, ?, ?)').bind(saleId, name, ids.length)]
    for (const id of ids) {
      statements.push(db.prepare("UPDATE tickets SET status = 'Vendido', buyer_name = ?, sale_id = ?, sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(name, saleId, id))
      statements.push(db.prepare("INSERT INTO ticket_events (ticket_id, event_type, previous_status, new_status, buyer_name, reason, sale_id) VALUES (?, 'sale', 'Disponible', 'Vendido', ?, 'Venta registrada', ?)").bind(id, name, saleId))
    }
    await db.batch(statements)
    return json({ ok: true, saleId, count: ids.length })
  } catch (error) {
    const conflict = /disponible|constraint/i.test(error.message || '')
    return json({ error: conflict ? 'Alguien cambió un boleto. Actualiza el mapa e inténtalo de nuevo.' : error.message || 'No se pudo registrar la venta.' }, conflict ? 409 : 503)
  }
}
