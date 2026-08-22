# Viaje a Chiloé 2026

App de una sola página (HTML + CSS + JS vanilla, sin framework ni backend) para planificar el viaje en auto de Andrés y Valentina por el sur de Chile: Santiago → Valdivia → Chiloé → Cochamó → Valdivia → Santiago, del 23 de octubre al 5 de noviembre de 2026.

## Funcionalidades

- **Itinerario**: una sola vista combinada con el calendario y el mapa lado a lado (apilados en celular), más la tabla editable de los 14 días (fecha, lugar, tipo, notas) debajo.
  - El calendario marca visualmente los días ya planificados (color por tipo) y avisa si queda algún día del rango del viaje sin asignar. Clic en un día lleva a esa fila de la tabla y centra el mapa ahí.
  - El mapa (Leaflet.js + OpenStreetMap, sin API key, vista inicial fija) se arma directo desde el itinerario — si editas fechas o lugares, se redibuja solo (los lugares se ubican con una lista curada de sitios conocidos del sur de Chile, ya que el geocodificador gratuito de OSM no permite llamarlo desde el navegador; si escribes un lugar no reconocido, la app avisa). Traza el trayecto real por carretera vía el servicio público OSRM (con caché local y respaldo sin conexión), separando automáticamente los tramos en ferry (OSRM ya sabe del cruce Pargua–Chacao) de los de auto/tránsito, y muestra los kilómetros y el tiempo estimado de cada tramo y el total por modo (no se pudo usar Google Maps para el tiempo porque exige una cuenta de pago; OSRM usa la misma red de caminos de OpenStreetMap). Clic en un marcador resalta ese día en el calendario y en la tabla.
- **Presupuesto**: aporte total de cada persona (el de Andrés incluye el auto ya pagado, $250.000), presupuesto proyectado por categoría, un resumen claro de presupuesto total vs. gasto real acumulado, y un registro semanal del precio del diésel (ingresado a mano — no existe una API pública gratuita y confiable para esto) que recalcula el estimado en litros según los km reales de la ruta y muestra el historial de precios semana a semana.
- **Gastos**: registro de gastos reales que se pueden pagar entre los dos (monto de Andrés + monto de Valentina por gasto). No se reparte todo proporcionalmente entre los dos (no todos los gastos son 50/50 ni van a prorrata del aporte) — lo que se muestra es cuánto ha gastado cada uno y cuánto le queda disponible de su propio presupuesto, con barra de avance.
- **Persistencia**: todo se guarda en `localStorage`. Hay botones para exportar/importar un archivo `.json` con todo el estado, para sincronizar datos entre los dos celulares (por WhatsApp, por ejemplo).
- **Instalable y funciona sin señal**: es una PWA (`manifest.json` + `sw.js`) — se puede "instalar" en el celular como app, y un Service Worker cachea la app y los tiles del mapa/rutas ya vistas para que sigan disponibles sin conexión.
- **Modo claro/oscuro**: botón en el header, respeta la preferencia del sistema por defecto y recuerda la elección manual.

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

**Importante: esto no es seguridad real.** El repo es público, así que cualquiera con algo de conocimiento técnico puede ver el código (y el hash de la clave) mirando el código fuente. Solo evita que alguien que llegue al link por casualidad vea el itinerario/presupuesto. La clave se guarda como hash SHA-256 en `app.js` (no en texto plano), y una vez ingresada correctamente el navegador la recuerda (no hay que escribirla de nuevo en ese dispositivo).

Al abrir `index.html` directo como archivo local (sin servidor), la pantalla de clave se salta automáticamente — ahí no hace falta, porque solo tú tienes ese archivo.

Para sincronizar los cambios que cada uno hace, seguir usando los botones **Exportar datos** / **Importar datos** de la app y mandarse el `.json` (el link público no sincroniza datos entre los dos: cada navegador tiene su propio `localStorage`).

## Estructura del proyecto

```
index.html   # estructura de la página y las 3 pestañas
style.css    # estilos
app.js       # datos semilla, lógica de la app y persistencia
```
