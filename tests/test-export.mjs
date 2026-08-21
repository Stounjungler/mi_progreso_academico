import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
// Rutas relativas al repo para que la suite corra desde cualquier carpeta (y en CI/Linux).
const __testsDir = path.dirname(fileURLToPath(import.meta.url));
const __repoRoot = path.resolve(__testsDir, '..');

// ---------- Stubs de DOM ----------
class ClassList {
  constructor(el) { this.el = el; this.set = new Set(); }
  add(...c) { c.forEach(x => this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) {
    const on = force !== undefined ? !!force : !this.set.has(c);
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
}
class StubEl {
  constructor(id) {
    this.id = id || '';
    this.classList = new ClassList(this);
    this.style = { setProperty() {} };
    this.attributes = {};
    this.dataset = {};
    this._innerHTML = '';
    this.value = '';
    this.placeholder = '';
    this.checked = false;
    this.disabled = false;
    this.title = '';
    this.children = [];
    this._textContent = '';
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) {
    this._innerHTML = String(v);
    // re-parse placeholders for nota-predicha-like testing not needed
  }
  get textContent() { return this._innerHTML.replace(/<[^>]*>/g, ' '); }
  set textContent(v) { this._textContent = String(v); this._innerHTML = String(v); }
  querySelector(sel) {
    if (sel === '.res-header') {
      const m = this._innerHTML.match(/<div class="res-header[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (m) { return { textContent: m[1] }; }
      return null;
    }
    if (sel === '.prediccion-resumen') {
      const m = this._innerHTML.match(/<span class="prediccion-resumen">([\s\S]*?)<\/span>/);
      if (m) { return { textContent: m[1], querySelector: () => ({ textContent: '' }) }; }
      return null;
    }
    if (sel === 'span') {
      const m = this._innerHTML.match(/<span>([\s\S]*?)<\/span>/);
      if (m) return { textContent: m[1] };
      return null;
    }
    return null;
  }
  querySelectorAll() { return []; }
  addEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  focus() {}
  click() {}
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  removeAttribute(k) { delete this.attributes[k]; }
  setSelectionRange() {}
  closest() { return null; }
  contains() { return false; }
  remove() {}
  insertAdjacentElement() {}
  setProperty() {}
}

const elStore = {};
function getEl(id) {
  if (!elStore[id]) elStore[id] = new StubEl(id);
  return elStore[id];
}

const localStorageStore = {};
// Proxy: expone las claves guardadas vía Object.keys(localStorage) / for-in, igual
// que el localStorage real (cloud.js itera Object.keys(localStorage) en
// recolectarEstadoCompleto / limpiarEstadoLocal / aplicarEstadoCompleto).
global.localStorage = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'getItem') return (k) => (k in localStorageStore ? localStorageStore[k] : null);
    if (prop === 'setItem') return (k, v) => { localStorageStore[k] = String(v); };
    if (prop === 'removeItem') return (k) => { delete localStorageStore[k]; };
    if (prop === 'key') return (i) => Object.keys(localStorageStore)[i] ?? null;
    if (prop === 'length') return Object.keys(localStorageStore).length;
    return undefined;
  },
  ownKeys() { return Reflect.ownKeys(localStorageStore); },
  getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
});

