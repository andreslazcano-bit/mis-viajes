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

const SEED_PERSONAS = [
  { id: 'andres', nombre: 'Andrés' },
  { id: 'valentina', nombre: 'Valentina' },
];

// aportes.andres es su aporte total: $800.000 en efectivo + $250.000 del
// auto (Hyundai Tucson, ya pagado aparte). Se cuenta como un solo monto.
const SEED_APORTES = { valentina: 500000, andres: 1050000 };

const TIPOS = {
  transito: 'Tránsito',
  vuelo: 'Vuelo',
  alojamiento: 'Alojamiento',
  camping: 'Camping',
};

// Tipos que representan "de paso" (llegar/salir), no una estadía real —
// se usa para saber si un lugar repetido debe ceder el paso a una parada
// real más adelante, y para decidir el modo de cada tramo del mapa.
const TRANSIT_LIKE_TIPOS = ['transito', 'vuelo'];

const CATEGORIAS_GASTO = {
  alojamiento: 'Alojamiento',
  comida: 'Comida',
  diesel: 'Combustible',
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
  auto: { color: '#1f5f52', weight: 4, dashArray: null, label: 'Auto' },
  bus: { color: '#5b6bb0', weight: 4, dashArray: '2 10', label: 'Bus' },
  caminando: { color: '#c9832f', weight: 3, dashArray: '4 4', label: 'Caminando' },
  ferry: { color: '#2f8fbf', weight: 3, dashArray: '1 8', label: 'Ferry' },
  vuelo: { color: '#8659c9', weight: 3, dashArray: '10 6', label: 'Vuelo' },
};

const KM_POR_HORA_RESPALDO = 65; // solo para estimar tiempo si OSRM no responde (auto/bus)
const KM_POR_HORA_CAMINANDO = 4.5; // ídem, para tramos a pie

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

/* ------------------------------------------------------------------ */
/* Autocompletado de lugares (Photon — geocodificador gratuito de      */
/* Komoot sobre datos de OpenStreetMap, con CORS habilitado, sin key)  */
/* ------------------------------------------------------------------ */

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Sesga las sugerencias hacia donde ya está pasando este viaje (en vez de
// un punto fijo): promedia las coordenadas ya resueltas del itinerario y
// sus paradas extra. Sin ningún lugar todavía (viaje recién creado), no
// hay sesgo — confirmado que un sesgo fijo mal puesto empeora resultados
// (ej. "Florence" con sesgo al sur de Chile no sugería Florencia, Italia).
function getTripBiasPoint() {
  if (!state) return null;
  const coords = [];

  state.itinerario.forEach((day) => {
    if (!day.lugar) return;
    if (!day.lugar.includes('→') && day.lugarLat !== undefined && day.lugarLng !== undefined) {
      coords.push({ lat: day.lugarLat, lng: day.lugarLng });
    } else {
      const partes = day.lugar.includes('→') ? day.lugar.split('→').map((s) => s.trim()) : [day.lugar];
      partes.forEach((parte) => {
        const c = resolvePlaceCoords(parte);
        if (c) coords.push(c);
      });
    }
    (day.paradas || []).forEach((parada) => {
      if (parada.lat !== undefined && parada.lng !== undefined) {
        coords.push({ lat: parada.lat, lng: parada.lng });
      } else {
        const c = resolvePlaceCoords(parada.lugar);
        if (c) coords.push(c);
      }
    });
  });

  if (coords.length === 0) return null;
  return {
    lat: coords.reduce((sum, c) => sum + c.lat, 0) / coords.length,
    lng: coords.reduce((sum, c) => sum + c.lng, 0) / coords.length,
  };
}

async function fetchPlaceSuggestions(query, signal) {
  const bias = getTripBiasPoint();
  // zoom fuerza el sesgo geográfico de verdad — probado en vivo: sin él,
  // un lugar ambiguo (ej. "Florence") sigue mostrando pueblos de EE.UU.
  // primero aunque el viaje esté centrado en Italia.
  const biasParams = bias ? `&lat=${bias.lat}&lon=${bias.lng}&zoom=8` : '';
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6${biasParams}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Photon respondió con error');
  const data = await res.json();
  return (data.features || []).map((f) => {
    const p = f.properties || {};
    const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ');
    const [lng, lat] = f.geometry.coordinates;
    return { name: p.name || query, label: label || query, lat, lng };
  });
}

// Conecta un input de texto a un desplegable de sugerencias de Photon.
// onCommit(texto, coords) se llama cuando el usuario elige una sugerencia
// o al salir del campo (coords es null si no hay una selección vigente,
// en cuyo caso el resto de la app cae de vuelta a la lista curada).
function setupPlaceAutocomplete(inputEl, dropdownEl, feedbackEl, onCommit) {
  let controller = null;
  let items = [];
  let highlightIndex = -1;
  let pendingCoords = null;

  function closeDropdown() {
    dropdownEl.innerHTML = '';
    dropdownEl.hidden = true;
    items = [];
    highlightIndex = -1;
  }

  function renderDropdown() {
    dropdownEl.innerHTML = '';
    if (items.length === 0) {
      dropdownEl.hidden = true;
      return;
    }
    items.forEach((item, idx) => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'place-option' + (idx === highlightIndex ? ' place-option-active' : '');
      opt.textContent = item.label;
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(item);
      });
      dropdownEl.appendChild(opt);
    });
    dropdownEl.hidden = false;
  }

  function updateFeedback() {
    if (!feedbackEl) return;
    const text = inputEl.value;
    if (!text.trim()) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'place-feedback';
      return;
    }
    const ok = Boolean(pendingCoords) || checkPlaceRecognized(text) === true;
    feedbackEl.textContent = ok
      ? 'Reconocido — aparecerá en el mapa'
      : 'No reconocido — elige una opción de la lista o escribe una ciudad conocida';
    feedbackEl.className = ok ? 'place-feedback place-feedback-ok' : 'place-feedback place-feedback-warn';
  }

  function selectItem(item) {
    inputEl.value = item.name;
    pendingCoords = { lat: item.lat, lng: item.lng };
    closeDropdown();
    updateFeedback();
    onCommit(inputEl.value, pendingCoords);
  }

  const doSearch = debounce(async (query) => {
    if (controller) controller.abort();
    if (!query || query.trim().length < 2) {
      closeDropdown();
      return;
    }
    controller = new AbortController();
    try {
      items = await fetchPlaceSuggestions(query.trim(), controller.signal);
      highlightIndex = -1;
      renderDropdown();
    } catch (e) {
      if (e.name !== 'AbortError') closeDropdown();
    }
  }, 300);

  inputEl.addEventListener('input', () => {
    pendingCoords = null;
    updateFeedback();
    doSearch(inputEl.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (dropdownEl.hidden || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, items.length - 1);
      renderDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
      renderDropdown();
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectItem(items[highlightIndex]);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  inputEl.addEventListener('blur', () => {
    // el timeout deja que el mousedown de una opción dispare antes de cerrar
    setTimeout(() => {
      closeDropdown();
      onCommit(inputEl.value.trim(), pendingCoords);
    }, 150);
  });

  return {
    getPendingCoords: () => pendingCoords,
    setInitial: (coords) => {
      pendingCoords = coords || null;
      updateFeedback();
    },
    reset: () => {
      pendingCoords = null;
      closeDropdown();
      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'place-feedback';
      }
    },
  };
}

// Convierte el itinerario (ordenado por fecha) en una lista de paradas con
// coordenadas. Las filas de tránsito con "X → Y" se separan en dos puntos.
// Se saltan repeticiones consecutivas del mismo lugar (días seguidos en el
// mismo sitio) y se reportan los lugares que no se pudieron ubicar.
function buildRouteStops() {
  const sorted = [...state.itinerario].filter((d) => d.fecha && d.lugar).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const stops = [];
  const unresolved = [];
  const extras = [];

  sorted.forEach((day) => {
    const esSplit = day.lugar.includes('→');
    const partes = esSplit ? day.lugar.split('→').map((s) => s.trim()) : [day.lugar.trim()];
    // Si el lugar se eligió del autocompletado (Photon) queda una
    // coordenada exacta guardada; se usa esa antes que la lista curada.
    const coordsExplicitas = !esSplit && day.lugarLat !== undefined && day.lugarLng !== undefined
      ? { lat: day.lugarLat, lng: day.lugarLng }
      : null;

    partes.forEach((parte) => {
      if (!parte) return;
      const coords = coordsExplicitas || resolvePlaceCoords(parte);
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
        if (TRANSIT_LIKE_TIPOS.includes(ultimo.tipo) && !TRANSIT_LIKE_TIPOS.includes(day.tipo)) {
          stops[stops.length - 1] = { ...ultimo, lugar: parte, fecha: day.fecha, tipo: day.tipo, notas: day.notas, dayId: day.id };
        }
        return;
      }
      stops.push({ lugar: parte, fecha: day.fecha, tipo: day.tipo, notas: day.notas, arrivalTipo: day.tipo, modoTransporte: day.modoTransporte || 'auto', dayId: day.id, lat: coords.lat, lng: coords.lng });
    });

    // Paradas extra dentro del día (ej: un rato en Niebla estando en
    // Valdivia). No forman parte de la ruta ni se enrutan, solo quedan
    // marcadas en el mapa junto a la parada principal de ese día.
    (day.paradas || []).forEach((parada) => {
      if (!parada.lugar) return;
      const coords = (parada.lat !== undefined && parada.lng !== undefined)
        ? { lat: parada.lat, lng: parada.lng }
        : resolvePlaceCoords(parada.lugar);
      if (!coords) {
        if (!unresolved.includes(parada.lugar)) unresolved.push(parada.lugar);
        return;
      }
      extras.push({ lugar: parada.lugar, notas: parada.notas, fecha: day.fecha, dayId: day.id, lat: coords.lat, lng: coords.lng });
    });
  });

  return { stops, unresolved, extras };
}

/* ------------------------------------------------------------------ */
/* Estado                                                             */
/* ------------------------------------------------------------------ */

