(function () {
    const ua = navigator.userAgent || '';
    const esNavegadorIntegrado = /(WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|Twitter)/i.test(ua)
        || (/; wv\)/i.test(ua)); // marca típica de WebView de Android embebido en otra app

    if (esNavegadorIntegrado) {
        document.addEventListener('DOMContentLoaded', () => {
            const overlay = document.getElementById('loginOverlay');
            const cardNormal = document.getElementById('loginCardNormal');
            const cardAviso = document.getElementById('loginCardNavegadorInterno');
            if (overlay) overlay.style.display = 'flex';
            if (cardNormal) cardNormal.style.display = 'none';
            if (cardAviso) cardAviso.style.display = 'block';
        });
    }

    window.abrirEnNavegadorReal = function () {
        const url = window.location.href;
        const esIOS = /iPhone|iPad|iPod/i.test(ua);
        if (esIOS) {
            // Este esquema fuerza la apertura en Safari incluso desde dentro de otra app en iOS.
            window.location.href = url.replace(/^https:\/\//i, 'x-safari-https://');
        } else {
            // En Android, intenta forzar la apertura en Chrome específicamente.
            const sinEsquema = url.replace(/^https?:\/\//i, '');
            window.location.href = 'intent://' + sinEsquema + '#Intent;scheme=https;package=com.android.chrome;end';
        }
    };
})();

/* ======================================================================
   PARTE 1 — DATOS Y LÓGICA DE LA MALLA CURRICULAR
   ====================================================================== */
// Recuerda, por ramo, si el usuario expandió manualmente el cuadro de
// "Modo Predictivo" (colapsado por defecto para no ser invasivo mientras escribe).
let prediccionExpandida = {};
window.togglePrediccion = (id, event) => {
    if (event) event.stopPropagation();
    const resBox = document.getElementById(`res-${id}`);
    if (!resBox || !resBox.classList.contains('res-proyeccion')) return; // solo colapsa/expande en modo predictivo
    prediccionExpandida[id] = !prediccionExpandida[id];
    window.calcularRamoNuevo(id, true);
};
function ramo(id, nombre) { return { id, nombre }; }

const CARRERAS = {
    sin_asignar: { nombre: 'Sin asignar', semestres: [] },
    computacion: {
        nombre: 'Ingeniería Civil en Computación e Informática',
        semestres: [
            [ramo('comp-1-1','Introducción a las Matemáticas'), ramo('comp-1-2','Introducción a la Física'), ramo('comp-1-3','Introducción a la Ingeniería en Computación e Informática'), ramo('comp-1-4','Formación Básica para la Vida Académica I'), ramo('comp-1-5','Curso Sello Institucional I: Inglés I')],
            [ramo('comp-2-1','Álgebra I'), ramo('comp-2-2','Cálculo I'), ramo('comp-2-3','Mecánica'), ramo('comp-2-4','Formación Básica para la Vida Académica II'), ramo('comp-2-5','Curso Sello Institucional II: Inglés II')],
            [ramo('comp-3-1','Álgebra II'), ramo('comp-3-2','Cálculo II'), ramo('comp-3-3','Electricidad y Magnetismo'), ramo('comp-3-4','Programación Computacional'), ramo('comp-3-5','Inglés Comunicacional'), ramo('comp-3-6','Curso Sello Institucional III')],
            [ramo('comp-4-1','Ecuaciones Diferenciales'), ramo('comp-4-2','Cálculo III'), ramo('comp-4-3','Ondas, Óptica y Calor'), ramo('comp-4-4','Programación Orientada a Objetos'), ramo('comp-4-5','Taller Integrador I'), ramo('comp-4-6','Curso Sello Institucional IV')],
            [ramo('comp-5-1','Probabilidad y Estadística'), ramo('comp-5-2','Química General'), ramo('comp-5-3','Arquitectura de Computadores'), ramo('comp-5-4','Estructura de Datos'), ramo('comp-5-5','Administración'), ramo('comp-5-6','Interdisciplinar')],
            [ramo('comp-6-1','Métodos Estadísticos'), ramo('comp-6-2','Fundamentos de Economía'), ramo('comp-6-3','Sistemas Operativos'), ramo('comp-6-4','Bases de Datos'), ramo('comp-6-5','Complejidad de Algoritmos'), ramo('comp-6-6','Interdisciplinar A+S')],
            [ramo('comp-7-1','Investigación Operativa'), ramo('comp-7-2','Contabilidad y Costos'), ramo('comp-7-3','Redes de Datos y Sistemas Distribuidos'), ramo('comp-7-4','Tópicos Avanzados de Datos'), ramo('comp-7-5','Análisis y Diseño de Sistemas de Información')],
            [ramo('comp-8-1','Evaluación de Proyectos'), ramo('comp-8-2','Ciberseguridad'), ramo('comp-8-3','Automatización'), ramo('comp-8-4','Minería de Datos'), ramo('comp-8-5','Ingeniería de Software'), ramo('comp-8-6','Taller Integrador II')],
            [ramo('comp-9-1','Innovación y Emprendimiento'), ramo('comp-9-2','Tecnologías Emergentes'), ramo('comp-9-3','Inteligencia Artificial'), ramo('comp-9-4','Proyecto Big Data'), ramo('comp-9-5','Gestión de Calidad de Software'), ramo('comp-9-6','Práctica Operacional')],
            [ramo('comp-10-1','Proyecto de Título I'), ramo('comp-10-2','Sistemas Inteligentes'), ramo('comp-10-3','Ingeniería y Gobierno de Datos'), ramo('comp-10-4','Dirección y Evaluación de Proyectos Informáticos')],
            [ramo('comp-11-1','Proyecto de Título II'), ramo('comp-11-2','Gestión y Planificación Estratégica'), ramo('comp-11-3','Proyecto de Informática'), ramo('comp-11-4','Práctica Profesional')]
        ]
    },
    minas: {
        nombre: 'Ingeniería Civil en Minas',
        semestres: [
            [ramo('minas-1-1','Introducción a las Matemáticas'), ramo('minas-1-2','Introducción a la Física'), ramo('minas-1-3','Introducción a la Ingeniería de Minas'), ramo('minas-1-4','Formación Básica para la Vida Académica I'), ramo('minas-1-5','Curso Sello Institucional I: Inglés I')],
            [ramo('minas-2-1','Álgebra I'), ramo('minas-2-2','Cálculo I'), ramo('minas-2-3','Mecánica'), ramo('minas-2-4','Formación Básica para la Vida Académica II'), ramo('minas-2-5','Curso Sello Institucional II: Inglés II')],
            [ramo('minas-3-1','Álgebra II'), ramo('minas-3-2','Cálculo II'), ramo('minas-3-3','Química General'), ramo('minas-3-4','Geología General'), ramo('minas-3-5','TIC para la Minería'), ramo('minas-3-6','Curso Sello Institucional III')],
            [ramo('minas-4-1','Ecuaciones Diferenciales'), ramo('minas-4-2','Cálculo III'), ramo('minas-4-3','Electricidad y Magnetismo'), ramo('minas-4-4','Métodos de Producción Minera'), ramo('minas-4-5','Petrografía y Mineralogía'), ramo('minas-4-6','Curso Sello Institucional IV')],
            [ramo('minas-5-1','Probabilidad y Estadística'), ramo('minas-5-2','Fundamentos de Economía'), ramo('minas-5-3','Investigación Operativa'), ramo('minas-5-4','Termodinámica'), ramo('minas-5-5','Métodos Numéricos'), ramo('minas-5-6','Topografía y Geomensura Minera')],
            [ramo('minas-6-1','Geoestadística'), ramo('minas-6-2','Evaluación de Proyectos'), ramo('minas-6-3','Exploración y Geología Económica'), ramo('minas-6-4','Perforación y Tronadura'), ramo('minas-6-5','Taller Integrador I'), ramo('minas-6-6','Interdisciplinar')],
            [ramo('minas-7-1','Evaluación Económica de Yacimientos'), ramo('minas-7-2','Mecánica de Fluidos'), ramo('minas-7-3','Fundamentos de Metalurgia'), ramo('minas-7-4','Carguío y Transporte'), ramo('minas-7-5','Mecánica de Rocas'), ramo('minas-7-6','Interdisciplinar A+S')],
            [ramo('minas-8-1','Software de Productividad Minera'), ramo('minas-8-2','Ventilación y Servicios Mina'), ramo('minas-8-3','Procesamiento de Minerales'), ramo('minas-8-4','Legislación Minera'), ramo('minas-8-5','Seguridad y Medio Ambiente en Minería'), ramo('minas-8-6','Taller Integrador II'), ramo('minas-8-7','Práctica Operacional')],
            [ramo('minas-9-1','Proyecto de Título I'), ramo('minas-9-2','Gestión de Empresas y Liderazgo en Minería'), ramo('minas-9-3','Diseño y Planificación Mina Subterránea'), ramo('minas-9-4','Diseño y Planificación Rajo Abierto'), ramo('minas-9-5','Excelencia Operacional')],
            [ramo('minas-10-1','Proyecto de Título II'), ramo('minas-10-2','Gestión de la Tecnología en Minería'), ramo('minas-10-3','Responsabilidad Social Empresarial en Minería'), ramo('minas-10-4','Innovación y Emprendimiento en Minería'), ramo('minas-10-5','Práctica Profesional')]
        ]
    }
};

const LS_CARRERA = 'malla_unif_carrera_activa';
const LS_PREFIX_ESTADO = 'malla_unif_estado_';
const LS_PREFIX_PREREQ = 'malla_unif_prereq_';
const LS_PREFIX_LINK = 'malla_unif_link_'; // ramoMallaId -> id de la tarjeta real en "Mis Ramos"

let carreraActiva = localStorage.getItem(LS_CARRERA) || 'sin_asignar';
let modoPrereq = false;
let prereqEditandoId = null;

function cargarJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
}
function esClaveSincronizableNube(key) {
    return key === LS_RAMOS || key === LS_CARRERA ||
        key.startsWith(LS_PREFIX_ESTADO) || key.startsWith(LS_PREFIX_PREREQ) || key.startsWith(LS_PREFIX_LINK);
}
function guardarJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (esClaveSincronizableNube(key) && window.notificarCambioParaNube) window.notificarCambioParaNube();
}