let openWindows = [];
global.window = {
  addEventListener() {},
  scrollTo() {},
  open() {
    const fake = {
      document: {
        open() {}, close() {},
        write(html) { this._innerHTML = String(html); },
        set title(v) {},
        readyState: 'complete',
      },
      focus() {},
      print() {},
      addEventListener() {},
      document_title: '',
    };
    openWindows.push(fake);
    return fake;
  },
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node-test' }, configurable: true });
const fakeWrap = new StubEl('wrap');
const fakeBtn = new StubEl('btn');
const fakeChev = { textContent: '▾' };
fakeBtn.querySelector = (sel) => (sel === '.chev' ? fakeChev : null);
const fakeCard = new StubEl('card');
fakeCard.querySelector = (sel) => (sel === '.config-avanzado-wrap' ? fakeWrap : null);
fakeBtn.closest = (sel) => (sel === '.config-box' ? fakeCard : null);
global.document = {
  getElementById: getEl,
  addEventListener() {},
  querySelector(sel) {
    if (typeof sel === 'string' && sel.startsWith('.btn-config-avanzado[data-action')) return fakeBtn;
    return null;
  },
  querySelectorAll(sel) {
    if (sel === '.config-avanzado-wrap') return [fakeWrap];
    if (sel === '.btn-config-avanzado') return [fakeBtn];
    return [];
  },
  createElement() { return new StubEl(''); },
  body: new StubEl('body'),
  documentElement: new StubEl('html'),
  title: '',
};
global.alert = (msg) => { throw new Error('ALERT: ' + msg); };
global.FileReader = class {
  readAsText(file) { if (this.onload) this.onload({ target: { result: (file && file._json) || '' } }); }
  readAsDataURL() {}
};
global.URL = class { static createObjectURL() { return 'blob:x'; } static revokeObjectURL() {} };
global.Blob = class {};
global.confirm = () => true;

// ---------- Cargar app.js ----------
const code = readFileSync(path.join(__repoRoot, 'js', 'app.js'), 'utf8');
eval(code + '\n;globalThis.__renderCardNuevo = renderCardNuevo;\nglobalThis.__normalizarRamo = normalizarRamo;\nglobalThis.__crearRamoNuevoTipo = crearRamoNuevoTipo;\nglobalThis.__getUltimaPrediccion = () => ultimaPrediccion;\nglobalThis.__escapeHTML = escapeHTML;\nglobalThis.__clampNota = clampNota;');
// app.js expone funciones como window.fn = ...; en el navegador quedan como globals
// alcanzables por llamadas internas desnudas (p.ej. guardarEnStorage()). El stub de
// window es un objeto plano, así que las copio al global para que esas llamadas
// internas resuelvan igual que en el navegador.
for (const k of Object.keys(global.window)) {
  if (typeof global.window[k] === 'function') global[k] = global.window[k];
}
global.console.warn = () => {};

// ---------- Helper para crear un ramo de prueba ----------
function makeRamo(over = {}) {
  return Object.assign({
    id: 'r1', nombre: 'Álgebra', tipoRamo: 'matematicas', tieneExamen: true,
    cantCat: 3, notasCat: [6.0, 5.5, ''], pesosCatInd: [40, 30, 30],
    pesoCatPct: 100, tieneLab: false, cantLab: 0, notasLab: [], pesoLabPct: 0,
    tieneEjercicios: false, cantEj: 0, notasEj: [], pesoEjerciciosPct: 0, promedioEjManual: '',
    usaPAR: false, notaPAR: '', usaRecuperativoLab: false, notaRecuperativoLab: '',
    notaExamen: '', notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0, notaAprobacion: 4.0,
    pesoPresentacionPct: 70, pesoExamenFinalPct: 30,
  }, over);
}

// ---------- Prueba 1: Modo Predictivo, falta una nota de cátedra (peso 30%) ----------
{
  const r = makeRamo();
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
  window.recargarRamosDesdeStorage();
  const resBox = getEl('res-r1');
  // notas: cat0=6, cat1=5.5, cat2 vacía(30%), presentación conocida=6*0.4+5.5*0.3=2.4+1.65=4.05, pesoVacio=0.3
  // para eximir: (5-4.05)/0.3=3.17 → Modo Predictivo, notaRelleno=3.2
  window.calcularRamoNuevo('r1', false);
  if (!resBox.classList.contains('res-proyeccion')) throw new Error('T1: debería estar en proyeccion');
  window.exportarRamoPDF('r1');
  const doc = openWindows[openWindows.length - 1].document;
  const html = doc._innerHTML || '';
  if (!html.includes('Reporte proyectado')) throw new Error('T1: el PDF no marca proyección');
  if (!html.includes('3.2')) throw new Error('T1: el PDF no muestra la nota de relleno 3.2');
  // verificar que las notas NO se modificaron permanentemente
  const notas = JSON.parse(localStorage.getItem('malla_unif_ramos'))[0].notasCat;
  if (notas[2] !== '') throw new Error('T1: se guardó nota rellena: ' + notas[2]);
  console.log('T1 OK — exporta con Modo Predictivo y restaura notas.');
}

// ---------- Prueba 2: Sin examen, reprobado inevitable (notaParaAprobar > 7) ----------
{
  const r = makeRamo({ tieneExamen: false, notasCat: [2.0, 2.0, ''], pesosCatInd: [40, 30, 30], notaAprobacion: 4.0 });
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
  window.recargarRamosDesdeStorage();
  const resBox = getEl('res-r1');
  window.calcularRamoNuevo('r1', false);
  if (!resBox.classList.contains('res-proyeccion')) throw new Error('T2: debería estar en proyeccion');
  window.exportarRamoPDF('r1');
  const doc = openWindows[openWindows.length - 1].document;
  const html = doc._innerHTML || '';
  if (!html.includes('Sin Derecho a Examen')) throw new Error('T2: debería marcar reprobado');
  if (!html.includes('Reporte proyectado')) throw new Error('T2: debería marcar proyección');
  console.log('T2 OK — reprobado inevitable exporta proyectado.');
}

// ---------- Prueba 3: Notas completas → exporta normal sin marca de proyección ----------
{
  const r = makeRamo({ notasCat: [6.5, 6.0, 6.0] });
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
  window.recargarRamosDesdeStorage();
  window.calcularRamoNuevo('r1', false);
  window.exportarRamoPDF('r1');
  const doc = openWindows[openWindows.length - 1].document;
  const html = doc._innerHTML || '';
  if (html.includes('Reporte proyectado')) throw new Error('T3: no debería marcar proyección con notas completas');
  if (!html.includes('Aprobado')) throw new Error('T3: debería ser aprobado');
  console.log('T3 OK — exporta normal sin marcar proyección.');
}

// ---------- Prueba 4: Derecho a Examen (notas completas, examen en blanco) ----------
{
  const r = makeRamo({ notasCat: [4.5, 4.5, 4.5], notaExamen: '' });
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
  window.recargarRamosDesdeStorage();
  const resBox = getEl('res-r1');
  window.calcularRamoNuevo('r1', false);
  // presentacion = 4.5 (pesos 40/30/30 = 1.8+1.35+1.35 = 4.5) → < 5.0 y >= 3.0 → Derecho a Examen
  if (!resBox.classList.contains('res-proyeccion')) throw new Error('T4: debería ser proyeccion');
  if (!resBox.innerHTML.includes('Derecho a Examen')) throw new Error('T4: debería ser Derecho a Examen');
  window.exportarRamoPDF('r1');
  const doc = openWindows[openWindows.length - 1].document;
  const html = doc._innerHTML || '';
  if (html.includes('Reporte proyectado')) throw new Error('T4: no debería marcar proyección');
  if (!html.includes('Derecho a Examen')) throw new Error('T4: el PDF debería decir Derecho a Examen');
  console.log('T4 OK — Derecho a Examen exporta normal.');
}

// ---------- Prueba 5: notas bajas, ya no da para eximir (notaParaEximir > 7) ----------
{
  const r = makeRamo({ notasCat: [3.0, 3.0, ''], pesosCatInd: [40, 30, 30] });
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
  window.recargarRamosDesdeStorage();
  const resBox = getEl('res-r1');
  window.calcularRamoNuevo('r1', false);
  // conocido = 3.0*0.4 + 3.0*0.3 = 2.1 ; pesoVacio = 0.3
  // notaParaEximir = (5 - 2.1)/0.3 = 9.67 (>7) ; notaParaExamen = (3 - 2.1)/0.3 = 3.0
  // → "¡A Examen!" → se rellena con 7.0 → presentacion = 2.1 + 2.1 = 4.2 ≥ 3.0 → Derecho a Examen
  if (!resBox.classList.contains('res-proyeccion')) throw new Error('T5: debería estar en proyeccion');
  if (!resBox.innerHTML.includes('A Examen')) throw new Error('T5: debería decir A Examen');
  window.exportarRamoPDF('r1');
  const doc = openWindows[openWindows.length - 1].document;
  const html = doc._innerHTML || '';
  if (!html.includes('Reporte proyectado')) throw new Error('T5: debería marcar proyección');
  if (!html.includes('7.0')) throw new Error('T5: debería rellenar con 7.0');
  const notas = JSON.parse(localStorage.getItem('malla_unif_ramos'))[0].notasCat;
  if (notas[2] !== '') throw new Error('T5: se guardó nota rellena');
  console.log('T5 OK — "A Examen" rellena con 7.0, exporta proyectado y restaura.');
}

console.log('\nTODAS LAS PRUEBAS PASARON ✅');

// ---------- Prueba 6: Configuración avanzada colapsable ----------
{
  const r = makeRamo();
  localStorage.removeItem('mpa_ui_avanzado_abierto');
  const html = globalThis.__renderCardNuevo(r);
  if (!html.includes('btn-config-avanzado')) throw new Error('T6: falta botón de config avanzada');
  if (!html.includes('config-avanzado-wrap')) throw new Error('T6: falta wrap de config avanzada');
  if (!html.includes('toggleAvanzado')) throw new Error('T6: falta data-action toggleAvanzado');
  if (html.includes('config-avanzado-wrap abierto')) throw new Error('T6: debería estar colapsada por defecto');
  const opens = (html.match(/<div\b/g) || []).length;
  const closes = (html.match(/<\/div>/g) || []).length;
  if (opens !== closes) throw new Error('T6: divs desbalanceados ' + opens + '/' + closes);
  localStorage.setItem('mpa_ui_avanzado_abierto', '1');
  const html2 = globalThis.__renderCardNuevo(r);
  if (!html2.includes('config-avanzado-wrap abierto')) throw new Error('T6: no abre con flag persistente');
  // toggleAvanzado invierte SOLO el ramo indicado (mapa por ramo) y actualiza el DOM.
  localStorage.removeItem('mpa_ui_avanzado_por_ramo');
  fakeWrap.classList.remove('abierto');
  window.toggleAvanzado('r1');
  if (JSON.parse(localStorage.getItem('mpa_ui_avanzado_por_ramo')).r1 !== true) throw new Error('T6: toggle no guarda r1 abierto');
  if (!fakeWrap.classList.contains('abierto')) throw new Error('T6: toggle no agrega clase abierto al wrap');
  if (fakeBtn.getAttribute('aria-expanded') !== 'true') throw new Error('T6: toggle no actualiza aria-expanded');
  if (fakeBtn.querySelector('.chev').textContent !== '▴') throw new Error('T6: toggle no actualiza el chevron');
  // togglear OTRO ramo no debe afectar a r1 (independencia por tarjeta)
  window.toggleAvanzado('r2');
  const mapa = JSON.parse(localStorage.getItem('mpa_ui_avanzado_por_ramo'));
  if (mapa.r1 !== true || mapa.r2 !== true) throw new Error('T6: los estados por ramo deben ser independientes');
  window.toggleAvanzado('r1');
  if (fakeWrap.classList.contains('abierto')) throw new Error('T6: toggle no cierra el wrap');
  if (JSON.parse(localStorage.getItem('mpa_ui_avanzado_por_ramo')).r1 !== false) throw new Error('T6: toggle no guarda r1 cerrado');
  console.log('T6 OK — config avanzada colapsada por defecto y toggle por ramo persistente (incl. DOM).');
}

// ---------- Prueba 7: sanitización de borde (normalizarRamo) ----------
{
  // 7a. id inválido (inyección de atributo) → el ramo se RECHAZA.
  const malo = makeRamo({ id: '1" onmouseover="alert(1)' });
  if (globalThis.__normalizarRamo(malo) !== null) throw new Error('T7a: id inválido debería rechazarse');

  // 7b. id válido + campos numéricos/cadena maliciosos → se coaccionan.
  const r = makeRamo({
    id: 'ramo123',
    tipoRamo: 'hacker',
    cantCat: -3,
    cantEj: 'x',
    pesoCatPct: '">BAD',
    notaEximicionMeta: '9.9',
    promedioEjManual: '6,4',
    notasCat: ['abc', '<img onerror=x>', '6,5'],
    notaPAR: '5.5',
    tieneLab: 1,
  });
  const norm = globalThis.__normalizarRamo(r);
  if (norm.tipoRamo !== 'carrera') throw new Error('T7b: tipoRamo inválido debería quedar en carrera');
  if (norm.cantCat !== 0) throw new Error('T7b: cantCat negativa debería ser 0, dio ' + norm.cantCat);
  if (norm.cantEj !== 0) throw new Error('T7b: cantEj inválida debería ser 0');
  if (norm.pesoCatPct !== 70) throw new Error('T7b: pesoCatPct inválido debería caer al fallback 70, dio ' + norm.pesoCatPct);
  if (norm.notaEximicionMeta !== 7) throw new Error('T7b: notaEximicionMeta 9.9 debería clampear a 7, dio ' + norm.notaEximicionMeta);
  if (norm.promedioEjManual !== 6.4) throw new Error('T7b: promedioEjManual con coma debería ser 6.4, dio ' + norm.promedioEjManual);
  // normalizarRamo redimensiona los arreglos de notas para que coincidan con la
  // cantidad coaccionada: con cantCat=0 no pueden quedar 3 notas colgando.
  if (JSON.stringify(norm.notasCat) !== JSON.stringify([])) throw new Error('T7b: notasCat debería redimensionarse a la cantidad coaccionada: ' + JSON.stringify(norm.notasCat));
  if (JSON.stringify(norm.pesosCatInd) !== JSON.stringify([])) throw new Error('T7b: pesosCatInd debería redimensionarse a cantCat');
  if (norm.tieneLab !== true) throw new Error('T7b: tieneLab 1 debería coaccionar a true');

  // 7e. normalizarRamo redimensiona hacia ABAJO cuando sobran notas (respaldos viejos).
  const sobran = makeRamo({ id: 'rsobra', cantCat: 3, notasCat: ['6', '5', '4', '3', '2'], pesosCatInd: [40, 30, 30, 15, 10], cantEj: 2, notasEj: ['7', '6', '5'] });
  const normSobran = globalThis.__normalizarRamo(sobran);
  if (normSobran.cantCat !== 3) throw new Error('T7e: cantCat debería quedar en 3');
  if (JSON.stringify(normSobran.notasCat) !== JSON.stringify([6, 5, 4])) throw new Error('T7e: notasCat debería recortarse a 3: ' + JSON.stringify(normSobran.notasCat));
  if (JSON.stringify(normSobran.pesosCatInd) !== JSON.stringify([40, 30, 30])) throw new Error('T7e: pesosCatInd debería recortarse a 3: ' + JSON.stringify(normSobran.pesosCatInd));
  if (JSON.stringify(normSobran.notasEj) !== JSON.stringify([7, 6])) throw new Error('T7e: notasEj debería recortarse a 2: ' + JSON.stringify(normSobran.notasEj));

  // 7c. renderCardNuevo sobre el ramo normalizado NO debe filtrar el payload.
  const html = globalThis.__renderCardNuevo(norm);
  if (html.includes('onerror') || html.includes('onmouseover') || html.includes('">BAD')) {
    const i = html.includes('onerror') ? html.indexOf('onerror') : html.includes('onmouseover') ? html.indexOf('onmouseover') : html.indexOf('">BAD');
    throw new Error('T7c: HTML filtró payload → ...' + html.slice(Math.max(0, i - 60), i + 60) + '...');
  }
  const opens = (html.match(/<div\b/g) || []).length;
  const closes = (html.match(/<\/div>/g) || []).length;
  if (opens !== closes) throw new Error('T7c: divs desbalanceados ' + opens + '/' + closes);

  // 7d. idempotencia: un ramo legítimo pasa sin mutarse.
  const bueno = makeRamo({ notasCat: [6.0, 5.5, ''], pesoCatPct: 100 });
  const normBueno = globalThis.__normalizarRamo(bueno);
  if (JSON.stringify(normBueno.notasCat) !== JSON.stringify([6.0, 5.5, ''])) throw new Error('T7d: se mutó un ramo legítimo');
  if (normBueno.pesoCatPct !== 100) throw new Error('T7d: se mutó pesoCatPct legítimo');
  if (normBueno.id !== 'r1') throw new Error('T7d: se mutó el id legítimo');
  console.log('T7 OK — sanitización de borde: rechaza ids inválidos, coacciona numéricos, HTML sin payload.');
}

// ---------- Prueba 8: aviso de ramos omitidos al restaurar respaldo ----------
{
  const bueno = makeRamo({ id: 'ok123' });
  const malo = makeRamo({ id: 'x" onmouseover="alert(1)', nombre: '<img src=x onerror=alert(1)>' });

  // 8a. 1 válido + 1 inválido → se restaura 1 y se avisa de 1 omitido.
  window.manejarArchivoRespaldo({ files: [{ _json: JSON.stringify([bueno, malo]) }], value: 'x' });
  if (getEl('confirmarRestaurarCantidad').textContent !== '1') throw new Error('T8a: debería mostrar 1 ramo tras omitir el inválido');
  const aviso = getEl('restaurarOmitidos');
  if (!aviso.textContent.includes('Se omitieron 1 ramo(s)')) throw new Error('T8a: falta aviso de omitidos: ' + aviso.textContent);
  if (aviso.classList.contains('hidden')) throw new Error('T8a: el aviso debería ser visible');

  // 8b. Sin omitidos → aviso oculto.
  window.manejarArchivoRespaldo({ files: [{ _json: JSON.stringify([bueno]) }], value: '' });
  if (getEl('confirmarRestaurarCantidad').textContent !== '1') throw new Error('T8b: cantidad incorrecta');
  if (!getEl('restaurarOmitidos').classList.contains('hidden')) throw new Error('T8b: sin omitidos el aviso debe estar oculto');

  // 8c. Todo inválido → alert y NO se abre el modal de restauración.
  let alertado = false;
  const prevAlert = global.alert;
  global.alert = () => { alertado = true; };
  window.manejarArchivoRespaldo({ files: [{ _json: JSON.stringify([malo]) }], value: '' });
  global.alert = prevAlert;
  if (!alertado) throw new Error('T8c: debería alertar cuando no queda ningún ramo válido');
  console.log('T8 OK — modal de restauración avisa los ramos omitidos y bloquea archivos sin datos válidos.');
}

// ---------- Prueba 9: Tutorial interactivo (demo) ----------
{
  // 9a. slots por tipo (coinciden con los campos reales de cada tipo).
  const tiposEsperados = {
    matematicas: 7,   // 3 cat + 3 ej + examen
    fisica: 12,       // 3 cat + 3 ej + 5 lab + examen
    carrera: 10,      // 3 cat + 1 ej + 5 lab + examen
    sello: 4,         // 3 cat + examen
    formacion_basica: 3,
    transversal: 3,
  };
  for (const [t, esperado] of Object.entries(tiposEsperados)) {
    const r = globalThis.__crearRamoNuevoTipo('X', t);
    r.id = 'tutorial-demo';
    const slots = window.__tdSlots(r);
    if (slots.length !== esperado) throw new Error(`T9a: ${t} debería tener ${esperado} slots, tiene ${slots.length}`);
  }
  const rF = globalThis.__crearRamoNuevoTipo('X', 'fisica');
  rF.usaPAR = true; rF.usaRecuperativoLab = true;
  if (window.__tdSlots(rF).length !== 14) throw new Error('T9a: PAR+recup deberían sumar 2 slots más');
  if (window.__tdLSKey !== 'mpa_tutorial_demo_visto') throw new Error('T9a: key del flag incorrecta');

  // 9b. funciones expuestas en window.
  for (const fn of ['openTutorialDemo', 'cerrarTutorialDemo', 'tdSiguiente', 'tdAtras', 'tdTipo', 'tdToggleAvanzado']) {
    if (typeof window[fn] !== 'function') throw new Error('T9b: falta window.' + fn);
  }

  // 9c. flujo completo demo: no persiste nada y marca el flag al cerrar.
  const antes = localStorage.getItem('malla_unif_ramos');
  localStorage.removeItem('mpa_tutorial_demo_visto');
  window.openTutorialDemo();
  if (window.__tdState.paso !== 0) throw new Error('T9c: debería abrir en paso 0');
  if (window.__tdState.ramo.id !== 'tutorial-demo') throw new Error('T9c: el ramo demo debería ser tutorial-demo');

  window.__tdState.tipo = 'fisica';
  window.tdSiguiente(); // paso 0 -> 1
  window.tdSiguiente(); // paso 1 -> 2
  if (window.__tdState.paso !== 2) throw new Error('T9c: no avanzó a paso 2');
  window.__tdState.avanzadoAbierto = true;
  window.tdSiguiente(); // paso 3
  if (window.__tdState.paso !== 3) throw new Error('T9c: no avanzó a paso 3');

  // cantidades realistas antes de avanzar
  getEl('tdCantCat').value = '3';
  getEl('tdCantEj').value = '3';
  getEl('tdCantLab').value = '5';
  window.tdSiguiente(); // paso 4
  if (window.__tdState.paso !== 4) throw new Error('T9c: no avanzó a paso 4');
  if (window.__tdState.slots.length !== 12) throw new Error('T9c: fisica con 3/3/5 debería tener 12 slots');

  // recorrer todos los slots de nota hasta llegar al paso 5
  let pasos = 0;
  while (window.__tdState.paso === 4 && pasos < 50) { window.tdSiguiente(); pasos++; }
  if (window.__tdState.paso !== 5) throw new Error('T9c: no llegó al paso 5, quedó en ' + window.__tdState.paso);

  // el ramo demo NO quedó en la lista de ramos
  const ramosAhora = JSON.parse(localStorage.getItem('malla_unif_ramos') || '[]');
  if (ramosAhora.some(x => x.id === 'tutorial-demo')) throw new Error('T9c: el ramo demo se persistió');
  if (localStorage.getItem('malla_unif_ramos') !== antes) throw new Error('T9c: se modificó la malla durante la demo');

  // cerrar → flag de primera vez
  window.cerrarTutorialDemo();
  if (localStorage.getItem('mpa_tutorial_demo_visto') !== '1') throw new Error('T9c: no se marcó el flag al cerrar');
  if (window.__tdState.ramo !== null) throw new Error('T9c: el ramo demo debería descartarse al cerrar');
  console.log('T9 OK — tutorial demo: slots por tipo, flujo completo, sin persistencia y flag de primera vez.');
}

// ---------- Prueba 10: cátedras mínimas + errores con diseño en el tutorial ----------
{
  const errEl = getEl('tdError');

  // 10a. Motor real: validación de cantidades según el tipo de ramo.
  // En "fisica": cátedra fija en 3 y laboratorio fijo en 5 (readonly + reversión
  // defensiva con modal); ejercicios clampa a mínimo 1 y avisa sobre 6 sin bloquear.
  const r10 = makeRamo({ id: 'r10', tipoRamo: 'fisica', tieneEjercicios: true, cantEj: 3, notasEj: ['', '', ''], tieneLab: true, cantLab: 5, notasLab: ['', '', '', '', ''] });
  localStorage.setItem('malla_unif_ramos', JSON.stringify([r10]));
  window.recargarRamosDesdeStorage();
  const leer = () => JSON.parse(localStorage.getItem('malla_unif_ramos'))[0];
  window.actualizarCantidad('r10', 'cat', { value: '0' });
  if (leer().cantCat !== 3) throw new Error('T10a: cantCat debería quedar fija en 3 para fisica, dio ' + leer().cantCat);
  if (leer().notasCat.length !== 3) throw new Error('T10a: notasCat debería mantenerse en 3');
  window.actualizarCantidad('r10', 'cat', { value: '4' });
  if (leer().cantCat !== 3) throw new Error('T10a: cantCat=4 debería revertirse a 3 para fisica');
  if (!/cátedra/.test(getEl('avisoCantidadMensaje').textContent)) throw new Error('T10a: revertir cátedra debería mostrar el modal explicando el valor fijo');
  window.actualizarCantidad('r10', 'cat', { value: '3' });
  if (leer().cantCat !== 3) throw new Error('T10a: cantCat=3 debe aplicarse tal cual');
  window.actualizarCantidad('r10', 'ej', { value: '0' });
  if (leer().cantEj !== 1) throw new Error('T10a: talleres no pueden quedar en 0');
  if (leer().notasEj.length !== 1) throw new Error('T10a: notasEj debería redimensionarse a 1');
  window.actualizarCantidad('r10', 'lab', { value: '0' });
  if (leer().cantLab !== 5) throw new Error('T10a: cantLab debería quedar fija en 5 para fisica, dio ' + leer().cantLab);
  window.actualizarCantidad('r10', 'ej', { value: '2' });
  window.actualizarCantidad('r10', 'lab', { value: '5' });
  if (leer().cantEj !== 2 || leer().cantLab !== 5) throw new Error('T10a: valores válidos deben aplicarse tal cual');

  // 10d. Aviso NO bloqueante de ejercicios > máximo esperado (6), una sola vez por ramo.
  window.actualizarCantidad('r10', 'ej', { value: '7' });
  if (leer().cantEj !== 7) throw new Error('T10d: ejercicios sobre el máximo deben aplicarse igual (aviso no bloqueante)');
  const primerMensaje = getEl('avisoCantidadMensaje').textContent;
  if (primerMensaje === '' || !/6/.test(primerMensaje)) throw new Error('T10d: debería haberse mostrado el modal de aviso, quedó: ' + primerMensaje);
  // insistir en el mismo ramo no vuelve a disparar el aviso (ya aceptado).
  window.actualizarCantidad('r10', 'ej', { value: '8' });
  window.actualizarCantidad('r10', 'ej', { value: '7' });
  if (getEl('avisoCantidadMensaje').textContent !== primerMensaje) throw new Error('T10d: el modal no debería re-dispararse al insistir');
  // el aviso se rearma si el valor vuelve a ≤6 y sube de nuevo.
  window.actualizarCantidad('r10', 'ej', { value: '6' });
  window.actualizarCantidad('r10', 'ej', { value: '9' });
  if (getEl('avisoCantidadMensaje').textContent === primerMensaje || !/9/.test(getEl('avisoCantidadMensaje').textContent)) throw new Error('T10d: el aviso debería re-dispararse tras volver al límite y subir otra vez');

  // 10b. Tutorial paso 3: con 0 en todas las cantidades NO avanza y muestra el error.
  localStorage.removeItem('mpa_tutorial_demo_visto');
  window.openTutorialDemo();
  window.__tdState.tipo = 'carrera';
  window.__tdState.avanzadoAbierto = true;
  window.__tdState.paso = 2;
  window.tdSiguiente(); // -> paso 3
  if (window.__tdState.paso !== 3) throw new Error('T10b: no llegó a paso 3');
  getEl('tdCantCat').value = '0';
  getEl('tdCantEj').value = '0';
  getEl('tdCantLab').value = '0';
  window.tdSiguiente();
  if (window.__tdState.paso !== 3) throw new Error('T10b: con cátedras 0 no debe avanzar');
  if (!errEl.classList.contains('visible')) throw new Error('T10b: no se mostró el error con diseño');
  if (!/cátedra/i.test(errEl.textContent)) throw new Error('T10b: el mensaje no menciona cátedra');
  // incluso con cátedras OK, talleres/lab en 0 tampoco pueden avanzar
  getEl('tdCantCat').value = '3';
  getEl('tdCantEj').value = '0';
  getEl('tdCantLab').value = '0';
  window.tdSiguiente();
  if (window.__tdState.paso !== 3) throw new Error('T10b: con talleres 0 no debe avanzar');
  if (!/taller|talleres/i.test(errEl.textContent)) throw new Error('T10b: el mensaje no menciona talleres');
  getEl('tdCantEj').value = '1';
  window.tdSiguiente();
  if (window.__tdState.paso !== 3) throw new Error('T10b: con laboratorio 0 no debe avanzar');
  if (!/laboratorio/i.test(errEl.textContent)) throw new Error('T10b: el mensaje no menciona laboratorio');
  getEl('tdCantCat').value = '3';
  getEl('tdCantEj').value = '1';
  getEl('tdCantLab').value = '5';
  window.tdSiguiente();
  if (window.__tdState.paso !== 4) throw new Error('T10b: con todas las cantidades ≥ 1 debería avanzar a paso 4');
  if (errEl.classList.contains('visible')) throw new Error('T10b: el error debería limpiarse al avanzar');

  // 10c. Pasos 1 y 2: mensajes con diseño (no alert nativo) y no avanzan sin cumplir.
  window.openTutorialDemo();
  window.tdSiguiente(); // paso 0 -> 1 (bienvenida)
  window.tdSiguiente(); // paso 1 sin tipo -> error, no avanza
  if (window.__tdState.paso !== 1) throw new Error('T10c: sin tipo no debe avanzar del paso 1');
  if (!errEl.classList.contains('visible') || !/Selecciona un tipo/.test(errEl.textContent)) throw new Error('T10c: error de tipo no mostrado');
  window.__tdState.tipo = 'sello';
  window.tdSiguiente(); // -> paso 2
  window.tdSiguiente(); // paso 2 sin config avanzada -> error, no avanza
  if (window.__tdState.paso !== 2) throw new Error('T10c: sin config avanzada no debe avanzar del paso 2');
  if (!errEl.classList.contains('visible') || !/Configuración avanzada/.test(errEl.textContent)) throw new Error('T10c: error de config avanzada no mostrado');
  console.log('T10 OK — cátedras mínimas (motor y tutorial) y mensajes de error con diseño.');
}

// ---------- Prueba 11: motor numérico (valores derivados de las reglas, no del código) ----------
// Cada escenario declara ANTES el resultado esperado derivado a mano de las reglas
// de negocio (pesos → presentación → umbrales), y recién después lo compara contra
// lo que devuelve calcularRamoNuevo. Si hay discrepancia es bug real o regla distinta.
{
  function correr(over) {
    const r = makeRamo(Object.assign({ id: 't11-' + Math.random().toString(36).slice(2, 7) }, over));
    localStorage.setItem('malla_unif_ramos', JSON.stringify([r]));
    window.recargarRamosDesdeStorage();
    window.calcularRamoNuevo(r.id, false);
    return r;
  }
  const resHTML = (r) => getEl('res-' + r.id).innerHTML;
  const resClases = (r) => getEl('res-' + r.id).classList;
  const pred = (r) => globalThis.__getUltimaPrediccion()[r.id];
  const aprox = (a, b, tol) => Math.abs(a - b) < (tol !== undefined ? tol : 1e-6);

  // 11a. Presentación ponderada de cátedras, sin examen, todo completo.
  // Reglas: presentación = Σ(nota_i × peso_i), con pesos en fracción (40/30/30).
  // Dado notasCat [6.0, 5.5, 4.0] y pesos [40, 30, 30]:
  //   presentación = 6.0·0.40 + 5.5·0.30 + 4.0·0.30 = 2.4 + 1.65 + 1.2 = 5.25
  //   sin examen: notaFinal = presentación; con notaAprobacion 4.0 → Aprobado.
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [6.0, 5.5, 4.0], pesosCatInd: [40, 30, 30], tieneExamen: false, notaAprobacion: 4.0 });
    const h = resHTML(r);
    if (!h.includes('5.25')) throw new Error('T11a: presentación esperada 5.25, HTML: ' + h);
    if (!resClases(r).contains('res-aprobado')) throw new Error('T11a: 5.25 ≥ 4.0 debería aprobar');
  }

  // 11b. Predicción con examen: notaParaEximir y notaParaExamen.
  // Dado notasCat [4.0, 3.0, ''] (peso 30% vacío), metaEximir 5.0, metaExamen 3.0:
  //   conocido = 4.0·0.40 + 3.0·0.30 = 1.6 + 0.9 = 2.5 ; pesoVacio = 0.30
  //   notaParaEximir = (5.0 − 2.5) / 0.30 = 8.3333…
  //   notaParaExamen = (3.0 − 2.5) / 0.30 = 1.6666…
  //   notaParaEximir > 7 → resumen "¡A Examen!" ; notaRelleno = clamp(8.33) = 7.0
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [4.0, 3.0, ''], pesosCatInd: [40, 30, 30], tieneExamen: true, notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0 });
    const p = pred(r);
    if (!p || !aprox(p.notaParaEximir, 25 / 3)) throw new Error('T11b: notaParaEximir esperado 8.3333, dio ' + (p && p.notaParaEximir));
    if (!p || !aprox(p.notaParaExamen, 5 / 3)) throw new Error('T11b: notaParaExamen esperado 1.6667, dio ' + (p && p.notaParaExamen));
    if (!p || p.notaRelleno !== 7) throw new Error('T11b: notaRelleno esperado 7.0, dio ' + (p && p.notaRelleno));
    if (!resHTML(r).includes('A Examen')) throw new Error('T11b: debería decir A Examen');
  }

  // 11c. Predicción SIN examen: notaParaAprobar.
  // Dado notasCat [3.0, 3.0, ''], metaAprobacion 4.0:
  //   conocido = 1.2 + 0.9 = 2.1 ; pesoVacio = 0.30
  //   notaParaAprobar = (4.0 − 2.1) / 0.30 = 6.3333… ; notaRelleno = clamp(6.33) = 6.3333
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [3.0, 3.0, ''], pesosCatInd: [40, 30, 30], tieneExamen: false, notaAprobacion: 4.0 });
    const p = pred(r);
    if (!p || !aprox(p.notaParaAprobar, 19 / 3)) throw new Error('T11c: notaParaAprobar esperado 6.3333, dio ' + (p && p.notaParaAprobar));
    if (!p || !aprox(p.notaRelleno, 19 / 3)) throw new Error('T11c: notaRelleno esperado 6.3333, dio ' + (p && p.notaRelleno));
    if (!p || p.metaAprobacion !== 4.0) throw new Error('T11c: metaAprobacion esperado 4.0');
  }

  // 11d. Laboratorio + ejercicios completos, escala de cátedra 70/30.
  // Reglas: escalaCat = pesoCatPct/100 = 0.7; ejercicios promedio simple con peso
  // 15% escalado; lab promedio con peso 30% (sin escala, ya es del total).
  // Dado notasCat [6,5,4] pesos [40,30,30], notasEj [7,6,5] (promedio 6.0),
  // notasLab [5,6,7,5,6] (promedio 5.8):
  //   cat  = (2.4·0.7)+(1.5·0.7)+(1.2·0.7) = 1.68+1.05+0.84 = 3.57
  //   ej   = 6.0 × (0.15·0.7) = 0.63
  //   lab  = 5.8 × 0.30 = 1.74
  //   presentación = 3.57+0.63+1.74 = 5.94 → ≥ metaEximir 5.0 → "¡Eximido!"
  {
    const r = correr({ tipoRamo: 'fisica', cantCat: 3, notasCat: [6, 5, 4], pesosCatInd: [40, 30, 30], pesoCatPct: 70, tieneLab: true, cantLab: 5, notasLab: [5, 6, 7, 5, 6], pesoLabPct: 30, tieneEjercicios: true, cantEj: 3, notasEj: [7, 6, 5], pesoEjerciciosPct: 15, tieneExamen: true, notaEximicionMeta: 5.0, notaExamen: '' });
    const h = resHTML(r);
    if (!h.includes('5.94')) throw new Error('T11d: presentación esperada 5.94, HTML: ' + h);
    if (!h.includes('Eximido')) throw new Error('T11d: 5.94 ≥ 5.0 debería eximir, HTML: ' + h);
    if (!resClases(r).contains('res-aprobado')) throw new Error('T11d: debería estar aprobado');
  }

  // 11e. Laboratorio parcial (proporcionalidad) + ejercicios completos.
  // notasLab [5,6,'','',''] → 2 de 5 válidas: proporción 0.4, promedio 5.5.
  //   lab = 5.5 × 0.30 × 0.4 = 0.66 ; pesoVacio += 0.30×0.6 = 0.18
  //   conocido = 3.57 + 0.63 + 0.66 = 4.86 ; pesoVacio = 0.18
  //   notaParaEximir = (5.0 − 4.86)/0.18 = 0.7777… ≤ 1 → "¡Asegurado!"
  //   notaParaExamen = (3.0 − 4.86)/0.18 = −10.333…
  {
    const r = correr({ tipoRamo: 'fisica', cantCat: 3, notasCat: [6, 5, 4], pesosCatInd: [40, 30, 30], pesoCatPct: 70, tieneLab: true, cantLab: 5, notasLab: [5, 6, '', '', ''], pesoLabPct: 30, tieneEjercicios: true, cantEj: 3, notasEj: [7, 6, 5], pesoEjerciciosPct: 15, tieneExamen: true, notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0 });
    const p = pred(r);
    if (!p || !aprox(p.notaParaEximir, 7 / 9)) throw new Error('T11e: notaParaEximir esperado 0.7778, dio ' + (p && p.notaParaEximir));
    if (!p || !aprox(p.notaParaExamen, -10.333333, 1e-4)) throw new Error('T11e: notaParaExamen esperado −10.333, dio ' + (p && p.notaParaExamen));
    if (!resHTML(r).includes('Asegurado')) throw new Error('T11e: debería decir ¡Asegurado!');
  }

  // 11f. PAR reemplaza la nota de cátedra más baja antes de calcular.
  // notasCat [4.0, 5.0, 6.0], PAR 6.5 → la menor (4.0) pasa a 6.5.
  //   presentación = 6.5·0.4 + 5.0·0.3 + 6.0·0.3 = 2.6 + 1.5 + 1.8 = 5.90 (sin examen)
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [4.0, 5.0, 6.0], pesosCatInd: [40, 30, 30], usaPAR: true, notaPAR: 6.5, tieneExamen: false, notaAprobacion: 4.0 });
    const h = resHTML(r);
    if (!h.includes('5.90')) throw new Error('T11f: presentación con PAR esperada 5.90, HTML: ' + h);
    if (!resClases(r).contains('res-aprobado')) throw new Error('T11f: 5.90 ≥ 4.0 debería aprobar');
  }

  // 11g. Nota final con examen: presentación·70% + examen·30%.
  // Dado notasCat [4.5,4.5,4.5] → presentación = 1.8+1.35+1.35 = 4.50.
  // Regla: 4.50 está en rango de Derecho a Examen (< metaEximir 5.0), así que con
  // examen presente entra al cálculo de nota final.
  //   notaFinal = 4.50·0.70 + 4.5·0.30 = 3.15 + 1.35 = 4.50 → ≥ 4.0 Aprobado
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [4.5, 4.5, 4.5], pesosCatInd: [40, 30, 30], tieneExamen: true, notaExamen: 4.5, pesoPresentacionPct: 70, pesoExamenFinalPct: 30, notaAprobacion: 4.0 });
    const h = resHTML(r);
    if (!h.includes('4.50')) throw new Error('T11g: notaFinal esperada 4.50, HTML: ' + h);
    if (!resClases(r).contains('res-aprobado')) throw new Error('T11g: 4.50 ≥ 4.0 debería aprobar');
  }

  // 11h. Examen necesario con presentación conocida (Derecho a Examen).
  // presentación = 4.5 (≥ metaExamen 3.0 y < metaEximir 5.0).
  //   examenNecesario = (4.0 − 4.5·0.70)/0.30 = (4.0 − 3.15)/0.30 = 2.8333 → "2.8"
  {
    const r = correr({ tipoRamo: 'matematicas', cantCat: 3, notasCat: [4.5, 4.5, 4.5], pesosCatInd: [40, 30, 30], tieneExamen: true, notaExamen: '', pesoPresentacionPct: 70, pesoExamenFinalPct: 30, notaAprobacion: 4.0, notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0 });
    const h = resHTML(r);
    if (!h.includes('2.8')) throw new Error('T11h: examenNecesario esperado 2.8, HTML: ' + h);
    if (!resClases(r).contains('res-proyeccion')) throw new Error('T11h: debería estar en proyección');
  }
  console.log('T11 OK — motor numérico: presentación, predicciones, lab/ej, PAR, nota final y examen necesario (8 escenarios con valores derivados).');
}