// appData guarda TODOS los viajes; state siempre apunta (por referencia)
// al viaje activo dentro de appData.trips — así el resto del código, que
// ya lee/escribe state.xxx, no necesita saber que hay más de un viaje.
let appData = null;
let state = null;
let isDirty = false;
let uidCounter = 1;

function nextId() {
  return 'id' + (Date.now().toString(36)) + (uidCounter++).toString(36);
}

function makeSeedTripData() {
  return {
    itinerario: SEED_ITINERARIO.map((d) => ({ id: nextId(), paradas: [], ...d })),
    presupuesto: SEED_PRESUPUESTO.map((d) => ({ id: nextId(), ...d })),
    personas: SEED_PERSONAS.map((p) => ({ ...p })),
    aportes: { ...SEED_APORTES },
    gastos: [],
    tipoCombustible: 'diesel',
    dieselKmPorLitro: 11.8,
    dieselPrecios: [],
  };
}

// A diferencia de makeSeedTripData(), esto no trae ninguna plantilla de
// itinerario/presupuesto: deja el viaje vacío para empezar de cero, pero
// sí precarga a Andrés y Valentina como personas (son quienes usan esta
// app) — se pueden editar, quitar o agregar más desde Presupuesto igual.
function makeEmptyTripData() {
  return {
    itinerario: [],
    presupuesto: [],
    personas: SEED_PERSONAS.map((p) => ({ ...p })),
    aportes: SEED_PERSONAS.reduce((acc, p) => { acc[p.id] = 0; return acc; }, {}),
    gastos: [],
    tipoCombustible: 'gasolina',
    dieselKmPorLitro: 11.8,
    dieselPrecios: [],
  };
}

function makeTrip(nombre, tripData) {
  return { id: nextId(), nombre, ...tripData };
}

// Reemplaza los datos del viaje activo (itinerario/presupuesto/gastos/etc.)
// conservando su id y nombre. Se usa para "vaciar este viaje" e importar.
function setActiveTripData(tripData) {
  const id = appData.activeTripId;
  const nombreActual = appData.trips[id] ? appData.trips[id].nombre : 'Viaje';
  appData.trips[id] = { id, nombre: nombreActual, ...tripData };
  state = appData.trips[id];
}

// Adapta un viaje guardado con el esquema anterior (aportes/gastos fijos
// para Andrés y Valentina) al esquema actual con personas dinámicas, sin
// perder lo que ya estaba guardado.
function normalizeTripData(parsed) {
  if (parsed.aportes && parsed.aportes.autoAndres !== undefined) {
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
  if (!['diesel', 'gasolina', 'electrico'].includes(parsed.tipoCombustible)) {
    parsed.tipoCombustible = 'gasolina';
  }

  // Esquema viejo: personas fijas Andrés/Valentina, con aportes.andres/
  // aportes.valentina y gastos.montoAndres/montoValentina.
  if (!Array.isArray(parsed.personas)) {
    parsed.personas = [
      { id: 'andres', nombre: 'Andrés' },
      { id: 'valentina', nombre: 'Valentina' },
    ];
    parsed.aportes = {
      andres: (parsed.aportes && parsed.aportes.andres) || 0,
      valentina: (parsed.aportes && parsed.aportes.valentina) || 0,
    };
  }

  parsed.gastos = (parsed.gastos || []).map((g) => {
    if (g.montos) return g;
    if (g.montoAndres !== undefined && g.montoValentina !== undefined) {
      return {
        id: g.id || nextId(),
        fecha: g.fecha || '',
        categoria: g.categoria || 'otro',
        descripcion: g.descripcion || '',
        montos: { andres: g.montoAndres || 0, valentina: g.montoValentina || 0 },
      };
    }
    const monto = Number(g.monto) || 0;
    return {
      id: g.id || nextId(),
      fecha: g.fecha || '',
      categoria: g.categoria || 'otro',
      descripcion: g.descripcion || '',
      montos: { andres: g.quien === 'Andrés' ? monto : 0, valentina: g.quien === 'Valentina' ? monto : 0 },
    };
  });

  parsed.itinerario = (parsed.itinerario || []).map((d) => ({
    ...d,
    paradas: Array.isArray(d.paradas) ? d.paradas : [],
    modoTransporte: ['auto', 'bus', 'caminando'].includes(d.modoTransporte) ? d.modoTransporte : 'auto',
  }));

  if (!Array.isArray(parsed.presupuesto)) parsed.presupuesto = [];
  if (!parsed.aportes || typeof parsed.aportes !== 'object') parsed.aportes = {};
  parsed.personas.forEach((p) => {
    if (parsed.aportes[p.id] === undefined) parsed.aportes[p.id] = 0;
  });

  return parsed;
}

function freshAppData() {
  const trip = makeTrip('Viaje a Chiloé 2026', makeSeedTripData());
  return { trips: { [trip.id]: trip }, activeTripId: trip.id };
}

// Adapta el localStorage completo: si viene del esquema anterior (la app
// entera era un solo viaje, sin la envoltura "trips"), lo migra a un
// primer viaje dentro de la colección.
function normalizeAppData(parsed) {
  if (!parsed.trips) {
    const tripData = normalizeTripData(parsed);
    const trip = makeTrip('Viaje a Chiloé 2026', tripData);
    return { trips: { [trip.id]: trip }, activeTripId: trip.id };
  }

  Object.keys(parsed.trips).forEach((id) => {
    parsed.trips[id] = { ...parsed.trips[id], ...normalizeTripData(parsed.trips[id]) };
  });
  if (!parsed.activeTripId || !parsed.trips[parsed.activeTripId]) {
    const ids = Object.keys(parsed.trips);
    parsed.activeTripId = ids.length > 0 ? ids[0] : null;
  }
  return parsed;
}

function loadAppData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return freshAppData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.trips && (!parsed.itinerario || !parsed.presupuesto || !parsed.aportes || !parsed.gastos)) {
      return freshAppData();
    }
    return normalizeAppData(parsed);
  } catch (e) {
    console.warn('No se pudo leer localStorage, usando datos semilla', e);
    return freshAppData();
  }
}

// Marca la edición como pendiente: NO escribe a localStorage. Los cambios
// quedan en memoria (todo se sigue viendo/actualizando en vivo, ya que las
// funciones de render leen directo de `state`/`appData`) hasta que el botón
// "Guardar" llama a persistToStorage().
function saveState() {
  isDirty = true;
  updateSaveIndicator();
}

// Escritura real a localStorage — el único lugar que persiste. La usan el
// botón "Guardar" y las acciones estructurales (crear/eliminar/importar/
// vaciar un viaje) que ya piden confirmación propia y deben quedar firmes de
// inmediato, sin depender de que además se apriete "Guardar".
function persistToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  isDirty = false;
  updateSaveIndicator();
  markProfileSnapshotCurrent();
  pushToCloud();
  hideCloudConflictBanner();
}

function updateSaveIndicator() {
  const statusEl = document.getElementById('save-status');
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');
  if (!statusEl || !saveBtn || !resetBtn) return;
  statusEl.textContent = isDirty ? 'Cambios sin guardar' : 'Todo guardado';
  statusEl.classList.toggle('save-status-dirty', isDirty);
  saveBtn.disabled = !isDirty;
  resetBtn.disabled = !isDirty;
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

const EXPAND_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

function makeEditButton(title, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-icon btn-icon-neutral';
  btn.title = title;
  btn.innerHTML = EXPAND_ICON_SVG;
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
    tr.addEventListener('dblclick', () => openDayModal(day.id));

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
    tdActions.className = 'itinerario-actions';
    const editBtn = makeEditButton('Ver / editar día y paradas extra', () => openDayModal(day.id));
    tdActions.appendChild(editBtn);
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
  if (field === 'lugar') {
    // Edición manual en la tabla: la coordenada exacta elegida antes en
    // el autocompletado (si había) ya no corresponde a este texto nuevo.
    delete day.lugarLat;
    delete day.lugarLng;
  }
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
      paradas: [],
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
        cell.classList.add('calendar-day-clickable');
        cell.setAttribute('role', 'button');
        cell.tabIndex = 0;
        cell.title = 'Agregar y editar este día';
        const warn = document.createElement('span');
        warn.className = 'calendar-day-warning';
        warn.textContent = 'Sin planificar';
        cell.appendChild(warn);

        const addNewDayHere = () => {
          const newDay = { id: nextId(), fecha: iso, lugar: '', tipo: 'alojamiento', notas: '', paradas: [] };
          state.itinerario.push(newDay);
          saveState();
          renderItinerario();
          openDayModal(newDay.id);
        };
        cell.addEventListener('click', addNewDayHere);
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addNewDayHere();
          }
        });
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
/* Modal de detalle de un día: campos + paradas extra                 */
/* ------------------------------------------------------------------ */

let dayLugarAutocomplete = null;
let paradaLugarAutocomplete = null;
let newTripLugarSalidaAutocomplete = null;
let newTripLugarRegresoAutocomplete = null;

function getDayById(id) {
  return state.itinerario.find((d) => d.id === id);
}

