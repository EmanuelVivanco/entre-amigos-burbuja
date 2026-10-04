import { useEffect, useState } from 'react'
import { createTicketImage } from './ticketImage'

// Este estado describe la venta; el futuro check-in se guardará por separado.
type Status = 'Disponible' | 'Vendido' | 'No disponible'
type Ticket = { id: string; table: number; letter: string; status: Status; buyer?: string; saleId?: string }
type Sale = { id: string; buyer: string; ticketIds: string[]; seatCount: number; createdAt: string }
type TicketEvent = { id: number; ticketIds: string; ticketCount: number; type: 'sale' | 'cancellation'; previousStatus: string; newStatus: string; buyer: string | null; reason: string; createdAt: string }

const STORAGE_KEY = 'burbuja-demo-tickets-v1'
const SALES_STORAGE_KEY = 'burbuja-demo-sales-v1'
const letters = ['A', 'B', 'C', 'D']
const tablePositions = [
  { table: 1, x: 62, y: 357 }, { table: 2, x: 62, y: 313 }, { table: 3, x: 62, y: 267 }, { table: 4, x: 62, y: 226 }, { table: 5, x: 62, y: 185 }, { table: 6, x: 62, y: 139 },
  { table: 7, x: 118, y: 53 }, { table: 8, x: 168, y: 53 }, { table: 9, x: 275, y: 53 }, { table: 10, x: 346, y: 53 },
  { table: 11, x: 505, y: 98 }, { table: 12, x: 505, y: 138 }, { table: 13, x: 505, y: 180 }, { table: 14, x: 505, y: 222 }, { table: 15, x: 505, y: 263 }, { table: 16, x: 505, y: 302 },
  { table: 17, x: 372, y: 279 }, { table: 18, x: 306, y: 279 }, { table: 19, x: 230, y: 279 },
  { table: 20, x: 153, y: 357 }, { table: 21, x: 153, y: 313 }, { table: 22, x: 153, y: 269 }, { table: 23, x: 153, y: 226 }, { table: 24, x: 153, y: 185 }, { table: 25, x: 153, y: 138 },
  { table: 26, x: 278, y: 118 }, { table: 27, x: 347, y: 118 }, { table: 28, x: 429, y: 151 }, { table: 29, x: 429, y: 193 }, { table: 30, x: 429, y: 236 },
]

function initialTickets(): Ticket[] {
  return Array.from({ length: 120 }, (_, index) => {
    const table = Math.floor(index / 4) + 1
    return {
      id: `${String(table).padStart(2, '0')}-${letters[index % 4]}`,
      table,
      letter: letters[index % 4],
      status: 'Disponible',
    }
  })
}

function readTickets(): Ticket[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Ticket[]
      if (parsed.length === 120) return parsed
    }
  } catch { /* Use the built-in demo data if local storage is unavailable. */ }
  return initialTickets()
}