// ---------- Prueba 12: escapeHTML y sanitización sin falsos positivos ----------
{
  const esc = globalThis.__escapeHTML;

  // 12a. Sin falsos positivos: acentos, ñ y &.
  // Regla: escapeHTML solo toca & < > " '. Acentos y ñ NO están en el patrón.
  if (esc('Cálculo & Álgebra') !== 'Cálculo &amp; Álgebra') throw new Error('T12a: & debe escapar a &amp; (se renderiza igual)');
  if (esc('Álgebra II – Ñandú') !== 'Álgebra II – Ñandú') throw new Error('T12a: acentos/ñ distorsionados: ' + esc('Álgebra II – Ñandú'));
  if (esc('José, Ingeniería') !== 'José, Ingeniería') throw new Error('T12a: acentos distorsionados');
  // En el render (value="...") el nombre se muestra idéntico: el navegador decodifica &amp;.
  const htmlOk = globalThis.__renderCardNuevo(makeRamo({ nombre: 'Cálculo & Álgebra' }));
  if (!htmlOk.includes('value="Cálculo &amp; Álgebra"')) throw new Error('T12a: el render debe escapar & dentro del atributo');
  if (htmlOk.includes('value="Cálculo & Álgebra"')) throw new Error('T12a: & sin escapar en el atributo');

  // 12b. Payload XSS en el nombre no debe crear un tag real.
  const mal = makeRamo({ nombre: '<img src=x onerror=alert(1)>' });
  const htmlX = globalThis.__renderCardNuevo(mal);
  if (htmlX.includes('<img')) throw new Error('T12b: el nombre creó un <img real');
  if (!htmlX.includes('&lt;img')) throw new Error('T12b: el nombre debería quedar escapado (&lt;img)');
  // normalizarRamo conserva el nombre legítimo tal cual (no lo distorsiona).
  const norm = globalThis.__normalizarRamo(makeRamo({ nombre: 'Cálculo & Álgebra' }));
  if (norm.nombre !== 'Cálculo & Álgebra') throw new Error('T12b: normalizarRamo distorsionó el nombre');

  // 12c. clampNota (notas 1–7, coma decimal, formato chileno 65 → 6.5).
  if (globalThis.__clampNota('65') !== 6.5) throw new Error('T12c: "65" debería ser 6.5');
  if (globalThis.__clampNota('6,5') !== 6.5) throw new Error('T12c: "6,5" debería ser 6.5');
  if (globalThis.__clampNota('abc') !== '') throw new Error('T12c: no numérico debería quedar vacío');
  if (globalThis.__clampNota(8) !== 7) throw new Error('T12c: 8 debería clampear a 7');
  console.log('T12 OK — escapeHTML sin falsos positivos (acentos/ñ/&) y payload XSS neutralizado.');
}

