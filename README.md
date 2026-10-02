# entre-amigos-burbuja
Tickets

## Panel administrativo (demo)

Primera versión mobile-first para administrar 120 boletos en 30 mesas con cuatro lugares (A, B, C y D) por mesa. El mapa ahora sigue las posiciones del croquis del Club Burbuja; cada mesa muestra cuatro marcas de estado y abre sus asientos en controles táctiles. En celular también se puede elegir la mesa desde una fila numerada. Permite seleccionar varios lugares disponibles y registrar una venta únicamente con el nombre del comprador. El estado de demostración se conserva en el navegador y puede restaurarse con **Reiniciar demo**.

Las salas VIP 01, 02 y 03 aparecen como vendidas. El proyecto incluye una integración opcional con Cloudflare D1: al conectar la base, el panel guarda ventas y cancelaciones, y registra un historial que conserva el nombre anterior y el motivo. Una cancelación permite devolver el lugar a venta o marcarlo como no disponible; no se elimina el registro. Mientras D1 no esté conectado, el panel señala que está en modo demostración y los cambios permanecen en ese navegador.

El panel muestra el flyer oficial del evento y, al confirmar una venta, genera un boleto en PNG con el flyer como cabecera, el nombre y los asientos comprados. Desde celular se puede compartir con las opciones del dispositivo; en otros equipos se descarga la imagen. El mapa se actualiza al volver a la pestaña y cada 15 segundos cuando la base de datos está activa. También hay un botón para actualizarlo manualmente.

### Conectar Cloudflare D1

1. En Cloudflare, abre **Storage & databases → D1 SQL Database** y crea una base para este proyecto.
2. Ejecuta el archivo `migrations/0001_tickets.sql` en el editor SQL de esa base. La migración crea los 120 lugares como disponibles; ejecútala una sola vez en una base nueva. Así no se mezclan nombres ni ventas ficticias con la operación real.
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