function Icon({ name }: { name: 'ticket' | 'grid' | 'check' | 'refresh' | 'arrow' | 'close' | 'spark' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const paths: Record<typeof name, React.ReactNode> = {
    ticket: <><path d="M3 8.5A2.5 2.5 0 0 0 5.5 6h13A2.5 2.5 0 0 0 21 8.5v1a2.5 2.5 0 0 0 0 5v1a2.5 2.5 0 0 0-2.5 2.5h-13A2.5 2.5 0 0 0 3 15.5v-1a2.5 2.5 0 0 0 0-5z"/><path d="M12 8v2m0 4v2"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4.8 9A7.5 7.5 0 0 1 18 6l2 2M4 17v-5h5"/><path d="M19.2 15A7.5 7.5 0 0 1 6 18l-2-2"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(readTickets)
  const [dataMode, setDataMode] = useState<'loading' | 'database' | 'demo'>('loading')
  const [dbError, setDbError] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [activeTable, setActiveTable] = useState(1)
  const [buyer, setBuyer] = useState('')
  const [saleOpen, setSaleOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [cancelTicket, setCancelTicket] = useState<Ticket | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDisposition, setCancelDisposition] = useState<'resell' | 'unavailable'>('resell')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<TicketEvent[]>([])
  const [busy, setBusy] = useState(false)
  const [issuedSale, setIssuedSale] = useState<{ buyer: string; ticketIds: string[] } | null>(null)
  const [ticketImageUrl, setTicketImageUrl] = useState('')
  const [ticketImageError, setTicketImageError] = useState('')
  const [sales, setSales] = useState<Sale[]>(() => {
    try { return JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]') as Sale[] } catch { return [] }
  })
  const [salesLoading, setSalesLoading] = useState(false)
  const [issuedOpen, setIssuedOpen] = useState(false)
  const soldCount = tickets.filter((ticket) => ticket.status === 'Vendido').length
  const availableCount = tickets.filter((ticket) => ticket.status === 'Disponible').length
  const tableTickets = tickets.filter((ticket) => ticket.table === activeTable)
  const activeAvailable = tableTickets.filter((ticket) => ticket.status === 'Disponible').length

  async function refreshTickets() {
    const response = await fetch('/api/tickets', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No se pudo conectar con la base de datos.')
    setTickets(data.tickets.map((ticket: { id: string; table: number; letter: string; status: Status; buyer: string | null; saleId?: string | null }) => ({ ...ticket, buyer: ticket.buyer || undefined, saleId: ticket.saleId || undefined })))
    setDataMode('database')
    setDbError('')
  }

  async function refreshSales() {
    const response = await fetch('/api/sales', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los boletos emitidos.')
    setSales(data.sales as Sale[])
  }

  useEffect(() => {
    if (dataMode === 'loading') refreshTickets().catch((error: Error) => {
      setDataMode('demo')
      setDbError(error.message)
    })
    if (dataMode !== 'database') return
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshTickets().catch((error: Error) => setDbError(error.message))
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshTickets().catch((error: Error) => setDbError(error.message))
    }, 5000)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [dataMode])

  useEffect(() => {
    if (dataMode === 'database') refreshSales().catch((error: Error) => setDbError(error.message))
  }, [dataMode])

  useEffect(() => {
    if (!issuedSale) return
    let objectUrl = ''
    setTicketImageUrl('')
    setTicketImageError('')
    const purchased = issuedSale.ticketIds.map((id) => {
      const ticket = tickets.find((item) => item.id === id)
      const [tableNumber, letter] = id.split('-')
      return { id, table: ticket?.table ?? Number(tableNumber), letter: ticket?.letter ?? letter }
    })
    createTicketImage(issuedSale.buyer, purchased).then((blob) => {
      objectUrl = URL.createObjectURL(blob)
      setTicketImageUrl(objectUrl)
    }).catch((error: Error) => setTicketImageError(error.message))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [issuedSale, tickets])

  function updateTickets(next: Ticket[]) {
    setTickets(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* The current session still works without persistence. */ }
  }

  function toggleTicket(ticket: Ticket) {
    if (dataMode === 'loading') return
    if (ticket.status !== 'Disponible') return
    setSelected((current) => current.includes(ticket.id) ? current.filter((id) => id !== ticket.id) : [...current, ticket.id])
  }

  async function recordSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = buyer.trim()
    if (!cleanName || selected.length === 0) return
    if (busy) return
    setBusy(true)
    const soldIds = [...selected]
    let saleId = crypto.randomUUID()
    if (dataMode === 'database') {
      try {
        const response = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cleanName, ticketIds: selected }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo registrar la venta.')
        if (typeof data.saleId === 'string') saleId = data.saleId
      } catch (error) {
        await refreshTickets().catch((syncError: Error) => setDbError(syncError.message))
        setNotice((error as Error).message)
        setBusy(false)
        return
      }
      const soldSet = new Set(soldIds)
      setTickets((current) => current.map((ticket) => soldSet.has(ticket.id) ? { ...ticket, status: 'Vendido', buyer: cleanName, saleId } : ticket))
      await refreshTickets().catch((error: Error) => setDbError(error.message))
      await refreshSales().catch((error: Error) => setDbError(error.message))
    } else {
      const ids = new Set(selected)
      updateTickets(tickets.map((ticket) => ids.has(ticket.id) ? { ...ticket, status: 'Vendido', buyer: cleanName, saleId } : ticket))
      const nextSale: Sale = { id: saleId, buyer: cleanName, ticketIds: soldIds, seatCount: soldIds.length, createdAt: new Date().toISOString() }
      setSales((current) => {
        const next = [nextSale, ...current]
        try { localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(next)) } catch { /* Mantener utilizable la sesión actual. */ }
        return next
      })
    }
    setNotice(`${selected.length} ${selected.length === 1 ? 'boleto registrado' : 'boletos registrados'} para ${cleanName}`)
    setIssuedSale({ buyer: cleanName, ticketIds: soldIds })
    setSelected([])
    setBuyer('')
    setSaleOpen(false)
    setBusy(false)
    window.setTimeout(() => setNotice(''), 4000)
  }

  async function shareTicketImage() {
    if (!ticketImageUrl || !issuedSale) return
    try {
      const blob = await fetch(ticketImageUrl).then((response) => response.blob())
      const file = new File([blob], 'boleto-entre-amigos.png', { type: 'image/png' })
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: 'Boleto Entre Amigos — Burbuja', text: `Boleto de ${issuedSale.buyer}` })
      } else {
        const link = document.createElement('a')
        link.href = ticketImageUrl
        link.download = 'boleto-entre-amigos.png'
        link.click()
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setNotice(error.message || 'No se pudo compartir la imagen.')
    }
  }

  function viewSale(sale: Sale) {
    setIssuedSale({ buyer: sale.buyer, ticketIds: sale.ticketIds })
  }

  async function openIssuedSales() {
    setIssuedOpen(true)
    if (dataMode !== 'database') return
    setSalesLoading(true)
    try { await refreshSales() } catch (error) { setNotice((error as Error).message) }
    finally { setSalesLoading(false) }
  }

  async function recordCancellation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cancelTicket || !cancelReason.trim() || busy) return
    setBusy(true)
    if (dataMode === 'database') {
      try {
        const response = await fetch('/api/cancellations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: cancelTicket.id, reason: cancelReason.trim(), disposition: cancelDisposition }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cancelar el boleto.')
      } catch (error) {
        await refreshTickets().catch((syncError: Error) => setDbError(syncError.message))
        setNotice((error as Error).message)
        setBusy(false)
        return
      }
      setTickets((current) => current.map((ticket) => ticket.id === cancelTicket.id ? { ...ticket, status: cancelDisposition === 'resell' ? 'Disponible' : 'No disponible', buyer: undefined, saleId: undefined } : ticket))
      await refreshTickets().catch((error: Error) => setDbError(error.message))
    } else {
      updateTickets(tickets.map((ticket) => ticket.id === cancelTicket.id ? { ...ticket, status: cancelDisposition === 'resell' ? 'Disponible' : 'No disponible', buyer: undefined, saleId: undefined } : ticket))
    }
    setNotice(`${cancelTicket.id} cancelado · ${cancelDisposition === 'resell' ? 'disponible para reventa' : 'marcado no disponible'}`)
    setCancelTicket(null)
    setCancelReason('')
    setBusy(false)
    window.setTimeout(() => setNotice(''), 5000)
  }

  async function loadHistory() {
    if (dataMode === 'database') {
      try {
        const response = await fetch('/api/history', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el historial.')
        setHistory(data.events)
      } catch (error) { setNotice((error as Error).message) }
    }
    setHistoryOpen(true)
  }

  function resetDemo() {
    updateTickets(initialTickets())
    setSales([])
    try { localStorage.removeItem(SALES_STORAGE_KEY) } catch { /* El reinicio de asientos sigue funcionando si el navegador limita el almacenamiento. */ }
    setSelected([])
    setActiveTable(1)
    setNotice('Datos demo restaurados')
    window.setTimeout(() => setNotice(''), 3000)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#inicio" aria-label="Entre Amigos inicio"><span className="brand-mark"><span /></span><span className="brand-text">entre amigos<small>BURBUJA</small></span></a>
      <div className="side-label">GESTIÓN</div>
      <nav className="side-nav" aria-label="Navegación principal"><a className="nav-item active" href="#panel"><Icon name="grid"/> <span>Panel de control</span></a><button className="nav-item nav-button" type="button" onClick={openIssuedSales}><Icon name="ticket"/><span>Boletos emitidos</span><span className="nav-count">{sales.length}</span></button></nav>
      <div className="sidebar-bottom"><div className="event-mini"><span className="live-dot"/>EVENTO ACTIVO<p>Entre Amigos<br/>— Burbuja</p><div className="event-mini-foot">Datos de demostración</div></div><div className="profile"><div className="avatar">EA</div><div><strong>Administración</strong><small>Panel demo</small></div><span className="profile-dots">···</span></div></div>
    </aside>

    <main className="main-content" id="panel">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><span /></span><strong>entre amigos</strong></div><div className="breadcrumb">Eventos <span>/</span> <strong>Burbuja</strong></div><div className="top-actions"><span className={`demo-pill ${dataMode === 'database' ? 'database-pill' : ''}`}><i/> {dataMode === 'database' ? 'BASE DE DATOS' : dataMode === 'loading' ? 'CONECTANDO' : 'MODO DEMO'}</span><button className="mobile-issued-shortcut" type="button" onClick={openIssuedSales} aria-label={`Ver boletos emitidos, ${sales.length}`}><Icon name="ticket"/><span>Emitidos</span><b>{sales.length}</b></button><div className="top-avatar">EA</div></div></header>
      <div className="page-wrap">
        {dataMode !== 'database' && <div className="database-notice" role="status"><strong>{dataMode === 'loading' ? 'Conectando con la base de datos…' : 'Vista de demostración'}</strong><span>{dataMode === 'loading' ? 'Cargando boletos' : dbError || 'La base de datos de Cloudflare aún no está conectada. Los cambios quedan solo en este navegador.'}</span></div>}
        {dataMode === 'database' && dbError && <div className="database-notice" role="status"><strong>Sincronización temporalmente interrumpida</strong><span>{dbError} No hagas cambios hasta que vuelva la conexión.</span></div>}
        <section className="page-heading"><div><div className="eyebrow"><span/> EVENTO ACTIVO</div><h1>Panel de control</h1><p className="subtitle">Selecciona mesa y asigna sus lugares.</p></div><div className="heading-actions"><button className="sync-button" disabled={dataMode === 'loading'} onClick={() => refreshTickets().catch((error: Error) => { setDbError(error.message); setNotice(error.message) })}><Icon name="refresh"/><span>Actualizar</span></button>{dataMode === 'demo' && <button className="reset-button" onClick={resetDemo}><Icon name="refresh"/> <span>Reiniciar demo</span></button>}</div></section>

        <section className="event-flyer-card" aria-label="Flyer del evento">
          <a className="event-flyer-image-link" href="/entre-amigos-flyer.jpg" target="_blank" rel="noreferrer" aria-label="Abrir flyer del evento en tamaño completo">
            <img src="/entre-amigos-flyer.jpg" alt="Flyer oficial: XX aniversario de Entre Amigos, show en vivo de SERÉ, 13 de noviembre a las 20:00 horas en el Hotel Xalapa, Salón La Burbuja" />
          </a>
          <div className="event-flyer-copy"><span className="section-kicker">FLYER DEL EVENTO</span><h2>Celebrando el XX aniversario</h2><p>Entre Amigos presenta un show en vivo de SERÉ.</p><div className="event-flyer-details"><strong>13 de noviembre · 20:00 hrs</strong><span>Hotel Xalapa · Salón “La Burbuja”</span></div><a href="/entre-amigos-flyer.jpg" target="_blank" rel="noreferrer">Ver flyer completo <Icon name="arrow"/></a></div>
        </section>

        <section className="stats-grid compact-stats" aria-label="Resumen de boletos">
          <article className="stat-card total-card"><div className="stat-top"><span>Total de boletos</span><span className="stat-icon violet"><Icon name="ticket"/></span></div><div className="stat-value">120</div><div className="stat-foot">30 mesas · 4 lugares por mesa</div></article>
          <article className="stat-card"><div className="stat-top"><span>Disponibles</span><span className="stat-icon mint"><span className="circle-check"><Icon name="check"/></span></span></div><div className="stat-value">{availableCount}<small> / 120</small></div><div className="stat-foot"><span className="stat-dot available-dot"/>Listos para asignar</div></article>
          <article className="stat-card"><div className="stat-top"><span>Vendidos</span><span className="stat-icon peach"><Icon name="ticket"/></span></div><div className="stat-value">{soldCount}<small> / 120</small></div><div className="stat-foot"><span className="stat-dot sold-dot"/>{Math.round(soldCount / 120 * 100)}% del total</div></article>
          <article className="stat-card progress-card"><div className="stat-top"><span>Progreso de venta</span><span className="progress-number">{Math.round(soldCount / 120 * 100)}%</span></div><div className="progress-track"><span style={{ width: `${soldCount / 120 * 100}%` }}/></div><div className="stat-foot">{soldCount} de 120 boletos vendidos</div></article>
        </section>

        <section className="map-card real-map-card" id="boletos" aria-label="Croquis interactivo del Club Burbuja">
          <div className="map-heading"><div><div className="section-kicker">CROQUIS DEL CLUB</div><h2>Mapa de mesas</h2><p>Toca una mesa para ver sus cuatro lugares.</p></div><span className="map-source-badge"><Icon name="spark"/> CROQUIS REAL</span></div>
          <div className="legend real-map-legend"><span><i className="legend-dot open"/>Disponible</span><span><i className="legend-dot taken"/>Vendido</span><span><i className="legend-dot unavailable"/>No disponible</span><span><i className="legend-dot chosen"/>Seleccionado</span><small>Asientos: A arriba · B derecha · C abajo · D izquierda</small><small className="table-status-guide">Mesa: verde 2+ disponibles · amarillo 1 · rojo agotada</small></div>
          <div className="floorplan-wrap">
            <div className="floorplan">
              <img src="/club-burbuja-croquis.png" alt="Croquis del Club Burbuja con pista, escenario, bar, salas VIP y mesas 1 a 30" />
              {tablePositions.map(({ table, x, y }) => {
                const seats = tickets.filter((ticket) => ticket.table === table)
                const remaining = seats.filter((ticket) => ticket.status === 'Disponible').length
                const soldOut = seats.every((ticket) => ticket.status === 'Vendido')
                const tableState = soldOut ? 'sold-out' : remaining === 0 ? 'unavailable' : remaining < 2 ? 'limited' : 'available'
                const tableStateLabel = soldOut ? 'agotada' : tableState === 'unavailable' ? 'sin lugares disponibles' : tableState === 'limited' ? 'queda 1 lugar' : 'con lugares disponibles'
                return <button key={table} className={`floor-table floor-table--${tableState} ${activeTable === table ? 'is-active' : ''}`} style={{ left: `${x / 720 * 100}%`, top: `${y / 472 * 100}%` }} onClick={() => setActiveTable(table)} aria-label={`Mesa ${table}, ${tableStateLabel}; ${remaining} de 4 disponibles`} aria-pressed={activeTable === table}>
                  <span className="floor-table-number">{table}</span><span className="floor-seats" aria-hidden="true">{seats.map((seat) => <i key={seat.id} className={`${seat.status === 'Vendido' ? 'seat-sold' : seat.status === 'No disponible' ? 'seat-unavailable' : 'seat-open'} ${selected.includes(seat.id) ? 'seat-chosen' : ''}`} />)}</span>
                </button>
              })}
            </div>
          </div>
          <div className="table-picker" aria-label="Elegir mesa"><div className="table-picker-heading"><strong>Elige una mesa</strong><span>Toca el número para ver sus asientos</span></div>{tablePositions.map(({ table }) => {
            const seats = tickets.filter((ticket) => ticket.table === table)
            const remaining = seats.filter((ticket) => ticket.status === 'Disponible').length
            const status = seats.every((ticket) => ticket.status === 'Vendido') ? 'sold-out' : remaining === 0 ? 'unavailable' : remaining === 1 ? 'limited' : 'available'
            return <button key={table} className={`table-choice table-choice--${status} ${activeTable === table ? 'picker-active' : ''}`} aria-pressed={activeTable === table} onClick={() => setActiveTable(table)}><strong>Mesa {String(table).padStart(2, '0')}</strong><small>{remaining ? `${remaining} ${remaining === 1 ? 'asiento libre' : 'asientos libres'}` : status === 'sold-out' ? 'Agotada' : 'Sin lugares'}</small></button>
          })}</div>
          <div className="map-summary"><div><span className="summary-vip">Sala VIP <b>01</b><em>Vendida</em></span><span className="summary-vip"><b>02</b><em>Vendida</em></span><span className="summary-vip"><b>03</b><em>Vendida</em></span></div><small>Mapa basado en el croquis recibido · estados de boletos DEMO</small></div>

          <section className="seat-panel" aria-live="polite" aria-label={`Lugares de la mesa ${activeTable}`}>
            <div className="seat-panel-heading"><div><span className="section-kicker">MESA SELECCIONADA</span><h3>Mesa {String(activeTable).padStart(2, '0')}</h3></div><span className="seat-count">{activeAvailable} de 4 disponibles</span></div>
            {tableTickets.some((ticket) => ticket.status === 'Vendido') && <p className="cancel-hint">Toca un boleto vendido para registrar una devolución o cancelación.</p>}
            <div className="seat-options">{tableTickets.map((ticket) => {
              const isSelected = selected.includes(ticket.id)
              return <button key={ticket.id} className={`seat-option ${ticket.status === 'Vendido' ? 'seat-option-sold' : ticket.status === 'No disponible' ? 'seat-option-unavailable' : ''} ${isSelected ? 'seat-option-selected' : ''}`} disabled={ticket.status === 'No disponible' || dataMode === 'loading'} aria-pressed={isSelected} onClick={() => ticket.status === 'Vendido' ? setCancelTicket(ticket) : toggleTicket(ticket)} aria-label={ticket.status === 'Vendido' ? `${ticket.id}, vendido a ${ticket.buyer}. Toca para cancelar` : `${ticket.id}, ${ticket.status}`}>
                <span className="seat-letter">{ticket.letter}</span><span className="seat-detail"><strong>{isSelected ? 'Seleccionado' : ticket.status}</strong><small className={ticket.status === 'Vendido' ? 'buyer-name' : ''}>{ticket.status === 'Vendido' ? ticket.buyer : ticket.id}</small></span>
                {ticket.status === 'Vendido' && <span className="seat-check"><Icon name="check"/></span>}
                {ticket.status === 'No disponible' && <span className="seat-check seat-unavailable-check"><Icon name="close"/></span>}
              </button>
            })}</div>
            <button className="history-button" onClick={loadHistory}>Ver historial de ventas y cancelaciones</button>
          </section>
        </section>
        <footer className="page-footer"><span>Entre Amigos — Burbuja <i>·</i> Panel administrativo</span><span><i className="live-dot"/> Versión de demostración</span></footer>
      </div>
    </main>

    {selected.length > 0 && <div className="selection-bar"><div className="selection-copy"><span className="selection-ticket"><Icon name="ticket"/></span><div><strong>{selected.length} {selected.length === 1 ? 'asiento seleccionado' : 'asientos seleccionados'}</strong><small>{selected.slice(0, 3).join(', ')}{selected.length > 3 ? ` +${selected.length - 3} más` : ''}</small></div></div><div className="selection-actions"><button className="clear-selection" onClick={() => setSelected([])}>Quitar selección</button><button className="sale-button" disabled={dataMode === 'loading' || (dataMode === 'database' && Boolean(dbError))} onClick={() => setSaleOpen(true)}>Continuar con la compra <Icon name="arrow"/></button></div></div>}

    {issuedOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIssuedOpen(false) }}><section className="sale-modal receipts-modal" role="dialog" aria-modal="true" aria-labelledby="issued-sales-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setIssuedOpen(false)}><Icon name="close"/></button><div className="section-kicker">COMPROBANTES GUARDADOS</div><h2 id="issued-sales-title">Boletos emitidos</h2><p className="modal-description">Abre un comprobante para volver a ver o compartir su imagen.</p><button className="sync-button receipts-refresh" onClick={() => { setSalesLoading(true); refreshSales().catch((error: Error) => setNotice(error.message)).finally(() => setSalesLoading(false)) }} disabled={salesLoading || dataMode !== 'database'}><Icon name="refresh"/><span>{salesLoading ? 'Actualizando…' : 'Actualizar lista'}</span></button>{salesLoading ? <p className="issued-sales-empty">Cargando comprobantes…</p> : sales.length ? <div className="issued-sales-list">{sales.map((sale) => <article className="issued-sale-row" key={sale.id}><span className="issued-sale-icon"><Icon name="ticket"/></span><div className="issued-sale-info"><strong>{sale.buyer}</strong><span>{sale.ticketIds.length || sale.seatCount} {(sale.ticketIds.length || sale.seatCount) === 1 ? 'asiento' : 'asientos'} · {sale.ticketIds.join(', ')}</span><small>{new Date(sale.createdAt.endsWith('Z') ? sale.createdAt : `${sale.createdAt.replace(' ', 'T')}Z`).toLocaleString('es-MX')}</small></div><button className="issued-sale-view" onClick={() => { setIssuedOpen(false); viewSale(sale) }}>Ver imagen <Icon name="arrow"/></button></article>)}</div> : <p className="issued-sales-empty">{dataMode === 'database' ? 'Aún no hay comprobantes registrados.' : 'Los comprobantes aparecerán aquí al conectar la base de datos.'}</p>}</section></div>}

    {saleOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSaleOpen(false) }}><section className="sale-modal" role="dialog" aria-modal="true" aria-labelledby="sale-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setSaleOpen(false)}><Icon name="close"/></button><div className="modal-icon"><Icon name="ticket"/></div><div className="section-kicker">NUEVA RESERVACIÓN / COMPRA</div><h2 id="sale-title">Registrar una compra</h2><p className="modal-description">Escribe solo el nombre de quien reserva. Todos los asientos seleccionados quedarán juntos en un solo comprobante.</p><div className="modal-ticket-summary"><div><span>Asientos incluidos</span><strong>{selected.length}</strong></div><div className="summary-chips">{selected.map((id) => <span key={id}>{id.replace('-', ' · ')}</span>)}</div></div><form onSubmit={recordSale}><label htmlFor="buyer-name">Nombre de la persona</label><input id="buyer-name" autoFocus required maxLength={80} placeholder="Ej. María García" value={buyer} onChange={(event) => setBuyer(event.target.value)}/><p className="name-only-note"><span>i</span> No pedimos teléfono, correo ni otros datos personales.</p><button className="confirm-sale" type="submit" disabled={!buyer.trim() || busy || (dataMode === 'database' && Boolean(dbError))}>{busy ? 'Guardando…' : 'Guardar y generar boleto'} <Icon name="arrow"/></button></form></section></div>}
    {issuedSale && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIssuedSale(null); setTicketImageUrl('') } }}><section className="sale-modal ticket-issued-modal" role="dialog" aria-modal="true" aria-labelledby="issued-title"><button className="modal-close" aria-label="Cerrar" onClick={() => { setIssuedSale(null); setTicketImageUrl('') }}><Icon name="close"/></button><div className="section-kicker">RESERVACIÓN GUARDADA</div><h2 id="issued-title">Comprobante listo</h2><p className="modal-description">Un solo comprobante para {issuedSale.buyer} y {issuedSale.ticketIds.length} {issuedSale.ticketIds.length === 1 ? 'asiento' : 'asientos'}.</p>{ticketImageUrl ? <img className="ticket-preview" src={ticketImageUrl} alt={`Comprobante de ${issuedSale.buyer} con sus asientos y mesas`}/> : ticketImageError ? <p className="ticket-image-error">{ticketImageError}</p> : <p className="ticket-generating">Preparando el comprobante…</p>}{ticketImageUrl && <button className="confirm-sale" onClick={() => shareTicketImage()}>Compartir o guardar comprobante <Icon name="arrow"/></button>}<p className="ticket-note">Incluye el nombre, los números de mesa y los asientos reservados.</p></section></div>}
    {cancelTicket && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCancelTicket(null) }}><section className="sale-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setCancelTicket(null)}><Icon name="close"/></button><div className="modal-icon cancel-icon"><Icon name="close"/></div><div className="section-kicker">CANCELACIÓN · {cancelTicket.id}</div><h2 id="cancel-title">Cancelar boleto</h2><p className="modal-description">La venta de {cancelTicket.buyer} se conservará en el historial.</p><form onSubmit={recordCancellation}><label htmlFor="cancel-reason">Motivo de cancelación</label><input id="cancel-reason" required maxLength={160} placeholder="Ej. Devolución" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}/><label htmlFor="cancel-disposition">¿Qué pasa con el lugar?</label><select id="cancel-disposition" value={cancelDisposition} onChange={(event) => setCancelDisposition(event.target.value as 'resell' | 'unavailable')}><option value="resell">Disponible para volver a vender</option><option value="unavailable">No se va a utilizar</option></select><button className="confirm-sale" type="submit" disabled={!cancelReason.trim() || busy || (dataMode === 'database' && Boolean(dbError))}>{busy ? 'Guardando…' : 'Confirmar cancelación'} <Icon name="arrow"/></button></form></section></div>}
    {historyOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false) }}><section className="sale-modal history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setHistoryOpen(false)}><Icon name="close"/></button><div className="section-kicker">REGISTRO</div><h2 id="history-title">Compras y cancelaciones</h2><div className="history-list">{history.length ? history.map((item) => <article key={item.id}><strong>{item.type === 'sale' ? 'Compra' : 'Devolución / cancelación'}</strong><span>{item.buyer || 'Sin nombre'}</span><small>{item.ticketCount} {item.ticketCount === 1 ? 'asiento' : 'asientos'} · {item.ticketIds.replaceAll(',', ', ')} · {item.reason} · {item.newStatus} · {new Date(item.createdAt + 'Z').toLocaleString('es-MX')}</small></article>) : <p>{dataMode === 'database' ? 'Todavía no hay movimientos registrados en la base de datos.' : 'El historial estará disponible al conectar la base de datos.'}</p>}</div></section></div>}
    {notice && <div className="toast" role="status"><span><Icon name="check"/></span>{notice}</div>}
  </div>
}