function getSortedItinerario() {
  return [...state.itinerario].filter((d) => d.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// true = todos los lugares del texto se reconocen, false = alguno no, null = sin texto.
function checkPlaceRecognized(text) {
  if (!text || !text.trim()) return null;
  const partes = text.includes('→') ? text.split('→').map((s) => s.trim()) : [text.trim()];
  return partes.every((p) => !p || resolvePlaceCoords(p));
}


function refreshDayModalNav(day) {
  const sorted = getSortedItinerario();
  const idx = sorted.findIndex((d) => d.id === day.id);
  document.getElementById('day-modal-nav-label').textContent = idx >= 0 ? `Día ${idx + 1} de ${sorted.length}` : 'Sin fecha';
  document.getElementById('day-modal-prev-btn').disabled = idx <= 0;
  document.getElementById('day-modal-next-btn').disabled = idx === -1 || idx >= sorted.length - 1;
}

function navigateDayModal(delta) {
  const sorted = getSortedItinerario();
  const currentId = document.getElementById('day-modal').dataset.dayId;
  const idx = sorted.findIndex((d) => d.id === currentId);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= sorted.length) return;
  openDayModal(sorted[nextIdx].id);
}

function openDayModal(dayId) {
  const day = getDayById(dayId);
  if (!day) return;
  if (!Array.isArray(day.paradas)) day.paradas = [];

  refreshDayModalNav(day);

  document.getElementById('day-modal-fecha').value = day.fecha || '';
  document.getElementById('day-modal-tipo').value = day.tipo;
  document.getElementById('day-modal-transporte').value = day.modoTransporte || 'auto';
  updateDayModalTransporteVisibility(day.tipo);
  document.getElementById('day-modal-lugar').value = day.lugar || '';
  document.getElementById('day-modal-notas').value = day.notas || '';

  if (dayLugarAutocomplete) {
    const yaTieneCoords = !day.lugar.includes('→') && day.lugarLat !== undefined && day.lugarLng !== undefined;
    dayLugarAutocomplete.setInitial(yaTieneCoords ? { lat: day.lugarLat, lng: day.lugarLng } : null);
  }

  renderParadasList(day);

  const modal = document.getElementById('day-modal');
  modal.dataset.dayId = dayId;
  modal.hidden = false;

  document.getElementById('parada-lugar-input').value = '';
  document.getElementById('parada-nota-input').value = '';
  if (paradaLugarAutocomplete) paradaLugarAutocomplete.reset();
}

function closeDayModal() {
  document.getElementById('day-modal').hidden = true;
}

// El modo de transporte (auto/bus/caminando) solo aplica a días de tipo
// "Tránsito" — un vuelo, alojamiento o camping no lo necesita.
function updateDayModalTransporteVisibility(tipo) {
  document.getElementById('day-modal-transporte-wrap').hidden = tipo !== 'transito';
}

// Distancia real por carretera (reutiliza el mismo caché/servicio OSRM
// que la ruta principal) desde la parada principal del día hasta la
// parada extra.
function getParadaCoords(parada) {
  if (parada.lat !== undefined && parada.lng !== undefined) return { lat: parada.lat, lng: parada.lng };
  return resolvePlaceCoords(parada.lugar);
}

function getDayMainCoords(day) {
  const esSplit = day.lugar && day.lugar.includes('→');
  if (!esSplit && day.lugarLat !== undefined && day.lugarLng !== undefined) {
    return { lat: day.lugarLat, lng: day.lugarLng };
  }
  const dayMainLugar = esSplit ? day.lugar.split('→').pop().trim() : day.lugar;
  return resolvePlaceCoords(dayMainLugar);
}

async function computeParadaDistance(fromCoords, parada) {
  const toCoords = getParadaCoords(parada);
  if (!toCoords) return null;
  const cache = loadRouteCache();
  try {
    const { subSegments } = await resolveSegmentRoute(fromCoords, toCoords, 'auto', cache);
    saveRouteCache(cache);
    const km = subSegments.reduce((sum, seg) => sum + seg.distanceKm, 0);
    const min = subSegments.reduce((sum, seg) => sum + seg.minutes, 0);
    return { km, min };
  } catch (e) {
    return null;
  }
}

function renderParadasList(day) {
  const container = document.getElementById('day-modal-paradas-list');
  container.innerHTML = '';

  const paradas = day.paradas || [];
  if (paradas.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'paradas-empty';
    empty.textContent = 'Sin paradas extra todavía.';
    container.appendChild(empty);
    return;
  }

  const dayMainLugar = day.lugar && day.lugar.includes('→') ? day.lugar.split('→').pop().trim() : day.lugar;
  const dayCoords = getDayMainCoords(day);

  paradas.forEach((parada) => {
    const row = document.createElement('div');
    row.className = 'parada-row';

    const info = document.createElement('div');
    info.className = 'parada-info';

    const lugarEl = document.createElement('div');
    lugarEl.className = 'parada-lugar';
    lugarEl.textContent = parada.lugar;
    info.appendChild(lugarEl);

    if (parada.notas) {
      const notaEl = document.createElement('div');
      notaEl.className = 'parada-nota';
      notaEl.textContent = parada.notas;
      info.appendChild(notaEl);
    }

    const distEl = document.createElement('div');
    distEl.className = 'parada-dist';
    info.appendChild(distEl);

    if (dayCoords && getParadaCoords(parada)) {
      distEl.textContent = 'Calculando distancia…';
      computeParadaDistance(dayCoords, parada).then((result) => {
        if (document.getElementById('day-modal').dataset.dayId !== day.id) return;
        distEl.textContent = result ? `${Math.round(result.km)} km · ${formatMinutes(result.min)} desde ${dayMainLugar}` : '';
      });
    } else if (!dayCoords) {
      distEl.textContent = `Agrega un lugar reconocido arriba para calcular la distancia`;
    }

    row.appendChild(info);

    const delBtn = makeDeleteButton('Eliminar parada', () => {
      day.paradas = day.paradas.filter((p) => p.id !== parada.id);
      saveState();
      renderParadasList(day);
      scheduleRouteRedraw();
    });
    row.appendChild(delBtn);

    container.appendChild(row);
  });
}

function setupDayModal() {
  document.getElementById('day-modal-close-btn').addEventListener('click', closeDayModal);
  document.getElementById('day-modal-prev-btn').addEventListener('click', () => navigateDayModal(-1));
  document.getElementById('day-modal-next-btn').addEventListener('click', () => navigateDayModal(1));

  document.getElementById('day-modal').addEventListener('click', (e) => {
    if (e.target.id === 'day-modal') closeDayModal();
  });

  document.addEventListener('keydown', (e) => {
    if (document.getElementById('day-modal').hidden) return;
    if (e.key === 'Escape') closeDayModal();
    if (e.key === 'ArrowLeft') navigateDayModal(-1);
    if (e.key === 'ArrowRight') navigateDayModal(1);
  });

  document.getElementById('day-modal-fecha').addEventListener('change', (e) => {
    const day = getDayById(document.getElementById('day-modal').dataset.dayId);
    if (!day) return;
    day.fecha = e.target.value;
    saveState();
    renderItinerario();
    refreshDayModalNav(day);
  });

  document.getElementById('day-modal-tipo').addEventListener('change', (e) => {
    const day = getDayById(document.getElementById('day-modal').dataset.dayId);
    if (!day) return;
    day.tipo = e.target.value;
    updateDayModalTransporteVisibility(day.tipo);
    saveState();
    renderItinerario();
  });

  document.getElementById('day-modal-transporte').addEventListener('change', (e) => {
    const day = getDayById(document.getElementById('day-modal').dataset.dayId);
    if (!day) return;
    day.modoTransporte = e.target.value;
    saveState();
    scheduleRouteRedraw();
  });

  dayLugarAutocomplete = setupPlaceAutocomplete(
    document.getElementById('day-modal-lugar'),
    document.getElementById('day-modal-lugar-suggestions'),
    document.getElementById('day-modal-lugar-feedback'),
    (text, coords) => {
      const day = getDayById(document.getElementById('day-modal').dataset.dayId);
      if (!day) return;
      day.lugar = text;
      if (coords) {
        day.lugarLat = coords.lat;
        day.lugarLng = coords.lng;
      } else {
        delete day.lugarLat;
        delete day.lugarLng;
      }
      saveState();
      renderItinerario();
    }
  );

  document.getElementById('day-modal-notas').addEventListener('blur', (e) => {
    const day = getDayById(document.getElementById('day-modal').dataset.dayId);
    if (!day) return;
    day.notas = e.target.value.trim();
    saveState();
    renderItinerario();
  });

  const paradaLugarInput = document.getElementById('parada-lugar-input');
  paradaLugarAutocomplete = setupPlaceAutocomplete(
    paradaLugarInput,
    document.getElementById('parada-lugar-suggestions'),
    document.getElementById('parada-lugar-feedback'),
    () => {
      // El guardado real de la parada ocurre al enviar el formulario
      // "Agregar" (ver más abajo), no en cada tecleo o al perder foco.
    }
  );

  document.getElementById('day-modal-add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const dayId = document.getElementById('day-modal').dataset.dayId;
    const day = getDayById(dayId);
    if (!day) return;

    const notaInput = document.getElementById('parada-nota-input');
    const lugar = paradaLugarInput.value.trim();
    if (!lugar) return;

    if (!Array.isArray(day.paradas)) day.paradas = [];
    const coords = paradaLugarAutocomplete.getPendingCoords();
    const nuevaParada = { id: nextId(), lugar, notas: notaInput.value.trim() };
    if (coords) {
      nuevaParada.lat = coords.lat;
      nuevaParada.lng = coords.lng;
    }
    day.paradas.push(nuevaParada);
    saveState();

    paradaLugarInput.value = '';
    notaInput.value = '';
    paradaLugarAutocomplete.reset();
    renderParadasList(day);
    scheduleRouteRedraw();
    paradaLugarInput.focus();
  });
}

/* ------------------------------------------------------------------ */
/* Ruta / mapa                                                        */
/* ------------------------------------------------------------------ */

const TIPO_MARKER_FILL = {
  transito: '#5b6bb0',
  vuelo: '#8659c9',
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

// Centra el mapa en la parada de ese día. Si tiene paradas extra, hace
// zoom para que se vean todas juntas ("sublugares" del día) en vez de
// solo centrarse en la parada principal.
function focusMapForDay(dayId) {
  const map = window.__leafletMap;
  const marker = window.__routeMarkersByDay && window.__routeMarkersByDay[dayId];
  if (!marker || !map) return;

  const extraMarkers = (window.__extraMarkersByDay && window.__extraMarkersByDay[dayId]) || [];
  if (extraMarkers.length > 0) {
    const bounds = L.latLngBounds([marker.getLatLng(), ...extraMarkers.map((m) => m.getLatLng())]);
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 14 });
  } else {
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 12));
  }
  marker.openPopup();
}

// Google Maps no requiere API key para estos links de solo-lectura (abren
// la app/web de Maps con el punto o la ruta ya buscados).
function googleMapsPlaceUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsDirectionsUrl(from, to, travelmode) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${travelmode}`;
}

function gmapsLinkHtml(url) {
  return `<a class="popup-gmaps-link" href="${url}" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>`;
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
      ${gmapsLinkHtml(googleMapsPlaceUrl(stop.lat, stop.lng))}
    </div>
  `;
}

