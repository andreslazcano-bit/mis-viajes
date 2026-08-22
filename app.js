'use strict';

/* ------------------------------------------------------------------ */
/* Datos semilla                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'viajeChiloe2026';
const ROUTE_CACHE_KEY = 'viajeChiloe2026_routeCacheV2';

// Notas: solo logística ya confirmada (transporte, ferry, retiro/devolución
// del auto). Nada de actividades o lugares sugeridos — eso lo deciden
// Andrés y Valentina y lo agregan ellos mismos editando la tabla.
const SEED_ITINERARIO = [
  { fecha: '2026-10-23', lugar: 'Santiago → Valdivia', tipo: 'transito', notas: 'Bus nocturno (~11-12 h)' },
  { fecha: '2026-10-24', lugar: 'Valdivia', tipo: 'alojamiento', notas: 'Llegada AM' },
  { fecha: '2026-10-25', lugar: 'Valdivia', tipo: 'alojamiento', notas: '' },
  { fecha: '2026-10-26', lugar: 'Quemchi (Chiloé)', tipo: 'alojamiento', notas: 'Retiro del auto en Valdivia. Ferry Pargua–Chacao' },
  { fecha: '2026-10-27', lugar: 'Quemchi (Chiloé)', tipo: 'alojamiento', notas: '' },
  { fecha: '2026-10-28', lugar: 'Castro / Chonchi', tipo: 'alojamiento', notas: '' },
  { fecha: '2026-10-29', lugar: 'Cucao / P.N. Chiloé', tipo: 'camping', notas: 'Llegada al parque' },
  { fecha: '2026-10-30', lugar: 'Cucao / P.N. Chiloé', tipo: 'camping', notas: '' },
  { fecha: '2026-10-31', lugar: 'Quellón', tipo: 'camping', notas: '' },
  { fecha: '2026-11-01', lugar: 'Quellón', tipo: 'camping', notas: '' },
  { fecha: '2026-11-02', lugar: 'Cochamó / Puerto Varas', tipo: 'alojamiento', notas: 'Salida de Chiloé: ferry Chacao–Pargua, luego ruta terrestre sin ferry hasta Cochamó (~360 km desde Quellón)' },
  { fecha: '2026-11-03', lugar: 'Cochamó / Puerto Varas', tipo: 'alojamiento', notas: '' },
  { fecha: '2026-11-04', lugar: 'Valdivia', tipo: 'alojamiento', notas: 'Ruta terrestre de vuelta a Valdivia' },
  { fecha: '2026-11-05', lugar: 'Valdivia → Santiago', tipo: 'transito', notas: 'Devolución del auto AM. Bus nocturno de vuelta' },
];

const SEED_PRESUPUESTO = [
  { categoria: 'Alojamiento', monto: 480000, detalle: '8 noches Airbnb ~$50.000 + 4 noches camping ~$20.000' },
  { categoria: 'Diésel', monto: 123626, detalle: '' },
  { categoria: 'Ferries', monto: 26000, detalle: 'Pargua–Chacao ida y vuelta' },
  { categoria: 'Peajes', monto: 22000, detalle: '' },
  { categoria: 'Buses Santiago–Valdivia', monto: 80000, detalle: 'Ida y vuelta, 2 personas. Ya comprado' },
  { categoria: 'Entradas parques nacionales', monto: 15400, detalle: 'Chiloé + Tantauco, 2 personas' },
  { categoria: 'Comida', monto: 520000, detalle: '' },
  { categoria: 'Vehículo', monto: 250000, detalle: 'Hyundai Tucson diésel 4x4. Ya pagado — retiro 26-10-2026, devolución 05-11-2026' },
];

// aportes.andres es su aporte total: $800.000 en efectivo + $250.000 del
// auto (Hyundai Tucson, ya pagado aparte). Se cuenta como un solo monto.
const SEED_APORTES = { valentina: 500000, andres: 1050000 };

const TIPOS = {
  transito: 'Tránsito',
  alojamiento: 'Alojamiento',
  camping: 'Camping',
};

const CATEGORIAS_GASTO = {
  alojamiento: 'Alojamiento',
  comida: 'Comida',
  diesel: 'Diésel',
  ferry: 'Ferry',
  peaje: 'Peaje',
  parque: 'Parque',
  otro: 'Otro',
};

/* ------------------------------------------------------------------ */
/* Ruta: el mapa se arma leyendo el itinerario directamente            */
/* ------------------------------------------------------------------ */

// Nominatim (el geocodificador gratuito de OpenStreetMap) no manda los
// headers CORS necesarios para llamarlo desde el navegador, así que en
// vez de adivinar coordenadas de cualquier texto, se usa esta lista de
// lugares conocidos del sur de Chile. Si el itinerario menciona un lugar
// que no está aquí, la app avisa en vez de fallar en silencio — se puede
// seguir agregando lugares a esta lista.
const PLACE_COORDS = {
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'valdivia': { lat: -39.8142, lng: -73.2459 },
  'niebla': { lat: -39.8631, lng: -73.3961 },
  'corral': { lat: -39.8814, lng: -73.4292 },
  'los molinos': { lat: -39.9394, lng: -73.3922 },
  'quemchi': { lat: -42.1439, lng: -73.4749 },
  'quemchi (chiloé)': { lat: -42.1439, lng: -73.4749 },
  'ancud': { lat: -41.8697, lng: -73.8203 },
  'dalcahue': { lat: -42.3789, lng: -73.6494 },
  'curaco de vélez': { lat: -42.4394, lng: -73.5847 },
  'achao': { lat: -42.4778, lng: -73.4967 },
  'castro': { lat: -42.4827, lng: -73.7654 },
  'chonchi': { lat: -42.6231, lng: -73.7761 },
  'castro / chonchi': { lat: -42.4827, lng: -73.7654 },
  'cucao': { lat: -42.6167, lng: -74.1167 },
  'cucao / p.n. chiloé': { lat: -42.6167, lng: -74.1167 },
  'quellón': { lat: -43.1197, lng: -73.6127 },
  'chaiguata': { lat: -43.0464, lng: -73.4972 },
  'puerto varas': { lat: -41.3195, lng: -72.9857 },
  'puerto montt': { lat: -41.4693, lng: -72.9424 },
  'cochamó': { lat: -41.5167, lng: -72.2333 },
  'cochamó / puerto varas': { lat: -41.3195, lng: -72.9857 },
  'frutillar': { lat: -41.1281, lng: -73.0631 },
  'osorno': { lat: -40.5739, lng: -73.1339 },
};

