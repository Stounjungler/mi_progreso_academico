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
// Restaurar el tema guardado (lo que persistió toggleTema) antes de actualizar el icono.
(function () {
    const temaGuardado = localStorage.getItem('malla_unif_tema');
    if (temaGuardado === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
})();
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
    const modalPrereq = document.getElementById('prereqModal');
    if (modalPrereq) modalPrereq.style.display = 'none';
    renderMalla();
};

window.recargarCarreraDesdeStorage = () => {
    carreraActiva = localStorage.getItem(LS_CARRERA) || 'sin_asignar';
    if (selectCarrera) selectCarrera.value = carreraActiva;
    renderMalla();
};

// Nota: renderMalla() se invoca más abajo, después de declarar contenidoMalla (línea ~412+).

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
window.togglePrereq = (carreraId, ramoId, prereqId) => {
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
        return `<label><input type="checkbox" ${marcado ? 'checked' : ''} data-action-change="togglePrereq:${carreraId},${ramoId},${c.id}"> ${c.nombre}</label>`;
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
                if (e.target && e.target.id === target) {
                    if (target === 'prereqModal' && typeof window.cerrarPrereqModal === 'function') {
                        window.cerrarPrereqModal();
                    } else if (target === 'confirmarRestaurarModal' && typeof window.cerrarConfirmarRestaurarModal === 'function') {
                        window.cerrarConfirmarRestaurarModal();
                    } else if (target === 'confirmarEliminarModal' && typeof window.cerrarConfirmarEliminarModal === 'function') {
                        window.cerrarConfirmarEliminarModal();
                    } else {
                        closeModal(target);
                    }
                }
                break;
            }
            case 'open-malla-modal': e.preventDefault(); openModal('mallaOficialModal'); break;
            case 'open-tutorial': openModal('tutorialModal'); break;
            case 'open-help': openModal('guiaModal'); break;
            case 'close-tutorial': closeModal('tutorialModal'); break;
            case 'close-help': closeModal('guiaModal'); break;
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
            case 'entrarModoInvitado': if (typeof window.entrarModoInvitado === 'function') window.entrarModoInvitado(); break;
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

// Delegación para input/change (los inputs generados en renderCardNuevo usan
// data-action-input / data-action-change en vez de inline handlers, por CSP).
['input', 'change'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
        const attr = evt === 'input' ? 'data-action-input' : 'data-action-change';
        const el = e.target.closest && e.target.closest(`[${attr}]`);
        if (!el) return;
        const raw = el.getAttribute(attr) || '';
        const [action, paramStr] = raw.split(':');
        const params = paramStr ? paramStr.split(',').map(p => decodeURIComponent(p)) : [];
        if (action && typeof window[action] === 'function') {
            try { window[action](...params, el); } catch (err) { console.error('action handler error', evt, action, err); }
        }
    });
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

