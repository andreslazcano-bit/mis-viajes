# Mis Viajes

App de una sola página (HTML + CSS + JS vanilla, sin framework ni backend) para organizar viajes en auto: itinerario con calendario y mapa, presupuesto, y gastos repartidos entre las personas que van. Soporta varios viajes — el primero, ya cargado, es el viaje a Chiloé de Andrés y Valentina (Santiago → Valdivia → Chiloé → Cochamó → Valdivia → Santiago, 23 oct – 5 nov 2026), y se pueden crear más desde el selector de viajes.

## Funcionalidades

- **Selector de viajes**: pantalla inicial con la lista de tus viajes. "Nuevo viaje" crea uno completamente vacío (nombre, y desde ahí completas todo). Cada viaje tiene su propio itinerario, presupuesto, personas y gastos — independientes entre sí. Desde dentro de un viaje, el botón "‹ Mis viajes" en el header vuelve a esta lista.
- **Itinerario**: una sola vista combinada con el calendario y el mapa lado a lado (apilados en celular), más la tabla editable de los días (fecha, lugar, tipo, notas) debajo. Cada día de tipo "Tránsito" tiene además su propio modo de transporte (auto, bus o caminando), editable desde el detalle del día.
  - El calendario marca visualmente los días ya planificados (color por tipo) y avisa si queda algún día del rango del viaje sin asignar. Clic en un día lleva a esa fila de la tabla y centra el mapa ahí.
  - El mapa (Leaflet.js + OpenStreetMap, sin API key, vista inicial fija) se arma directo desde el itinerario — si editas fechas o lugares, se redibuja solo. Traza el trayecto real vía el servicio público OSRM (con caché local y respaldo sin conexión), usando el perfil de auto para auto/bus y el de a pie para caminando, separando automáticamente los tramos en ferry, y dibuja los vuelos en línea recta con su distancia real. Muestra los kilómetros y el tiempo estimado de cada tramo y el total por modo. Cada marcador y cada tramo tiene un link "Ver en Google Maps" (al lugar, o como ruta cuando es auto/bus/caminando). Un clic normal en un día del calendario o un marcador del mapa solo hace zoom y muestra sus paradas extra — para editar, ver el punto siguiente.
  - **Detalle de un día**: un ícono de flecha en cada fila de la tabla (o doble clic en la fila) abre una ventana con fecha/tipo/lugar/notas editables ahí mismo, flechas para pasar al día anterior/siguiente sin cerrarla, y las **paradas extra** de ese día (ej: estando en Valdivia, ir un rato a Niebla) — con la distancia real por carretera desde la parada principal, y aparecen como puntos chicos en el mapa (no forman parte del trayecto ni se enrutan, son solo un ida y vuelta dentro del mismo día).
  - **Autocompletado de lugares**: al escribir un lugar (el del día o el de una parada extra) aparece un desplegable con opciones reales — usa [Photon](https://photon.komoot.io) (geocodificador gratuito de Komoot sobre datos de OpenStreetMap, con CORS habilitado y sin API key; a diferencia de Nominatim, este sí se puede llamar directo desde el navegador), con sesgo dinámico hacia la zona del viaje. Al elegir una opción se guarda su coordenada exacta; si no seleccionas nada, cae de vuelta a una lista curada de lugares comunes del sur de Chile como respaldo.
- **Presupuesto**: aporte de cada persona del viaje (nombres y montos editables, personas se agregan/quitan libremente), presupuesto proyectado por categoría, un resumen claro de presupuesto total vs. gasto real acumulado, y una tarjeta de combustible (solo aparece si hay tramos en auto) con precio semanal — soporta diésel, gasolina/híbrido o eléctrico, y recalcula el estimado según los km reales en auto de la ruta.
- **Gastos**: registro de gastos reales que se pueden pagar entre cualquier cantidad de personas (un monto por persona, por gasto). No se reparte todo proporcionalmente entre todos (no todos los gastos son a prorrata del aporte) — lo que se muestra es cuánto ha gastado cada uno y cuánto le queda disponible de su propio presupuesto, con barra de avance.
- **Guardar / Restablecer**: las ediciones (itinerario, presupuesto, gastos, etc.) quedan en memoria hasta que apretai "Guardar" en el encabezado del viaje — "Restablecer" las descarta y vuelve a la última vez que guardaste. Salir de un viaje o cerrar la pestaña con cambios sin guardar te avisa antes. Esto no aplica a "Exportar", "Importar" ni "Vaciar este viaje" (ver más abajo), que quedan guardados de inmediato.
- **Perfiles y avisos de cambios**: como la usamos Andrés y Valentina, después de la clave se elige un perfil. Si la otra persona hizo cambios desde tu última visita, al entrar te aparece un resumen de qué cambió en cada viaje. Hay botones para cambiar de perfil o salir (cerrar sesión y volver a pedir la clave).
- **Persistencia**: todo se guarda en `localStorage` (todos los viajes juntos). Hay botones para exportar/importar un archivo `.json` con los datos del viaje que tienes abierto, para sincronizarlo con tus compañeros de viaje (por WhatsApp, por ejemplo). "Vaciar este viaje" deja el viaje abierto completamente en blanco (sin afectar tus otros viajes) — pide confirmación.
- **Instalable y funciona sin señal**: es una PWA (`manifest.json` + `sw.js`) — se puede "instalar" en el celular como app, y un Service Worker cachea la app y los tiles del mapa/rutas ya vistas para que sigan disponibles sin conexión.
- **Modo claro/oscuro**: botón fijo arriba a la derecha, respeta la preferencia del sistema por defecto y recuerda la elección manual.

## Cómo abrir la app localmente

No requiere instalación ni build. Alguna de estas opciones:

1. Abrir `index.html` directamente con doble clic (funciona en la mayoría de los navegadores).
2. O servirla con un servidor local simple, por ejemplo:
   ```bash
   python3 -m http.server 8000
   ```
   y luego abrir `http://localhost:8000` en el navegador.

## Repositorio público, con clave de acceso

Este repositorio es **público** y se publica en GitHub Pages en `https://andreslazcano-bit.github.io/viaje-chiloe-2026/`. Para que no cualquiera que encuentre el link vea los datos, la app pide una clave antes de mostrar contenido.

**Importante: esto no es seguridad real.** El repo es público, así que cualquiera con algo de conocimiento técnico puede ver el código (y el hash de la clave) mirando el código fuente. Solo evita que alguien que llegue al link por casualidad vea tus viajes. La clave se guarda como hash SHA-256 en `app.js` (no en texto plano), y una vez ingresada correctamente el navegador la recuerda (no hay que escribirla de nuevo en ese dispositivo).

Al abrir `index.html` directo como archivo local (sin servidor), la pantalla de clave se salta automáticamente — ahí no hace falta, porque solo tú tienes ese archivo.

Para sincronizar los cambios que cada persona hace en un viaje, seguir usando los botones **Exportar datos** / **Importar datos** de la app y mandarse el `.json` (el link público no sincroniza datos entre dispositivos: cada navegador tiene su propio `localStorage`).

## Estructura del proyecto

```
index.html   # estructura de la página: selector de viajes + vista de un viaje (pestañas)
style.css    # estilos
app.js       # datos semilla, lógica de la app y persistencia (varios viajes en un solo localStorage)
```
