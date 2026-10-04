export type TicketImageItem = { id: string; table: number; letter: string }

const NAVY = '#102a43'
const TURQUOISE = '#168bd2'
const MUTED = '#526779'
const PALE_TURQUOISE = '#e7f4fb'
const BORDER = '#dce8ed'

export async function createTicketImage(buyer: string, tickets: TicketImageItem[]): Promise<Blob> {
  const flyer = new Image()
  await new Promise<void>((resolve, reject) => {
    flyer.onload = () => resolve()
    flyer.onerror = () => reject(new Error('No se pudo cargar el flyer del evento. Revisa tu conexión e inténtalo de nuevo.'))
    flyer.src = new URL('/entre-amigos-flyer.jpg', window.location.origin).toString()
    if (flyer.complete && flyer.naturalWidth > 0) resolve()
  })

  const byTable = new Map<number, string[]>()
  for (const ticket of tickets) {
    byTable.set(ticket.table, [...(byTable.get(ticket.table) || []), ticket.letter])
  }
  const groups = [...byTable.entries()].sort(([a], [b]) => a - b).map(([table, letters]) => ({
    table,
    letters: letters.sort().join(' · '),
  }))

  // Wait for the requested fonts when the network can load them. The fallbacks
  // keep ticket generation available on devices that are offline.
  await Promise.all([
    document.fonts.load('700 30px Poppins').catch(() => []),
    document.fonts.load('500 20px Montserrat').catch(() => []),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  const flyerWidth = 984
  const flyerHeight = flyerWidth * flyer.naturalHeight / flyer.naturalWidth
  const detailsTop = 48 + flyerHeight + 32
  const tableRowHeight = 84
  const rowsTop = detailsTop + 422
  const instructionTop = rowsTop + groups.length * tableRowHeight + 22
  const instructionHeight = 138
  canvas.height = Math.ceil(instructionTop + instructionHeight + 84)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Este dispositivo no pudo preparar el comprobante.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Flyer with a clean white frame and softly rounded corners.
  roundedRect(context, 48, 48, flyerWidth, flyerHeight, 22, '#ffffff')
  context.save()
  roundedPath(context, 48, 48, flyerWidth, flyerHeight, 22)
  context.clip()
  context.drawImage(flyer, 48, 48, flyerWidth, flyerHeight)
  context.restore()

  // Main ticket information panel.
  roundedRect(context, 48, detailsTop, 984, canvas.height - detailsTop - 32, 30, '#ffffff')
  context.strokeStyle = BORDER
  context.lineWidth = 2
  roundedPath(context, 48, detailsTop, 984, canvas.height - detailsTop - 32, 30)
  context.stroke()

  context.fillStyle = TURQUOISE
  context.font = '700 21px Poppins, Arial, sans-serif'
  context.fillText('COMPROBANTE DE RESERVACIÓN', 104, detailsTop + 64)
  context.fillStyle = MUTED
  context.font = '600 18px Montserrat, Arial, sans-serif'
  context.fillText('PERSONA QUE RESERVA / COMPRA', 104, detailsTop + 119)
  context.fillStyle = NAVY
  context.font = '700 46px Poppins, Arial, sans-serif'
  context.fillText(trimCanvasText(context, buyer, 870), 104, detailsTop + 178)

  // Seat count highlighted in turquoise.
  roundedRect(context, 104, detailsTop + 208, 872, 100, 20, PALE_TURQUOISE)
  context.fillStyle = MUTED
  context.font = '600 17px Montserrat, Arial, sans-serif'
  context.fillText(tickets.length === 1 ? 'ASIENTO RESERVADO' : 'ASIENTOS RESERVADOS', 132, detailsTop + 248)
  context.fillStyle = TURQUOISE
  context.font = '700 38px Poppins, Arial, sans-serif'
  context.fillText(String(tickets.length), 132, detailsTop + 292)

  context.fillStyle = NAVY
  context.font = '700 23px Poppins, Arial, sans-serif'
  context.fillText(groups.length === 1 ? 'MESA Y ASIENTO' : 'MESAS Y ASIENTOS', 104, detailsTop + 365)

  groups.forEach((group, index) => {
    const top = rowsTop + index * tableRowHeight
    roundedRect(context, 104, top, 872, 68, 15, '#ffffff')
    context.strokeStyle = BORDER
    context.lineWidth = 2
    roundedPath(context, 104, top, 872, 68, 15)
    context.stroke()

    roundedRect(context, 120, top + 10, 300, 48, 12, PALE_TURQUOISE)
    context.fillStyle = TURQUOISE
    context.font = '700 22px Poppins, Arial, sans-serif'
    context.fillText('MESA ' + String(group.table).padStart(2, '0'), 144, top + 43)
    context.fillStyle = TURQUOISE
    context.font = '600 20px Montserrat, Arial, sans-serif'
    const seatLabel = (group.letters.includes('·') ? 'ASIENTOS: ' : 'ASIENTO: ') + group.letters
    context.fillText(trimCanvasText(context, seatLabel, 500), 470, top + 43)
  })

  // Clear arrival instruction requested by the organizer.
  roundedRect(context, 104, instructionTop, 872, instructionHeight, 20, '#f4f8fb')
  context.fillStyle = NAVY
  context.font = '700 19px Poppins, Arial, sans-serif'
  context.fillText('AL LLEGAR AL EVENTO', 132, instructionTop + 37)
  context.fillStyle = MUTED
  context.font = '500 17px Montserrat, Arial, sans-serif'
  drawWrappedText(
    context,
    'Las personas que tengan esta reserva deben mostrar esta imagen y dejar su nombre al ingresar.',
    132,
    instructionTop + 72,
    810,
    27,
  )

  context.fillStyle = MUTED
  context.font = '500 15px Montserrat, Arial, sans-serif'
  context.fillText('Conserva esta imagen para presentarla al ingresar.', 104, canvas.height - 54)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar el comprobante.')), 'image/png')
  })
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  context.fillStyle = fill
  roundedPath(context, x, y, width, height, radius)
  context.fill()
}

function roundedPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  let lineNumber = 0
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, y + lineNumber * lineHeight)
      line = word
      lineNumber += 1
    } else {
      line = candidate
    }
  }
  if (line) context.fillText(line, x, y + lineNumber * lineHeight)
}

function trimCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(shortened + '…').width > maxWidth) shortened = shortened.slice(0, -1)
  return shortened + '…'
}
