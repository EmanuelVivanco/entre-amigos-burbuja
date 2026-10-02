export type TicketImageItem = { id: string; table: number; letter: string }

export async function createTicketImage(buyer: string, tickets: TicketImageItem[]): Promise<Blob> {
  const flyer = new Image()
  flyer.src = '/entre-amigos-flyer.jpg'
  await flyer.decode()

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  const flyerWidth = 984
  const flyerHeight = flyerWidth * flyer.naturalHeight / flyer.naturalWidth
  const bodyTop = 48 + flyerHeight + 28
  let context = canvas.getContext('2d')
  if (!context) throw new Error('Este dispositivo no pudo preparar la imagen.')

  context.font = '700 24px Arial, sans-serif'
  let x = 104
  let y = bodyTop + 258
  const chips: Array<{ x: number; y: number; width: number; label: string }> = []
  for (const ticket of tickets) {
    const label = 'MESA ' + String(ticket.table).padStart(2, '0') + ' · ' + ticket.letter
    const width = context.measureText(label).width + 48
    if (x + width > 976) { x = 104; y += 76 }
    chips.push({ x, y, width, label })
    x += width + 14
  }
  const footerY = Math.max(bodyTop + 465, y + 120)
  canvas.height = Math.ceil(footerY + 190)
  context = canvas.getContext('2d')
  if (!context) throw new Error('Este dispositivo no pudo preparar la imagen.')

  context.fillStyle = '#17141b'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(flyer, 48, 48, flyerWidth, flyerHeight)
  context.fillStyle = '#f9f6f0'
  context.beginPath()
  context.roundRect(48, bodyTop, 984, footerY + 112 - bodyTop, 36)
  context.fill()

  context.fillStyle = '#82604f'
  context.font = '700 21px Arial, sans-serif'
  context.fillText('BOLETO PERSONAL', 104, bodyTop + 76)
  context.fillStyle = '#221d25'
  context.font = '700 24px Arial, sans-serif'
  context.fillText('TITULAR', 104, bodyTop + 143)
  context.font = '700 44px Arial, sans-serif'
  context.fillText(trimCanvasText(context, buyer, 860), 104, bodyTop + 199)

  context.fillStyle = '#82604f'
  context.font = '700 21px Arial, sans-serif'
  context.fillText(tickets.length === 1 ? 'ASIENTO' : 'ASIENTOS', 104, bodyTop + 241)
  context.font = '700 24px Arial, sans-serif'
  for (const chip of chips) {
    context.fillStyle = '#e8dfd7'
    context.beginPath()
    context.roundRect(chip.x, chip.y - 34, chip.width, 52, 24)
    context.fill()
    context.fillStyle = '#3a2c37'
    context.fillText(chip.label, chip.x + 24, chip.y)
  }

  context.fillStyle = '#514851'
  context.font = '600 21px Arial, sans-serif'
  context.fillText('Conserva esta imagen y preséntala al llegar al evento.', 104, footerY)
  context.fillStyle = '#938993'
  context.font = '400 18px Arial, sans-serif'
  context.fillText('El registro de acceso con código QR se añadirá después.', 104, footerY + 40)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen del boleto.')), 'image/png')
  })
}

function trimCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(shortened + '…').width > maxWidth) shortened = shortened.slice(0, -1)
  return shortened + '…'
}