function getEstado(carreraId) { return cargarJSON(LS_PREFIX_ESTADO + carreraId, {}); }
function setEstado(carreraId, obj) { guardarJSON(LS_PREFIX_ESTADO + carreraId, obj); }
function getLink(carreraId) { return cargarJSON(LS_PREFIX_LINK + carreraId, {}); }
function setLink(carreraId, obj) { guardarJSON(LS_PREFIX_LINK + carreraId, obj); }

const PREREQ_DEFAULT = {
    computacion: {
        'comp-2-1': ['comp-1-1'], 'comp-3-1': ['comp-2-1'], 'comp-3-2': ['comp-2-2'],
        'comp-4-2': ['comp-3-2'], 'comp-4-1': ['comp-3-2'], 'comp-5-1': ['comp-4-2'],
        'comp-2-3': ['comp-1-2'], 'comp-3-3': ['comp-2-3'], 'comp-4-3': ['comp-3-3'],
        'comp-3-4': ['comp-1-3'], 'comp-4-4': ['comp-3-4'], 'comp-5-4': ['comp-4-4'],
        'comp-2-4': ['comp-1-4'], 'comp-6-1': ['comp-5-1'], 'comp-7-1': ['comp-6-1'],
        'comp-8-1': ['comp-7-1'], 'comp-6-3': ['comp-5-3'], 'comp-7-3': ['comp-6-3'],
        'comp-7-4': ['comp-6-4'], 'comp-8-4': ['comp-7-4'], 'comp-9-4': ['comp-8-4']
    }
};
function getPrereq(carreraId) {
    const guardado = localStorage.getItem(LS_PREFIX_PREREQ + carreraId);
    if (guardado) return JSON.parse(guardado);
    return PREREQ_DEFAULT[carreraId] ? JSON.parse(JSON.stringify(PREREQ_DEFAULT[carreraId])) : {};
}
function setPrereq(carreraId, obj) { guardarJSON(LS_PREFIX_PREREQ + carreraId, obj); }

