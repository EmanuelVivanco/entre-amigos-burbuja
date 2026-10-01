# entre-amigos-burbuja
Tickets

## Panel administrativo (demo)

Primera versión mobile-first para administrar 120 boletos en 30 mesas con cuatro lugares (A, B, C y D) por mesa. El mapa ahora sigue las posiciones del croquis del Club Burbuja; cada mesa muestra cuatro marcas de estado y abre sus asientos en controles táctiles. En celular también se puede elegir la mesa desde una fila numerada. Permite seleccionar varios lugares disponibles y registrar una venta únicamente con el nombre del comprador. El estado de demostración se conserva en el navegador y puede restaurarse con **Reiniciar demo**.

Las salas VIP 01, 02 y 03 aparecen como vendidas. Los estados de los boletos y nombres son de demostración; los cambios se guardan solo en el navegador. Esta versión no conecta servicios externos.

### Fase posterior: acceso al evento

Al añadir el escaneo de boletos, registrar la asistencia por separado (por ejemplo, con una fecha de acceso) y mostrar **Asistió** como estado de entrada. Así el boleto conserva su estado **Vendido**. El lector QR y el check-in no forman parte de esta demo.

### Desarrollo

```sh
pnpm install
pnpm dev
```

### Build

```sh
pnpm build
```
