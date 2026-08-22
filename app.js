'use strict';

/* ------------------------------------------------------------------ */
/* Datos semilla                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'viajeChiloe2026';

const SEED_ITINERARIO = [
  { fecha: '2026-10-23', lugar: 'Santiago → Valdivia', tipo: 'transito', notas: 'Bus nocturno (~11-12 h)' },
  { fecha: '2026-10-24', lugar: 'Valdivia', tipo: 'alojamiento', notas: 'Llegada AM. Centro, costanera, Mercado Fluvial, Isla Teja' },
  { fecha: '2026-10-25', lugar: 'Valdivia', tipo: 'alojamiento', notas: 'Niebla / Fuerte de Corral, o Parque Saval' },
  { fecha: '2026-10-26', lugar: 'Quemchi (Chiloé)', tipo: 'alojamiento', notas: 'Retiro del auto en Valdivia. Ferry Pargua–Chacao. Isla Aucar' },
  { fecha: '2026-10-27', lugar: 'Quemchi (Chiloé)', tipo: 'alojamiento', notas: 'Bote desde Quicaví a Isla Mechuque' },
  { fecha: '2026-10-28', lugar: 'Castro / Chonchi', tipo: 'alojamiento', notas: 'Dalcahue + Isla Quinchao (Curaco de Vélez, Achao)' },
  { fecha: '2026-10-29', lugar: 'Cucao / P.N. Chiloé', tipo: 'camping', notas: 'Llegada al parque, caminata corta' },
  { fecha: '2026-10-30', lugar: 'Cucao / P.N. Chiloé', tipo: 'camping', notas: 'Kayak Lago Huillinco o sendero Chanquín' },
  { fecha: '2026-10-31', lugar: 'Quellón', tipo: 'camping', notas: 'Caleta pesquera, mariscos frescos' },
  { fecha: '2026-11-01', lugar: 'Quellón', tipo: 'camping', notas: 'Parque Tantauco (Chaiguata) o descanso' },
  { fecha: '2026-11-02', lugar: 'Cochamó / Puerto Varas', tipo: 'alojamiento', notas: 'Salida de Chiloé (ferry Chacao–Pargua, ruta terrestre sin ferry hasta Cochamó, ~360 km desde Quellón). Descanso' },
  { fecha: '2026-11-03', lugar: 'Cochamó / Puerto Varas', tipo: 'alojamiento', notas: 'Día libre, borde costero, sin tours' },
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
];

const SEED_APORTES = { valentina: 500000, andres: 800000 };

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
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.itinerario || !parsed.presupuesto || !parsed.aportes || !parsed.gastos) {
      return defaultState();
    }
    return parsed;
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
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Eliminar día';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => {
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
}

function updateItinerarioField(id, field, value) {
  const day = state.itinerario.find((d) => d.id === id);
  if (!day) return;
  day[field] = value;
  saveState();
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
/* Ruta / mapa                                                        */
/* ------------------------------------------------------------------ */

function initMap() {
  const map = L.map('map').setView([-40.5, -73.0], 6);
  window.__leafletMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const latlngs = ROUTE_POINTS.map((p) => [p.lat, p.lng]);
  L.polyline(latlngs, { color: '#c96f34', weight: 3, dashArray: '6 6' }).addTo(map);

  window.__routeMarkers = ROUTE_POINTS.map((point, idx) => {
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 9,
      fillColor: '#2f6b5e',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.95,
    }).addTo(map);

    marker.bindPopup(buildPopupContent(point));
    marker.bindTooltip(`${idx + 1}. ${point.lugar}`, { permanent: false, direction: 'top' });
    return marker;
  });

  const bounds = L.latLngBounds(latlngs);
  map.fitBounds(bounds, { padding: [30, 30] });
}

function buildPopupContent(point) {
  const day = state.itinerario.find((d) => d.fecha === point.fecha);
  const fechaDisplay = formatFechaDisplay(point.fecha);
  const notas = day ? `<br><small>${escapeHtml(day.notas || '')}</small>` : '';
  return `<strong>${escapeHtml(point.lugar)}</strong><br>${fechaDisplay}${notas}`;
}