/* ---- Tema ---- */
function actualizarIconoTema() {
    const btn = document.getElementById('temaToggleBtn');
    const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = oscuro ? '🌙' : '☀️';
}
window.toggleTema = () => {
    const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    if (oscuro) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('malla_unif_tema', 'light'); }
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('malla_unif_tema', 'dark'); }
    actualizarIconoTema();
};
actualizarIconoTema();

/* ---- Tabs ---- */
window.cambiarTab = (tab) => {
    document.getElementById('panel-malla').classList.toggle('activo', tab === 'malla');
    document.getElementById('panel-ramos').classList.toggle('activo', tab === 'ramos');
    document.getElementById('tabBtnMalla').classList.toggle('activo', tab === 'malla');
    document.getElementById('tabBtnRamos').classList.toggle('activo', tab === 'ramos');
};

window.irARamo = (cardId) => {
    cambiarTab('ramos');
    setTimeout(() => {
        const el = document.getElementById('card-' + cardId);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('resaltado');
        setTimeout(() => el.classList.remove('resaltado'), 2200);
    }, 60);
};

/* ---- Selector de carrera ---- */
const selectCarrera = document.getElementById('selectCarrera');
Object.keys(CARRERAS).forEach(id => {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = CARRERAS[id].nombre;
    selectCarrera.appendChild(opt);
});
selectCarrera.value = carreraActiva;
selectCarrera.onchange = () => {
    carreraActiva = selectCarrera.value;
    localStorage.setItem(LS_CARRERA, carreraActiva);
    if (window.notificarCambioParaNube) window.notificarCambioParaNube();
    modoPrereq = false;
    prereqEditandoId = null;
    document.getElementById('prereqModal').style.display = 'none';
    renderMalla();
};

/* ---- Prerrequisitos ---- */
function ramosAnteriores(carreraId, semestreIdx) {
    const carrera = CARRERAS[carreraId];
    let out = [];
    for (let i = 0; i < semestreIdx; i++) out = out.concat(carrera.semestres[i]);
    return out;
}
function prereqsCumplidos(carreraId, ramoId) {
    const prereq = getPrereq(carreraId)[ramoId] || [];
    if (prereq.length === 0) return true;
    const estado = getEstado(carreraId);
    return prereq.every(pid => estado[pid] === 'aprobado');
}
function nombresPrereqFaltantes(carreraId, ramoId) {
    const prereq = getPrereq(carreraId)[ramoId] || [];
    const estado = getEstado(carreraId);
    const todos = CARRERAS[carreraId].semestres.flat();
    return prereq.filter(pid => estado[pid] !== 'aprobado').map(pid => (todos.find(r => r.id === pid) || {}).nombre || pid);
}
function togglePrereq(carreraId, ramoId, prereqId) {
    const prereq = getPrereq(carreraId);
    const actual = prereq[ramoId] || [];
    const idx = actual.indexOf(prereqId);
    if (idx >= 0) actual.splice(idx, 1); else actual.push(prereqId);
    prereq[ramoId] = actual;
    setPrereq(carreraId, prereq);
    renderPrereqModalLista(carreraId, ramoId);
    renderMalla();
}

