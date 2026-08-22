'use strict';

/* ------------------------------------------------------------------ */
/* Datos semilla                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'viajeChiloe2026';
const ROUTE_CACHE_KEY = 'viajeChiloe2026_routeCache';

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
/* Ruta: puntos, tramos y modos de transporte                         */
/* ------------------------------------------------------------------ */

const ROUTE_POINTS = [
  { lugar: 'Santiago', fecha: '2026-10-23', lat: -33.4489, lng: -70.6693 },
  { lugar: 'Valdivia', fecha: '2026-10-24', lat: -39.8142, lng: -73.2459 },
  { lugar: 'Quemchi', fecha: '2026-10-26', lat: -42.1439, lng: -73.4749 },
  { lugar: 'Castro', fecha: '2026-10-28', lat: -42.4827, lng: -73.7654 },
  { lugar: 'Cucao', fecha: '2026-10-29', lat: -42.6167, lng: -74.1167 },
  { lugar: 'Quellón', fecha: '2026-10-31', lat: -43.1197, lng: -73.6127 },
  { lugar: 'Cochamó / Puerto Varas', fecha: '2026-11-02', lat: -41.3195, lng: -72.9857 },
  { lugar: 'Valdivia', fecha: '2026-11-04', lat: -39.8142, lng: -73.2459 },
  { lugar: 'Santiago', fecha: '2026-11-05', lat: -33.4489, lng: -70.6693 },
];

// Terminales del ferry Pargua–Chacao (Canal de Chacao). No son días de
// alojamiento del itinerario, solo puntos de paso de la ruta.
const HUB_PARGUA = { lugar: 'Pargua (ferry)', lat: -41.6047, lng: -73.2802 };
const HUB_CHACAO = { lugar: 'Chacao (ferry)', lat: -41.8203, lng: -73.5150 };

const [PT_SCL_IDA, PT_VALDIVIA_IDA, PT_QUEMCHI, PT_CASTRO, PT_CUCAO, PT_QUELLON, PT_COCHAMO, PT_VALDIVIA_VUELTA, PT_SCL_VUELTA] = ROUTE_POINTS;

// Cada tramo se dibuja por separado para poder diferenciar bus / auto /
// ferry. Los tramos "auto" y "bus" se enrutan por carretera real vía OSRM;
// el ferry no se enruta (no hay camino por tierra) y usa una línea recta
// con el km real aproximado del cruce.
const ROUTE_SEGMENTS = [
  { from: PT_SCL_IDA, to: PT_VALDIVIA_IDA, mode: 'bus', fallbackKm: 840 },
  { from: PT_VALDIVIA_IDA, to: HUB_PARGUA, mode: 'auto', fallbackKm: 145 },
  { from: HUB_PARGUA, to: HUB_CHACAO, mode: 'ferry', fallbackKm: 3 },
  { from: HUB_CHACAO, to: PT_QUEMCHI, mode: 'auto', fallbackKm: 55 },
  { from: PT_QUEMCHI, to: PT_CASTRO, mode: 'auto', fallbackKm: 65 },
  { from: PT_CASTRO, to: PT_CUCAO, mode: 'auto', fallbackKm: 55 },
  { from: PT_CUCAO, to: PT_QUELLON, mode: 'auto', fallbackKm: 100 },
  { from: PT_QUELLON, to: HUB_CHACAO, mode: 'auto', fallbackKm: 155 },
  { from: HUB_CHACAO, to: HUB_PARGUA, mode: 'ferry', fallbackKm: 3 },
  { from: HUB_PARGUA, to: PT_COCHAMO, mode: 'auto', fallbackKm: 85 },
  { from: PT_COCHAMO, to: PT_VALDIVIA_VUELTA, mode: 'auto', fallbackKm: 180 },
  { from: PT_VALDIVIA_VUELTA, to: PT_SCL_VUELTA, mode: 'bus', fallbackKm: 840 },
];

const MODE_STYLES = {
  bus: { color: '#5b6bb0', weight: 4, dashArray: '2 10', label: 'Bus' },
  auto: { color: '#1f5f52', weight: 4, dashArray: null, label: 'Auto' },
  ferry: { color: '#2f8fbf', weight: 3, dashArray: '1 8', label: 'Ferry' },
};

// Km totales en auto (recorrido completo) para estimar litros de diésel.
// Arranca con la suma de los km de respaldo y se actualiza con el dato
// real apenas se resuelven los tramos de la ruta (ver drawRouteSegments).
const FALLBACK_AUTO_KM = ROUTE_SEGMENTS.filter((s) => s.mode === 'auto').reduce((sum, s) => sum + s.fallbackKm, 0);
let currentAutoKm = FALLBACK_AUTO_KM;

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

      if (btn.dataset.tab === 'ruta' && window.__leafletMap) {
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
      renderRutaTimestamps();
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
}