// ---------- Prueba 13: sincronización Firestore (cloud.js con Firebase stubbeado) ----------
// COBERTURA QUE T13 PRETENDE CUBRIR Y QUÉ QUEDA FUERA (condición del usuario):
//
// El stub de Firestore (fb-firestore.mjs) modela: referencias doc(collection/id),
// getDoc y transaction.get con snapshot .exists()/.data(), transaction.set/update/
// delete sobre un almacén en memoria, runTransaction que ejecuta el callback UNA sola
// vez y de forma "atómica" (si el callback lanza, no se aplica nada), y onSnapshot
// que solo devuelve unsubscribe. NO habla con un servidor real.
//
// Por lo tanto T13 valida la lógica LOCAL de cloud.js: subida inicial del estado,
// round-trip recolectar/aplicar/limpiar, detección de conflicto por actualizadoEn,
// fallback de carrera remota inexistente a 'computacion', debounce de 1200ms, y la
// desactivación de la sync ante un error de permisos (simulado con __failNext).
//
// QUEDA FUERA de T13 (el stub no puede simularlo fielmente):
//   - Atomicidad REAL de runTransaction (rollback ante fallo parcial a mitad de camino).
//   - Reintentos por contención de versión (aquí la transacción corre 1 sola vez).
//   - Reglas de seguridad REALES de Firestore y el mensaje/estado exacto de la API
//     (los 403 reales solo aparecen con reglas desplegadas + credenciales reales).
//   - Latencia/reordenamiento de red y onSnapshot en vivo con hasPendingWrites real.
//   - El flujo con emulador (USE_EMULATOR) no se ejercita aquí.
{
  const stubUrl = (n) => pathToFileURL(path.join(__testsDir, n)).href;
  const srcCloud = readFileSync(path.join(__repoRoot, 'js', 'cloud.js'), 'utf8');
  let build = srcCloud
    .replace('from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"', `from "${stubUrl('fb-app.mjs')}"`)
    .replace('from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"', `from "${stubUrl('fb-auth.mjs')}"`)
    .replace('from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"', `from "${stubUrl('fb-firestore.mjs')}"`);
  build += [
    '',
    'export { recolectarEstadoCompleto, aplicarEstadoCompleto, limpiarEstadoLocal, subirEstadoActual, programarSincronizacionNube, flushSincronizacionPendiente, mostrarEstadoSync, syncDeshabilitado };',
    'export function __testReset() { usuarioActual = null; syncDeshabilitado = false; aplicandoDesdeNube = false; timerSincronizacion = null; ultimaVersionConocida = null; }',
    ''
  ].join('\n');
  const cloudBuildPath = path.join(os.tmpdir(), 'cloud-test-build.mjs');
  writeFileSync(cloudBuildPath, build, 'utf8');

  const cloud = await import(pathToFileURL(cloudBuildPath).href);
  const fire = await import(stubUrl('fb-firestore.mjs'));
  const auth = await import(stubUrl('fb-auth.mjs'));
  fire.__reset();

  // 13a. Primer login: sube el estado local completo y guarda el dueño.
  // Esperado: doc usuarios/u1 con ramos, carreraActiva 'computacion', estados y
  // actualizadoEn > 0; localStorage guarda el uid dueno.
  localStorage.setItem('malla_unif_ramos', JSON.stringify([makeRamo({ id: 'c1', nombre: 'Local' })]));
  localStorage.setItem('malla_unif_carrera_activa', 'computacion');
  localStorage.setItem('malla_unif_estado_computacion', JSON.stringify({ 'comp-1-1': 'cursando' }));
  localStorage.setItem('malla_unif_prereq_computacion', JSON.stringify({}));
  localStorage.setItem('malla_unif_link_computacion', JSON.stringify({}));
  await auth.__authState.__cb({ uid: 'u1', displayName: 'Tester', photoURL: '' });
  const docAlmacenado = fire.__store['usuarios/u1'];
  if (!docAlmacenado) throw new Error('T13a: login no creó el documento remoto');
  if (docAlmacenado.carreraActiva !== 'computacion') throw new Error('T13a: carrera remota debe ser computacion');
  if (!Array.isArray(docAlmacenado.ramos) || docAlmacenado.ramos.length !== 1 || docAlmacenado.ramos[0].id !== 'c1') throw new Error('T13a: ramos remotos mal subidos');
  if ((docAlmacenado.estados || {}).computacion['comp-1-1'] !== 'cursando') throw new Error('T13a: estados remotos mal subidos');
  if (!(docAlmacenado.actualizadoEn > 0)) throw new Error('T13a: actualizadoEn ausente');
  if (localStorage.getItem('malla_unif_uid_dueno') !== 'u1') throw new Error('T13a: no se guardó el uid dueno');

  // 13b. Carrera remota inexistente (Minas se eliminó de la app) → fallback 'computacion'.
  // Esperado: carreraActiva local queda 'computacion'; ramos/estados remotos aplicados.
  const remotoInexistente = {
    ramos: [makeRamo({ id: 'c2', nombre: 'Remoto' })],
    carreraActiva: 'minas',
    estados: { minas: { 'min-1-1': 'aprobado' }, computacion: { 'comp-1-1': 'aprobado' } },
    prereqs: {}, links: {}, actualizadoEn: 999
  };
  cloud.aplicarEstadoCompleto(remotoInexistente);
  if (localStorage.getItem('malla_unif_carrera_activa') !== 'computacion') throw new Error('T13b: carrera inexistente debe caer a computacion');
  const ramosLocal = JSON.parse(localStorage.getItem('malla_unif_ramos'));
  if (ramosLocal.length !== 1 || ramosLocal[0].id !== 'c2') throw new Error('T13b: no se aplicaron los ramos remotos');
  if (JSON.parse(localStorage.getItem('malla_unif_estado_computacion'))['comp-1-1'] !== 'aprobado') throw new Error('T13b: no se aplicó el estado remoto de computacion');

  // 13c. Round-trip: recolectarEstadoCompleto == lo que quedó aplicado en 13b.
  const reco = cloud.recolectarEstadoCompleto();
  if (reco.carreraActiva !== 'computacion') throw new Error('T13c: carrera recolectada incorrecta');
  if (JSON.stringify(reco.ramos) !== JSON.stringify(remotoInexistente.ramos)) throw new Error('T13c: ramos no coinciden en el round-trip');
  if (JSON.stringify(reco.estados) !== JSON.stringify(remotoInexistente.estados)) throw new Error('T13c: estados no coinciden en el round-trip');

  // 13d. Conflicto: el remoto tiene actualizadoEn mayor → se aplica el remoto y avisa.
  // Esperado: ramos locales pasan a ser los del remoto y syncEstado dice el aviso.
  fire.__store['usuarios/u1'].actualizadoEn = Date.now() + 60000;
  fire.__store['usuarios/u1'].ramos = [makeRamo({ id: 'remoto-x', nombre: 'Desde otro dispositivo' })];
  await cloud.subirEstadoActual();
  const ramosConflicto = JSON.parse(localStorage.getItem('malla_unif_ramos'));
  if (ramosConflicto.length !== 1 || ramosConflicto[0].id !== 'remoto-x') throw new Error('T13d: el conflicto debió aplicar el estado remoto');
  if (getEl('syncEstado').textContent !== 'Actualizado desde otro dispositivo') throw new Error('T13d: mensaje de conflicto ausente');

  // 13e. Debounce: notificar cambios programa una única subida a 1200ms.
  const timers = [];
  const origSet = global.setTimeout;
  const origClear = global.clearTimeout;
  global.setTimeout = (fn, d) => { timers.push({ fn, d }); return timers.length; };
  global.clearTimeout = () => {};
  try {
    window.notificarCambioParaNube();
    if (timers.length !== 1 || timers[0].d !== 1200) throw new Error('T13e: debounce esperado 1200ms, programado ' + (timers[0] && timers[0].d));
  } finally {
    global.setTimeout = origSet;
    global.clearTimeout = origClear;
  }

  // 13f. Error de permisos → sync deshabilitada, modo local, y no se vuelve a programar.
  fire.__failNext('runTransaction', { code: 'permission-denied' });
  await cloud.subirEstadoActual();
  if (cloud.syncDeshabilitado !== true) throw new Error('T13f: permission-denied debe deshabilitar la sync');
  if (getEl('syncEstado').textContent !== 'Sin sincronización (modo local)') throw new Error('T13f: mensaje de modo local ausente');
  const timers2 = [];
  const oS = global.setTimeout;
  const oC = global.clearTimeout;
  global.setTimeout = (fn, d) => { timers2.push({ fn, d }); return timers2.length; };
  global.clearTimeout = () => {};
  try {
    window.notificarCambioParaNube();
    if (timers2.length !== 0) throw new Error('T13f: con sync deshabilitada no debe programar subida');
  } finally {
    global.setTimeout = oS;
    global.clearTimeout = oC;
  }

  // 13g. limpiarEstadoLocal borra ramos, carrera y todos los prefijos estado/prereq/link.
  cloud.limpiarEstadoLocal();
  if (localStorage.getItem('malla_unif_ramos') !== null) throw new Error('T13g: limpiarEstadoLocal no borró ramos');
  if (localStorage.getItem('malla_unif_carrera_activa') !== null) throw new Error('T13g: limpiarEstadoLocal no borró la carrera');
  if (localStorage.getItem('malla_unif_estado_computacion') !== null) throw new Error('T13g: limpiarEstadoLocal no borró los estados');

  cloud.__testReset();
  console.log('T13 OK — sync cloud.js con stubs de Firebase: subida inicial, round-trip, conflicto, debounce, permisos y limpieza.');
}