function buildExtraPopup(extra) {
  const notas = extra.notas ? `<div class="popup-notas">${escapeHtml(extra.notas)}</div>` : '';
  return `
    <div class="stop-popup">
      <div class="popup-lugar">${escapeHtml(extra.lugar)}</div>
      <div class="popup-fecha">${formatFechaDisplay(extra.fecha)} · parada extra</div>
      ${notas}
      ${gmapsLinkHtml(googleMapsPlaceUrl(extra.lat, extra.lng))}
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
  el.textContent = `No pudimos ubicar en el mapa: ${unresolved.join(', ')}. Ábrelo (ícono de editar o clic en el día) y elige una opción del desplegable de sugerencias en vez de solo escribir el nombre.`;
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

function segmentKey(from, to, profile = 'driving') {
  return `${from.lat},${from.lng}|${to.lat},${to.lng}|${profile}`;
}

// Pide la ruta real por carretera a OSRM, con los pasos (steps) para poder
// detectar automáticamente qué parte del trayecto es en ferry (OSRM ya
// conoce el ferry Pargua–Chacao y lo marca con mode:"ferry").
async function fetchOsrmRouteDetailed(from, to, profile = 'driving') {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('OSRM respondió con error');
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error('OSRM sin ruta');

    // A veces OSRM responde "Ok" con una ruta que no tiene sentido (ej.
    // probamos un tramo Santiago–París, sin camino real por tierra entre
    // los dos: "ancló" el punto de Santiago a una carretera en Portugal,
    // a 10.383 km de distancia, y calculó una ruta corta desde ahí). La
    // señal confiable es el "distance" de cada waypoint en la respuesta:
    // qué tan lejos tuvo que anclar el punto pedido a un camino real. Si
    // ese ancle es grande, la ruta entera no sirve — se descarta para que
    // caiga al respaldo en vez de mostrar un número sin sentido.
    const maxSnapKm = Math.max(...(data.waypoints || []).map((wp) => (wp.distance || 0) / 1000));
    if (maxSnapKm > 5) {
      throw new Error(`OSRM ancló un punto a ${maxSnapKm.toFixed(0)} km de distancia (probablemente sin camino por tierra)`);
    }

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
  // Un vuelo no sigue caminos: se dibuja directo en línea recta con la
  // distancia real, sin intentar enrutarlo por auto y sin inventar un
  // tiempo de viaje (a diferencia del respaldo por falta de conexión,
  // que sí asume velocidad de auto porque ahí sí se esperaba manejar).
  if (outerMode === 'vuelo') {
    const distanceKm = haversineKm(from, to);
    return {
      subSegments: [{ mode: 'vuelo', coords: [[from.lat, from.lng], [to.lat, to.lng]], distanceKm, minutes: null }],
      source: 'vuelo',
    };
  }

  // "Bus" sigue las mismas carreteras que "auto" (mismo perfil de OSRM);
  // solo "caminando" necesita el perfil de a pie.
  const profile = outerMode === 'caminando' ? 'foot' : 'driving';
  const key = segmentKey(from, to, profile);
  if (cache[key]) {
    return { subSegments: cache[key].subSegments, source: 'cache' };
  }
  try {
    const subSegments = await fetchOsrmRouteDetailed(from, to, profile);
    cache[key] = { subSegments };
    return { subSegments, source: 'osrm' };
  } catch (e) {
    const distanceKm = haversineKm(from, to);
    const kmPorHora = outerMode === 'caminando' ? KM_POR_HORA_CAMINANDO : KM_POR_HORA_RESPALDO;
    return {
      subSegments: [{ mode: outerMode, coords: [[from.lat, from.lng], [to.lat, to.lng]], distanceKm, minutes: (distanceKm / kmPorHora) * 60 }],
      source: 'fallback',
    };
  }
}

async function drawRoute() {
  const map = window.__leafletMap;
  if (!map || !window.__routeLayer) return;
  window.__routeLayer.clearLayers();

  const { stops, unresolved, extras } = buildRouteStops();
  renderUnresolvedNote(unresolved);

  const totals = {
    auto: { km: 0, min: 0 },
    bus: { km: 0, min: 0 },
    caminando: { km: 0, min: 0 },
    ferry: { km: 0, min: 0 },
    vuelo: { km: 0, min: 0 },
  };

  window.__routeMarkersByDay = {};
  window.__extraMarkersByDay = {};

  extras.forEach((extra) => {
    const marker = L.circleMarker([extra.lat, extra.lng], {
      radius: 4,
      fillColor: '#bc6a3f',
      color: '#fff',
      weight: 1.5,
      fillOpacity: 0.9,
    })
      .addTo(window.__routeLayer)
      .bindPopup(buildExtraPopup(extra));
    if (!window.__extraMarkersByDay[extra.dayId]) window.__extraMarkersByDay[extra.dayId] = [];
    window.__extraMarkersByDay[extra.dayId].push(marker);
  });

  if (stops.length === 0) {
    currentAutoKm = 0;
    renderDieselCard();
    renderRutaResumen(totals);
    return;
  }

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
      focusMapForDay(stop.dayId);
    });
    window.__routeMarkersByDay[stop.dayId] = marker;
    return marker;
  });

  // El modo de un tramo lo define el día de LLEGADA: "vuelo" viaja en línea
  // recta, "tránsito" usa el modoTransporte elegido en ese día (auto/bus/
  // caminando), y cualquier otro día (alojamiento/camping) simplemente
  // asume que se llegó en auto.
  const pairs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const next = stops[i + 1];
    let outerMode = 'auto';
    if (next.arrivalTipo === 'vuelo') outerMode = 'vuelo';
    else if (next.arrivalTipo === 'transito') outerMode = next.modoTransporte || 'auto';
    pairs.push({ from: stops[i], to: next, outerMode });
  }

  const cache = loadRouteCache();
  let cacheDirty = false;

  const resolved = await Promise.all(
    pairs.map(async (pair) => {
      const profile = pair.outerMode === 'caminando' ? 'foot' : 'driving';
      const key = segmentKey(pair.from, pair.to, profile);
      const hadCache = Boolean(cache[key]);
      const r = await resolveSegmentRoute(pair.from, pair.to, pair.outerMode, cache);
      if (!hadCache && cache[key]) cacheDirty = true;
      return { pair, ...r };
    })
  );

  if (cacheDirty) saveRouteCache(cache);

  resolved.forEach(({ pair, subSegments, source }) => {
    subSegments.forEach((sub) => {
      const styleMode = sub.mode === 'ferry' || sub.mode === 'vuelo' ? sub.mode : pair.outerMode;
      const style = MODE_STYLES[styleMode];
      const line = L.polyline(sub.coords, {
        color: style.color,
        weight: style.weight,
        dashArray: style.dashArray,
        lineCap: 'round',
        opacity: 0.9,
      }).addTo(window.__routeLayer);

      totals[styleMode].km += sub.distanceKm;
      if (sub.minutes !== null) totals[styleMode].min += sub.minutes;

      const approxNote = source === 'fallback' ? ' (aprox., sin conexión al calcular)' : '';
      const tiempoTexto = sub.minutes === null ? 'línea recta' : formatMinutes(sub.minutes);
      // Un ferry o un vuelo no se puede pedir como ruta en Google Maps
      // (no calcula cruces en barco ni trayectos aéreos punto a punto).
      const direccionesLink = (styleMode === 'auto' || styleMode === 'bus' || styleMode === 'caminando')
        ? gmapsLinkHtml(googleMapsDirectionsUrl(pair.from, pair.to, styleMode === 'caminando' ? 'walking' : 'driving'))
        : '';
      line.bindPopup(`<strong>${escapeHtml(pair.from.lugar)} → ${escapeHtml(pair.to.lugar)}</strong><br>${style.label} · ${Math.round(sub.distanceKm)} km · ${tiempoTexto}${approxNote}${direccionesLink}`);
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

  // Solo se muestran los modos que realmente se usan en este viaje (un
  // viaje solo en avión o solo en bus no necesita ver "0 km en auto").
  const partes = [];
  if (totals.auto.km > 0) partes.push(`<span><strong>${Math.round(totals.auto.km)}</strong> km en auto (~${formatMinutes(totals.auto.min)})</span>`);
  if (totals.bus.km > 0) partes.push(`<span><strong>${Math.round(totals.bus.km)}</strong> km en bus (~${formatMinutes(totals.bus.min)})</span>`);
  if (totals.caminando.km > 0) partes.push(`<span><strong>${Math.round(totals.caminando.km)}</strong> km caminando (~${formatMinutes(totals.caminando.min)})</span>`);
  if (totals.ferry.km > 0) partes.push(`<span><strong>${Math.round(totals.ferry.km)}</strong> km en ferry (~${formatMinutes(totals.ferry.min)})</span>`);
  if (totals.vuelo.km > 0) partes.push(`<span><strong>${Math.round(totals.vuelo.km)}</strong> km en vuelo (línea recta)</span>`);

  el.innerHTML = partes.length > 0 ? partes.join('') : 'Agrega días con lugares reconocidos para ver los kilómetros de la ruta.';
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

function gastoTotalMontos(gasto) {
  return Object.values(gasto.montos || {}).reduce((sum, m) => sum + (Number(m) || 0), 0);
}

function totalGastadoReal() {
  return state.gastos.reduce((sum, g) => sum + gastoTotalMontos(g), 0);
}

function totalAportado() {
  return state.personas.reduce((sum, p) => sum + (Number(state.aportes[p.id]) || 0), 0);
}

function renderAportesList() {
  const container = document.getElementById('aportes-list');
  container.innerHTML = '';

  if (state.personas.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'paradas-empty';
    empty.textContent = 'Agrega quiénes van en este viaje para registrar sus aportes.';
    container.appendChild(empty);
    return;
  }

  state.personas.forEach((persona) => {
    const row = document.createElement('div');
    row.className = 'persona-aporte-row';

    const fields = document.createElement('div');
    fields.className = 'persona-fields';

    const nombreInput = document.createElement('input');
    nombreInput.type = 'text';
    nombreInput.className = 'persona-nombre-input';
    nombreInput.value = persona.nombre;
    nombreInput.placeholder = 'Nombre';
    nombreInput.addEventListener('blur', () => {
      persona.nombre = nombreInput.value.trim() || persona.nombre;
      saveState();
      renderAll();
    });
    fields.appendChild(nombreInput);

    const montoLabel = document.createElement('label');
    montoLabel.textContent = 'Aporta (CLP)';
    const montoInput = document.createElement('input');
    montoInput.type = 'number';
    montoInput.step = '1000';
    montoInput.value = state.aportes[persona.id] || 0;
    montoInput.addEventListener('input', () => {
      state.aportes[persona.id] = Number(montoInput.value) || 0;
      saveState();
      renderAportesResumen();
      updateBalance();
    });
    montoLabel.appendChild(montoInput);
    fields.appendChild(montoLabel);

    row.appendChild(fields);

    const delBtn = makeDeleteButton('Quitar persona', () => {
      if (confirm(`¿Quitar a ${persona.nombre} del viaje? Se pierden sus aportes y los montos que pagó en cada gasto.`)) {
        state.personas = state.personas.filter((p) => p.id !== persona.id);
        delete state.aportes[persona.id];
        state.gastos.forEach((g) => {
          if (g.montos) delete g.montos[persona.id];
        });
        saveState();
        renderAll();
      }
    });
    row.appendChild(delBtn);

    container.appendChild(row);
  });
}

function setupPresupuestoUI() {
  document.getElementById('add-budget-btn').addEventListener('click', () => {
    state.presupuesto.push({ id: nextId(), categoria: 'Nueva categoría', monto: 0, detalle: '' });
    saveState();
    renderPresupuesto();
  });

  document.getElementById('add-persona-btn').addEventListener('click', () => {
    const nombre = prompt('Nombre de la persona:');
    if (!nombre || !nombre.trim()) return;
    const persona = { id: nextId(), nombre: nombre.trim() };
    state.personas.push(persona);
    state.aportes[persona.id] = 0;
    saveState();
    renderAll();
  });
}

function renderAportesResumen() {
  renderAportesList();

  const total = totalAportado();
  const pctText = state.personas
    .map((p) => {
      const monto = Number(state.aportes[p.id]) || 0;
      const pct = total > 0 ? (monto / total) * 100 : 0;
      return `${p.nombre}: ${pct.toFixed(2)}%`;
    })
    .join(' · ');

  const pctsEl = document.getElementById('aporte-pcts');
  if (state.personas.length === 0) {
    pctsEl.textContent = 'Agrega personas para ver el reparto de aportes.';
  } else if (total > 0) {
    pctsEl.textContent = `Reparto de gastos compartidos → ${pctText}`;
  } else {
    pctsEl.textContent = 'Ingresa los aportes para calcular los porcentajes.';
  }

  renderPresupuestoResumen();
}

function renderPresupuestoResumen() {
  const total = totalAportado();
  const proyectado = state.presupuesto.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const gastadoReal = totalGastadoReal();
  const restante = total - gastadoReal;

  const listEl = document.getElementById('resumen-aportes-list');
  listEl.innerHTML = '';
  state.personas.forEach((p) => {
    const div = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = p.nombre;
    const dd = document.createElement('dd');
    dd.textContent = formatCLP(state.aportes[p.id] || 0);
    div.append(dt, dd);
    listEl.appendChild(div);
  });
  const totalDiv = document.createElement('div');
  totalDiv.className = 'summary-total';
  const totalDt = document.createElement('dt');
  totalDt.textContent = 'Total aportado';
  const totalDd = document.createElement('dd');
  totalDd.textContent = formatCLP(total);
  totalDiv.append(totalDt, totalDd);
  listEl.appendChild(totalDiv);

  document.getElementById('resumen-proyectado').textContent = formatCLP(proyectado);
  document.getElementById('resumen-gastado').textContent = formatCLP(gastadoReal);

  const restanteEl = document.getElementById('resumen-restante');
  restanteEl.textContent = formatCLP(restante);
  restanteEl.classList.toggle('negative-amount', restante < 0);

  const fill = document.getElementById('resumen-progress');
  const label = document.getElementById('resumen-progress-label');
  const pct = total > 0 ? (gastadoReal / total) * 100 : 0;
  fill.style.width = `${Math.min(pct, 100)}%`;
  fill.classList.toggle('over-budget', pct > 100);
  label.textContent = `${pct.toFixed(0)}%`;
}

/* ------------------------------------------------------------------ */
/* Diésel: precio semanal e historial                                  */
/* ------------------------------------------------------------------ */

const COMBUSTIBLE_UNIDADES = {
  diesel: { rendimiento: 'km/L', cantidad: 'Litros', unidadPrecio: 'CLP/L' },
  gasolina: { rendimiento: 'km/L', cantidad: 'Litros', unidadPrecio: 'CLP/L' },
  electrico: { rendimiento: 'km/kWh', cantidad: 'kWh', unidadPrecio: 'CLP/kWh' },
};

function setupDieselUI() {
  const tipoSelect = document.getElementById('combustible-tipo');
  tipoSelect.value = state.tipoCombustible;
  tipoSelect.addEventListener('change', () => {
    state.tipoCombustible = tipoSelect.value;
    saveState();
    renderDieselCard();
  });

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
  const cardEl = document.getElementById('combustible-card');
  if (!cardEl) return;

  // Solo tiene sentido si el viaje realmente tiene tramos en auto.
  const relevante = currentAutoKm > 0;
  cardEl.style.display = relevante ? '' : 'none';
  if (!relevante) return;

  const unidades = COMBUSTIBLE_UNIDADES[state.tipoCombustible] || COMBUSTIBLE_UNIDADES.gasolina;
  document.getElementById('combustible-unidad-rendimiento').textContent = unidades.rendimiento;
  document.getElementById('combustible-unidad-cantidad').textContent = unidades.cantidad;
  document.getElementById('combustible-unidad-precio').textContent = unidades.unidadPrecio;

  const kmPorUnidad = state.dieselKmPorLitro || 0;
  const cantidad = kmPorUnidad > 0 ? currentAutoKm / kmPorUnidad : 0;

  document.getElementById('diesel-km').textContent = `${Math.round(currentAutoKm)} km`;
  document.getElementById('diesel-litros').textContent = `${Math.round(cantidad)} ${unidades.cantidad === 'kWh' ? 'kWh' : 'L'}`;

  const historial = [...state.dieselPrecios].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimo = historial[historial.length - 1];

  const estimadoEl = document.getElementById('diesel-estimado-linea');
  const aplicarBtn = document.getElementById('diesel-aplicar-btn');

  if (ultimo) {
    const estimado = cantidad * ultimo.precioLitro;
    estimadoEl.innerHTML = `Estimado con el precio más reciente (${formatCLP(ultimo.precioLitro)}/${unidades.cantidad === 'kWh' ? 'kWh' : 'L'}, ${formatFechaDisplay(ultimo.fecha)}): <strong>${formatCLP(estimado)}</strong>`;
    aplicarBtn.disabled = false;
    aplicarBtn.onclick = () => {
      let combustibleCat = state.presupuesto.find((p) => {
        const c = p.categoria.trim().toLowerCase();
        return c.startsWith('combustible') || c.startsWith('diésel') || c.startsWith('diesel');
      });
      if (!combustibleCat) {
        combustibleCat = { id: nextId(), categoria: 'Combustible', monto: 0, detalle: '' };
        state.presupuesto.push(combustibleCat);
      }
      combustibleCat.monto = Math.round(estimado);
      saveState();
      renderPresupuesto();
    };
  } else {
    estimadoEl.textContent = 'Registra el precio de esta semana para ver el estimado.';
    aplicarBtn.disabled = true;
    aplicarBtn.onclick = null;
  }

  renderDieselHistorial(historial, unidades.cantidad === 'kWh' ? 'kWh' : 'L');
}

function renderDieselHistorial(historialSorted, unidadSufijo = 'L') {
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
    precio.textContent = `${formatCLP(entry.precioLitro)}/${unidadSufijo}`;
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

function renderGastosTableHead() {
  const headRow = document.getElementById('gastos-thead-row');
  headRow.innerHTML = '';
  ['Fecha', 'Categoría', 'Descripción'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
  state.personas.forEach((p) => {
    const th = document.createElement('th');
    th.textContent = `Pagó ${p.nombre}`;
    headRow.appendChild(th);
  });
  ['Total', ''].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
}

function renderGastos() {
  renderGastosTableHead();

  const tbody = document.getElementById('gastos-tbody');
  tbody.innerHTML = '';

  const sorted = [...state.gastos].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  sorted.forEach((gasto) => {
    if (!gasto.montos) gasto.montos = {};
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

    const montoInputs = [];
    function refreshTotal() {
      const total = montoInputs.reduce((sum, inp) => sum + (Number(inp.value) || 0), 0);
      tdTotal.textContent = formatCLP(total);
    }

    const montoCells = state.personas.map((p) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '100';
      input.value = gasto.montos[p.id] || 0;
      input.addEventListener('change', () => {
        gasto.montos[p.id] = Number(input.value) || 0;
        saveState();
        updateBalance();
        refreshTotal();
      });
      td.appendChild(input);
      montoInputs.push(input);
      return td;
    });

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

    tr.append(tdFecha, tdCategoria, tdDescripcion, ...montoCells, tdTotal, tdActions);
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

function renderGastoFormFields() {
  const row = document.getElementById('gasto-montos-row');
  row.innerHTML = '';
  state.personas.forEach((p) => {
    const label = document.createElement('label');
    label.textContent = `Pagó ${p.nombre} (CLP)`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '100';
    input.value = '0';
    input.className = 'gasto-monto-persona-input';
    input.dataset.personaId = p.id;
    label.appendChild(input);
    row.appendChild(label);
  });
}

function setupGastoForm() {
  const form = document.getElementById('gasto-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fecha = document.getElementById('gasto-fecha').value;
    const categoria = document.getElementById('gasto-categoria').value;
    const descripcion = document.getElementById('gasto-descripcion').value.trim();

    const montos = {};
    let total = 0;
    document.querySelectorAll('.gasto-monto-persona-input').forEach((input) => {
      const v = Number(input.value) || 0;
      montos[input.dataset.personaId] = v;
      total += v;
    });

    if (!fecha || !descripcion || total <= 0) return;

    state.gastos.push({ id: nextId(), fecha, categoria, descripcion, montos });
    saveState();
    renderGastos();
    updateBalance();

    form.reset();
    document.getElementById('gasto-fecha').value = fecha;
    renderGastoFormFields();
    document.getElementById('gasto-descripcion').focus();
  });
}

/* ------------------------------------------------------------------ */
/* Gasto por persona vs. su propio presupuesto                        */
/* ------------------------------------------------------------------ */

function renderGastoPersonaCards() {
  const container = document.getElementById('gasto-persona-cards');
  container.innerHTML = '';

  state.personas.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'card';

    const h4 = document.createElement('h4');
    h4.textContent = p.nombre;
    card.appendChild(h4);

    const presupuestoP = document.createElement('p');
    presupuestoP.innerHTML = `Presupuesto: <strong id="persona-${p.id}-presupuesto">$0</strong>`;
    const pagoP = document.createElement('p');
    pagoP.innerHTML = `Gastado: <strong id="persona-${p.id}-pago">$0</strong>`;
    const disponibleP = document.createElement('p');
    disponibleP.innerHTML = `Disponible: <strong id="persona-${p.id}-disponible">$0</strong>`;
    card.append(presupuestoP, pagoP, disponibleP);

    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap';
    progressWrap.innerHTML = `
      <div class="progress-bar"><div class="progress-fill" id="persona-${p.id}-progress"></div></div>
      <span id="persona-${p.id}-progress-label">0%</span>
    `;
    card.appendChild(progressWrap);

    container.appendChild(card);
  });
}

// No todos los gastos se reparten proporcionalmente entre las personas
// (por ejemplo, uno paga el auto y otro los pasajes). Lo que importa
// acá es que cada uno vea claramente si se está pasando de su propio
// presupuesto, no calcular quién le debe a quién.
function updateBalance() {
  renderGastoPersonaCards();

  const totalGastado = totalGastadoReal();
  document.getElementById('gasto-total-real').textContent = formatCLP(totalGastado);

  state.personas.forEach((p) => {
    const pago = state.gastos.reduce((sum, g) => sum + (Number(g.montos && g.montos[p.id]) || 0), 0);
    const presupuestoPersonal = Number(state.aportes[p.id]) || 0;

    document.getElementById(`persona-${p.id}-presupuesto`).textContent = formatCLP(presupuestoPersonal);
    document.getElementById(`persona-${p.id}-pago`).textContent = formatCLP(pago);
    setDisponible(`persona-${p.id}-disponible`, presupuestoPersonal - pago);
    updateProgress(`persona-${p.id}`, pago, presupuestoPersonal);
  });

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
    const slug = stripAccents((state.nombre || 'viaje').toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${slug || 'viaje'}-${fecha}.json`;
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
        if (!confirm(`Esto reemplazará los datos de "${state.nombre}" por los del archivo importado. ¿Continuar?`)) {
          return;
        }
        setActiveTripData(normalizeTripData(imported));
        persistToStorage();
        renderTripHeader();
        renderAll();
      } catch (err) {
        alert('No se pudo importar el archivo: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (confirm(`Esto vacía por completo el viaje "${state.nombre}": sin días de itinerario, sin categorías de presupuesto, sin personas ni gastos. No se puede deshacer. ¿Seguro que quieres continuar?`)) {
      setActiveTripData(makeEmptyTripData());
      persistToStorage();
      renderTripHeader();
      renderAll();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Guardar / Restablecer                                               */
/* ------------------------------------------------------------------ */

function setupSaveBar() {
  document.getElementById('save-btn').addEventListener('click', () => {
    persistToStorage();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!isDirty) return;
    if (!confirm('Esto descarta los cambios hechos desde el último guardado y vuelve a esa versión. ¿Continuar?')) return;

    closeDayModal();

    const activeId = appData.activeTripId;
    appData = loadAppData();
    state = activeId && appData.trips[activeId] ? appData.trips[activeId] : (appData.activeTripId ? appData.trips[appData.activeTripId] : null);
    isDirty = false;
    updateSaveIndicator();
    hideCloudConflictBanner();

    if (state) {
      renderTripHeader();
      renderAll();
    } else {
      backToTripsForced();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = '';
  });
}

// Como backToTrips(), pero sin el aviso de cambios sin guardar — se usa tras
// un Restablecer que ya se confirmó, cuando el viaje activo ya no existe.
function backToTripsForced() {
  document.getElementById('app-root').hidden = true;
  document.getElementById('trip-selector').hidden = false;
  renderTripList();
}

/* ------------------------------------------------------------------ */
/* Sync en la nube (Firestore, vía window.firebaseSync de index.html)  */
/* ------------------------------------------------------------------ */

// Guarda el último payload que subimos nosotros mismos, para reconocer y
// descartar el "eco" cuando Firestore nos devuelve nuestro propio guardado
// a través del mismo listener en tiempo real.
let lastPushedPayload = null;

function pushToCloud() {
  if (!window.firebaseSync) return;
  lastPushedPayload = JSON.stringify(appData);
  window.firebaseSync.push(appData, getActiveProfile()).catch((err) => {
    console.warn('No se pudo sincronizar con la nube (se guardó igual localmente)', err);
  });
}

function showCloudConflictBanner() {
  const el = document.getElementById('cloud-conflict-banner');
  if (el) el.hidden = false;
}

function hideCloudConflictBanner() {
  const el = document.getElementById('cloud-conflict-banner');
  if (el) el.hidden = true;
}

// Aplica en memoria los datos que llegaron de la nube y re-renderiza lo que
// corresponda según qué pantalla esté visible. Solo se llama cuando NO hay
// ediciones locales sin guardar (si las hay, se avisa con el banner en vez
// de pisarlas — ver handleRemoteSnapshot).
function applyRemoteAppData(remoteAppData, updatedBy) {
  const previousAppData = appData;
  const activeId = previousAppData ? previousAppData.activeTripId : null;

  appData = remoteAppData;
  appData.activeTripId = (activeId && appData.trips[activeId]) ? activeId : appData.activeTripId;

  const profile = getActiveProfile();
  if (profile && previousAppData && updatedBy && updatedBy !== profile) {
    const summary = computeChangesSummary(previousAppData, appData);
    if (summary.length > 0) showChangesNotification(summary);
  }
  if (profile) markProfileSnapshotCurrent();

  hideCloudConflictBanner();
  if (!document.getElementById('day-modal').hidden) closeDayModal();

  if (!document.getElementById('app-root').hidden) {
    state = appData.trips[appData.activeTripId] || null;
    if (state) {
      renderTripHeader();
      renderAll();
    } else {
      backToTripsForced();
    }
  } else if (!document.getElementById('trip-selector').hidden) {
    state = appData.activeTripId ? appData.trips[appData.activeTripId] : null;
    renderTripList();
  } else {
    // Todavía en la pantalla de clave o de perfil: solo deja los datos
    // listos, sin intentar re-renderizar una vista que no está visible.
    state = appData.activeTripId ? appData.trips[appData.activeTripId] : null;
  }
}

function handleRemoteSnapshot(payloadJson, updatedAt, updatedBy, isFirst) {
  if (payloadJson === null) {
    // Todavía no hay nada guardado en la nube: si es la primera vez que
    // corre esto en este dispositivo, siembra los datos locales actuales
    // (típicamente el primer dispositivo en usar esta versión con sync).
    if (isFirst && appData) pushToCloud();
    return;
  }
  if (payloadJson === lastPushedPayload) return; // eco de nuestro propio guardado

  let remoteAppData;
  try {
    remoteAppData = normalizeAppData(JSON.parse(payloadJson));
  } catch (e) {
    return;
  }

  if (appData && JSON.stringify(appData) === JSON.stringify(remoteAppData)) return; // sin cambios reales

  // Deja esto como "lo último guardado" para todo el mundo (localStorage,
  // Restablecer, comparaciones de perfil) exista o no una edición local en
  // curso — lo único que se protege de un cambio remoto es el `state` en
  // memoria mientras haya algo sin guardar.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteAppData));
  } catch (e) {}

  if (isDirty) {
    showCloudConflictBanner();
    return;
  }

  applyRemoteAppData(remoteAppData, updatedBy);
}

function setupCloudSync() {
  if (!window.firebaseSync) return;
  window.firebaseSync.subscribe(handleRemoteSnapshot);
}

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

function renderAll() {
  updateSaveIndicator();
  renderTripHeader();
  renderItinerario();
  renderPresupuesto();
  renderAportesResumen();
  renderGastoFormFields();
  renderGastos();
  updateBalance();
  renderDieselCard();
}

/* ------------------------------------------------------------------ */
/* Selector de viajes                                                  */
/* ------------------------------------------------------------------ */

function tripDateRangeLabel(trip) {
  const fechas = trip.itinerario.map((d) => d.fecha).filter(Boolean).sort();
  if (fechas.length === 0) return '';
  const inicio = formatFechaDisplay(fechas[0]);
  const fin = formatFechaDisplay(fechas[fechas.length - 1]);
  return inicio === fin ? inicio : `${inicio} – ${fin}`;
}

function renderTripList() {
  updateProfileBarLabel();
  const container = document.getElementById('trip-list');
  container.innerHTML = '';

  const trips = Object.values(appData.trips).sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (trips.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'trip-empty';
    empty.textContent = 'No tienes viajes todavía. Crea uno con el botón de arriba.';
    container.appendChild(empty);
    return;
  }

  trips.forEach((trip) => {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const nombreEl = document.createElement('div');
    nombreEl.className = 'trip-card-name';
    nombreEl.textContent = trip.nombre;
    card.appendChild(nombreEl);

    const personas = trip.personas.length;
    const rango = tripDateRangeLabel(trip);
    const metaEl = document.createElement('div');
    metaEl.className = 'trip-card-meta';
    metaEl.textContent = [rango, `${personas} persona${personas === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
    card.appendChild(metaEl);

    const open = () => openTrip(trip.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return; // evita doble acción si el foco está en el botón de borrar
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    const delBtn = makeDeleteButton('Eliminar viaje', (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar el viaje "${trip.nombre}"? Esto no se puede deshacer.`)) {
        delete appData.trips[trip.id];
        if (appData.activeTripId === trip.id) appData.activeTripId = null;
        persistToStorage();
        renderTripList();
      }
    });
    delBtn.classList.add('trip-card-delete');
    card.appendChild(delBtn);

    container.appendChild(card);
  });
}

