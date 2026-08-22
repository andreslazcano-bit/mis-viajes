# Viaje a Chiloé 2026

App de una sola página (HTML + CSS + JS vanilla, sin framework ni backend) para planificar el viaje en auto de Andrés y Valentina por el sur de Chile: Santiago → Valdivia → Chiloé → Cochamó → Valdivia → Santiago, del 23 de octubre al 5 de noviembre de 2026.

## Funcionalidades

- **Itinerario**: tabla editable de los 14 días del viaje (fecha, lugar, tipo, notas), con un calendario que marca visualmente los días ya planificados (y color por tipo) y avisa si queda algún día del rango del viaje sin asignar.
- **Ruta**: mapa con Leaflet.js (OpenStreetMap, sin API key), con vista inicial fija. Traza el trayecto real por carretera (vía el servicio público OSRM, con caché local y respaldo sin conexión) diferenciando bus, auto y ferry, y muestra los kilómetros de cada tramo y el total por modo de transporte.
- **Presupuesto**: aportes de cada persona (incluye el auto ya pagado por Andrés, sumado a su aporte para el cálculo del reparto), presupuesto proyectado por categoría, un resumen claro de presupuesto total vs. gasto real acumulado, y un registro semanal del precio del diésel (ingresado a mano — no existe una API pública gratuita y confiable para esto) que recalcula el estimado en litros según los km reales de la ruta y muestra el historial de precios semana a semana.
- **Gastos**: registro de gastos reales que se pueden pagar entre los dos (monto de Andrés + monto de Valentina por gasto), con reparto proporcional automático según el % de aporte de cada persona (no 50/50), balance en tiempo real y barra de avance de gasto vs. presupuesto personal.
- **Persistencia**: todo se guarda en `localStorage`. Hay botones para exportar/importar un archivo `.json` con todo el estado, para sincronizar datos entre los dos celulares (por WhatsApp, por ejemplo).

## Cómo abrir la app localmente

No requiere instalación ni build. Alguna de estas opciones:

1. Abrir `index.html` directamente con doble clic (funciona en la mayoría de los navegadores).
2. O servirla con un servidor local simple, por ejemplo:
   ```bash
   python3 -m http.server 8000
   ```
   y luego abrir `http://localhost:8000` en el navegador.

## Repositorio privado, sin GitHub Pages

Este repositorio es **privado** (solo lo ve la cuenta dueña). GitHub Pages gratis no está disponible para repos privados, así que la app no tiene una URL pública — se usa solo abriendo los archivos localmente (ver sección anterior) en el celular o notebook de cada uno.

Para compartir el avance entre Andrés y Valentina, usar los botones **Exportar datos** / **Importar datos** de la app y mandarse el `.json` (por WhatsApp, por ejemplo).

## Estructura del proyecto

```
index.html   # estructura de la página y las 4 pestañas
style.css    # estilos
app.js       # datos semilla, lógica de la app y persistencia
```