function semestreIdxDeRamo(carreraId, ramoId) {
    const carrera = CARRERAS[carreraId];
    return carrera.semestres.findIndex(sem => sem.some(r => r.id === ramoId));
}

function renderPrereqModalLista(carreraId, ramoId) {
    const semestreIdx = semestreIdxDeRamo(carreraId, ramoId);
    const candidatos = ramosAnteriores(carreraId, semestreIdx);
    const prereqActual = getPrereq(carreraId)[ramoId] || [];
    const lista = document.getElementById('prereqModalLista');
    if (candidatos.length === 0) {
        lista.innerHTML = `<div class="prereq-modal-vacio">No hay ramos de semestres anteriores.</div>`;
        return;
    }
    lista.innerHTML = candidatos.map(c => {
        const marcado = prereqActual.includes(c.id);
        return `<label><input type="checkbox" ${marcado ? 'checked' : ''} onchange="togglePrereq('${carreraId}','${ramoId}','${c.id}')"> ${c.nombre}</label>`;
    }).join('');
}

window.abrirPrereqModal = (carreraId, ramoId) => {
    prereqEditandoId = ramoId;
    const nombreRamo = (CARRERAS[carreraId].semestres.flat().find(r => r.id === ramoId) || {}).nombre || '';
    document.getElementById('prereqModalTitulo').textContent = nombreRamo;
    renderPrereqModalLista(carreraId, ramoId);
    document.getElementById('prereqModal').style.display = 'flex';
};

window.cerrarPrereqModal = (event) => {
    if (event && event.target.id !== 'prereqModal') return;
    document.getElementById('prereqModal').style.display = 'none';
    prereqEditandoId = null;
};

/* ---- Marcar estado + conexión con el motor de cálculo real ---- */
function marcarEstado(carreraId, ramoId, nuevoEstado) {
    const estado = getEstado(carreraId);
    estado[ramoId] = nuevoEstado;
    setEstado(carreraId, estado);

    const link = getLink(carreraId);

    if (nuevoEstado === 'cursando') {
        if (!link[ramoId]) {
            const nombreRamo = (CARRERAS[carreraId].semestres.flat().find(r => r.id === ramoId) || {}).nombre || '';
            const nuevaTarjeta = crearRamoNuevoTipo(nombreRamo, 'carrera');
            ramos.push(nuevaTarjeta);
            link[ramoId] = nuevaTarjeta.id;
            setLink(carreraId, link);
            guardarEnStorage();
        }
    } else if (link[ramoId]) {
        ramos = ramos.filter(r => r.id !== link[ramoId]);
        delete link[ramoId];
        setLink(carreraId, link);
        guardarEnStorage();
    }

    renderMalla();
    renderRamos();
}
function revertirAPendiente(carreraId, ramoId) { marcarEstado(carreraId, ramoId, 'pendiente'); }

function handleChipClick(carreraId, ramoId) {
    if (modoPrereq) {
        abrirPrereqModal(carreraId, ramoId);
        return;
    }
    const estado = getEstado(carreraId);
    const est = estado[ramoId] || 'pendiente';
    if (est === 'pendiente') marcarEstado(carreraId, ramoId, 'cursando');
    else if (est === 'cursando') marcarEstado(carreraId, ramoId, 'aprobado');
    else revertirAPendiente(carreraId, ramoId);
}