function openTrip(tripId) {
  if (!appData.trips[tripId]) return;
  appData.activeTripId = tripId;
  persistToStorage();
  state = appData.trips[tripId];

  document.getElementById('trip-selector').hidden = true;
  document.getElementById('app-root').hidden = false;

  if (!window.__leafletMap) {
    initMap();
  }
  renderAll();
  if (window.__leafletMap) {
    setTimeout(() => window.__leafletMap.invalidateSize(), 50);
  }
}

function backToTrips() {
  if (isDirty && !confirm('Tienes cambios sin guardar en este viaje. Si sales sin guardar, se perderán la próxima vez que abras la app. ¿Salir de todas formas?')) {
    return;
  }
  document.getElementById('app-root').hidden = true;
  document.getElementById('trip-selector').hidden = false;
  renderTripList();
}

function renderTripHeader() {
  if (!state) return;
  document.getElementById('trip-title').textContent = state.nombre;
  document.getElementById('trip-subtitle').textContent = tripDateRangeLabel(state);
  document.title = `${state.nombre} — Mis Viajes`;
}

// El nombre del viaje se puede renombrar tocando/editando el título
// directamente (mismo patrón que "lugar"/"notas" en la tabla de
// itinerario), sin un modal aparte.
function setupTripHeader() {
  const titleEl = document.getElementById('trip-title');
  titleEl.addEventListener('blur', () => {
    if (!state) return;
    const nuevoNombre = titleEl.textContent.trim();
    if (!nuevoNombre) {
      titleEl.textContent = state.nombre; // no se permite dejarlo vacío
      return;
    }
    if (nuevoNombre === state.nombre) return;
    state.nombre = nuevoNombre;
    saveState();
    document.title = `${state.nombre} — Mis Viajes`;
  });
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleEl.blur();
    }
  });
}

