export function database(context) {
  const db = context.env.BURBUJA_DB
  if (!db) throw new Error('La base de datos todavía no está conectada en Cloudflare.')
  return db
}

export function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function readJson(request) {
  if (Number(request.headers.get('content-length') || 0) > 20_000) throw new Error('La solicitud es demasiado grande.')
  try { return await request.json() } catch { throw new Error('La información enviada no es válida.') }
}