function renderRutaTimestamps() {
  if (!window.__routeMarkers) return;
  window.__routeMarkers.forEach((marker, idx) => {
    marker.setPopupContent(buildPopupContent(ROUTE_POINTS[idx]));
  });
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
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Eliminar categoría';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => {
      if (confirm('¿Eliminar esta categoría de presupuesto?')) {
        state.presupuesto = state.presupuesto.filter((p) => p.id !== item.id);
        saveState();
        renderPresupuesto();
        renderPresupuestoTotal();
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
}

function setupPresupuestoUI() {
  document.getElementById('add-budget-btn').addEventListener('click', () => {
    state.presupuesto.push({ id: nextId(), categoria: 'Nueva categoría', monto: 0, detalle: '' });
    saveState();
    renderPresupuesto();
  });

  const valentinaInput = document.getElementById('aporte-valentina');
  const andresInput = document.getElementById('aporte-andres');

  valentinaInput.value = state.aportes.valentina;
  andresInput.value = state.aportes.andres;

  valentinaInput.addEventListener('input', () => {
    state.aportes.valentina = Number(valentinaInput.value) || 0;
    saveState();
    renderAportesResumen();
    updateBalance();
  });
  andresInput.addEventListener('input', () => {
    state.aportes.andres = Number(andresInput.value) || 0;
    saveState();
    renderAportesResumen();
    updateBalance();
  });
}

function renderAportesResumen() {
  const { valentina, andres } = state.aportes;
  const total = valentina + andres;
  document.getElementById('aporte-total').textContent = formatCLP(total);

  const pctValentina = total > 0 ? (valentina / total) * 100 : 0;
  const pctAndres = total > 0 ? (andres / total) * 100 : 0;

  document.getElementById('aporte-pcts').textContent =
    total > 0
      ? `Valentina: ${pctValentina.toFixed(2)}% · Andrés: ${pctAndres.toFixed(2)}%`
      : 'Ingresa los aportes para calcular los porcentajes.';
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

    const tdMonto = document.createElement('td');
    const montoInput = document.createElement('input');
    montoInput.type = 'number';
    montoInput.min = '0';
    montoInput.step = '100';
    montoInput.value = gasto.monto || 0;
    montoInput.addEventListener('change', () => updateGastoField(gasto.id, 'monto', Number(montoInput.value) || 0));
    tdMonto.appendChild(montoInput);

    const tdQuien = document.createElement('td');
    const quienSelect = document.createElement('select');
    ['Andrés', 'Valentina'].forEach((nombre) => {
      const opt = document.createElement('option');
      opt.value = nombre;
      opt.textContent = nombre;
      if (nombre === gasto.quien) opt.selected = true;
      quienSelect.appendChild(opt);
    });
    quienSelect.addEventListener('change', () => updateGastoField(gasto.id, 'quien', quienSelect.value));
    tdQuien.appendChild(quienSelect);

    const tdActions = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Eliminar gasto';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => {
      state.gastos = state.gastos.filter((g) => g.id !== gasto.id);
      saveState();
      renderGastos();
      updateBalance();
    });
    tdActions.appendChild(delBtn);

    tr.append(tdFecha, tdCategoria, tdDescripcion, tdMonto, tdQuien, tdActions);
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
    const quien = document.getElementById('gasto-quien').value;
    const descripcion = document.getElementById('gasto-descripcion').value.trim();
    const monto = Number(document.getElementById('gasto-monto').value) || 0;

    if (!fecha || !descripcion || monto <= 0) return;

    state.gastos.push({ id: nextId(), fecha, categoria, descripcion, monto, quien });
    saveState();
    renderGastos();
    updateBalance();

    form.reset();
    document.getElementById('gasto-fecha').value = fecha;
    document.getElementById('gasto-descripcion').focus();
  });
}

/* ------------------------------------------------------------------ */
/* Balance / reparto proporcional                                     */
/* ------------------------------------------------------------------ */

function updateBalance() {
  const { valentina: aporteValentina, andres: aporteAndres } = state.aportes;
  const totalAportes = aporteValentina + aporteAndres;

  const pctValentina = totalAportes > 0 ? aporteValentina / totalAportes : 0;
  const pctAndres = totalAportes > 0 ? aporteAndres / totalAportes : 0;

  const totalGastado = state.gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

  const pagoAndres = state.gastos
    .filter((g) => g.quien === 'Andrés')
    .reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const pagoValentina = state.gastos
    .filter((g) => g.quien === 'Valentina')
    .reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

  const correspondeAndres = totalGastado * pctAndres;
  const correspondeValentina = totalGastado * pctValentina;

  const saldoAndres = pagoAndres - correspondeAndres;
  const saldoValentina = pagoValentina - correspondeValentina;

  document.getElementById('gasto-total-real').textContent = formatCLP(totalGastado);

  document.getElementById('andres-pago').textContent = formatCLP(pagoAndres);
  document.getElementById('andres-corresponde').textContent = formatCLP(correspondeAndres);

  document.getElementById('valentina-pago').textContent = formatCLP(pagoValentina);
  document.getElementById('valentina-corresponde').textContent = formatCLP(correspondeValentina);

  updateProgress('andres', pagoAndres, aporteAndres);
  updateProgress('valentina', pagoValentina, aporteValentina);

  const messageEl = document.getElementById('balance-message');
  const diff = Math.round(Math.abs(saldoAndres));

  if (diff < 100) {
    messageEl.textContent = '✅ Cuentas parejas — nadie le debe nada a nadie.';
    messageEl.className = 'balance-message even';
  } else if (saldoAndres > 0) {
    messageEl.textContent = `💸 Valentina le debe ${formatCLP(diff)} a Andrés.`;
    messageEl.className = 'balance-message owe-andres';
  } else {
    messageEl.textContent = `💸 Andrés le debe ${formatCLP(diff)} a Valentina.`;
    messageEl.className = 'balance-message owe-valentina';
  }
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
        state = imported;
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
}

document.addEventListener('DOMContentLoaded', () => {
  state = loadState();

  setupTabs();
  setupPresupuestoUI();
  setupGastoForm();
  setupDataButtons();
  initMap();
  renderAll();
});
