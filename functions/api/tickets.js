import { database, json } from './_shared.js'

export async function onRequestGet(context) {
  try {
    const { results } = await database(context).prepare(
      'SELECT id, table_number AS "table", seat_letter AS letter, status, buyer_name AS buyer FROM tickets ORDER BY table_number, seat_letter'
    ).all()
    return json({ tickets: results })
  } catch (error) {
    return json({ error: error.message || 'No se pudieron cargar los boletos.' }, 503)
  }
}
