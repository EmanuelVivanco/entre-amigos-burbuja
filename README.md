# entre-amigos-burbuja
Tickets

## Panel administrativo (demo)

Primera versión mobile-first para administrar 120 boletos en 30 mesas con cuatro lugares (A, B, C y D) por mesa. El mapa ahora sigue las posiciones del croquis del Club Burbuja; cada mesa muestra cuatro marcas de estado y abre sus asientos en controles táctiles. En celular también se puede elegir la mesa desde una fila numerada. Permite seleccionar varios lugares disponibles y registrar una venta únicamente con el nombre del comprador. El estado de demostración se conserva en el navegador y puede restaurarse con **Reiniciar demo**.

Las salas VIP 01, 02 y 03 aparecen como vendidas. El proyecto incluye una integración opcional con Cloudflare D1: al conectar la base, el panel guarda ventas y cancelaciones, y registra un historial que conserva el nombre anterior y el motivo. Una cancelación permite devolver el lugar a venta o marcarlo como no disponible; no se elimina el registro. Mientras D1 no esté conectado, el panel señala que está en modo demostración y los cambios permanecen en ese navegador. El modo demo arranca con los 120 lugares libres.

Cada compra se guarda como una sola reservación con el nombre de la persona y todos sus asientos; el historial agrupa los lugares por compra. No solicita teléfono ni correo. Al confirmar, el panel genera un comprobante PNG único para esa persona, con el flyer, la cantidad de asientos y la mesa y letras de asiento. No lleva QR. Desde celular se puede compartir con las opciones del dispositivo; en otros equipos se descarga la imagen. Los comprobantes se consultan desde el acceso “Boletos emitidos” y no ocupan espacio en el panel. El croquis administrativo se actualiza al volver a la pestaña, cada cinco segundos mientras está abierta y con el botón de actualización.

Para preparar la futura vista de venta, `GET /api/availability` devuelve el inventario de los mismos 120 lugares con sus estados (`Disponible`, `Vendido` o `No disponible`) y omite nombres y datos de reserva. La vista pública podrá consultar este endpoint periódicamente; así leerá el mismo D1 que modifica el panel administrativo. D1 no envía cambios por sí solo, por lo que esta primera sincronización se basa en consultas periódicas, no en notificaciones instantáneas.

### Conectar Cloudflare D1

1. En Cloudflare, abre **Storage & databases → D1 SQL Database** y crea una base para este proyecto.
2. En una base nueva, ejecuta `migrations/0001_tickets.sql` y luego `migrations/0002_grouped_sales.sql`, en ese orden y una sola vez. La segunda migración agrupa cada compra y conserva el inventario que ya exista.
3. Abre el proyecto Pages **entre-amigos-burbuja → Settings → Functions → D1 database bindings**.
4. Añade la vinculación con el nombre `BURBUJA_DB`, selecciona la base creada y guarda.
5. Vuelve a desplegar el proyecto. El panel cambiará de demostración a base de datos cuando la conexión esté activa.

**Acceso:** por decisión del propietario, el sitio y sus acciones no requieren iniciar sesión. Cualquier persona con el enlace podrá ver nombres y registrar ventas o cancelaciones. El historial conserva los movimientos, pero no identifica quién los hizo.

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

### Publicación

Cloudflare Pages publica la rama `main`; los cambios llegan al sitio cuando termina una implementación de producción exitosa.