document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-action]');
    if (el) {
        const raw = el.getAttribute('data-action') || '';
        const [action, paramStr] = raw.split(':');
        const params = paramStr ? paramStr.split(',').map(p => decodeURIComponent(p)) : [];

        // small helpers and common cases
        switch (action) {
            case 'stop-prop': e.stopPropagation(); break;
            case 'overlay-click': {
                const target = el.getAttribute('data-target');
                if (e.target && e.target.id === target) closeModal(target);
                break;
            }
            case 'open-malla-modal': e.preventDefault(); openModal('mallaOficialModal'); break;
            case 'open-tutorial': openModal('tutorialModal'); break;
            case 'open-help': openModal('guiaModal'); break;
            case 'close-tutorial': closeModal('tutorialModal'); break;
            case 'close-malla-modal': closeModal('mallaOficialModal'); break;
            case 'toggleTema': if (typeof window.toggleTema === 'function') window.toggleTema(); break;
            case 'iniciarSesionConGoogle': if (typeof window.iniciarSesionConGoogle === 'function') window.iniciarSesionConGoogle(); break;
            case 'abrirEnNavegadorReal': if (typeof window.abrirEnNavegadorReal === 'function') window.abrirEnNavegadorReal(); break;
            case 'descargarRespaldo': if (typeof window.descargarRespaldo === 'function') window.descargarRespaldo(); break;
            case 'activarInputRespaldo': if (typeof window.activarInputRespaldo === 'function') window.activarInputRespaldo(); break;
            case 'cerrar-confirmar-eliminar': if (typeof window.cerrarConfirmarEliminarModal === 'function') window.cerrarConfirmarEliminarModal(); break;
            case 'confirmar-eliminar-ramo': if (typeof window.confirmarEliminarRamo === 'function') window.confirmarEliminarRamo(); break;
            case 'cerrar-confirmar-restaurar': if (typeof window.cerrarConfirmarRestaurarModal === 'function') window.cerrarConfirmarRestaurarModal(); break;
            case 'confirmar-restaurar-respaldo': if (typeof window.confirmarRestaurarRespaldo === 'function') window.confirmarRestaurarRespaldo(); break;
            case 'cerrar-prereq': if (typeof window.cerrarPrereqModal === 'function') window.cerrarPrereqModal(); break;
            default:
                // generic: call a global function if exists
                if (action && typeof window[action] === 'function') {
                    try { window[action](...params); } catch (err) { console.error('action handler error', action, err); }
                }
        }
        return;
    }

    // legacy button outside delegation (toggle prerreq by id)
    if (e.target && e.target.id === 'btnPrereq') {
        modoPrereq = !modoPrereq;
        prereqEditandoId = null;
        document.getElementById('prereqModal').style.display = 'none';
        renderMalla();
    }
});

// Modal helpers: apertura, cierre y focus-trap para accesibilidad
// Cierra cualquier modal visible con la tecla Escape (accesibilidad de teclado).
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        if (getComputedStyle(overlay).display !== 'none') closeModal(overlay.id);
    });
});

const _modalState = new Map();

function getFocusableElements(container) {
    return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(el => el.offsetParent !== null);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const content = modal.querySelector('.modal-content') || modal.firstElementChild;
    if (!content) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    content.setAttribute('tabindex', '-1');

    // save last focused element to restore later
    const last = document.activeElement;
    _modalState.set(modalId, { lastActive: last });

    // make background inert for accessibility
    Array.from(document.body.children).forEach(el => { if (el === modal) return; el.setAttribute('inert', ''); });

    // focus first focusable inside modal or the content wrapper
    const focusables = getFocusableElements(modal);
    if (focusables.length) focusables[0].focus(); else content.focus();

    // trap Tab navigation inside modal
    const trap = function (ev) {
        if (ev.key !== 'Tab') return;
        const nodes = getFocusableElements(modal);
        if (!nodes.length) { ev.preventDefault(); return; }
        const idx = nodes.indexOf(document.activeElement);
        if (ev.shiftKey) {
            if (idx === 0) { nodes[nodes.length - 1].focus(); ev.preventDefault(); }
        } else {
            if (idx === nodes.length - 1) { nodes[0].focus(); ev.preventDefault(); }
        }
    };
    modal._trap = trap;
    modal.addEventListener('keydown', trap);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');

    // restore background interactivity
    Array.from(document.body.children).forEach(el => { if (el === modal) return; el.removeAttribute('inert'); });

    const state = _modalState.get(modalId);
    if (state && state.lastActive) {
        try { state.lastActive.focus(); } catch (e) {}
    }
    _modalState.delete(modalId);

    if (modal._trap) { modal.removeEventListener('keydown', modal._trap); delete modal._trap; }
}

/* ---- Render de la malla ---- */
const contenidoMalla = document.getElementById('contenidoMalla');

function estadoResumenRamo(ramoId) {
    const ramoCard = ramos.find(r => r.id === ramoId);
    if (!ramoCard) return { texto: 'Sin notas aún', clase: 'vacio' };
    const el = document.createElement('div'); // caja temporal invisible para reutilizar calcularRamoNuevo sin tocar el DOM real
    return null; // no se usa; el resumen real se calcula al vuelo en renderCursandoLista()
}

function renderMalla() {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const gridEl = contenidoMalla.querySelector('.malla-grid');
    const gridScrollLeft = gridEl ? gridEl.scrollLeft : 0;

    _renderMallaInterno();

    window.scrollTo({ top: scrollY, left: scrollX, behavior: 'instant' });
    const nuevoGridEl = contenidoMalla.querySelector('.malla-grid');
    if (nuevoGridEl) nuevoGridEl.scrollLeft = gridScrollLeft;

    alinearFilasMalla();
    configurarScrollHintMalla();
    observarResizeMalla();
}