const MODE_STYLES = {
  transito: { color: '#5b6bb0', weight: 4, dashArray: '2 10', label: 'Tránsito' },
  auto: { color: '#1f5f52', weight: 4, dashArray: null, label: 'Auto' },
  ferry: { color: '#2f8fbf', weight: 3, dashArray: '1 8', label: 'Ferry' },
};

const KM_POR_HORA_RESPALDO = 65; // solo para estimar tiempo si OSRM no responde

// Km reales en auto (recorrido completo) para estimar litros de diésel.
// Se actualiza cada vez que se recalcula la ruta (ver drawRoute).
let currentAutoKm = 0;

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizePlaceKey(str) {
  return stripAccents(str.trim().toLowerCase());
}

const PLACE_INDEX = {};
Object.entries(PLACE_COORDS).forEach(([name, coords]) => {
  PLACE_INDEX[normalizePlaceKey(name)] = coords;
});

function resolvePlaceCoords(rawLugar) {
  if (!rawLugar) return null;
  const sinParentesis = rawLugar.replace(/\([^)]*\)/g, '').trim();
  const candidatos = [rawLugar, sinParentesis, ...sinParentesis.split('/').map((s) => s.trim())];
  for (const candidato of candidatos) {
    const coords = PLACE_INDEX[normalizePlaceKey(candidato)];
    if (coords) return coords;
  }
  return null;
}

// Convierte el itinerario (ordenado por fecha) en una lista de paradas con
// coordenadas. Las filas de tránsito con "X → Y" se separan en dos puntos.
// Se saltan repeticiones consecutivas del mismo lugar (días seguidos en el
// mismo sitio) y se reportan los lugares que no se pudieron ubicar.
function buildRouteStops() {
  const sorted = [...state.itinerario].filter((d) => d.fecha && d.lugar).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const stops = [];
  const unresolved = [];

  sorted.forEach((day) => {
    const partes = day.lugar.includes('→') ? day.lugar.split('→').map((s) => s.trim()) : [day.lugar.trim()];
    partes.forEach((parte) => {
      if (!parte) return;
      const coords = resolvePlaceCoords(parte);
      if (!coords) {
        if (!unresolved.includes(parte)) unresolved.push(parte);
        return;
      }
      const ultimo = stops[stops.length - 1];
      if (ultimo && normalizePlaceKey(ultimo.lugar) === normalizePlaceKey(parte)) {
        // Mismo lugar que la parada anterior: si esa parada era solo de
        // paso (tránsito) y esta es una parada real, actualiza lo que se
        // muestra en el popup (fecha/notas) pero conserva arrivalTipo tal
        // cual, porque ese es el que define si el tramo hacia este lugar
        // se dibuja como tránsito o como auto.
        if (ultimo.tipo === 'transito' && day.tipo !== 'transito') {
          stops[stops.length - 1] = { ...ultimo, lugar: parte, fecha: day.fecha, tipo: day.tipo, notas: day.notas, dayId: day.id };
        }
        return;
      }
      stops.push({ lugar: parte, fecha: day.fecha, tipo: day.tipo, notas: day.notas, arrivalTipo: day.tipo, dayId: day.id, lat: coords.lat, lng: coords.lng });
    });
  });

  return { stops, unresolved };
}

/* ------------------------------------------------------------------ */
/* Estado                                                             */
/* ------------------------------------------------------------------ */

let state = null;
let uidCounter = 1;

function nextId() {
  return 'id' + (Date.now().toString(36)) + (uidCounter++).toString(36);
}

function defaultState() {
  return {
    itinerario: SEED_ITINERARIO.map((d) => ({ id: nextId(), ...d })),
    presupuesto: SEED_PRESUPUESTO.map((d) => ({ id: nextId(), ...d })),
    aportes: { ...SEED_APORTES },
    gastos: [],
    dieselKmPorLitro: 11.8,
    dieselPrecios: [],
  };
}