// NOTA: la malla NO se renderiza aquí. `renderMalla()` accede a `ramos`, que
// se declara con `let` más abajo (PARTE 2). Llamarla antes dejaría `ramos` en
// "temporal dead zone" y crashearía todo el script. La invocación inicial se
// hace justo después de inicializar `ramos`.

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
            const botonEditar = card ? `<button class="btn btn-ghost btn-small" data-action="irARamo:${encodeURIComponent(cardId)}">Editar notas →</button>` : '';
            return `<div class="cursando-item">
                <div><div class="nombre">${r.nombre}</div><div class="tipo">${card ? etiquetaTipo(card.tipoRamo) : ''}</div></div>
                <div class="card-action-row">
                    ${pillHtml}
                    ${botonEditar}
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

// Renderizar la malla por primera vez (ahora `ramos` ya está inicializado).
renderMalla();

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
window.manejarArchivoRespaldo = (el) => {
    const file = (el && el.files && el.files[0]) ? el.files[0] : null;
    if (el) el.value = ''; // permite volver a seleccionar el mismo archivo si se cancela
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        let datos;
        try { datos = JSON.parse(e.target.result); }
        catch (err) { alert('El archivo no es un JSON válido.'); return; }
        if (!Array.isArray(datos)) { alert('El archivo no tiene el formato esperado: se esperaba un arreglo de ramos.'); return; }
        const estructuraValida = datos.every(r => r && typeof r === 'object' && typeof r.id !== 'undefined' && typeof r.nombre === 'string' && typeof r.tipoRamo === 'string');
        if (!estructuraValida) { alert('El archivo no tiene la estructura esperada de un respaldo de "Mis Ramos".'); return; }
        _respaldoPendiente = datos;
        document.getElementById('confirmarRestaurarCantidad').textContent = datos.length;
        document.getElementById('confirmarRestaurarModal').style.display = 'flex';
    };
    reader.onerror = () => alert('No se pudo leer el archivo seleccionado.');
    reader.readAsText(file);
};

window.cerrarConfirmarRestaurarModal = (event) => {
    if (event && event.target.id !== 'confirmarRestaurarModal') return;
    document.getElementById('confirmarRestaurarModal').style.display = 'none';
    _respaldoPendiente = null;
};

window.confirmarRestaurarRespaldo = () => {
    if (!_respaldoPendiente) return;
    ramos = _respaldoPendiente;
    ramos.forEach(r => { if (r.tieneExamen === undefined) r.tieneExamen = true; if (r.promedioEjManual === undefined) r.promedioEjManual = ''; });
    _respaldoPendiente = null;
    guardarEnStorage(true);
    renderRamos();
    document.getElementById('confirmarRestaurarModal').style.display = 'none';
};

function pesosIguales(n) {
    if (n <= 0) return [];
    const base = Math.floor((100 / n) * 100) / 100;
    const pesos = Array(n).fill(base);
    const suma = pesos.reduce((a, b) => a + b, 0);
    pesos[pesos.length - 1] += Math.round((100 - suma) * 100) / 100;
    return pesos;
}

function crearRamoNuevoTipo(nombre, tipo) {
    const tieneLab = (tipo === 'fisica' || tipo === 'carrera');
    const esCarrera = (tipo === 'carrera');
    const esPromedioSimple = (tipo === 'sello' || tipo === 'formacion_basica' || tipo === 'transversal');

    if (esPromedioSimple) {
        const cant = 3;
        const tieneExamen = (tipo === 'sello'); // Curso Sello trae examen activado por defecto (editable); Formación Básica y Transversal no tienen examen.
        return {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            nombre: nombre, tipoRamo: tipo,
            cantCat: cant, notasCat: Array(cant).fill(''),
            pesosCatInd: pesosIguales(cant),
            usaPAR: false, notaPAR: '',
            tieneEjercicios: false, pesoEjerciciosPct: 0, cantEj: 0, notasEj: [],
            tieneLab: false, cantLab: 0, notasLab: [],
            usaRecuperativoLab: false, notaRecuperativoLab: '',
            pesoCatPct: 100, pesoLabPct: 0,
            tieneExamen: tieneExamen,
            notaExamen: '', notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0, notaAprobacion: 4.0,
            pesoPresentacionPct: 70, pesoExamenFinalPct: 30
        };
    }

    return {
        id: Date.now().toString() + Math.floor(Math.random() * 1000),
        nombre: nombre, tipoRamo: tipo,
        cantCat: 3, notasCat: Array(3).fill(''),
        pesosCatInd: esCarrera ? [25, 25, 25] : [25, 30, 30],
        usaPAR: false, notaPAR: '',
        tieneEjercicios: true, pesoEjerciciosPct: esCarrera ? 25 : 15,
        cantEj: esCarrera ? 1 : 3, notasEj: esCarrera ? [''] : Array(3).fill(''),
        promedioEjManual: '',
        tieneLab: tieneLab, cantLab: tieneLab ? 5 : 0, notasLab: tieneLab ? Array(5).fill('') : [],
        usaRecuperativoLab: false, notaRecuperativoLab: '',
        pesoCatPct: 70, pesoLabPct: 30,
        tieneExamen: true,
        notaExamen: '', notaEximicionMeta: 5.0, notaReprobacionDirecta: 3.0, notaAprobacion: 4.0,
        pesoPresentacionPct: 70, pesoExamenFinalPct: 30
    };
}

let _idRamoAEliminar = null;
window.eliminarRamo = (id) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    _idRamoAEliminar = id;
    document.getElementById('confirmarEliminarNombre').textContent = r.nombre;
    document.getElementById('confirmarEliminarModal').style.display = 'flex';
};
window.confirmarEliminarRamo = () => {
    if (!_idRamoAEliminar) return;
    delete _respaldoCantidad[_idRamoAEliminar];
    ramos = ramos.filter(r => r.id !== _idRamoAEliminar);
    // Si ese ramo estaba vinculado a algún nodo de la malla, ese nodo vuelve a "pendiente".
    Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX_LINK)).forEach(key => {
        const carreraId = key.replace(LS_PREFIX_LINK, '');
        const link = getLink(carreraId);
        const entrada = Object.entries(link).find(([, cardId]) => cardId === _idRamoAEliminar);
        if (entrada) {
            const [ramoMallaId] = entrada;
            delete link[ramoMallaId];
            setLink(carreraId, link);
            const estado = getEstado(carreraId);
            estado[ramoMallaId] = 'pendiente';
            setEstado(carreraId, estado);
        }
    });
    guardarEnStorage(true); renderRamos(); renderMalla(); cerrarConfirmarEliminarModal();
};
window.cerrarConfirmarEliminarModal = (event) => {
    if (event && event.target.id !== 'confirmarEliminarModal') return;
    _idRamoAEliminar = null;
    document.getElementById('confirmarEliminarModal').style.display = 'none';
};

window.actualizarNombre = (id, el) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    r.nombre = (el && el.value) ? el.value : 'Sin Nombre';
    guardarEnStorage();
};

// Botón "➕ Agregar Ramo" de la pestaña Mis Ramos: crea un ramo manual (tipo carrera).
window.agregarRamoManual = () => {
    const nuevo = crearRamoNuevoTipo('Nuevo Ramo', 'carrera');
    ramos.push(nuevo);
    guardarEnStorage(true);
    renderRamos();
    const el = document.getElementById('card-' + nuevo.id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nombreInput = el.querySelector('.ramo-nombre-input');
        if (nombreInput) { nombreInput.focus(); nombreInput.select(); }
    }
};

// Escapa caracteres especiales de HTML antes de insertar texto ingresado por el
// usuario (ej: nombre de un ramo) dentro de innerHTML o atributos como value="...".
function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function clampNota(valor) {
    if (valor === '' || valor === undefined || valor === null) return '';
    let n = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(n)) return '';
    if (Number.isInteger(n) && n >= 10 && n <= 99) {
        n = n / 10;
    }
    n = Math.round(n * 10) / 10;
    return Math.min(7, Math.max(1, n));
}

// Convierte un valor (string/número) a número respetando el separador decimal
// con coma (común en Chile): "5,5" -> 5.5. Devuelve NaN si no es numérico.
function parsearNumero(valor) {
    if (valor === '' || valor === undefined || valor === null) return NaN;
    return parseFloat(String(valor).replace(',', '.'));
}

// Arma un cuadro de resultado "predictivo" colapsable: por defecto muestra solo
// una línea con el resumen (título + dato clave), y el detalle completo aparece
// al hacer clic. El estado se recuerda por ramo en `prediccionExpandida`.
function envolverPrediccion(id, titulo, resumenCorto, detalleHTML) {
    const expandido = !!prediccionExpandida[id];
    return `
        <div class="res-header res-header-colapsable" data-action="togglePrediccion:${id}">
            <span class="prediccion-titulo">${titulo}</span>
            <span class="prediccion-resumen">${resumenCorto}<span class="prediccion-chevron">${expandido ? '▾' : '▸'}</span></span>
        </div>
        <div class="prediccion-detalle"${expandido ? '' : ' style="display:none;"'}>${detalleHTML}</div>`;
}

window.actualizarNota = (ramoId, tipo, index, el) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    const n = clampNota(el ? el.value : '');
    if (tipo === 'cat') r.notasCat[index] = n;
    if (tipo === 'ej') r.notasEj[index] = n;
    if (tipo === 'lab') r.notasLab[index] = n;
    if (el) el.value = n === '' ? '' : n.toFixed(1);
    guardarEnStorage();
    window.calcularRamoNuevo(ramoId, true);
};
window.actualizarNotaLive = (ramoId, tipo, index, el) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    const valor = el ? el.value : '';
    const n = valor === '' ? '' : parsearNumero(valor);
    const nVal = (n === '' || isNaN(n)) ? '' : n;
    if (tipo === 'cat') r.notasCat[index] = nVal;
    if (tipo === 'ej') r.notasEj[index] = nVal;
    if (tipo === 'lab') r.notasLab[index] = nVal;
};

window.actualizarPesoInd = (ramoId, tipo, index, el) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    const valor = el ? el.value : '';
    if (tipo === 'cat') r.pesosCatInd[index] = valor !== '' ? parsearNumero(valor) : '';
    guardarEnStorage();
};
window.actualizarPesoEjercicios = (ramoId, el) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    const valor = el ? el.value : '';
    r.pesoEjerciciosPct = Math.min(100, Math.max(0, parsearNumero(valor) || 0));
    guardarEnStorage(); window.actualizarVistaPesosCat(ramoId);
};
window.actualizarVistaPesosCat = (ramoId) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    let suma = 0;
    for (let i = 0; i < r.cantCat; i++) {
        const el = document.getElementById(`pcat-${ramoId}-${i}`);
        suma += el ? (parsearNumero(el.value) || 0) : 0;
    }
    if (r.tieneEjercicios) {
        const elEj = document.getElementById(`pesoEj-${ramoId}`);
        suma += elEj ? (parsearNumero(elEj.value) || 0) : 0;
    }
    const resumen = document.getElementById(`resumen-cat-${ramoId}`);
    if (!resumen) return;
    const fill = resumen.querySelector('.resumen-barra-fill');
    const texto = resumen.querySelector('.resumen-texto');
    let color, mensaje;
    if (suma > 100.01) { color = 'var(--danger)'; mensaje = `⚠ Suman ${suma.toFixed(1)}%, te pasas por ${(suma - 100).toFixed(1)}%.`; }
    else if (Math.abs(suma - 100) < 0.01) { color = 'var(--success)'; mensaje = `✓ 100% asignado en cátedra.`; }
    else { color = 'var(--accent)'; mensaje = `Suman ${suma.toFixed(1)}% de 100% necesario en cátedra.`; }
    if (fill) { fill.style.width = `${Math.min(100, suma)}%`; fill.style.background = color; }
    if (texto) { texto.textContent = mensaje; texto.style.color = color; }
};

// Guarda notas/pesos excedentes al reducir la cantidad de un ramo, para no
// perderlos si el usuario vuelve a subir la cantidad. Se limpia al cambiar tipo.
const _respaldoCantidad = {};
function redimensionarPreservando(arr, nuevaCant) {
    const previo = arr || [];
    const result = Array(nuevaCant).fill('').map((_, i) => (previo[i] !== undefined) ? previo[i] : '');
    const excedente = previo.slice(nuevaCant);
    if (excedente.length) return { result, excedente };
    return { result, excedente: [] };
}

window.actualizarCantidad = (ramoId, categoria, el) => {
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    const nuevaCant = Math.max(0, parseInt(el ? el.value : '') || 0);
    const esPromedioSimple = (r.tipoRamo === 'sello' || r.tipoRamo === 'formacion_basica' || r.tipoRamo === 'transversal');
    const cache = _respaldoCantidad[ramoId] || (_respaldoCantidad[ramoId] = {});
    // Combina las notas actuales con las excedentes guardadas (del mismo ramo y
    // categoría) y re-guarda el nuevo excedente. Al bajar la cantidad, las notas
    // que quedan fuera se conservan en el cache; al subirla, se recuperan.
    const redimensionar = (actuales) => {
        const previos = cache[categoria] || [];
        const pool = (actuales || []).concat(previos);
        cache[categoria] = pool.slice(nuevaCant);
        return pool.slice(0, nuevaCant);
    };
    if (categoria === 'cat') {
        r.notasCat = redimensionar(r.notasCat);
        r.pesosCatInd = esPromedioSimple ? pesosIguales(nuevaCant) : redimensionarPreservando(r.pesosCatInd, nuevaCant).result;
        r.cantCat = nuevaCant;
    }
    else if (categoria === 'ej') { r.notasEj = redimensionar(r.notasEj); r.cantEj = nuevaCant; }
    else if (categoria === 'lab') { r.notasLab = redimensionar(r.notasLab); r.cantLab = nuevaCant; }
    guardarEnStorage(); renderRamos();
};

window.cambiarTipoRamo = (id, el) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    const tipo = el && el.value ? el.value : r.tipoRamo;
    const base = crearRamoNuevoTipo(r.nombre, tipo);
    base.id = r.id;
    ramos = ramos.map(x => x.id === id ? base : x);
    delete _respaldoCantidad[id];
    guardarEnStorage(); renderRamos();
};

window.toggleLabRamo = (id) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    r.tieneLab = !r.tieneLab;
    if (r.tieneLab) {
        r.cantLab = r.cantLab || 5;
        r.notasLab = (r.notasLab && r.notasLab.length === r.cantLab) ? r.notasLab : Array(r.cantLab).fill('');
        r.pesoCatPct = 70; r.pesoLabPct = 30;
    } else {
        r.usaRecuperativoLab = false; r.notaRecuperativoLab = '';
        r.pesoCatPct = 100; r.pesoLabPct = 0;
    }
    guardarEnStorage(); renderRamos();
};

window.toggleExamenRamo = (id) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    r.tieneExamen = !r.tieneExamen;
    if (!r.tieneExamen) { r.notaExamen = ''; }
    guardarEnStorage(); renderRamos();
};

window.actualizarPromedioEjManualLive = (id, el) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    const valor = el ? el.value : '';
    const n = valor === '' ? '' : parsearNumero(valor);
    r.promedioEjManual = (n === '' || isNaN(n)) ? '' : n;
};
window.actualizarPromedioEjManual = (id, el) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    const n = clampNota(el ? el.value : '');
    r.promedioEjManual = n;
    if (el) el.value = n === '' ? '' : n;
    if (n !== '') { r.notasEj = Array(r.cantEj).fill(''); }
    guardarEnStorage(); renderRamos();
};

window.actualizarConfigNuevo = (id, campo, el) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    const valor = el ? el.value : '';
    const nuevoValor = valor === '' ? '' : (parsearNumero(valor) || 0);
    const camposUmbral = ['notaReprobacionDirecta', 'notaAprobacion', 'notaEximicionMeta'];
    if (camposUmbral.includes(campo) && nuevoValor !== '') {
        const reprob = campo === 'notaReprobacionDirecta' ? nuevoValor : (r.notaReprobacionDirecta ?? 3.0);
        const aprob = campo === 'notaAprobacion' ? nuevoValor : (r.notaAprobacion ?? 4.0);
        const exim = campo === 'notaEximicionMeta' ? nuevoValor : (r.notaEximicionMeta ?? 5.0);
        if (!(reprob <= aprob && aprob <= exim)) {
            alert(`Los umbrales deben cumplir: Reprobación Directa (${reprob}) ≤ Nota Aprobación (${aprob}) ≤ Nota Eximición (${exim}). Ajusta el valor para que el orden sea correcto.`);
            renderRamos(); return;
        }
    }
    r[campo] = nuevoValor; guardarEnStorage();
};

window.togglePAR = (id) => { const r = ramos.find(x => x.id === id); if (!r) return; r.usaPAR = !r.usaPAR; guardarEnStorage(); renderRamos(); };
window.toggleRecuperativoLab = (id) => { const r = ramos.find(x => x.id === id); if (!r) return; r.usaRecuperativoLab = !r.usaRecuperativoLab; guardarEnStorage(); renderRamos(); };

window.actualizarNotaPAR = (id, el) => {
    const r = ramos.find(x => x.id === id); if (!r) return;
    const n = clampNota(el ? el.value : ''); r.notaPAR = n;
    if (el) el.value = n === '' ? '' : n.toFixed(1);
    guardarEnStorage();
};
window.actualizarNotaRecuperativoLab = (id, el) => {
    const r = ramos.find(x => x.id === id); if (!r) return;
    const n = clampNota(el ? el.value : ''); r.notaRecuperativoLab = n;
    if (el) el.value = n === '' ? '' : n.toFixed(1);
    guardarEnStorage();
};
window.actualizarNotaExamen = (id, el) => {
    const r = ramos.find(x => x.id === id); if (!r) return;
    const n = clampNota(el ? el.value : ''); r.notaExamen = n;
    if (el) el.value = n === '' ? '' : n.toFixed(1);
    guardarEnStorage();
};
window.actualizarNotaPARLive = (id, el) => { const r = ramos.find(x => x.id === id); if (!r) return; const valor = el ? el.value : ''; const n = valor === '' ? '' : parsearNumero(valor); r.notaPAR = (n === '' || isNaN(n)) ? '' : n; };
window.actualizarNotaRecuperativoLabLive = (id, el) => { const r = ramos.find(x => x.id === id); if (!r) return; const valor = el ? el.value : ''; const n = valor === '' ? '' : parsearNumero(valor); r.notaRecuperativoLab = (n === '' || isNaN(n)) ? '' : n; };
window.actualizarNotaExamenLive = (id, el) => { const r = ramos.find(x => x.id === id); if (!r) return; const valor = el ? el.value : ''; const n = valor === '' ? '' : parsearNumero(valor); r.notaExamen = (n === '' || isNaN(n)) ? '' : n; };

window.sincronizarPesoCatLab = (ramoId, origen, el) => {
    const v = Math.min(100, Math.max(0, parsearNumero(el ? el.value : '') || 0));
    const otroId = origen === 'cat' ? `pesoLabPct-${ramoId}` : `pesoCatPct-${ramoId}`;
    const otro = document.getElementById(otroId);
    if (otro) otro.value = (100 - v).toFixed(0);
};
window.actualizarPesoCatLab = (id, origen, el) => {
    const r = ramos.find(x => x.id === id); if (!r) return;
    const v = Math.min(100, Math.max(0, parsearNumero(el ? el.value : '') || 0));
    if (origen === 'cat') { r.pesoCatPct = v; r.pesoLabPct = 100 - v; } else { r.pesoLabPct = v; r.pesoCatPct = 100 - v; }
    guardarEnStorage();
};
window.sincronizarPesoPresentacionExamen = (ramoId, origen, el) => {
    const v = Math.min(100, Math.max(0, parsearNumero(el ? el.value : '') || 0));
    const otroId = origen === 'presentacion' ? `pesoExamenFinalPct-${ramoId}` : `pesoPresentacionPct-${ramoId}`;
    const otro = document.getElementById(otroId);
    if (otro) otro.value = (100 - v).toFixed(0);
};
window.actualizarPesoPresentacionExamen = (id, origen, el) => {
    const r = ramos.find(x => x.id === id); if (!r) return;
    const v = Math.min(100, Math.max(0, parsearNumero(el ? el.value : '') || 0));
    if (origen === 'presentacion') { r.pesoPresentacionPct = v; r.pesoExamenFinalPct = 100 - v; } else { r.pesoExamenFinalPct = v; r.pesoPresentacionPct = 100 - v; }
    guardarEnStorage();
};

function renderPesosCatedra(r) {
    const labels = ['N1', 'N2', 'N3'];
    let html = '<div class="pesos-ind-grid">';
    for (let i = 0; i < r.cantCat; i++) {
        const val = r.pesosCatInd[i] !== undefined ? r.pesosCatInd[i] : '';
        html += `<div class="peso-ind-chip"><span>${labels[i] || ('N' + (i + 1))}</span>
            <input type="number" id="pcat-${r.id}-${i}" value="${val}" step="1" min="0" max="100"
                data-action-input="actualizarVistaPesosCat:${r.id}" data-action-change="actualizarPesoInd:${r.id},cat,${i}"><span>%</span></div>`;
    }
    if (r.tieneEjercicios) {
        html += `<div class="peso-ind-chip"><span>N4</span>
            <input type="number" id="pesoEj-${r.id}" value="${r.pesoEjerciciosPct || 15}" step="1" min="0" max="100"
                data-action-input="actualizarPesoEjercicios:${r.id}"><span>%</span></div>`;
    }
    html += '</div>';
    return html;
}

/* ---- Motor de cálculo (idéntico a calcularRamoNuevo del dashboard) ---- */
window.calcularRamoNuevo = (id, silencioso) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;
    const resBox = document.getElementById(`res-${id}`);
    if (!resBox) return;
    resBox.classList.remove('res-aprobado', 'res-reprobado', 'res-critico', 'res-proyeccion');

    const avisar = (msg) => {
        if (silencioso) {
            resBox.classList.add('res-proyeccion');
            resBox.innerHTML = envolverPrediccion(id, '⚠ Falta configurar', '', `<div class="salvavidas">${msg}</div>`);
            resBox.style.display = 'block';
        } else { alert(msg); }
    };

    let notasCat = [...r.notasCat];
    if (r.usaPAR && r.notaPAR !== '' && !isNaN(r.notaPAR)) {
        let idxMin = 0, hayBaseValida = false;
        const limite = Math.min(3, notasCat.length);
        for (let i = 0; i < limite; i++) {
            if (notasCat[i] !== '' && !isNaN(notasCat[i])) {
                if (!hayBaseValida || parseFloat(notasCat[i]) < parseFloat(notasCat[idxMin])) idxMin = i;
                hayBaseValida = true;
            }
        }
        if (hayBaseValida) notasCat[idxMin] = parseFloat(r.notaPAR);
    }

    let notasLab = r.tieneLab ? [...r.notasLab] : [];
    if (r.tieneLab && r.usaRecuperativoLab && r.notaRecuperativoLab !== '' && !isNaN(r.notaRecuperativoLab)) {
        let idxMin = 0, hayBaseValida = false;
        for (let i = 0; i < notasLab.length; i++) {
            if (notasLab[i] !== '' && !isNaN(notasLab[i])) {
                if (!hayBaseValida || parseFloat(notasLab[i]) < parseFloat(notasLab[idxMin])) idxMin = i;
                hayBaseValida = true;
            }
        }
        if (hayBaseValida) notasLab[idxMin] = parseFloat(r.notaRecuperativoLab);
    }

    const escalaCat = r.tieneLab ? (r.pesoCatPct / 100) : 1;
    let conocido = 0, pesoVacio = 0, hayVacios = false;

    for (let i = 0; i < r.cantCat; i++) {
        const peso = ((r.pesosCatInd[i] || 0) / 100) * escalaCat;
        const n = notasCat[i];
        if (n === '' || n === undefined || isNaN(n)) { pesoVacio += peso; hayVacios = true; }
        else conocido += parseFloat(n) * peso;
    }

    if (r.tieneEjercicios) {
        if (r.promedioEjManual !== '' && r.promedioEjManual !== undefined && !isNaN(r.promedioEjManual)) {
            const pesoEj = (r.pesoEjerciciosPct / 100) * escalaCat;
            conocido += parseFloat(r.promedioEjManual) * pesoEj;
        } else if (r.cantEj <= 0) {
            avisar(`Configura la "Cantidad de Ejercicios" (${r.tipoRamo === 'matematicas' ? 'talleres' : 'Otras Actividades'}) antes de calcular — ese ${r.pesoEjerciciosPct || 15}% no puede quedar sin notas asociadas.`);
            return;
        } else {
            const pesoEj = (r.pesoEjerciciosPct / 100) * escalaCat;
            const notasEjValidas = r.notasEj.filter(n => n !== '' && !isNaN(n));
            if (notasEjValidas.length === 0) { pesoVacio += pesoEj; hayVacios = true; }
            else if (notasEjValidas.length < r.notasEj.length) {
                const proporcionCompleta = notasEjValidas.length / r.notasEj.length;
                const promedioParcial = notasEjValidas.reduce((a, b) => a + parseFloat(b), 0) / notasEjValidas.length;
                conocido += promedioParcial * pesoEj * proporcionCompleta;
                pesoVacio += pesoEj * (1 - proporcionCompleta);
                hayVacios = true;
            } else {
                const promedioEj = notasEjValidas.reduce((a, b) => a + parseFloat(b), 0) / notasEjValidas.length;
                conocido += promedioEj * pesoEj;
            }
        }
    }

    if (r.tieneLab) {
        const pesoLabTotal = r.pesoLabPct / 100;
        const notasLabValidas = notasLab.filter(n => n !== '' && !isNaN(n));
        if (r.cantLab > 0) {
            if (notasLabValidas.length === 0) { pesoVacio += pesoLabTotal; hayVacios = true; }
            else if (notasLabValidas.length < notasLab.length) {
                const proporcionCompleta = notasLabValidas.length / notasLab.length;
                const promedioParcial = notasLabValidas.reduce((a, b) => a + parseFloat(b), 0) / notasLabValidas.length;
                conocido += promedioParcial * pesoLabTotal * proporcionCompleta;
                pesoVacio += pesoLabTotal * (1 - proporcionCompleta);
                hayVacios = true;
            } else {
                const promedioLab = notasLabValidas.reduce((a, b) => a + parseFloat(b), 0) / notasLabValidas.length;
                conocido += promedioLab * pesoLabTotal;
            }
        }
    }

    if (hayVacios) {
        if (r.tieneExamen === false) {
            const meta = r.notaAprobacion || 4.0;
            const notaParaAprobar = ((meta - conocido) / pesoVacio);
            const notaARellenarVisual = Math.min(7, Math.max(1, notaParaAprobar));

            if (!silencioso) {
                const rellenar = (tipo, cant) => {
                    for (let i = 0; i < cant; i++) {
                        const el = document.getElementById(`${tipo}-${id}-${i}`);
                        if (el && el.value === '') { el.placeholder = notaARellenarVisual.toFixed(1); el.classList.add('nota-predicha'); }
                    }
                };
                rellenar('cat', r.cantCat);
            }

            resBox.classList.add('res-proyeccion');
            let resumen, detalle;
            if (notaParaAprobar > 7.0) {
                resumen = 'Reprobado 💀';
                detalle = `<span>Reprobado 💀</span><div class="salvavidas">Ni sacándote un 7.0 en lo que falta alcanzas el ${meta.toFixed(1)} mínimo para aprobar.</div>`;
            } else if (notaParaAprobar <= 1.0) {
                resumen = '¡Asegurado! 🎊';
                detalle = `<span>¡Asegurado! 🎊</span><div class="salvavidas">Incluso con 1.0 en lo que falta, apruebas (promedio ≥ ${meta.toFixed(1)}).</div>`;
            } else {
                resumen = notaParaAprobar.toFixed(1);
                detalle = `<span>${notaParaAprobar.toFixed(1)}</span><div class="salvavidas">Necesitas promediar esta nota en lo que falta para <strong>aprobar</strong> (promedio ≥ ${meta.toFixed(1)}).</div>`;
            }
            resBox.innerHTML = envolverPrediccion(id, 'Modo Predictivo 🔮', resumen, detalle);
            resBox.style.display = 'block';
            return;
        }

        const metaEximir = r.notaEximicionMeta || 5.0;
        const metaExamen = r.notaReprobacionDirecta || 3.0;
        const notaParaEximir = ((metaEximir - conocido) / pesoVacio);
        const notaParaExamen = ((metaExamen - conocido) / pesoVacio);
        const notaARellenarVisual = Math.min(7, Math.max(1, notaParaEximir));

        if (!silencioso) {
            const rellenar = (tipo, cant) => {
                for (let i = 0; i < cant; i++) {
                    const el = document.getElementById(`${tipo}-${id}-${i}`);
                    if (el && el.value === '') { el.placeholder = notaARellenarVisual.toFixed(1); el.classList.add('nota-predicha'); }
                }
            };
            rellenar('cat', r.cantCat);
            if (r.tieneEjercicios && !(r.promedioEjManual !== '' && r.promedioEjManual !== undefined && !isNaN(r.promedioEjManual))) rellenar('ej', r.cantEj);
            if (r.tieneLab) rellenar('lab', r.cantLab);
        }

        resBox.classList.add('res-proyeccion');
        let resumen, detalle = '';
        if (notaParaEximir > 7.0 && notaParaExamen > 7.0) {
            resumen = 'Reprobado 💀';
            detalle = `<span>Reprobado 💀</span><div class="salvavidas">Ni sacándote un 7.0 en todo lo que falta alcanzas el ${metaExamen.toFixed(1)} mínimo para tener derecho a examen.</div>`;
        } else if (notaParaEximir <= 7.0) {
            if (notaParaEximir <= 1.0) {
                resumen = '¡Asegurado! 🎊';
                detalle = `<span>¡Asegurado! 🎊</span><div class="salvavidas">Incluso con 1.0 en lo que falta, te eximes (presentación ≥ ${metaEximir.toFixed(1)}).</div>`;
            } else {
                resumen = notaParaEximir.toFixed(1);
                detalle = `<span>${notaParaEximir.toFixed(1)}</span><div class="salvavidas">Necesitas promediar esta nota en lo que falta para <strong>eximirte</strong> (presentación ≥ ${metaEximir.toFixed(1)}).</div>`;
                if (notaParaExamen <= 7.0 && notaParaExamen > 1.0) {
                    detalle += `<div style="font-size:12px; margin-top:8px; opacity:0.8;">(Si prefieres solo asegurar el derecho a examen, con un <strong>${notaParaExamen.toFixed(1)}</strong> te alcanza.)</div>`;
                } else if (notaParaExamen <= 1.0) {
                    detalle += `<div style="font-size:12px; margin-top:8px; opacity:0.8;">(El derecho a examen ya lo tienes asegurado con lo que llevas.)</div>`;
                }
            }
        } else if (notaParaExamen <= 1.0) {
            resumen = '¡A Examen! 💀';
            detalle = `<span>¡A Examen! 💀</span><div class="salvavidas">Ya no te da para eximirte, pero el <strong>derecho a examen ya lo tienes asegurado</strong> con lo que llevas (presentación ≥ ${metaExamen.toFixed(1)}).</div>`;
        } else {
            resumen = '¡A Examen! 💀';
            detalle = `<span>¡A Examen! 💀</span><div class="salvavidas">Ya no te da para eximirte. Necesitas al menos <strong>${notaParaExamen.toFixed(1)}</strong> en lo que falta solo para tener <strong>derecho a examen</strong> (presentación ≥ ${metaExamen.toFixed(1)}).</div>`;
        }
        resBox.innerHTML = envolverPrediccion(id, 'Modo Predictivo 🔮', resumen, detalle);
        resBox.style.display = 'block';
        return;
    }

    const presentacion = conocido;
    const promedioCat = notasCat.reduce((a, b, i) => a + parseFloat(b) * ((r.pesosCatInd[i] || 0) / 100), 0);
    const notaEjerciciosCalculada = r.tieneEjercicios && r.cantEj > 0 ? r.notasEj.reduce((a, b) => a + parseFloat(b), 0) / r.cantEj : null;
    const notaLabCalculada = r.tieneLab && r.cantLab > 0 ? notasLab.reduce((a, b) => a + parseFloat(b), 0) / r.cantLab : null;

    let detalles = [`Cátedra: ${promedioCat.toFixed(2)}`];
    if (notaEjerciciosCalculada !== null) detalles.push(`Ejercicios: ${notaEjerciciosCalculada.toFixed(2)}`);
    if (notaLabCalculada !== null) detalles.push(`Lab: ${notaLabCalculada.toFixed(2)}`);
    const detalleTexto = ` (${detalles.join(' · ')})`;

    let HTML = '';
    const metaEximirFinal = r.notaEximicionMeta || 5.0;
    const metaExamenFinal = r.notaReprobacionDirecta || 3.0;
    const metaAprobacionFinal = r.notaAprobacion || 4.0;

    if (r.tieneExamen === false) {
        HTML = `<div class="res-header">Nota Final</div><span>${presentacion.toFixed(2)}</span>`;
        if (presentacion >= metaAprobacionFinal) { resBox.classList.add('res-aprobado'); HTML += `¡Ramo aprobado! 🎉${detalleTexto}`; }
        else { resBox.classList.add('res-reprobado'); HTML += `Ramo reprobado 💀${detalleTexto}`; }
        resBox.innerHTML = HTML; resBox.style.display = 'block';
        return;
    }

    if (presentacion >= metaEximirFinal) {
        resBox.classList.add('res-aprobado');
        HTML = `<div class="res-header">Nota de Presentación</div><span>${presentacion.toFixed(2)}</span>¡Eximido del examen! 🎉${detalleTexto}`;
    } else if (presentacion < metaExamenFinal) {
        resBox.classList.add('res-critico');
        HTML = `<div class="res-header">Nota de Presentación</div><span>${presentacion.toFixed(2)}</span>Ramo reprobado directamente 💀${detalleTexto}`;
    } else {
        if (r.notaExamen === '' || r.notaExamen === undefined || isNaN(r.notaExamen)) {
            const pesoPresDec = (r.pesoPresentacionPct !== undefined ? r.pesoPresentacionPct : 70) / 100;
            const pesoExamDec = (r.pesoExamenFinalPct !== undefined ? r.pesoExamenFinalPct : 30) / 100;
            const examenNecesario = (metaAprobacionFinal - presentacion * pesoPresDec) / pesoExamDec;
            resBox.classList.add('res-proyeccion');
            let detalleExamen;
            if (examenNecesario > 7.0) detalleExamen = `<div class="salvavidas">Necesitarías un <strong>${examenNecesario.toFixed(1)}</strong> en el examen — matemáticamente imposible. Ramo prácticamente reprobado. 💀</div>`;
            else if (examenNecesario <= 1.0) detalleExamen = `<div class="salvavidas">Estás sobrado: incluso con un 1.0 en el examen, apruebas.</div>`;
            else detalleExamen = `<div class="salvavidas">Necesitas un <strong>${examenNecesario.toFixed(1)}</strong> en el examen para aprobar (nota final ≥ ${metaAprobacionFinal.toFixed(1)}).</div>`;
            HTML = envolverPrediccion(id, 'Derecho a Examen 🔮', presentacion.toFixed(2), `<span>${presentacion.toFixed(2)}</span>${detalleExamen}`);
        } else {
            const pesoPresDec = (r.pesoPresentacionPct !== undefined ? r.pesoPresentacionPct : 70) / 100;
            const pesoExamDec = (r.pesoExamenFinalPct !== undefined ? r.pesoExamenFinalPct : 30) / 100;
            const notaFinal = presentacion * pesoPresDec + parseFloat(r.notaExamen) * pesoExamDec;
            HTML = `<div class="res-header">Nota Final</div><span>${notaFinal.toFixed(2)}</span>`;
            if (notaFinal >= metaAprobacionFinal) { resBox.classList.add('res-aprobado'); HTML += `¡Ramo aprobado! 🎉 (Presentación: ${presentacion.toFixed(2)})`; }
            else { resBox.classList.add('res-reprobado'); HTML += `Ramo reprobado 💀 (Presentación: ${presentacion.toFixed(2)})`; }
        }
    }
    resBox.innerHTML = HTML; resBox.style.display = 'block';
};

function esRamoVinculado(ramoId) {
    for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(LS_PREFIX_LINK)) continue;
        const link = cargarJSON(key, {});
        const encontrado = Object.values(link).includes(ramoId);
        if (encontrado) return true;
    }
    return false;
}

function renderCardNuevo(r) {
    const labelsCat = ['N1', 'N2', 'N3'];
    const inputsCatHTML = r.notasCat.map((nota, i) => `
        <div class="celda-nota"><input type="number" id="cat-${r.id}-${i}" step="0.1" min="1" max="7" value="${nota}" placeholder="${labelsCat[i] || ('N' + (i + 1))}" data-action-input="actualizarNotaLive:${r.id},cat,${i}" data-action-change="actualizarNota:${r.id},cat,${i}"></div>`).join('');
    const inputsLabHTML = r.tieneLab ? r.notasLab.map((nota, i) => `
        <div class="celda-nota"><input type="number" id="lab-${r.id}-${i}" step="0.1" min="1" max="7" value="${nota}" placeholder="L${i + 1}" data-action-input="actualizarNotaLive:${r.id},lab,${i}" data-action-change="actualizarNota:${r.id},lab,${i}"></div>`).join('') : '';
    const hayPromedioEjManual = r.promedioEjManual !== '' && r.promedioEjManual !== undefined && !isNaN(r.promedioEjManual);
    const inputsEjHTML = r.tieneEjercicios ? r.notasEj.map((nota, i) => `
        <div class="celda-nota"><input type="number" id="ej-${r.id}-${i}" step="0.1" min="1" max="7" value="${nota}" placeholder="T${i + 1}" ${hayPromedioEjManual ? 'disabled' : ''} data-action-input="actualizarNotaLive:${r.id},ej,${i}" data-action-change="actualizarNota:${r.id},ej,${i}"></div>`).join('') : '';

    const vinculado = esRamoVinculado(r.id);

    return `
        <div>
            <div class="ramo-header">
                <input type="text" class="ramo-nombre-input" value="${escapeHTML(r.nombre)}" data-action-change="actualizarNombre:${r.id}" title="Haz clic para editar el nombre">
                <button class="btn-delete" title="Eliminar ramo" data-action="eliminarRamo:${r.id}">✕</button>
            </div>
            ${vinculado ? `<span class="vinculo-malla">🎓 vinculado a tu malla curricular</span>` : ''}

            <div class="config-box">
                <div class="input-group" style="margin-bottom:15px;">
                    <label>Tipo de Ramo</label>
                    <select data-action-change="cambiarTipoRamo:${r.id}">
                        <option value="matematicas" ${r.tipoRamo === 'matematicas' ? 'selected' : ''}>📐 Ciencia Básica — Matemáticas</option>
                        <option value="fisica" ${r.tipoRamo === 'fisica' ? 'selected' : ''}>⚛️ Ciencia Básica — Física</option>
                        <option value="carrera" ${r.tipoRamo === 'carrera' ? 'selected' : ''}>💻 Ramo de Carrera</option>
                        <option value="sello" ${r.tipoRamo === 'sello' ? 'selected' : ''}>🎗️ Curso Sello</option>
                        <option value="formacion_basica" ${r.tipoRamo === 'formacion_basica' ? 'selected' : ''}>🧭 Formación Básica</option>
                        <option value="transversal" ${r.tipoRamo === 'transversal' ? 'selected' : ''}>🔀 Transversal</option>
                    </select>
                </div>
                ${(r.tipoRamo === 'fisica' || r.tipoRamo === 'carrera') ? `<label class="toggle-avanzado" style="width:100%; margin:0 0 15px 0;" title="Actívalo si este ramo tiene laboratorio con notas propias"><span>🧪 Este ramo tiene laboratorio</span><input type="checkbox" data-action-change="toggleLabRamo:${r.id}" ${r.tieneLab ? 'checked' : ''}></label>` : ''}
                ${r.tipoRamo === 'sello' ? `<label class="toggle-avanzado" style="width:100%; margin:0 0 15px 0;" title="Desactívalo si este curso sello no tiene examen final (ej: Inglés I)"><span>📝 Este ramo tiene examen</span><input type="checkbox" data-action-change="toggleExamenRamo:${r.id}" ${r.tieneExamen ? 'checked' : ''}></label>` : ''}
                ${(() => { const esPromedioSimple = (r.tipoRamo === 'sello' || r.tipoRamo === 'formacion_basica' || r.tipoRamo === 'transversal'); return esPromedioSimple ? '' : `
                <div class="notas-subtitulo">Cátedra (% de cada nota)</div>
                ${renderPesosCatedra(r)}
                <div class="resumen-pesos" id="resumen-cat-${r.id}"><div class="resumen-barra"><div class="resumen-barra-fill"></div></div><div class="resumen-texto">Configura los pesos.</div></div>
                `; })()}

                ${(r.tieneLab && r.tieneExamen !== false) ? `
                <div class="config-row">
                    <div class="input-group"><label>Peso Cátedra (%)</label><input type="number" id="pesoCatPct-${r.id}" value="${r.pesoCatPct}" data-action-input="sincronizarPesoCatLab:${r.id},cat" data-action-change="actualizarPesoCatLab:${r.id},cat"></div>
                    <div class="input-group"><label>Peso Laboratorio (%)</label><input type="number" id="pesoLabPct-${r.id}" value="${r.pesoLabPct}" data-action-input="sincronizarPesoCatLab:${r.id},lab" data-action-change="actualizarPesoCatLab:${r.id},lab"></div>
                </div>` : ''}

                ${r.tieneExamen !== false ? `
                <div class="config-row">
                    <div class="input-group"><label>Peso Presentación (%)</label><input type="number" id="pesoPresentacionPct-${r.id}" value="${r.pesoPresentacionPct ?? 70}" data-action-input="sincronizarPesoPresentacionExamen:${r.id},presentacion" data-action-change="actualizarPesoPresentacionExamen:${r.id},presentacion"></div>
                    <div class="input-group"><label>Peso Examen (%)</label><input type="number" id="pesoExamenFinalPct-${r.id}" value="${r.pesoExamenFinalPct ?? 30}" data-action-input="sincronizarPesoPresentacionExamen:${r.id},examen" data-action-change="actualizarPesoPresentacionExamen:${r.id},examen"></div>
                </div>
                <div class="config-row">
                    <div class="input-group"><label title="Nota Eximición">Eximición</label><input type="number" step="0.1" min="1" max="7" value="${r.notaEximicionMeta ?? 5.0}" data-action-change="actualizarConfigNuevo:${r.id},notaEximicionMeta"></div>
                    <div class="input-group"><label title="Nota Aprobación">Aprobación</label><input type="number" step="0.1" min="1" max="7" value="${r.notaAprobacion ?? 4.0}" data-action-change="actualizarConfigNuevo:${r.id},notaAprobacion"></div>
                </div>` : `
                <div class="config-row">
                    <div class="input-group"><label title="Nota Aprobación">Aprobación</label><input type="number" step="0.1" min="1" max="7" value="${r.notaAprobacion ?? 4.0}" data-action-change="actualizarConfigNuevo:${r.id},notaAprobacion"></div>
                </div>`}
            </div>

            <div class="notas-subtitulo">Notas de Cátedra</div>
            <div style="display:flex; gap:12px; align-items:stretch; margin-bottom:12px;">
                <div class="input-group" style="flex:2; min-width:0; margin:0;"><label>Cantidad de Cátedras</label><input type="number" min="0" value="${r.cantCat}" data-action-change="actualizarCantidad:${r.id},cat"></div>
                <label class="toggle-avanzado" style="flex:1.3; min-width:120px; margin:24px 0 0 0;" title="Reemplaza tu nota más baja entre N1-N3"><span>Prueba PAR</span><input type="checkbox" data-action-change="togglePAR:${r.id}" ${r.usaPAR ? 'checked' : ''}></label>
            </div>
            <div class="notas-grid">${inputsCatHTML}</div>
            ${r.usaPAR ? `<div class="notas-subtitulo">Prueba PAR</div><div class="notas-grid"><div class="celda-nota input-especial"><input type="number" step="0.1" min="1" max="7" value="${r.notaPAR}" placeholder="PAR" data-action-input="actualizarNotaPARLive:${r.id}" data-action-change="actualizarNotaPAR:${r.id}"></div></div>` : ''}

            ${r.tieneEjercicios ? `
            <div class="notas-subtitulo">Otras Actividades (Talleres-Controles)</div>
            <div class="config-row" style="margin-bottom:12px;">
                <div class="input-group"><label>Cantidad de Ejercicios</label><input type="number" min="0" value="${r.cantEj}" data-action-change="actualizarCantidad:${r.id},ej"></div>
                <div class="input-group"><label title="Si ya sabes el promedio pero no las notas individuales, ponlo aquí">Promedio (opcional)</label><input type="number" step="0.1" min="1" max="7" value="${r.promedioEjManual}" placeholder="Ej: 6,4" data-action-input="actualizarPromedioEjManualLive:${r.id}" data-action-change="actualizarPromedioEjManual:${r.id}"></div>
            </div>
            <div class="notas-grid">${inputsEjHTML}</div>` : ''}

            ${r.tieneLab ? `
            <div class="notas-subtitulo">Notas de Laboratorio</div>
            <div style="display:flex; gap:12px; align-items:stretch; margin-bottom:12px;">
                <div class="input-group" style="flex:2; min-width:0; margin:0;"><label>Cantidad de Laboratorios</label><input type="number" min="0" value="${r.cantLab}" data-action-change="actualizarCantidad:${r.id},lab"></div>
                <label class="toggle-avanzado" style="flex:1.3; min-width:130px; margin:24px 0 0 0;" title="Reemplaza tu nota más baja del laboratorio"><span>Recuperativo</span><input type="checkbox" data-action-change="toggleRecuperativoLab:${r.id}" ${r.usaRecuperativoLab ? 'checked' : ''}></label>
            </div>
            <div class="notas-grid">${inputsLabHTML}</div>
            ${r.usaRecuperativoLab ? `<div class="notas-subtitulo">Laboratorio Recuperativo</div><div class="notas-grid"><div class="celda-nota input-especial"><input type="number" step="0.1" min="1" max="7" value="${r.notaRecuperativoLab}" placeholder="Rec." data-action-input="actualizarNotaRecuperativoLabLive:${r.id}" data-action-change="actualizarNotaRecuperativoLab:${r.id}"></div></div>` : ''}` : ''}

            ${r.tieneExamen !== false ? `
            <div class="notas-subtitulo">Examen (déjalo en blanco para saber qué necesitas)</div>
            <div class="notas-grid"><div class="celda-nota input-rescate"><input type="number" step="0.1" min="1" max="7" value="${r.notaExamen}" placeholder="Examen" data-action-input="actualizarNotaExamenLive:${r.id}" data-action-change="actualizarNotaExamen:${r.id}"></div></div>` : ''}
        </div>

        <div style="margin-top:20px; display:flex; gap:10px; align-items:flex-start;">
            <button class="btn btn-calc" style="flex:1; margin-top:0;" data-action="calcularRamoNuevo:${r.id}">Calcular Ramo</button>
            <button class="btn btn-ghost" style="flex-shrink:0;" title="Genera un PDF con las notas y el resultado de este ramo" data-action="exportarRamoPDF:${r.id}">📄 PDF</button>
        </div>
        <div id="res-${r.id}" class="resultado-box" style="display:none; margin-top:12px;"></div>
    `;
}

/* ---- Exportar reporte de un ramo a PDF ----
   No reimplementa el cálculo: llama a calcularRamoNuevo() y lee el resultado
   ya renderizado en #res-{id}, igual que lo ve el estudiante en pantalla. */
window.exportarRamoPDF = (id) => {
    const r = ramos.find(x => x.id === id);
    if (!r) return;

    window.calcularRamoNuevo(id, false);

    const resBox = document.getElementById(`res-${id}`);
    if (!resBox || resBox.style.display === 'none' || !resBox.innerHTML.trim()) {
        return;
    }

    if (resBox.classList.contains('res-proyeccion') && !resBox.querySelector('.res-header')?.textContent.includes('Derecho a Examen')) {
        alert('Aún faltan notas por ingresar para poder generar el reporte final de este ramo.');
        return;
    }

    let escenario; // 'exam' | 'approved' | 'failed'
    let notaMostrada = null;
    let etiquetaNota = 'Nota';

    if (resBox.classList.contains('res-critico')) {
        escenario = 'failed';
        etiquetaNota = 'Nota Presentación';
    } else if (resBox.classList.contains('res-reprobado')) {
        escenario = 'failed';
        etiquetaNota = 'Nota Final';
    } else if (resBox.classList.contains('res-aprobado')) {
        escenario = 'approved';
        etiquetaNota = resBox.querySelector('.res-header')?.textContent.includes('Final') ? 'Nota Final' : 'Nota Definitiva';
    } else if (resBox.classList.contains('res-proyeccion')) {
        escenario = 'exam';
        etiquetaNota = 'Nota Presentación';
    } else {
        alert('No se pudo determinar el estado del ramo para generar el reporte.');
        return;
    }

    const elNumero = resBox.querySelector('span');
    notaMostrada = elNumero ? parseFloat(elNumero.textContent.trim().replace(',', '.')) : NaN;
    if (isNaN(notaMostrada)) {
        alert('No se pudo leer la nota calculada para generar el reporte.');
        return;
    }

    const metaAprobacion = r.notaAprobacion || 4.0;
    const metaExamenMin = r.notaReprobacionDirecta || 3.0;

    const CFG = {
        exam: {
            heroClass: 'hero-card-exam',
            badgeClass: 'badge-exam',
            fillClass: 'fill-exam',
            markerClass: 'marker-exam',
            bannerClass: 'banner-exam',
            badgeTexto: 'Estado de Cursado',
            titulo: 'Derecho a Examen',
            subtitulo: 'Cumple con los requisitos para rendir la evaluación final',
            mensaje: () => {
                const necesario = ((metaAprobacion - notaMostrada * 0.7) / 0.3);
                const necesarioTxt = isFinite(necesario) ? Math.min(7, Math.max(1, necesario)).toFixed(1) : '—';
                return `<strong>¡Estás listo para el examen!</strong> Con tu nota actual de <span class="badge-white">${notaMostrada.toFixed(2)}</span>, necesitas obtener una nota mínima aproximada de <span class="badge-yellow">${necesarioTxt}</span> en el examen final para aprobar la asignatura con un <span class="badge-white">${metaAprobacion.toFixed(1)}</span>.`;
            }
        },
        approved: {
            heroClass: 'hero-card-approved',
            badgeClass: 'badge-approved',
            fillClass: 'fill-approved',
            markerClass: 'marker-approved',
            bannerClass: 'banner-approved',
            badgeTexto: 'Asignatura Finalizada',
            titulo: 'Aprobado',
            subtitulo: 'Has cumplido satisfactoriamente las exigencias del ramo',
            mensaje: () => `<strong>¡Felicitaciones!</strong> Asignatura aprobada exitosamente. Tu nota final es <span class="badge-emerald">${notaMostrada.toFixed(2)}</span>.`
        },
        failed: {
            heroClass: 'hero-card-failed',
            badgeClass: 'badge-failed',
            fillClass: 'fill-failed',
            markerClass: 'marker-failed',
            bannerClass: 'banner-failed',
            badgeTexto: 'Asignatura Reprobada',
            titulo: 'Sin Derecho a Examen',
            subtitulo: 'No se alcanzaron los requisitos mínimos establecidos',
            mensaje: () => `<strong>Lo sentimos.</strong> Con tu nota actual de <span class="badge-rose">${notaMostrada.toFixed(2)}</span>, no cumples con los requisitos mínimos para aprobar la asignatura.`
        }
    };
    const cfg = CFG[escenario];

    const pctBarra = Math.min(100, Math.max(0, ((notaMostrada - 1.0) / 6.0) * 100)).toFixed(2);

    const fechaGen = new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const nombreRamo = (r.nombre || 'Ramo');

    const htmlReporte = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte - ${escapeHTML(nombreRamo)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm 15mm; background-color: #f8fafc; }
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .top-accent-bar { height: 4px; background: linear-gradient(90deg, #1e3a8a 0%, #059669 50%, #dc2626 100%); border-radius: 2px; margin-bottom: 14px; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .header-title-cell { vertical-align: middle; padding-left: 0; }
  .main-title { font-size: 18pt; font-weight: 800; color: #1e3a8a; margin: 0 0 4px 0; letter-spacing: -0.5px; }
  .meta-container { font-size: 8.5pt; color: #64748b; line-height: 1.3; }
  .meta-line { margin-bottom: 2px; }
  .meta-label { font-weight: 500; color: #64748b; }
  .meta-value-bold { font-weight: 700; color: #1e293b; }
  .hero-table { width: 100%; border-collapse: collapse; }
  .hero-left { vertical-align: middle; }
  .hero-right { text-align: right; vertical-align: middle; width: 180px; }
  .hero-card-exam { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #fff; border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; border: 1px solid #1e40af; }
  .hero-card-approved { background: linear-gradient(135deg, #052e1f 0%, #047857 100%); color: #fff; border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; border: 1px solid #10b981; }
  .hero-card-failed { background: linear-gradient(135deg, #3f0a12 0%, #b91c3c 100%); color: #fff; border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; border: 1px solid #f43f5e; }
  .badge-exam, .badge-approved { display: inline-block; background-color: #10b981; color: #fff; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 20px; margin-bottom: 4px; }
  .badge-failed { display: inline-block; background-color: #e11d48; color: #fff; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 20px; margin-bottom: 4px; }
  .score-box-exam, .score-box-approved, .score-box-failed { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.22); border-radius: 8px; padding: 6px 10px; text-align: center; }
  .hero-status-title { margin: 2px 0 0 0; font-size: 15pt; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
  .hero-subtitle { font-size: 8.5pt; color: #cbd5e1; margin: 2px 0 0 0; }
  .score-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #cbd5e1; font-weight: 700; }
  .score-value { font-size: 20pt; font-weight: 800; color: #fff; line-height: 1; }
  .progress-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.15); }
  .progress-title-table { width: 100%; margin-bottom: 6px; font-size: 8pt; color: #e2e8f0; }
  .progress-track-container { position: relative; height: 10px; background-color: rgba(255,255,255,0.15); border-radius: 5px; margin-bottom: 12px; }
  .progress-fill { position: absolute; left: 0; top: 0; height: 100%; border-radius: 5px; width: ${pctBarra}%; }
  .fill-exam { background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); }
  .fill-approved { background: linear-gradient(90deg, #10b981 0%, #34d399 100%); }
  .fill-failed { background: linear-gradient(90deg, #991b1b 0%, #f43f5e 100%); }
  .progress-marker { position: absolute; top: -3px; width: 16px; height: 16px; margin-left: -8px; background-color: #fff; border-radius: 50%; left: ${pctBarra}%; }
  .marker-exam { border: 3px solid #3b82f6; }
  .marker-approved { border: 3px solid #10b981; }
  .marker-failed { border: 3px solid #f43f5e; }
  .progress-scale-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; color: #cbd5e1; }
  .scale-pass-line { border-left: 1px dashed rgba(255,255,255,0.4); padding-left: 6px; color: #fff; font-weight: 600; }
  .msg-banner { background-color: rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; margin-top: 10px; font-size: 8.5pt; color: #f8fafc; line-height: 1.4; border: 1px solid rgba(255,255,255,0.2); }
  .badge-yellow { display: inline-block; background-color: #fef08a; color: #854d0e; font-weight: 800; font-size: 8.5pt; padding: 1px 7px; border-radius: 5px; }
  .badge-white { display: inline-block; background-color: rgba(255,255,255,0.2); color: #fff; font-weight: 700; font-size: 8.5pt; padding: 1px 6px; border-radius: 5px; }
  .badge-emerald { display: inline-block; background-color: #34d399; color: #022c22; font-weight: 800; font-size: 9pt; padding: 1px 8px; border-radius: 5px; }
  .badge-rose { display: inline-block; background-color: #f43f5e; color: #fff; font-weight: 800; font-size: 8.5pt; padding: 1px 7px; border-radius: 5px; }
  .footer { text-align: center; font-size: 7.5pt; font-variant: small-caps; letter-spacing: 0.8px; color: #a1a1aa; margin-top: 15px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
</style>
</head>
<body>
  <div class="top-accent-bar"></div>
  <table class="header-table">
    <tr>
      <td class="header-title-cell">
        <h1 class="main-title">Mi Progreso Académico</h1>
        <div class="meta-container">
          <div class="meta-line"><span class="meta-label">Asignatura:</span> <span class="meta-value-bold">${escapeHTML(nombreRamo)}</span></div>
          <div class="meta-line"><span class="meta-label">Fecha de reporte:</span> ${fechaGen}</div>
        </div>
      </td>
    </tr>
  </table>

  <div class="${cfg.heroClass}">
    <table class="hero-table">
      <tr>
        <td class="hero-left">
          <div class="${cfg.badgeClass}">${cfg.badgeTexto}</div>
          <h2 class="hero-status-title">${cfg.titulo}</h2>
          <p class="hero-subtitle">${cfg.subtitulo}</p>
        </td>
        <td class="hero-right">
          <div class="score-box-${escenario === 'exam' ? 'exam' : escenario === 'approved' ? 'approved' : 'failed'}">
            <div class="score-label">${etiquetaNota}</div>
            <div class="score-value">${notaMostrada.toFixed(2)}</div>
          </div>
        </td>
      </tr>
    </table>
    <div class="progress-section">
      <table class="progress-title-table">
        <tr>
          <td>Posición ${escenario === 'approved' ? 'final' : 'actual'} en escala académica</td>
          <td style="text-align: right; font-weight: 700; color: #ffffff;">${notaMostrada.toFixed(2)} / 7.0</td>
        </tr>
      </table>
      <div class="progress-track-container">
        <div class="progress-fill ${cfg.fillClass}"></div>
        <div class="progress-marker ${cfg.markerClass}"></div>
      </div>
      <table class="progress-scale-table">
        <tr>
          <td style="width: 50%;">1.0 (Mínima)</td>
          <td style="width: 20%;" class="scale-pass-line">${metaAprobacion.toFixed(1)} (Aprobación)</td>
          <td style="text-align: right;">7.0 (Máxima)</td>
        </tr>
      </table>
    </div>
    <div class="msg-banner ${cfg.bannerClass}">
      ${cfg.mensaje()}
    </div>
  </div>

  <div class="footer">Mi Progreso Académico &bull; Documento generado automáticamente solo para lectura e impresión</div>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=850,height=1100');
    if (!ventana) {
        alert('El navegador bloqueó la ventana del reporte. Permite ventanas emergentes para este sitio e intenta de nuevo.');
        return;
    }
    ventana.document.open();
    ventana.document.write(htmlReporte);
    ventana.document.close();
    ventana.document.title = `reporte-${(r.nombre || 'ramo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'ramo'}-${fechaArchivo}`;

    const imprimir = () => { ventana.focus(); ventana.print(); };
    if (ventana.document.readyState === 'complete') {
        setTimeout(imprimir, 150);
    } else {
        ventana.addEventListener('load', () => setTimeout(imprimir, 150));
    }
};

let _debounceTimers = {};
document.addEventListener('input', (e) => {
    const target = e.target;
    if (!(target.tagName === 'INPUT' || target.tagName === 'SELECT')) return;
    const card = target.closest('.ramo-card');
    if (!card) return;
    const resBox = card.querySelector('[id^="res-"]');
    if (!resBox) return;
    const ramoId = resBox.id.replace('res-', '');
    const r = ramos.find(x => x.id === ramoId);
    if (!r) return;
    clearTimeout(_debounceTimers[ramoId]);
    _debounceTimers[ramoId] = setTimeout(() => {
        // Persistir los valores "en vivo" aunque el usuario no salga del input (blur/change).
        guardarEnStorage();
        window.calcularRamoNuevo(ramoId, true);
    }, 150);
});

window.renderRamos = () => {
    const grid = document.getElementById('grid-ramos');

    const activeEl = document.activeElement;
    let focusId = null, selStart = null, selEnd = null;
    if (activeEl && grid && grid.contains(activeEl) && activeEl.id) {
        focusId = activeEl.id;
        if (typeof activeEl.selectionStart === 'number') {
            selStart = activeEl.selectionStart;
            selEnd = activeEl.selectionEnd;
        }
    }

    if (!grid) return;
    grid.innerHTML = '';
    actualizarBadgeRamos();

    if (ramos.length === 0) {
        grid.innerHTML = `<div class="vacio-msg"><h3>No hay ramos activos</h3><p>Marca un ramo como "cursando" en la Malla Curricular para empezar a calcular.</p></div>`;
        return;
    }
    ramos.forEach(r => {
        const cardNuevo = document.createElement('div');
        cardNuevo.className = 'ramo-card';
        cardNuevo.id = 'card-' + r.id;
        cardNuevo.innerHTML = renderCardNuevo(r);
        grid.appendChild(cardNuevo);
        window.actualizarVistaPesosCat(r.id);
    });

    if (focusId) {
        const nuevoEl = document.getElementById(focusId);
        if (nuevoEl) {
            nuevoEl.focus();
            if (selStart !== null && nuevoEl.setSelectionRange) {
                try { nuevoEl.setSelectionRange(selStart, selEnd); } catch (e) { /* input types como number no soportan selectionRange en algunos navegadores */ }
            }
        }
    }
};

/* ---- Puentes para sincronización en la nube (usados por el módulo de Firebase) ----
   Estas funciones permiten que el script de autenticación/Firestore recargue el
   estado en memoria (ramos, carreraActiva) después de escribir datos nuevos en
   localStorage, sin duplicar la lógica de carga que ya existe acá. */
window.recargarRamosDesdeStorage = () => {
    ramos = cargarJSON(LS_RAMOS, []);
    ramos.forEach(r => { if (r.tieneExamen === undefined) r.tieneExamen = true; if (r.promedioEjManual === undefined) r.promedioEjManual = ''; });
    renderRamos();
};