function setupTripSelector() {
  document.getElementById('back-to-trips-btn').addEventListener('click', backToTrips);
  document.getElementById('new-trip-btn').addEventListener('click', openNewTripModal);
}

/* ------------------------------------------------------------------ */
/* Modal "Nuevo viaje"                                                 */
/* ------------------------------------------------------------------ */

function updateNewTripLugarRegresoVisibility() {
  const mismoLugar = document.getElementById('new-trip-mismo-lugar').checked;
  document.getElementById('new-trip-lugar-regreso-wrap').hidden = mismoLugar;
  document.getElementById('new-trip-lugar-regreso-feedback').hidden = mismoLugar;
}

function openNewTripModal() {
  document.getElementById('new-trip-nombre').value = '';
  document.getElementById('new-trip-fecha-salida').value = '';
  document.getElementById('new-trip-fecha-regreso').value = '';
  document.getElementById('new-trip-lugar-salida').value = '';
  document.getElementById('new-trip-lugar-regreso').value = '';
  document.getElementById('new-trip-mismo-lugar').checked = true;
  document.getElementById('new-trip-error').style.display = 'none';
  if (newTripLugarSalidaAutocomplete) newTripLugarSalidaAutocomplete.reset();
  if (newTripLugarRegresoAutocomplete) newTripLugarRegresoAutocomplete.reset();
  updateNewTripLugarRegresoVisibility();
  document.getElementById('new-trip-modal').hidden = false;
  document.getElementById('new-trip-nombre').focus();
}