// Adapta datos guardados con el esquema anterior (aportes sin auto,
// gastos con "quien"/"monto" en vez de montoAndres/montoValentina) al
// esquema actual, sin perder lo que ya estaba guardado.
function normalizeState(parsed) {
  if (parsed.aportes.autoAndres !== undefined) {
    parsed.aportes.andres = (Number(parsed.aportes.andres) || 0) + (Number(parsed.aportes.autoAndres) || 0);
    delete parsed.aportes.autoAndres;
  }

  if (parsed.dieselKmPorLitro === undefined || parsed.dieselKmPorLitro === null || Number.isNaN(parsed.dieselKmPorLitro)) {
    // Esquema anterior guardaba L/100km; se convierte a km/L.
    parsed.dieselKmPorLitro = parsed.dieselRendimiento > 0 ? +(100 / parsed.dieselRendimiento).toFixed(1) : 11.8;
  }
  delete parsed.dieselRendimiento;
  if (!Array.isArray(parsed.dieselPrecios)) {
    parsed.dieselPrecios = [];
  }

  parsed.gastos = (parsed.gastos || []).map((g) => {
    if (g.montoAndres !== undefined && g.montoValentina !== undefined) return g;
    const monto = Number(g.monto) || 0;
    return {
      id: g.id || nextId(),
      fecha: g.fecha || '',
      categoria: g.categoria || 'otro',
      descripcion: g.descripcion || '',
      montoAndres: g.quien === 'Andrés' ? monto : 0,
      montoValentina: g.quien === 'Valentina' ? monto : 0,
    };
  });

  return parsed;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.itinerario || !parsed.presupuesto || !parsed.aportes || !parsed.gastos) {
      return defaultState();
    }
    return normalizeState(parsed);
  } catch (e) {
    console.warn('No se pudo leer localStorage, usando datos semilla', e);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                         */
/* ------------------------------------------------------------------ */

function formatCLP(num) {
  const n = Number(num) || 0;
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function formatFechaDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const TRASH_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"/><path d="M6 7 V20 a1.5 1.5 0 0 0 1.5 1.5 h9 A1.5 1.5 0 0 0 18 20 V7"/><path d="M9.5 11 V17"/><path d="M14.5 11 V17"/><path d="M9 7 V4.5 A1.5 1.5 0 0 1 10.5 3 h3 A1.5 1.5 0 0 1 15 4.5 V7"/></svg>';

function makeDeleteButton(title, onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn-icon';
  btn.title = title;
  btn.innerHTML = TRASH_ICON_SVG;
  btn.addEventListener('click', onClick);
  return btn;
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(btn.dataset.tab).classList.add('active');

      if (btn.dataset.tab === 'itinerario' && window.__leafletMap) {
        setTimeout(() => window.__leafletMap.invalidateSize(), 50);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* Itinerario                                                         */
/* ------------------------------------------------------------------ */

function renderItinerario() {
  const tbody = document.getElementById('itinerario-tbody');
  tbody.innerHTML = '';

  const sorted = [...state.itinerario].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  sorted.forEach((day) => {
    const tr = document.createElement('tr');
    tr.dataset.id = day.id;

    const tdFecha = document.createElement('td');
    const fechaInput = document.createElement('input');
    fechaInput.type = 'date';
    fechaInput.value = day.fecha || '';
    fechaInput.addEventListener('change', () => {
      updateItinerarioField(day.id, 'fecha', fechaInput.value);
      renderItinerario();
    });
    tdFecha.appendChild(fechaInput);

    const tdLugar = document.createElement('td');
    tdLugar.contentEditable = 'true';
    tdLugar.textContent = day.lugar || '';
    tdLugar.addEventListener('blur', () => updateItinerarioField(day.id, 'lugar', tdLugar.textContent.trim()));

    const tdTipo = document.createElement('td');
    const tipoSelect = document.createElement('select');
    tipoSelect.className = 'tipo-select tipo-' + day.tipo;
    Object.entries(TIPOS).forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (value === day.tipo) opt.selected = true;
      tipoSelect.appendChild(opt);
    });
    tipoSelect.addEventListener('change', () => {
      updateItinerarioField(day.id, 'tipo', tipoSelect.value);
      tipoSelect.className = 'tipo-select tipo-' + tipoSelect.value;
    });
    tdTipo.appendChild(tipoSelect);

    const tdNotas = document.createElement('td');
    tdNotas.contentEditable = 'true';
    tdNotas.textContent = day.notas || '';
    tdNotas.addEventListener('blur', () => updateItinerarioField(day.id, 'notas', tdNotas.textContent.trim()));

    const tdActions = document.createElement('td');
    const delBtn = makeDeleteButton('Eliminar día', () => {
      if (confirm('¿Eliminar este día del itinerario?')) {
        state.itinerario = state.itinerario.filter((d) => d.id !== day.id);
        saveState();
        renderItinerario();
      }
    });
    tdActions.appendChild(delBtn);

    tr.append(tdFecha, tdLugar, tdTipo, tdNotas, tdActions);
    tbody.appendChild(tr);
  });

  renderCalendar();
  scheduleRouteRedraw();
}

function updateItinerarioField(id, field, value) {
  const day = state.itinerario.find((d) => d.id === id);
  if (!day) return;
  day[field] = value;
  saveState();
  renderCalendar();
  scheduleRouteRedraw();
}

document.addEventListener('DOMContentLoaded', () => {
  const addDayBtn = document.getElementById('add-day-btn');
  addDayBtn.addEventListener('click', () => {
    state.itinerario.push({
      id: nextId(),
      fecha: '',
      lugar: '',
      tipo: 'alojamiento',
      notas: '',
    });
    saveState();
    renderItinerario();
  });
});

/* ------------------------------------------------------------------ */
/* Calendario del itinerario                                          */
/* ------------------------------------------------------------------ */

const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_LABELS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getTripRange() {
  const fechas = state.itinerario.map((d) => d.fecha).filter(Boolean).sort();
  if (fechas.length === 0) return null;
  return { start: fechas[0], end: fechas[fechas.length - 1] };
}

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  container.innerHTML = '';

  const range = getTripRange();
  if (!range) return;

  const [startY, startM] = range.start.split('-').map(Number);
  const [endY, endM] = range.end.split('-').map(Number);

  let y = startY;
  let m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    container.appendChild(renderMonthGrid(y, m, range));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
}

function renderMonthGrid(year, month, range) {
  const wrap = document.createElement('div');
  wrap.className = 'calendar-month';

  const title = document.createElement('h4');
  title.textContent = `${MONTH_LABELS[month - 1]} ${year}`;
  wrap.appendChild(title);

  const dowRow = document.createElement('div');
  dowRow.className = 'calendar-dow-row';
  DOW_LABELS.forEach((l) => {
    const el = document.createElement('span');
    el.textContent = l;
    dowRow.appendChild(el);
  });
  wrap.appendChild(dowRow);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // grilla de lunes a domingo

  for (let i = 0; i < leadingBlanks; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day calendar-day-blank';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';

    const num = document.createElement('span');
    num.className = 'calendar-day-num';
    num.textContent = String(day);
    cell.appendChild(num);

    const inTrip = iso >= range.start && iso <= range.end;
    const entries = state.itinerario.filter((d) => d.fecha === iso);

    if (inTrip) {
      cell.classList.add('calendar-day-in-trip');
      if (entries.length === 0) {
        cell.classList.add('calendar-day-empty');
        const warn = document.createElement('span');
        warn.className = 'calendar-day-warning';
        warn.textContent = 'Sin planificar';
        cell.appendChild(warn);
      } else {
        entries.forEach((entry) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `calendar-chip tipo-${entry.tipo}`;
          chip.textContent = entry.lugar || '(sin lugar)';
          chip.title = `${entry.lugar || '(sin lugar)'} — ${TIPOS[entry.tipo] || ''}`;
          chip.dataset.dayId = entry.id;
          chip.addEventListener('click', () => {
            highlightItinerarioRow(entry.id);
            focusMapForDay(entry.id);
          });
          cell.appendChild(chip);
        });
      }
    } else {
      cell.classList.add('calendar-day-out');
    }

    grid.appendChild(cell);
  }

  wrap.appendChild(grid);
  return wrap;
}