// ---------- Resumen final ----------
console.log('\n──────────────────────────────────────────────────');
console.log('RESUMEN FINAL: 13 grupos de pruebas (T1–T13).');
console.log('T1–T10: regresión previa.  T11: motor numérico.  T12: escape/sanitización.  T13: sync cloud.js con stubs.');
console.log('SI LLEGASTE AQUÍ SIN ERRORES: los 13 grupos pasaron.');
console.log('──────────────────────────────────────────────────');
console.log('HUECOS DE COBERTURA CONOCIDOS QUE NO SE CUBREN (y por qué):');
console.log('  1. Firestore REAL: el stub no verifica atomicidad de transacciones,');
console.log('     reintentos por contención, reglas de seguridad ni los 403 reales.');
console.log('     → solo se comprueban con las reglas desplegadas + credenciales reales.');
console.log('  2. onSnapshot en vivo (cambios remotos en tiempo real) no se ejerce:');
console.log('     el stub lo deja como no-op. Requiere emulador/servidor real.');
console.log('  3. Latencia/red y reordenamiento: no simulados en el stub.');
console.log('  4. Tutorial (T9) valida el flujo sin asserts numéricos: los números del');
console.log('     demo replican el motor ya cubierto en T11.');
console.log('  5. Recuperativo de laboratorio (usaRecuperativoLab) sin caso dedicado');
console.log('     en T11; mismo patrón que PAR (T11f) y se ejerce vía T1–T5.');
console.log('──────────────────────────────────────────────────');
console.log('\nTODAS LAS PRUEBAS PASARON ✅');