function updateItinerarioField(id, field, value) {
  const day = state.itinerario.find((d) => d.id === id);
  if (!day) return;
  day[field] = value;
  saveState();
  renderCalendar();
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
          chip.addEventListener('click', () => highlightItinerarioRow(entry.id));
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

/* ------------------------------------------------------------------ */
/* Ruta / mapa                                                        */
/* ------------------------------------------------------------------ */

function initMap() {
  const map = L.map('map', {
    center: [-38.5, -72.2],
    zoom: 5,
  });
  window.__leafletMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  window.__routeMarkers = ROUTE_POINTS.map((point, idx) => {
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 9,
      fillColor: '#1f5f52',
      color: '#fff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map);

    marker.bindPopup(buildPopupContent(point));
    marker.bindTooltip(`${idx + 1}. ${point.lugar}`, { direction: 'top' });
    return marker;
  });

  [HUB_PARGUA, HUB_CHACAO].forEach((hub) => {
    L.circleMarker([hub.lat, hub.lng], {
      radius: 5,
      fillColor: '#2f8fbf',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup(`<strong>${escapeHtml(hub.lugar)}</strong>`);
  });

  drawRouteSegments(map);
}

function buildPopupContent(point) {
  const day = state.itinerario.find((d) => d.fecha === point.fecha);
  const fechaDisplay = formatFechaDisplay(point.fecha);
  const notas = day && day.notas ? `<br><small>${escapeHtml(day.notas)}</small>` : '';
  return `<strong>${escapeHtml(point.lugar)}</strong><br>${fechaDisplay}${notas}`;
}

function renderRutaTimestamps() {
  if (!window.__routeMarkers) return;
  window.__routeMarkers.forEach((marker, idx) => {
    marker.setPopupContent(buildPopupContent(ROUTE_POINTS[idx]));
  });
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

function segmentKey(seg) {
  return `${seg.from.lat},${seg.from.lng}|${seg.to.lat},${seg.to.lng}`;
}

async function fetchOsrmRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('OSRM respondió con error');
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error('OSRM sin ruta');
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      km: route.distance / 1000,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveSegment(seg, cache) {
  if (seg.mode === 'ferry') {
    return {
      coords: [[seg.from.lat, seg.from.lng], [seg.to.lat, seg.to.lng]],
      km: seg.fallbackKm,
      source: 'ferry',
    };
  }

  const key = segmentKey(seg);
  if (cache[key]) {
    return { coords: cache[key].coords, km: cache[key].km, source: 'cache' };
  }

  try {
    const result = await fetchOsrmRoute(seg.from, seg.to);
    cache[key] = result;
    return { ...result, source: 'osrm' };
  } catch (e) {
    return {
      coords: [[seg.from.lat, seg.from.lng], [seg.to.lat, seg.to.lng]],
      km: seg.fallbackKm,
      source: 'fallback',
    };
  }
}

async function drawRouteSegments(map) {
  const cache = loadRouteCache();
  const totals = { bus: 0, auto: 0, ferry: 0 };
  let cacheDirty = false;

  const resolved = await Promise.all(
    ROUTE_SEGMENTS.map(async (seg) => {
      const key = segmentKey(seg);
      const hadCache = Boolean(cache[key]);
      const r = await resolveSegment(seg, cache);
      if (!hadCache && cache[key]) cacheDirty = true;
      return { seg, r };
    })
  );

  if (cacheDirty) saveRouteCache(cache);

  resolved.forEach(({ seg, r }) => {
    const style = MODE_STYLES[seg.mode];
    const line = L.polyline(r.coords, {
      color: style.color,
      weight: style.weight,
      dashArray: style.dashArray,
      lineCap: 'round',
      opacity: 0.9,
    }).addTo(map);

    const km = Math.round(r.km);
    totals[seg.mode] += km;

    const approxNote = r.source === 'fallback' ? ' (aprox., sin conexión al calcular)' : '';
    line.bindPopup(`<strong>${escapeHtml(seg.from.lugar)} → ${escapeHtml(seg.to.lugar)}</strong><br>${style.label} · ${km} km${approxNote}`);
  });

  window.__routeMarkers.forEach((marker) => marker.bringToFront());
  renderRutaResumen(totals);

  currentAutoKm = totals.auto;
  renderDieselCard();
}

function renderRutaResumen(totals) {
  const el = document.getElementById('ruta-resumen');
  if (!el) return;
  el.innerHTML = `
    <span><strong>${totals.auto}</strong> km en auto</span>
    <span><strong>${totals.bus}</strong> km en bus (ida y vuelta)</span>
    <span><strong>${totals.ferry}</strong> km en ferry</span>
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
      state.gastos = state.gastos.filter((g) => g.id !== gasto.id);
      saveState();
      renderGastos();
      updateBalance();
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
  renderRutaTimestamps();
  renderDieselCard();
}

document.addEventListener('DOMContentLoaded', () => {
  state = loadState();

  setupTabs();
  setupPresupuestoUI();
  setupDieselUI();
  setupGastoForm();
  setupDataButtons();
  initMap();
  renderAll();
});
