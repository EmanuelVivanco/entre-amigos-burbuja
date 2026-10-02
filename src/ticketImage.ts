export type TicketImageItem = { id: string; table: number; letter: string }

export function createTicketImage(buyer: string, tickets: TicketImageItem[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    let context = canvas.getContext('2d')
    if (!context) return reject(new Error('Este dispositivo no pudo preparar la imagen.'))

    context.font = '700 24px Arial, sans-serif'
    let x = 136
    let y = 702
    const chipPositions: Array<{ x: number; y: number; width: number; label: string }> = []
    const maxX = 930
    for (const ticket of tickets) {
      const label = `MESA ${String(ticket.table).padStart(2, '0')} · ${ticket.letter}`
      const width = context.measureText(label).width + 48
      if (x + width > maxX) { x = 136; y += 76 }
      chipPositions.push({ x, y, width, label })
      x += width + 14
    }
    const lastChipY = chipPositions.at(-1)?.y ?? 702
    const footerY = Math.max(1000, lastChipY + 210)
    canvas.height = footerY + 270
    context = canvas.getContext('2d')
    if (!context) return reject(new Error('Este dispositivo no pudo preparar la imagen.'))

    const background = context.createLinearGradient(0, 0, 1080, canvas.height)
    background.addColorStop(0, '#241b3b')
    background.addColorStop(1, '#563d72')
    context.fillStyle = background
    context.fillRect(0, 0, 1080, canvas.height)

    context.fillStyle = '#f3a8cf'
    context.beginPath()
    context.arc(980, 92, 190, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#f9ead8'
    context.beginPath()
    context.roundRect(48, 48, 984, canvas.height - 96, 48)
    context.fill()

    context.fillStyle = '#744e91'
    context.font = '700 32px Arial, sans-serif'
    context.fillText('ENTRE AMIGOS', 104, 132)
    context.fillStyle = '#9a779e'
    context.font = '600 22px Arial, sans-serif'
    context.fillText('BURBUJA', 104, 170)

    context.fillStyle = '#39274c'
    context.font = '800 68px Arial, sans-serif'
    context.fillText('TU BOLETO', 104, 318)
    context.fillStyle = '#725f73'
    context.font = '400 30px Arial, sans-serif'
    context.fillText('Pase de acceso · Evento Entre Amigos', 104, 376)

    context.fillStyle = '#fff'
    context.beginPath()
    context.roundRect(88, 448, 904, lastChipY + 105 - 448, 32)
    context.fill()
    context.fillStyle = '#9b879d'
    context.font = '700 21px Arial, sans-serif'
    context.fillText('A NOMBRE DE', 136, 514)
    context.fillStyle = '#35283e'
    context.font = '700 46px Arial, sans-serif'
    context.fillText(trimCanvasText(context, buyer, 800), 136, 576)

    context.fillStyle = '#9b879d'
    context.font = '700 21px Arial, sans-serif'
    context.fillText(tickets.length === 1 ? 'ASIENTO' : 'ASIENTOS', 136, 658)

    for (const chip of chipPositions) {
      context.fillStyle = '#f6e8f0'
      context.beginPath()
      context.roundRect(chip.x, chip.y - 34, chip.width, 52, 24)
      context.fill()
      context.fillStyle = '#744e91'
      context.fillText(chip.label, chip.x + 24, chip.y)
    }

    context.fillStyle = '#5b4664'
    context.font = '700 25px Arial, sans-serif'
    context.fillText('Nos vemos en la pista', 104, footerY)
    context.fillStyle = '#9b879d'
    context.font = '400 22px Arial, sans-serif'
    context.fillText('Presenta esta imagen al llegar al evento.', 104, footerY + 42)
    context.fillStyle = '#d5c3d2'
    context.fillRect(104, footerY + 100, 872, 2)
    context.fillStyle = '#9b879d'
    context.font = '400 18px Arial, sans-serif'
    context.fillText('Conserva este boleto. El código QR y el registro de asistencia se añadirán después.', 104, footerY + 154)

    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen del boleto.')), 'image/png')
  })
}

function trimCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1)
  return `${shortened}…`
}