function highlightItinerarioRow(id) {
  const row = document.querySelector(`#itinerario-tbody tr[data-id="${id}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.add('row-flash');
  setTimeout(() => row.classList.remove('row-flash'), 1500);
}

function highlightCalendarChip(id) {
  const chip = document.querySelector(`.calendar-chip[data-day-id="${id}"]`);
  if (!chip) return;
  chip.scrollIntoView({ behavior: 'smooth', block: 'center' });
  chip.classList.add('chip-flash');
  setTimeout(() => chip.classList.remove('chip-flash'), 1500);
}

/* ------------------------------------------------------------------ */
/* Ruta / mapa                                                        */
/* ------------------------------------------------------------------ */

const TIPO_MARKER_FILL = {
  transito: '#5b6bb0',
  alojamiento: '#1f5f52',
  camping: '#c98a2e',
};

let routeRedrawTimeout = null;

function initMap() {
  const map = L.map('map', {
    center: [-38.5, -72.2],
    zoom: 5,
  });
  window.__leafletMap = map;
  window.__routeLayer = L.layerGroup().addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  drawRoute();
}

// Redibuja el mapa un rato después del último cambio en el itinerario,
// para no lanzar varias llamadas a OSRM si se editan varios campos seguidos.
function scheduleRouteRedraw() {
  if (!window.__leafletMap) return;
  if (routeRedrawTimeout) clearTimeout(routeRedrawTimeout);
  routeRedrawTimeout = setTimeout(() => drawRoute(), 400);
}

function focusMapForDay(dayId) {
  const marker = window.__routeMarkersByDay && window.__routeMarkersByDay[dayId];
  if (!marker || !window.__leafletMap) return;
  window.__leafletMap.setView(marker.getLatLng(), Math.max(window.__leafletMap.getZoom(), 8));
  marker.openPopup();
}

function buildStopPopup(stop) {
  const fechaDisplay = formatFechaDisplay(stop.fecha);
  const tipoLabel = TIPOS[stop.tipo] || stop.tipo;
  const notas = stop.notas
    ? `<div class="popup-notas">${escapeHtml(stop.notas)}</div>`
    : '<div class="popup-notas popup-notas-empty">Sin notas</div>';
  return `
    <div class="stop-popup">
      <div class="popup-lugar">${escapeHtml(stop.lugar)}</div>
      <div class="popup-fecha">${fechaDisplay}</div>
      <span class="popup-tipo tipo-${stop.tipo}">${escapeHtml(tipoLabel)}</span>
      ${notas}
    </div>
  `;
}

function renderUnresolvedNote(unresolved) {
  const el = document.getElementById('ruta-unresolved');
  if (!el) return;
  if (unresolved.length === 0) {
    el.textContent = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  el.textContent = `No pudimos ubicar en el mapa: ${unresolved.join(', ')}. Usa el nombre de una ciudad conocida del sur de Chile, o pide que se agregue a la lista de lugares reconocidos.`;
}

function formatMinutes(min) {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function loadRouteCache() {
  try {
    return JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveRouteCache(cache) {
  try {
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // localStorage lleno o no disponible: seguimos sin cachear.
  }
}

function segmentKey(from, to) {
  return `${from.lat},${from.lng}|${to.lat},${to.lng}`;
}

// Pide la ruta real por carretera a OSRM, con los pasos (steps) para poder
// detectar automáticamente qué parte del trayecto es en ferry (OSRM ya
// conoce el ferry Pargua–Chacao y lo marca con mode:"ferry").
async function fetchOsrmRouteDetailed(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('OSRM respondió con error');
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error('OSRM sin ruta');

    const subSegments = [];
    route.legs.forEach((leg) => {
      leg.steps.forEach((step) => {
        const mode = step.mode === 'ferry' ? 'ferry' : 'driving';
        const coords = step.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const last = subSegments[subSegments.length - 1];
        if (last && last.mode === mode) {
          last.coords.push(...coords.slice(1));
          last.distanceKm += step.distance / 1000;
          last.minutes += step.duration / 60;
        } else {
          subSegments.push({ mode, coords: [...coords], distanceKm: step.distance / 1000, minutes: step.duration / 60 });
        }
      });
    });

    return subSegments;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveSegmentRoute(from, to, outerMode, cache) {
  const key = segmentKey(from, to);
  if (cache[key]) {
    return { subSegments: cache[key].subSegments, source: 'cache' };
  }
  try {
    const subSegments = await fetchOsrmRouteDetailed(from, to);
    cache[key] = { subSegments };
    return { subSegments, source: 'osrm' };
  } catch (e) {
    const distanceKm = haversineKm(from, to);
    return {
      subSegments: [{ mode: outerMode, coords: [[from.lat, from.lng], [to.lat, to.lng]], distanceKm, minutes: (distanceKm / KM_POR_HORA_RESPALDO) * 60 }],
      source: 'fallback',
    };
  }
}

async function drawRoute() {
  const map = window.__leafletMap;
  if (!map || !window.__routeLayer) return;
  window.__routeLayer.clearLayers();

  const { stops, unresolved } = buildRouteStops();
  renderUnresolvedNote(unresolved);

  const totals = {
    auto: { km: 0, min: 0 },
    transito: { km: 0, min: 0 },
    ferry: { km: 0, min: 0 },
  };

  if (stops.length === 0) {
    window.__routeMarkersByDay = {};
    currentAutoKm = 0;
    renderDieselCard();
    renderRutaResumen(totals);
    return;
  }

  window.__routeMarkersByDay = {};

  const markers = stops.map((stop) => {
    const marker = L.circleMarker([stop.lat, stop.lng], {
      radius: 8,
      fillColor: TIPO_MARKER_FILL[stop.tipo] || TIPO_MARKER_FILL.alojamiento,
      color: '#fff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(window.__routeLayer);
    marker.bindPopup(buildStopPopup(stop));
    marker.on('click', () => {
      highlightCalendarChip(stop.dayId);
      highlightItinerarioRow(stop.dayId);
    });
    window.__routeMarkersByDay[stop.dayId] = marker;
    return marker;
  });

  const pairs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    pairs.push({
      from: stops[i],
      to: stops[i + 1],
      outerMode: stops[i + 1].arrivalTipo === 'transito' ? 'transito' : 'auto',
    });
  }

  const cache = loadRouteCache();
  let cacheDirty = false;

  const resolved = await Promise.all(
    pairs.map(async (pair) => {
      const key = segmentKey(pair.from, pair.to);
      const hadCache = Boolean(cache[key]);
      const r = await resolveSegmentRoute(pair.from, pair.to, pair.outerMode, cache);
      if (!hadCache && cache[key]) cacheDirty = true;
      return { pair, ...r };
    })
  );

  if (cacheDirty) saveRouteCache(cache);

  resolved.forEach(({ pair, subSegments, source }) => {
    subSegments.forEach((sub) => {
      const styleMode = sub.mode === 'ferry' ? 'ferry' : pair.outerMode;
      const style = MODE_STYLES[styleMode];
      const line = L.polyline(sub.coords, {
        color: style.color,
        weight: style.weight,
        dashArray: style.dashArray,
        lineCap: 'round',
        opacity: 0.9,
      }).addTo(window.__routeLayer);

      totals[styleMode].km += sub.distanceKm;
      totals[styleMode].min += sub.minutes;

      const approxNote = source === 'fallback' ? ' (aprox., sin conexión al calcular)' : '';
      line.bindPopup(`<strong>${escapeHtml(pair.from.lugar)} → ${escapeHtml(pair.to.lugar)}</strong><br>${style.label} · ${Math.round(sub.distanceKm)} km · ${formatMinutes(sub.minutes)}${approxNote}`);
    });
  });

  markers.forEach((m) => m.bringToFront());

  currentAutoKm = totals.auto.km;
  renderDieselCard();
  renderRutaResumen(totals);
}

function renderRutaResumen(totals) {
  const el = document.getElementById('ruta-resumen');
  if (!el) return;
  el.innerHTML = `
    <span><strong>${Math.round(totals.auto.km)}</strong> km en auto (~${formatMinutes(totals.auto.min)})</span>
    <span><strong>${Math.round(totals.transito.km)}</strong> km en tránsito (~${formatMinutes(totals.transito.min)})</span>
    <span><strong>${Math.round(totals.ferry.km)}</strong> km en ferry (~${formatMinutes(totals.ferry.min)})</span>
  `;
}

/* ------------------------------------------------------------------ */
/* Presupuesto                                                        */
/* ------------------------------------------------------------------ */

function renderPresupuesto() {
  const tbody = document.getElementById('presupuesto-tbody');
  tbody.innerHTML = '';

  state.presupuesto.forEach((item) => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;

    const tdCat = document.createElement('td');
    tdCat.contentEditable = 'true';
    tdCat.textContent = item.categoria || '';
    tdCat.addEventListener('blur', () => updatePresupuestoField(item.id, 'categoria', tdCat.textContent.trim()));

    const tdMonto = document.createElement('td');
    const montoInput = document.createElement('input');
    montoInput.type = 'number';
    montoInput.min = '0';
    montoInput.step = '1000';
    montoInput.value = item.monto || 0;
    montoInput.addEventListener('change', () => {
      updatePresupuestoField(item.id, 'monto', Number(montoInput.value) || 0);
      renderPresupuestoTotal();
    });
    tdMonto.appendChild(montoInput);

    const tdDetalle = document.createElement('td');
    tdDetalle.contentEditable = 'true';
    tdDetalle.textContent = item.detalle || '';
    tdDetalle.addEventListener('blur', () => updatePresupuestoField(item.id, 'detalle', tdDetalle.textContent.trim()));

    const tdActions = document.createElement('td');
    const delBtn = makeDeleteButton('Eliminar categoría', () => {
      if (confirm('¿Eliminar esta categoría de presupuesto?')) {
        state.presupuesto = state.presupuesto.filter((p) => p.id !== item.id);
        saveState();
        renderPresupuesto();
      }
    });
    tdActions.appendChild(delBtn);

    tr.append(tdCat, tdMonto, tdDetalle, tdActions);
    tbody.appendChild(tr);
  });

  renderPresupuestoTotal();
}

function updatePresupuestoField(id, field, value) {
  const item = state.presupuesto.find((p) => p.id === id);
  if (!item) return;
  item[field] = value;
  saveState();
}

function renderPresupuestoTotal() {
  const total = state.presupuesto.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  document.getElementById('presupuesto-total').textContent = formatCLP(total);
  renderPresupuestoResumen();
}

function setupPresupuestoUI() {
  document.getElementById('add-budget-btn').addEventListener('click', () => {
    state.presupuesto.push({ id: nextId(), categoria: 'Nueva categoría', monto: 0, detalle: '' });
    saveState();
    renderPresupuesto();
  });

  const inputs = [
    ['aporte-valentina', 'valentina'],
    ['aporte-andres', 'andres'],
  ];

  inputs.forEach(([elId, key]) => {
    const input = document.getElementById(elId);
    input.value = state.aportes[key];
    input.addEventListener('input', () => {
      state.aportes[key] = Number(input.value) || 0;
      saveState();
      renderAportesResumen();
      updateBalance();
    });
  });
}

function renderAportesResumen() {
  const { valentina, andres } = state.aportes;
  const total = valentina + andres;

  const pctValentina = total > 0 ? (valentina / total) * 100 : 0;
  const pctAndres = total > 0 ? (andres / total) * 100 : 0;

  document.getElementById('aporte-pcts').textContent =
    total > 0
      ? `Reparto de gastos compartidos → Valentina: ${pctValentina.toFixed(2)}% · Andrés: ${pctAndres.toFixed(2)}%`
      : 'Ingresa los aportes para calcular los porcentajes.';

  renderPresupuestoResumen();
}

function renderPresupuestoResumen() {
  const { valentina, andres } = state.aportes;
  const totalAportado = valentina + andres;
  const proyectado = state.presupuesto.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const gastadoReal = state.gastos.reduce((sum, g) => sum + (Number(g.montoAndres) || 0) + (Number(g.montoValentina) || 0), 0);
  const restante = totalAportado - gastadoReal;

  document.getElementById('resumen-valentina').textContent = formatCLP(valentina);
  document.getElementById('resumen-andres').textContent = formatCLP(andres);
  document.getElementById('resumen-total-aportes').textContent = formatCLP(totalAportado);

  document.getElementById('resumen-proyectado').textContent = formatCLP(proyectado);
  document.getElementById('resumen-gastado').textContent = formatCLP(gastadoReal);

  const restanteEl = document.getElementById('resumen-restante');
  restanteEl.textContent = formatCLP(restante);
  restanteEl.classList.toggle('negative-amount', restante < 0);

  const fill = document.getElementById('resumen-progress');
  const label = document.getElementById('resumen-progress-label');
  const pct = totalAportado > 0 ? (gastadoReal / totalAportado) * 100 : 0;
  fill.style.width = `${Math.min(pct, 100)}%`;
  fill.classList.toggle('over-budget', pct > 100);
  label.textContent = `${pct.toFixed(0)}%`;
}

/* ------------------------------------------------------------------ */
/* Diésel: precio semanal e historial                                  */
/* ------------------------------------------------------------------ */

function setupDieselUI() {
  const rendimientoInput = document.getElementById('diesel-rendimiento');
  rendimientoInput.value = state.dieselKmPorLitro;
  rendimientoInput.addEventListener('input', () => {
    state.dieselKmPorLitro = Number(rendimientoInput.value) || 0;
    saveState();
    renderDieselCard();
  });

  const fechaInput = document.getElementById('diesel-fecha-input');
  fechaInput.value = new Date().toISOString().slice(0, 10);

  document.getElementById('diesel-registrar-btn').addEventListener('click', () => {
    const precioInput = document.getElementById('diesel-precio-input');
    const precio = Number(precioInput.value) || 0;
    const fecha = fechaInput.value || new Date().toISOString().slice(0, 10);
    if (precio <= 0) return;

    state.dieselPrecios.push({ id: nextId(), fecha, precioLitro: precio });
    saveState();
    precioInput.value = '';
    fechaInput.value = new Date().toISOString().slice(0, 10);
    renderDieselCard();
  });
}

function renderDieselCard() {
  const kmEl = document.getElementById('diesel-km');
  if (!kmEl) return;

  const kmPorLitro = state.dieselKmPorLitro || 0;
  const litros = kmPorLitro > 0 ? currentAutoKm / kmPorLitro : 0;

  kmEl.textContent = `${Math.round(currentAutoKm)} km`;
  document.getElementById('diesel-litros').textContent = `${Math.round(litros)} L`;

  const historial = [...state.dieselPrecios].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimo = historial[historial.length - 1];

  const estimadoEl = document.getElementById('diesel-estimado-linea');
  const aplicarBtn = document.getElementById('diesel-aplicar-btn');

  if (ultimo) {
    const estimado = litros * ultimo.precioLitro;
    estimadoEl.innerHTML = `Estimado con el precio más reciente (${formatCLP(ultimo.precioLitro)}/L, ${formatFechaDisplay(ultimo.fecha)}): <strong>${formatCLP(estimado)}</strong>`;
    aplicarBtn.disabled = false;
    aplicarBtn.onclick = () => {
      let dieselCat = state.presupuesto.find((p) => {
        const c = p.categoria.trim().toLowerCase();
        return c.startsWith('diésel') || c.startsWith('diesel');
      });
      if (!dieselCat) {
        dieselCat = { id: nextId(), categoria: 'Diésel', monto: 0, detalle: '' };
        state.presupuesto.push(dieselCat);
      }
      dieselCat.monto = Math.round(estimado);
      saveState();
      renderPresupuesto();
    };
  } else {
    estimadoEl.textContent = 'Registra el precio de esta semana para ver el estimado.';
    aplicarBtn.disabled = true;
    aplicarBtn.onclick = null;
  }

  renderDieselHistorial(historial);
}

function renderDieselHistorial(historialSorted) {
  const container = document.getElementById('diesel-historial');
  container.innerHTML = '';

  if (historialSorted.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diesel-historial-empty';
    empty.textContent = 'Sin precios registrados todavía.';
    container.appendChild(empty);
    return;
  }

  const recienteAAntiguo = [...historialSorted].reverse();

  recienteAAntiguo.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'diesel-historial-row';

    const fecha = document.createElement('span');
    fecha.className = 'diesel-historial-fecha';
    fecha.textContent = formatFechaDisplay(entry.fecha);
    row.appendChild(fecha);

    const precio = document.createElement('span');
    precio.className = 'diesel-historial-precio';
    precio.textContent = `${formatCLP(entry.precioLitro)}/L`;
    row.appendChild(precio);

    const anterior = recienteAAntiguo[idx + 1];
    if (anterior) {
      const delta = entry.precioLitro - anterior.precioLitro;
      const deltaSpan = document.createElement('span');
      deltaSpan.textContent = delta === 0 ? 'sin cambio' : `${delta > 0 ? '+' : ''}${formatCLP(delta)}/L`;
      deltaSpan.className = delta > 0 ? 'diesel-delta-up' : delta < 0 ? 'diesel-delta-down' : '';
      row.appendChild(deltaSpan);
    }

    const delBtn = makeDeleteButton('Eliminar registro', () => {
      state.dieselPrecios = state.dieselPrecios.filter((p) => p.id !== entry.id);
      saveState();
      renderDieselCard();
    });
    row.appendChild(delBtn);

    container.appendChild(row);
  });
}

/* ------------------------------------------------------------------ */
/* Gastos                                                              */
/* ------------------------------------------------------------------ */

function renderGastos() {
  const tbody = document.getElementById('gastos-tbody');
  tbody.innerHTML = '';

  const sorted = [...state.gastos].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  sorted.forEach((gasto) => {
    const tr = document.createElement('tr');
    tr.dataset.id = gasto.id;

    const tdFecha = document.createElement('td');
    const fechaInput = document.createElement('input');
    fechaInput.type = 'date';
    fechaInput.value = gasto.fecha || '';
    fechaInput.addEventListener('change', () => {
      updateGastoField(gasto.id, 'fecha', fechaInput.value);
    });
    tdFecha.appendChild(fechaInput);

    const tdCategoria = document.createElement('td');
    const catSelect = document.createElement('select');
    Object.entries(CATEGORIAS_GASTO).forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (value === gasto.categoria) opt.selected = true;
      catSelect.appendChild(opt);
    });
    catSelect.addEventListener('change', () => updateGastoField(gasto.id, 'categoria', catSelect.value));
    tdCategoria.appendChild(catSelect);

    const tdDescripcion = document.createElement('td');
    tdDescripcion.contentEditable = 'true';
    tdDescripcion.textContent = gasto.descripcion || '';
    tdDescripcion.addEventListener('blur', () => updateGastoField(gasto.id, 'descripcion', tdDescripcion.textContent.trim()));

    const tdTotal = document.createElement('td');
    tdTotal.className = 'gasto-total-cell';

    function refreshTotal() {
      tdTotal.textContent = formatCLP((Number(montoAndresInput.value) || 0) + (Number(montoValentinaInput.value) || 0));
    }

    const tdMontoAndres = document.createElement('td');
    const montoAndresInput = document.createElement('input');
    montoAndresInput.type = 'number';
    montoAndresInput.min = '0';
    montoAndresInput.step = '100';
    montoAndresInput.value = gasto.montoAndres || 0;
    montoAndresInput.addEventListener('change', () => {
      updateGastoField(gasto.id, 'montoAndres', Number(montoAndresInput.value) || 0);
      refreshTotal();
    });
    tdMontoAndres.appendChild(montoAndresInput);

    const tdMontoValentina = document.createElement('td');
    const montoValentinaInput = document.createElement('input');
    montoValentinaInput.type = 'number';
    montoValentinaInput.min = '0';
    montoValentinaInput.step = '100';
    montoValentinaInput.value = gasto.montoValentina || 0;
    montoValentinaInput.addEventListener('change', () => {
      updateGastoField(gasto.id, 'montoValentina', Number(montoValentinaInput.value) || 0);
      refreshTotal();
    });
    tdMontoValentina.appendChild(montoValentinaInput);

    refreshTotal();

    const tdActions = document.createElement('td');
    const delBtn = makeDeleteButton('Eliminar gasto', () => {
      if (confirm(`¿Eliminar el gasto "${gasto.descripcion || 'sin descripción'}"?`)) {
        state.gastos = state.gastos.filter((g) => g.id !== gasto.id);
        saveState();
        renderGastos();
        updateBalance();
      }
    });
    tdActions.appendChild(delBtn);

    tr.append(tdFecha, tdCategoria, tdDescripcion, tdMontoAndres, tdMontoValentina, tdTotal, tdActions);
    tbody.appendChild(tr);
  });
}

function updateGastoField(id, field, value) {
  const gasto = state.gastos.find((g) => g.id === id);
  if (!gasto) return;
  gasto[field] = value;
  saveState();
  updateBalance();
}

function setupGastoForm() {
  const form = document.getElementById('gasto-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fecha = document.getElementById('gasto-fecha').value;
    const categoria = document.getElementById('gasto-categoria').value;
    const descripcion = document.getElementById('gasto-descripcion').value.trim();
    const montoAndres = Number(document.getElementById('gasto-monto-andres').value) || 0;
    const montoValentina = Number(document.getElementById('gasto-monto-valentina').value) || 0;

    if (!fecha || !descripcion || (montoAndres <= 0 && montoValentina <= 0)) return;

    state.gastos.push({ id: nextId(), fecha, categoria, descripcion, montoAndres, montoValentina });
    saveState();
    renderGastos();
    updateBalance();

    form.reset();
    document.getElementById('gasto-fecha').value = fecha;
    document.getElementById('gasto-descripcion').focus();
  });
}

/* ------------------------------------------------------------------ */
/* Gasto por persona vs. su propio presupuesto                        */
/* ------------------------------------------------------------------ */

// No todos los gastos se reparten proporcionalmente entre los dos (por
// ejemplo, el auto lo pagó solo Andrés y los pasajes solo Valentina).
// Lo que importa aquí es que cada uno vea claramente si se está pasando
// de su propio presupuesto, no calcular quién le debe a quién.
function updateBalance() {
  const { valentina: aporteValentina, andres: aporteAndres } = state.aportes;

  const totalGastado = state.gastos.reduce((sum, g) => sum + (Number(g.montoAndres) || 0) + (Number(g.montoValentina) || 0), 0);
  const pagoAndres = state.gastos.reduce((sum, g) => sum + (Number(g.montoAndres) || 0), 0);
  const pagoValentina = state.gastos.reduce((sum, g) => sum + (Number(g.montoValentina) || 0), 0);

  document.getElementById('gasto-total-real').textContent = formatCLP(totalGastado);

  document.getElementById('andres-presupuesto').textContent = formatCLP(aporteAndres);
  document.getElementById('andres-pago').textContent = formatCLP(pagoAndres);
  setDisponible('andres-disponible', aporteAndres - pagoAndres);

  document.getElementById('valentina-presupuesto').textContent = formatCLP(aporteValentina);
  document.getElementById('valentina-pago').textContent = formatCLP(pagoValentina);
  setDisponible('valentina-disponible', aporteValentina - pagoValentina);

  updateProgress('andres', pagoAndres, aporteAndres);
  updateProgress('valentina', pagoValentina, aporteValentina);

  renderPresupuestoResumen();
}

function setDisponible(elId, disponible) {
  const el = document.getElementById(elId);
  el.textContent = formatCLP(disponible);
  el.classList.toggle('negative-amount', disponible < 0);
}

function updateProgress(personKey, pagado, presupuestoPersonal) {
  const fill = document.getElementById(`${personKey}-progress`);
  const label = document.getElementById(`${personKey}-progress-label`);
  const pct = presupuestoPersonal > 0 ? (pagado / presupuestoPersonal) * 100 : 0;
  const clamped = Math.min(pct, 100);

  fill.style.width = `${clamped}%`;
  fill.classList.toggle('over-budget', pct > 100);
  label.textContent = `${pct.toFixed(0)}%`;
}

/* ------------------------------------------------------------------ */
/* Exportar / Importar / Reset                                        */
/* ------------------------------------------------------------------ */

function setupDataButtons() {
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `viaje-chiloe-2026-${fecha}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.itinerario || !imported.presupuesto || !imported.aportes || !imported.gastos) {
          throw new Error('Formato inválido');
        }
        if (!confirm('Esto reemplazará los datos actuales por los del archivo importado. ¿Continuar?')) {
          return;
        }
        state = normalizeState(imported);
        saveState();
        renderAll();
      } catch (err) {
        alert('No se pudo importar el archivo: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Esto borrará todos los datos guardados y volverá a los datos originales del viaje. ¿Continuar?')) {
      state = defaultState();
      saveState();
      renderAll();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

function renderAll() {
  renderItinerario();
  renderPresupuesto();
  document.getElementById('aporte-valentina').value = state.aportes.valentina;
  document.getElementById('aporte-andres').value = state.aportes.andres;
  renderAportesResumen();
  renderGastos();
  updateBalance();
  renderDieselCard();
}

/* ------------------------------------------------------------------ */
/* Clave de acceso                                                     */
/* ------------------------------------------------------------------ */

// Esto NO es seguridad real: el repo es público y cualquiera con algo de
// conocimiento técnico puede ver este código y el hash. Solo evita que
// alguien que llegue al link por casualidad vea los datos del viaje.
const LOCK_PASSWORD_HASH = 'c5f011b4b1fce43e38aa776d1430cab5067085a85e155f2fa678f03e78eae7ef';
const LOCK_UNLOCKED_KEY = 'viajeChiloe2026_unlocked';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function revealApp() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('app-root').hidden = false;
  if (window.__leafletMap) {
    setTimeout(() => window.__leafletMap.invalidateSize(), 50);
  }
}