// Muestra un aviso de "desliza para ver más" y un fade lateral mientras quede contenido
// horizontal sin ver en la malla; ambos se ocultan automáticamente al llegar al final.
function configurarScrollHintMalla() {
    const gridEl = contenidoMalla.querySelector('.malla-grid');
    const wrapEl = contenidoMalla.querySelector('.malla-grid-wrap');
    const hintEl = contenidoMalla.querySelector('.malla-scroll-hint');
    if (!gridEl || !wrapEl || !hintEl) return;

    const actualizar = () => {
        const alFinal = gridEl.scrollLeft + gridEl.clientWidth >= gridEl.scrollWidth - 4;
        const hayOverflow = gridEl.scrollWidth > gridEl.clientWidth + 4;
        wrapEl.classList.toggle('scroll-end', alFinal || !hayOverflow);
        hintEl.classList.toggle('oculto', alFinal || !hayOverflow);
    };
    gridEl.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    actualizar();
}

// Iguala la altura de todos los ramo-chip que comparten la misma posición de fila
// entre columnas de semestre, para que la malla quede alineada como una tabla (igual que el PDF oficial).
function alinearFilasMalla() {
    const gridEl = contenidoMalla.querySelector('.malla-grid');
    if (!gridEl) return;
    const columnas = Array.from(gridEl.querySelectorAll('.semestre-col'));
    if (!columnas.length) return;

    // Reset de alturas antes de medir
    columnas.forEach(col => {
        col.querySelectorAll('.ramo-chip').forEach(chip => { chip.style.height = ''; });
    });

    const maxFilas = Math.max(...columnas.map(col => col.querySelectorAll('.ramo-chip-slot').length));

    for (let fila = 0; fila < maxFilas; fila++) {
        let maxAlto = 0;
        columnas.forEach(col => {
            const slots = col.querySelectorAll('.ramo-chip-slot');
                const chip = slots[fila] ? slots[fila].querySelector('.ramo-chip') : null;
            if (chip) maxAlto = Math.max(maxAlto, chip.getBoundingClientRect().height);
        });
        if (maxAlto > 0) {
            columnas.forEach(col => {
                const slots = col.querySelectorAll('.ramo-chip-slot');
                const chip = slots[fila] ? slots[fila].querySelector('.ramo-chip') : null;
                if (chip) chip.style.height = maxAlto + 'px';
            });
        }
    }
}

window.addEventListener('resize', () => { if (contenidoMalla.querySelector('.malla-grid')) alinearFilasMalla(); });

// Set dynamic year (moved here to avoid inline script and allow CSP)
document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('anioActual');
    if (el) el.textContent = new Date().getFullYear();
});

// Las tipografías (Barlow Condensed / Inter) se cargan de forma asíncrona desde Google Fonts.
// Si alinearFilasMalla() mide las alturas ANTES de que terminen de cargar, el texto puede
// re-envolverse a otra cantidad de líneas una vez la fuente real reemplaza a la de respaldo,
// dejando la tabla descuadrada un rato después (el "tiempo no calculado" que se observaba).
// Recalculamos apenas las fuentes están listas, y de nuevo con un pequeño colchón por si acaso.
if (window.document && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        if (contenidoMalla.querySelector('.malla-grid')) alinearFilasMalla();
    });
}

// Refuerzo: si el tamaño de cualquier chip cambia por cualquier motivo (fuente, zoom,
// contenido dinámico), volvemos a alinear las filas automáticamente sin esperar un resize
// de ventana. Usamos ResizeObserver sobre la grilla completa, con un debounce simple para
// no entrar en bucle (alinearFilasMalla también modifica alturas de chips).
let _resizeObsMalla = null;
let _alineandoMalla = false;
function observarResizeMalla() {
    const gridEl = contenidoMalla.querySelector('.malla-grid');
    if (!gridEl) return;
    if (_resizeObsMalla) _resizeObsMalla.disconnect();
    let pendiente = null;
    _resizeObsMalla = new ResizeObserver(() => {
        if (_alineandoMalla) return; // evita loop causado por los propios cambios de altura
        clearTimeout(pendiente);
        pendiente = setTimeout(() => {
            _alineandoMalla = true;
            alinearFilasMalla();
            requestAnimationFrame(() => { _alineandoMalla = false; });
        }, 120);
    });
    gridEl.querySelectorAll('.ramo-chip').forEach(chip => _resizeObsMalla.observe(chip));
}

