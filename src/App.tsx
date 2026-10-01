import { useState } from 'react'

// Este estado describe la venta; el futuro check-in se guardará por separado.
type Status = 'Disponible' | 'Vendido' | 'No disponible'
type Ticket = { id: string; table: number; letter: string; status: Status; buyer?: string }

const STORAGE_KEY = 'burbuja-demo-tickets-v1'
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
  const soldNumbers = new Set([2, 3, 6, 9, 10, 13, 18, 21, 24, 27, 31, 34, 38, 41, 44, 48, 53, 57, 62, 66, 71, 76, 83, 89, 94, 101, 108, 116])
  return Array.from({ length: 120 }, (_, index) => {
    const table = Math.floor(index / 4) + 1
    const sold = soldNumbers.has(index + 1)
    return {
      id: `${String(table).padStart(2, '0')}-${letters[index % 4]}`,
      table,
      letter: letters[index % 4],
      status: sold ? 'Vendido' : 'Disponible',
      ...(sold ? { buyer: ['Mariana López', 'Diego Ramírez', 'Sofía Torres', 'Carlos Méndez'][index % 4] } : {}),
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
  const [selected, setSelected] = useState<string[]>([])
  const [activeTable, setActiveTable] = useState(1)
  const [buyer, setBuyer] = useState('')
  const [saleOpen, setSaleOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const soldCount = tickets.filter((ticket) => ticket.status === 'Vendido').length
  const availableCount = tickets.filter((ticket) => ticket.status === 'Disponible').length
  const tableTickets = tickets.filter((ticket) => ticket.table === activeTable)
  const activeAvailable = tableTickets.filter((ticket) => ticket.status === 'Disponible').length

  function updateTickets(next: Ticket[]) {
    setTickets(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* The current session still works without persistence. */ }
  }

  function toggleTicket(ticket: Ticket) {
    if (ticket.status !== 'Disponible') return
    setSelected((current) => current.includes(ticket.id) ? current.filter((id) => id !== ticket.id) : [...current, ticket.id])
  }

  function recordSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = buyer.trim()
    if (!cleanName || selected.length === 0) return
    const ids = new Set(selected)
    updateTickets(tickets.map((ticket) => ids.has(ticket.id) ? { ...ticket, status: 'Vendido', buyer: cleanName } : ticket))
    setNotice(`${selected.length} ${selected.length === 1 ? 'boleto registrado' : 'boletos registrados'} para ${cleanName}`)
    setSelected([])
    setBuyer('')
    setSaleOpen(false)
    window.setTimeout(() => setNotice(''), 4000)
  }

  function resetDemo() {
    updateTickets(initialTickets())
    setSelected([])
    setActiveTable(1)
    setNotice('Datos demo restaurados')
    window.setTimeout(() => setNotice(''), 3000)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#inicio" aria-label="Entre Amigos inicio"><span className="brand-mark"><span /></span><span className="brand-text">entre amigos<small>BURBUJA</small></span></a>
      <div className="side-label">GESTIÓN</div>
      <nav className="side-nav" aria-label="Navegación principal"><a className="nav-item active" href="#panel"><Icon name="grid"/> <span>Panel de control</span></a><a className="nav-item" href="#boletos"><Icon name="ticket"/><span>Boletos</span><span className="nav-count">120</span></a></nav>
      <div className="sidebar-bottom"><div className="event-mini"><span className="live-dot"/>EVENTO ACTIVO<p>Entre Amigos<br/>— Burbuja</p><div className="event-mini-foot">Datos de demostración</div></div><div className="profile"><div className="avatar">EA</div><div><strong>Administración</strong><small>Panel demo</small></div><span className="profile-dots">···</span></div></div>
    </aside>

    <main className="main-content" id="panel">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><span /></span><strong>entre amigos</strong></div><div className="breadcrumb">Eventos <span>/</span> <strong>Burbuja</strong></div><div className="top-actions"><span className="demo-pill"><i/> MODO DEMO</span><div className="top-avatar">EA</div></div></header>
      <div className="page-wrap">
        <section className="page-heading"><div><div className="eyebrow"><span/> EVENTO ACTIVO</div><h1>Panel de control</h1><p className="subtitle">Selecciona mesa y asigna sus lugares.</p></div><button className="reset-button" onClick={resetDemo}><Icon name="refresh"/> <span>Reiniciar demo</span></button></section>

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
          <div className="table-picker" aria-label="Elegir mesa">{tablePositions.map(({ table }) => <button key={table} className={activeTable === table ? 'picker-active' : ''} aria-pressed={activeTable === table} onClick={() => setActiveTable(table)}>{table}</button>)}</div>
          <div className="map-summary"><div><span className="summary-vip">Sala VIP <b>01</b><em>Vendida</em></span><span className="summary-vip"><b>02</b><em>Vendida</em></span><span className="summary-vip"><b>03</b><em>Vendida</em></span></div><small>Mapa basado en el croquis recibido · estados de boletos DEMO</small></div>

          <section className="seat-panel" aria-live="polite" aria-label={`Lugares de la mesa ${activeTable}`}>
            <div className="seat-panel-heading"><div><span className="section-kicker">MESA SELECCIONADA</span><h3>Mesa {String(activeTable).padStart(2, '0')}</h3></div><span className="seat-count">{activeAvailable} de 4 disponibles</span></div>
            <div className="seat-options">{tableTickets.map((ticket) => {
              const isSelected = selected.includes(ticket.id)
              return <button key={ticket.id} className={`seat-option ${ticket.status === 'Vendido' ? 'seat-option-sold' : ticket.status === 'No disponible' ? 'seat-option-unavailable' : ''} ${isSelected ? 'seat-option-selected' : ''}`} disabled={ticket.status !== 'Disponible'} aria-pressed={isSelected} onClick={() => toggleTicket(ticket)}>
                <span className="seat-letter">{ticket.letter}</span><span className="seat-detail"><strong>{isSelected ? 'Seleccionado' : ticket.status}</strong><small className={ticket.status === 'Vendido' ? 'buyer-name' : ''}>{ticket.status === 'Vendido' ? ticket.buyer : ticket.id}</small></span>
                {ticket.status === 'Vendido' && <span className="seat-check"><Icon name="check"/></span>}
                {ticket.status === 'No disponible' && <span className="seat-check seat-unavailable-check"><Icon name="close"/></span>}
              </button>
            })}</div>
          </section>
        </section>
        <footer className="page-footer"><span>Entre Amigos — Burbuja <i>·</i> Panel administrativo</span><span><i className="live-dot"/> Versión de demostración</span></footer>
      </div>
    </main>

    {selected.length > 0 && <div className="selection-bar"><div className="selection-copy"><span className="selection-ticket"><Icon name="ticket"/></span><div><strong>{selected.length} {selected.length === 1 ? 'lugar seleccionado' : 'lugares seleccionados'}</strong><small>{selected.slice(0, 3).join(', ')}{selected.length > 3 ? ` +${selected.length - 3} más` : ''}</small></div></div><div className="selection-actions"><button className="clear-selection" onClick={() => setSelected([])}>Cancelar</button><button className="sale-button" onClick={() => setSaleOpen(true)}>Registrar venta <Icon name="arrow"/></button></div></div>}

    {saleOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaleOpen(false) }}><section className="sale-modal" role="dialog" aria-modal="true" aria-labelledby="sale-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setSaleOpen(false)}><Icon name="close"/></button><div className="modal-icon"><Icon name="ticket"/></div><div className="section-kicker">NUEVA VENTA</div><h2 id="sale-title">Registrar boletos</h2><p className="modal-description">Agrega el nombre de quien compró los lugares seleccionados.</p><div className="modal-ticket-summary"><div><span>Lugares seleccionados</span><strong>{selected.length}</strong></div><div className="summary-chips">{selected.map((id) => <span key={id}>{id}</span>)}</div></div><form onSubmit={recordSale}><label htmlFor="buyer-name">Nombre del comprador</label><input id="buyer-name" autoFocus required maxLength={80} placeholder="Ej. María García" value={buyer} onChange={(event) => setBuyer(event.target.value)}/><p className="name-only-note"><span>i</span> El registro solicita únicamente el nombre.</p><button className="confirm-sale" type="submit" disabled={!buyer.trim()}>Confirmar venta <Icon name="arrow"/></button></form></section></div>}
    {notice && <div className="toast" role="status"><span><Icon name="check"/></span>{notice}</div>}
  </div>
}