function setupLockScreen() {
  if (!window.crypto || !window.crypto.subtle) {
    // Sin Web Crypto (ej. abierto como archivo local con file://, donde
    // el navegador no la habilita): no hay riesgo de exposición al abrir
    // un archivo propio, así que no tiene sentido pedir la clave.
    revealApp();
    return;
  }

  let alreadyUnlocked = false;
  try {
    alreadyUnlocked = localStorage.getItem(LOCK_UNLOCKED_KEY) === '1';
  } catch (e) {
    // localStorage no disponible: se pedirá la clave en cada visita.
  }

  if (alreadyUnlocked) {
    revealApp();
    return;
  }

  document.getElementById('lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('lock-input');
    const errorEl = document.getElementById('lock-error');
    const hash = await sha256Hex(input.value);

    if (hash === LOCK_PASSWORD_HASH) {
      try {
        localStorage.setItem(LOCK_UNLOCKED_KEY, '1');
      } catch (err) {
        // sigue funcionando para esta sesión aunque no se pueda recordar.
      }
      errorEl.style.display = 'none';
      revealApp();
    } else {
      errorEl.style.display = 'block';
      input.value = '';
      input.focus();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Tema claro / oscuro                                                */
/* ------------------------------------------------------------------ */

const THEME_KEY = 'viajeChiloe2026_theme';

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // localStorage no disponible: el toggle igual funciona para esta sesión.
  }
}

function resolvedTheme() {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleIcon() {
  document.getElementById('theme-toggle-btn').classList.toggle('is-dark', resolvedTheme() === 'dark');
}

function setupThemeToggle() {
  updateThemeToggleIcon();
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
    setStoredTheme(next);
    document.documentElement.dataset.theme = next;
    updateThemeToggleIcon();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  state = loadState();

  setupLockScreen();
  setupTabs();
  setupThemeToggle();
  setupPresupuestoUI();
  setupDieselUI();
  setupGastoForm();
  setupDataButtons();
  initMap();
  renderAll();
});