function _renderMallaInterno() {
    const carrera = CARRERAS[carreraActiva];

    if (carreraActiva === 'sin_asignar') {
        contenidoMalla.innerHTML = `
            <div class="empty-state">
                <div class="icono">🧭</div>
                <h3>Todavía no elegiste tu carrera</h3>
                <p>Selecciona una carrera arriba para ver tu malla completa y empezar a registrar tu avance.</p>
            </div>`;
        return;
    }
    if (carrera.pendiente) {
        contenidoMalla.innerHTML = `<div class="malla-pendiente">📄 Todavía no tengo la malla oficial de <b>${carrera.nombre}</b> cargada. Pasa el PDF de la malla y se agrega igual que se hizo con Computación e Informática.</div>`;
        return;
    }

    const estado = getEstado(carreraActiva);
    const link = getLink(carreraActiva);
    const todos = carrera.semestres.flat();
    const totalRamos = todos.length;
    const aprobados = todos.filter(r => estado[r.id] === 'aprobado').length;
    const cursando = todos.filter(r => estado[r.id] === 'cursando').length;
    const reprobados = todos.filter(r => estado[r.id] === 'reprobado').length;
    const pendientes = totalRamos - aprobados - cursando - reprobados;
    const pct = totalRamos ? Math.round((aprobados / totalRamos) * 100) : 0;

    let html = `
        <div class="progreso-card">
            <div class="progreso-header"><h2>Avance de carrera</h2><div class="progreso-pct">${pct}%</div></div>
            <div class="progreso-barra"><div class="progreso-barra-fill" data-pct="${pct}"></div></div>
            <div class="progreso-stats">
                <span><span class="dot dot-success"></span><b>${aprobados}</b> aprobados</span>
                <span><span class="dot dot-accent"></span><b>${cursando}</b> cursando</span>
                <span><span class="dot dot-faint"></span><b>${pendientes}</b> pendientes</span>
                <span>de <b>${totalRamos}</b> ramos totales</span>
            </div>
        </div>

            <div class="toolbar">
            <span class="small-muted-text">🔗 Prerrequisitos precargados desde tu malla 2025. Los que tenían flechas cruzadas quedaron sin cargar — <a href="#" class="link-malla-oficial" data-action="open-malla-modal">revísalos aquí</a>.</span>
            <button class="btn-prereq ${modoPrereq ? 'activo' : ''}" id="btnPrereq">${modoPrereq ? '✓ Listo — salir de edición' : '✏️ Editar prerrequisitos'}</button>
        </div>

        <div class="leyenda-click">
            ${modoPrereq ? '💡 Modo prerrequisitos: toca un ramo para elegir qué otros ramos anteriores necesita.'
                : '💡 Toca un ramo para avanzar su estado: pendiente → cursando → aprobado. Vuelve a tocarlo para reiniciarlo.'}
        </div>
    `;

    const maxRamosPorSemestre = Math.max(...carrera.semestres.map(rs => rs.length));
    html += `<div class="malla-scroll-hint">→ desliza para ver más semestres</div>`;
    html += `<div class="malla-grid-wrap"><div class="malla-grid">`;
    carrera.semestres.forEach((ramosSemestre, idx) => {
        const semestreNum = idx + 1;
        const apr = ramosSemestre.filter(r => estado[r.id] === 'aprobado').length;
        html += `<div class="semestre-col"><div class="semestre-col-head">Semestre ${semestreNum}<span class="mini">${apr}/${ramosSemestre.length}</span></div>`;

            ramosSemestre.forEach(r => {
            const est = estado[r.id] || 'pendiente';
            const cumplePrereq = prereqsCumplidos(carreraActiva, r.id);
            const faltantes = nombresPrereqFaltantes(carreraActiva, r.id);
            const bloqueado = est === 'pendiente' && !cumplePrereq;
            const claseEstado = bloqueado ? '' : est;
            const editando = modoPrereq && prereqEditandoId === r.id;
            const icono = bloqueado ? '🔒' : (est === 'pendiente' ? '○' : est === 'cursando' ? '▶' : est === 'aprobado' ? '✓' : '✕');
            const tituloTip = bloqueado ? `Requiere aprobar: ${faltantes.join(', ')}` : r.nombre;

            html += `<div class="ramo-chip-slot"><button type="button" class="ramo-chip ${claseEstado} ${editando ? 'editando' : ''}"
                        ${(bloqueado && !modoPrereq) ? 'disabled' : ''} title="${tituloTip}"
                        data-action="handleChipClick:${encodeURIComponent(carreraActiva)},${encodeURIComponent(r.id)}">
                        <span class="chip-icono">${icono}</span><span class="chip-nombre">${r.nombre}</span>
                    </button></div>`;
        });
        // Rellenar slots vacíos para que todas las columnas alineen sus filas con las demás
        for (let i = ramosSemestre.length; i < maxRamosPorSemestre; i++) {
            html += `<div class="ramo-chip-slot vacio"><button type="button" class="ramo-chip" tabindex="-1" aria-hidden="true"><span class="chip-icono">○</span><span>&nbsp;</span></button></div>`;
        }
        html += `</div>`;
    });
    html += `</div></div>`;

    // Sección "cursando" — conecta con el motor de cálculo real
    const ramosCursando = todos.filter(r => estado[r.id] === 'cursando');
    html += `<div class="seccion-cursando">
        <h2>🧮 Ramos que estás cursando este semestre</h2>
        <p>Cada uno tiene su tarjeta completa (con PAR, recuperativo, laboratorio y umbrales editables) en la pestaña "Mis Ramos".</p>`;

    if (ramosCursando.length === 0) {
        html += `<div class="sin-cursando">Todavía no marcaste ningún ramo como "cursando". Toca el ramo que estás tomando en la grilla de arriba (queda azul y pasa a "cursando").</div>`;
    } else {
        html += `<div class="cursando-list">` + ramosCursando.map(r => {
            const cardId = link[r.id];
            const card = ramos.find(c => c.id === cardId);
            let pillHtml = `<span class="estado-pill vacio">Sin notas aún</span>`;
            if (card) {
                const resumen = resumirCard(card);
                pillHtml = `<span class="estado-pill ${resumen.clase}">${resumen.texto}</span>`;
            }
            return `<div class="cursando-item">
                <div><div class="nombre">${r.nombre}</div><div class="tipo">${card ? etiquetaTipo(card.tipoRamo) : ''}</div></div>
                <div class="card-action-row">
                    ${pillHtml}
                    <button class="btn btn-ghost btn-small" data-action="irARamo:${encodeURIComponent(cardId)}">Editar notas →</button>
                </div>
            </div>`;
        }).join('') + `</div>`;
    }
    html += `</div>`;

    contenidoMalla.innerHTML = html;
    // Post-process dynamic styles (avoid inline styles in template for linting)
    try {
        document.querySelectorAll('.progreso-barra-fill').forEach(el => {
            const pct = el.dataset.pct || 0;
            el.style.width = String(pct) + '%';
        });
    } catch (e) { console.warn('post-process estilos dinamicos fallo', e); }
}