function closeNewTripModal() {
  document.getElementById('new-trip-modal').hidden = true;
}

// Cada día de tránsito/vuelo trae su propio modoTransporte por defecto
// ("auto") aunque acá nunca se enrute como vuelo — el usuario lo ajusta
// desde el detalle del día si el viaje es, por ejemplo, solo en avión.
function makeBoundaryDay(fecha, lugar, coords) {
  const day = { id: nextId(), fecha, lugar, tipo: 'transito', notas: '', paradas: [], modoTransporte: 'auto' };
  if (coords) {
    day.lugarLat = coords.lat;
    day.lugarLng = coords.lng;
  }
  return day;
}

function setupNewTripModal() {
  document.getElementById('new-trip-modal-close-btn').addEventListener('click', closeNewTripModal);
  document.getElementById('new-trip-modal').addEventListener('click', (e) => {
    if (e.target.id === 'new-trip-modal') closeNewTripModal();
  });
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('new-trip-modal').hidden) return;
    if (e.key === 'Escape') closeNewTripModal();
  });

  document.getElementById('new-trip-mismo-lugar').addEventListener('change', updateNewTripLugarRegresoVisibility);

  // El guardado real ocurre al enviar el formulario (ver más abajo), no en
  // cada tecleo — igual que el autocompletado de paradas extra del día.
  newTripLugarSalidaAutocomplete = setupPlaceAutocomplete(
    document.getElementById('new-trip-lugar-salida'),
    document.getElementById('new-trip-lugar-salida-suggestions'),
    document.getElementById('new-trip-lugar-salida-feedback'),
    () => {}
  );
  newTripLugarRegresoAutocomplete = setupPlaceAutocomplete(
    document.getElementById('new-trip-lugar-regreso'),
    document.getElementById('new-trip-lugar-regreso-suggestions'),
    document.getElementById('new-trip-lugar-regreso-feedback'),
    () => {}
  );

  document.getElementById('new-trip-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('new-trip-nombre').value.trim();
    const fechaSalida = document.getElementById('new-trip-fecha-salida').value;
    const fechaRegreso = document.getElementById('new-trip-fecha-regreso').value;
    const lugarSalida = document.getElementById('new-trip-lugar-salida').value.trim();
    const mismoLugar = document.getElementById('new-trip-mismo-lugar').checked;
    const lugarRegreso = mismoLugar ? lugarSalida : document.getElementById('new-trip-lugar-regreso').value.trim();
    const errorEl = document.getElementById('new-trip-error');

    if (!nombre || !fechaSalida || !fechaRegreso || !lugarSalida) {
      errorEl.textContent = 'Completa el nombre, las dos fechas y el lugar de salida para crear el viaje.';
      errorEl.style.display = 'block';
      return;
    }
    if (!mismoLugar && !lugarRegreso) {
      errorEl.textContent = 'Escribe el lugar de regreso, o marca "El regreso es al mismo lugar".';
      errorEl.style.display = 'block';
      return;
    }
    if (fechaRegreso < fechaSalida) {
      errorEl.textContent = 'La fecha de regreso no puede ser antes que la de salida.';
      errorEl.style.display = 'block';
      return;
    }

    const coordsSalida = newTripLugarSalidaAutocomplete.getPendingCoords();
    const coordsRegreso = mismoLugar ? coordsSalida : newTripLugarRegresoAutocomplete.getPendingCoords();

    const tripData = makeEmptyTripData();
    // Estos dos días marcan el rango y los extremos del viaje desde el
    // principio (para que el calendario y el mapa tengan algo con qué
    // partir) — el tipo, el lugar y el modo de transporte quedan
    // editables, no asumen auto/avión/bus específico. Se colapsan a un
    // solo día solo si además del día coinciden en el mismo lugar (un
    // viaje de un día a un lugar distinto sigue necesitando los dos
    // extremos, aunque compartan fecha).
    tripData.itinerario = (fechaSalida === fechaRegreso && lugarSalida === lugarRegreso)
      ? [makeBoundaryDay(fechaSalida, lugarSalida, coordsSalida)]
      : [makeBoundaryDay(fechaSalida, lugarSalida, coordsSalida), makeBoundaryDay(fechaRegreso, lugarRegreso, coordsRegreso)];

    const trip = makeTrip(nombre, tripData);
    appData.trips[trip.id] = trip;
    appData.activeTripId = trip.id;
    persistToStorage();
    closeNewTripModal();
    openTrip(trip.id);
  });
}

/* ------------------------------------------------------------------ */
/* Clave de acceso                                                     */
/* ------------------------------------------------------------------ */

// Esto NO es seguridad real: el repo es público y cualquiera con algo de
// conocimiento técnico puede ver este código y el hash. Solo evita que
// alguien que llegue al link por casualidad vea los datos del viaje.
// El PIN es de 4 dígitos (ver #lock-input: inputmode numérico, maxlength 4).
const LOCK_PASSWORD_HASH = 'c5f011b4b1fce43e38aa776d1430cab5067085a85e155f2fa678f03e78eae7ef';
const LOCK_UNLOCKED_KEY = 'viajeChiloe2026_unlocked';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function revealApp() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('theme-toggle-btn').hidden = false;
  enterProfileFlow();
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

  const lockInput = document.getElementById('lock-input');
  lockInput.addEventListener('input', () => {
    // Solo 4 dígitos: fuerza el teclado numérico a comportarse como PIN
    // aunque el usuario pegue o escriba algo con letras u otros símbolos.
    lockInput.value = lockInput.value.replace(/\D/g, '').slice(0, 4);
  });

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
/* Perfiles (Andrés / Valentina) y aviso de cambios                    */
/* ------------------------------------------------------------------ */

// Esta app la usan dos personas fijas — no hace falta un modelo de
// perfiles genérico ni cuentas separadas, solo saber quién es quién para
// avisar "esto cambió desde tu última visita" cuando entra la otra.
const PROFILE_KEY = 'misViajes_activeProfile';
const PROFILE_SNAPSHOT_PREFIX = 'misViajes_lastSeen_';
const PROFILE_LABELS = { andres: 'Andrés', valentina: 'Valentina' };

