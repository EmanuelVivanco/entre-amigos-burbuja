export type TicketImageItem = { id: string; table: number; letter: string }

export async function createTicketImage(buyer: string, tickets: TicketImageItem[]): Promise<Blob> {
  const flyer = new Image()
  flyer.src = '/entre-amigos-flyer.jpg'
  await flyer.decode()

  const byTable = new Map<number, string[]>()
  for (const ticket of tickets) byTable.set(ticket.table, [...(byTable.get(ticket.table) || []), ticket.letter])
  const groups = [...byTable.entries()].sort(([a], [b]) => a - b).map(([table, letters]) => ({ table, letters: letters.sort().join(' · ') }))

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  const flyerWidth = 984
  const flyerHeight = flyerWidth * flyer.naturalHeight / flyer.naturalWidth
  const detailsTop = 48 + flyerHeight + 28
  const rowHeight = 82
  canvas.height = Math.ceil(detailsTop + 540 + groups.length * rowHeight)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Este dispositivo no pudo preparar el comprobante.')

  context.fillStyle = '#17141b'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(flyer, 48, 48, flyerWidth, flyerHeight)
  context.fillStyle = '#f9f6f0'
  context.beginPath()
  context.roundRect(48, detailsTop, 984, canvas.height - detailsTop - 48, 36)
  context.fill()

  context.fillStyle = '#82604f'
  context.font = '700 22px Arial, sans-serif'
  context.fillText('COMPROBANTE DE RESERVACIÓN / COMPRA', 104, detailsTop + 68)
  context.fillStyle = '#675965'
  context.font = '700 20px Arial, sans-serif'
  context.fillText('PERSONA QUE RESERVA / COMPRA', 104, detailsTop + 133)
  context.fillStyle = '#221d25'
  context.font = '700 46px Arial, sans-serif'
  context.fillText(trimCanvasText(context, buyer, 860), 104, detailsTop + 193)

  context.fillStyle = '#f0e8e0'
  context.beginPath()
  context.roundRect(104, detailsTop + 222, 872, 98, 20)
  context.fill()
  context.fillStyle = '#675965'
  context.font = '700 20px Arial, sans-serif'
  context.fillText('NÚMERO DE ASIENTOS', 132, detailsTop + 260)
  context.fillStyle = '#322532'
  context.font = '800 42px Arial, sans-serif'
  context.fillText(String(tickets.length), 132, detailsTop + 306)
  context.fillStyle = '#82604f'
  context.font = '700 22px Arial, sans-serif'
  context.fillText(groups.length === 1 ? 'MESA Y ASIENTOS' : 'MESAS Y ASIENTOS', 104, detailsTop + 373)

  groups.forEach((group, index) => {
    const top = detailsTop + 397 + index * rowHeight
    context.fillStyle = '#fff'
    context.beginPath()
    context.roundRect(104, top, 872, 66, 16)
    context.fill()
    context.fillStyle = '#342b34'
    context.font = '700 24px Arial, sans-serif'
    context.fillText('MESA ' + String(group.table).padStart(2, '0'), 132, top + 42)
    context.fillStyle = '#4d815d'
    context.font = '700 22px Arial, sans-serif'
    context.fillText((group.letters.includes('·') ? 'ASIENTOS: ' : 'ASIENTO: ') + group.letters, 490, top + 42)
  })
  const footerY = detailsTop + 425 + groups.length * rowHeight
  context.fillStyle = '#514851'
  context.font = '600 20px Arial, sans-serif'
  context.fillText('Conserva este comprobante y preséntalo al llegar.', 104, footerY)
  context.fillStyle = '#938993'
  context.font = '400 18px Arial, sans-serif'
  context.fillText('Un solo registro para esta persona y todos sus asientos.', 104, footerY + 38)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar el comprobante.')), 'image/png')
  })
}

function trimCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(shortened + '…').width > maxWidth) shortened = shortened.slice(0, -1)
  return shortened + '…'
}