function etiquetaTipo(tipo) {
    const etiquetas = {
        matematicas: '📐 Ciencia Básica — Matemáticas',
        fisica: '⚛️ Ciencia Básica — Física',
        carrera: '💻 Ramo de Carrera',
        sello: '🎗️ Curso Sello',
        formacion_basica: '🧭 Formación Básica',
        transversal: '🔀 Transversal'
    };
    return etiquetas[tipo] || '💻 Ramo de Carrera';
}

// Resume el estado de una tarjeta sin tocar el DOM, reutilizando la misma lógica que calcularRamoNuevo.
function resumirCard(ramoObj) {
    const hayPromedioEjManual = ramoObj.promedioEjManual !== '' && ramoObj.promedioEjManual !== undefined && !isNaN(ramoObj.promedioEjManual);
    const notasCat = ramoObj.notasCat.filter(n => n !== '' && !isNaN(n));
    const notasEj = ramoObj.tieneEjercicios ? ramoObj.notasEj.filter(n => n !== '' && !isNaN(n)) : [];
    const notasLab = ramoObj.tieneLab ? ramoObj.notasLab.filter(n => n !== '' && !isNaN(n)) : [];
    if (notasCat.length === 0 && notasEj.length === 0 && notasLab.length === 0 && !hayPromedioEjManual) {
        return { texto: 'Sin notas aún', clase: 'vacio' };
    }
    const hayTodas = notasCat.length === ramoObj.cantCat &&
        (!ramoObj.tieneEjercicios || hayPromedioEjManual || notasEj.length === ramoObj.cantEj) &&
        (!ramoObj.tieneLab || notasLab.length === ramoObj.cantLab);
    if (!hayTodas) return { texto: 'En progreso', clase: 'mid' };
    return { texto: 'Notas completas', clase: 'ok' };
}

/* ======================================================================
   PARTE 2 — MOTOR DE CÁLCULO REAL (idéntico al dashboard)
   ====================================================================== */
const LS_RAMOS = 'malla_unif_ramos';
let ramos = cargarJSON(LS_RAMOS, []);
ramos.forEach(r => { if (r.tieneExamen === undefined) r.tieneExamen = true; if (r.promedioEjManual === undefined) r.promedioEjManual = ''; });

window.guardarEnStorage = (forzarSnapshot) => {
    guardarJSON(LS_RAMOS, ramos);
    actualizarBadgeRamos();
};
function actualizarBadgeRamos() { document.getElementById('badgeRamos').textContent = ramos.length; }

/* ---- Respaldo: descargar / restaurar ramos como .json ---- */
window.descargarRespaldo = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const contenido = JSON.stringify(ramos, null, 2);
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-malla-${fecha}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.activarInputRespaldo = () => {
    document.getElementById('inputRespaldo').click();
};

let _respaldoPendiente = null;
window.manejarArchivoRespaldo = (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // permite volver a seleccionar el mismo archivo si se cancela
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        let datos;
        try { datos = JSON.parse(e.target.result); }
        catch (err) { alert('El archivo no es un JSON válido.'); return; }
        if (!Array.isArray(datos)) { alert('El archivo no tiene el formato esperado: se esperaba un arreglo de ramos.'); return; }
        const estructuraValida = datos.every(r => r && typeof r === 'object' && typeof r.id !== 'undefined' && typeof r.nombre === 'string' && typeof r.tipoRamo === 'string');
        if (!estructuraValida) { alert('El archivo no tiene la estructura esperada de un respaldo de "Mis Ramos".'); return; }
        // Importar los ramos desde el respaldo: reemplaza el arreglo actual
        ramos = datos;
        guardarEnStorage(true);
        if (typeof renderRamos === 'function') renderRamos();
        alert('Respaldo importado correctamente.');
    };
    reader.readAsText(file);
};