function getActiveProfile() {
  try {
    const p = localStorage.getItem(PROFILE_KEY);
    return PROFILE_LABELS[p] ? p : null;
  } catch (e) {
    return null;
  }
}

function setActiveProfile(profileId) {
  try { localStorage.setItem(PROFILE_KEY, profileId); } catch (e) {}
}

function clearActiveProfile() {
  try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
}

function updateProfileBarLabel() {
  const el = document.getElementById('profile-bar-label');
  if (!el) return;
  const profile = getActiveProfile();
  el.textContent = profile ? `Perfil: ${PROFILE_LABELS[profile]}` : '';
}

// Guarda "así se veían los datos la última vez que este perfil guardó/vio
// cambios" — la referencia contra la que se compara la próxima vez que
// entre, para saber qué cambió mientras tanto.
function markProfileSnapshotCurrent() {
  const profile = getActiveProfile();
  if (!profile) return;
  try {
    localStorage.setItem(PROFILE_SNAPSHOT_PREFIX + profile, JSON.stringify(appData));
  } catch (e) {}
}

function diffById(beforeArr, afterArr) {
  const beforeMap = new Map((Array.isArray(beforeArr) ? beforeArr : []).map((x) => [x.id, x]));
  const afterMap = new Map((Array.isArray(afterArr) ? afterArr : []).map((x) => [x.id, x]));
  const added = [...afterMap.keys()].filter((id) => !beforeMap.has(id));
  const removed = [...beforeMap.keys()].filter((id) => !afterMap.has(id));
  const modified = [...afterMap.keys()].filter(
    (id) => beforeMap.has(id) && JSON.stringify(beforeMap.get(id)) !== JSON.stringify(afterMap.get(id))
  );
  return { added, removed, modified };
}

function plural(n, singular, pluralForm) {
  return n === 1 ? singular : pluralForm;
}

function computeTripChangeLines(beforeTrip, afterTrip) {
  const lines = [];

  const itin = diffById(beforeTrip.itinerario, afterTrip.itinerario);
  if (itin.added.length) lines.push(`${itin.added.length} ${plural(itin.added.length, 'día agregado', 'días agregados')} al itinerario`);
  if (itin.removed.length) lines.push(`${itin.removed.length} ${plural(itin.removed.length, 'día eliminado', 'días eliminados')} del itinerario`);
  if (itin.modified.length) lines.push(`${itin.modified.length} ${plural(itin.modified.length, 'día editado', 'días editados')} en el itinerario`);

  const afterGastosMap = new Map((afterTrip.gastos || []).map((g) => [g.id, g]));
  const gastos = diffById(beforeTrip.gastos, afterTrip.gastos);
  if (gastos.added.length) {
    const total = gastos.added.reduce((sum, id) => {
      const g = afterGastosMap.get(id);
      const montos = (g && g.montos) || {};
      return sum + Object.values(montos).reduce((a, b) => a + (Number(b) || 0), 0);
    }, 0);
    lines.push(`${gastos.added.length} ${plural(gastos.added.length, 'gasto nuevo', 'gastos nuevos')} (${formatCLP(total)})`);
  }
  if (gastos.removed.length) lines.push(`${gastos.removed.length} ${plural(gastos.removed.length, 'gasto eliminado', 'gastos eliminados')}`);
  if (gastos.modified.length) lines.push(`${gastos.modified.length} ${plural(gastos.modified.length, 'gasto editado', 'gastos editados')}`);

  const presu = diffById(beforeTrip.presupuesto, afterTrip.presupuesto);
  if (presu.added.length || presu.removed.length || presu.modified.length) {
    lines.push('Se actualizó el presupuesto por categoría');
  }

  if (
    JSON.stringify(beforeTrip.aportes || {}) !== JSON.stringify(afterTrip.aportes || {}) ||
    JSON.stringify(beforeTrip.personas || []) !== JSON.stringify(afterTrip.personas || [])
  ) {
    lines.push('Se actualizaron las personas o los aportes del viaje');
  }

  if (
    JSON.stringify(beforeTrip.dieselPrecios || []) !== JSON.stringify(afterTrip.dieselPrecios || []) ||
    beforeTrip.dieselKmPorLitro !== afterTrip.dieselKmPorLitro ||
    beforeTrip.tipoCombustible !== afterTrip.tipoCombustible
  ) {
    lines.push('Se actualizó el combustible o el rendimiento del vehículo');
  }

  if (beforeTrip.nombre !== afterTrip.nombre) {
    lines.push(`Se renombró el viaje a "${afterTrip.nombre}"`);
  }

  return lines;
}

function computeChangesSummary(before, after) {
  const summary = [];
  const beforeTrips = (before && before.trips) || {};
  const afterTrips = (after && after.trips) || {};
  const allIds = new Set([...Object.keys(beforeTrips), ...Object.keys(afterTrips)]);

  allIds.forEach((id) => {
    const b = beforeTrips[id];
    const a = afterTrips[id];
    if (!b && a) {
      summary.push({ trip: a.nombre, lines: ['Viaje nuevo'] });
    } else if (b && !a) {
      summary.push({ trip: b.nombre, lines: ['Este viaje fue eliminado'] });
    } else if (b && a) {
      const lines = computeTripChangeLines(b, a);
      if (lines.length > 0) summary.push({ trip: a.nombre, lines });
    }
  });

  return summary;
}

function checkForOtherProfileChanges(profileId) {
  let previousRaw = null;
  try {
    previousRaw = localStorage.getItem(PROFILE_SNAPSHOT_PREFIX + profileId);
  } catch (e) {
    return;
  }

  let currentRaw = null;
  try {
    currentRaw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return;
  }

  if (!previousRaw) {
    // Primera vez que este perfil entra: todavía no hay nada con qué
    // comparar, solo se guarda la referencia para la próxima visita.
    if (currentRaw) {
      try { localStorage.setItem(PROFILE_SNAPSHOT_PREFIX + profileId, currentRaw); } catch (e) {}
    }
    return;
  }
  if (previousRaw === currentRaw) return;

  try {
    const before = JSON.parse(previousRaw);
    const after = JSON.parse(currentRaw);
    const summary = computeChangesSummary(before, after);
    if (summary.length > 0) showChangesNotification(summary);
  } catch (e) {
    // si algo falla al comparar, no bloquea el flujo normal de la app
  } finally {
    try { localStorage.setItem(PROFILE_SNAPSHOT_PREFIX + profileId, currentRaw); } catch (e) {}
  }
}

function showChangesNotification(summary) {
  const body = document.getElementById('changes-modal-body');
  body.innerHTML = '';
  summary.forEach(({ trip, lines }) => {
    const group = document.createElement('div');
    group.className = 'changes-trip-group';

    const name = document.createElement('div');
    name.className = 'changes-trip-name';
    name.textContent = trip;
    group.appendChild(name);

    const ul = document.createElement('ul');
    lines.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    });
    group.appendChild(ul);

    body.appendChild(group);
  });
  document.getElementById('changes-modal').hidden = false;
}

function closeChangesModal() {
  document.getElementById('changes-modal').hidden = true;
}

function showProfileSelector() {
  document.getElementById('app-root').hidden = true;
  document.getElementById('trip-selector').hidden = true;
  document.getElementById('profile-selector').hidden = false;
}

function enterAsProfile(profileId) {
  setActiveProfile(profileId);
  document.getElementById('profile-selector').hidden = true;
  // Se revisa por localStorage (que el sync en la nube ya deja al día si
  // alcanzó a llegar el primer snapshot) Y además queda el listener en
  // tiempo real (setupCloudSync) por si ese snapshot llega recién después
  // de elegir el perfil — cubre la carrera entre ambos sin depender de
  // cuál gane.
  checkForOtherProfileChanges(profileId);
  backToTripsForced();
  updateProfileBarLabel();
}

function enterProfileFlow() {
  const profile = getActiveProfile();
  if (!profile) {
    showProfileSelector();
    return;
  }
  enterAsProfile(profile);
}

function setupProfileSelector() {
  document.querySelectorAll('.profile-card').forEach((btn) => {
    btn.addEventListener('click', () => enterAsProfile(btn.dataset.profile));
  });

  document.getElementById('switch-profile-btn').addEventListener('click', () => {
    if (isDirty && !confirm('Tienes cambios sin guardar en este viaje. Si cambias de perfil ahora, se perderán la próxima vez que abras la app. ¿Continuar?')) return;
    clearActiveProfile();
    showProfileSelector();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    if (isDirty && !confirm('Tienes cambios sin guardar en este viaje. Si sales ahora, se perderán la próxima vez que abras la app. ¿Continuar?')) return;
    clearActiveProfile();
    try { localStorage.removeItem(LOCK_UNLOCKED_KEY); } catch (e) {}
    document.getElementById('app-root').hidden = true;
    document.getElementById('trip-selector').hidden = true;
    document.getElementById('profile-selector').hidden = true;
    document.getElementById('theme-toggle-btn').hidden = true;
    document.getElementById('lock-screen').style.display = '';
    document.getElementById('lock-input').value = '';
  });

  document.getElementById('changes-modal-close-btn').addEventListener('click', closeChangesModal);
  document.getElementById('changes-modal-ok-btn').addEventListener('click', closeChangesModal);
  document.getElementById('changes-modal').addEventListener('click', (e) => {
    if (e.target.id === 'changes-modal') closeChangesModal();
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
  appData = loadAppData();
  // Si es la primera vez (no había nada en localStorage), deja los datos
  // semilla guardados de inmediato: así "Restablecer" siempre tiene una
  // versión coherente a la que volver, incluso antes de la primera edición.
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  }
  state = appData.activeTripId ? appData.trips[appData.activeTripId] : null;

  setupLockScreen();
  setupProfileSelector();
  setupTripSelector();
  setupNewTripModal();
  setupTripHeader();
  setupTabs();
  setupThemeToggle();
  setupDayModal();
  setupPresupuestoUI();
  setupDieselUI();
  setupGastoForm();
  setupDataButtons();
  setupSaveBar();
  setupCloudSync();

  if (state) {
    initMap();
    renderAll();
  }
});
