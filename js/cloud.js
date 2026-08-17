/* PARTE 4 — CUENTA Y SINCRONIZACIÓN EN LA NUBE (Firebase Auth + Firestore)
   Extraído de index.html como módulo. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, signOut, onAuthStateChanged, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
    getFirestore, doc, getDoc, onSnapshot, runTransaction, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// firebaseConfig is injected at build/runtime into `window.__FIREBASE_CONFIG` by `scripts/write-config.js`.
const injected = window.__FIREBASE_CONFIG || {};
const firebaseConfig = {
    apiKey: injected.apiKey || '',
    authDomain: injected.authDomain || '',
    projectId: injected.projectId || '',
    storageBucket: injected.storageBucket || '',
    messagingSenderId: injected.messagingSenderId || '',
    appId: injected.appId || ''
};

const GIS_CLIENT_ID = (window.__FIREBASE_CONFIG && window.__FIREBASE_CONFIG.gisClientId) || '';
const USE_EMULATOR = (window.__FIREBASE_CONFIG && window.__FIREBASE_CONFIG.useEmulator) || false;

// If running with the emulator and no apiKey was injected, provide a harmless fallback
if (USE_EMULATOR && !firebaseConfig.apiKey) {
    firebaseConfig.apiKey = 'fake-api-key-for-emulator';
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// If using emulator, connect client SDK to local emulator endpoints
if (USE_EMULATOR) {
    try {
        // Auth emulator expects full URL
        connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    } catch (e) { console.warn('connectAuthEmulator failed', e); }
    try {
        connectFirestoreEmulator(db, '127.0.0.1', 8081);
    } catch (e) { console.warn('connectFirestoreEmulator failed', e); }
}
const proveedorGoogle = new GoogleAuthProvider();

async function manejarCredencialGoogle(respuesta) {
    const msg = document.getElementById('loginEstadoMsg');
    if (msg) msg.textContent = '';
    try {
        const credential = GoogleAuthProvider.credential(respuesta.credential);
        await signInWithCredential(auth, credential);
    } catch (e) {
        console.error(e);
        if (msg) msg.textContent = 'No se pudo iniciar sesión. Intenta de nuevo.';
    }
}
window.manejarCredencialGoogle = manejarCredencialGoogle;

function inicializarGoogleIdentity() {
    const boton = document.getElementById('googleButtonDiv');
    const fallback = document.getElementById('btnLoginGoogle');

    function mostrarFallback() {
        if (fallback) {
            fallback.classList.remove('hidden');
            fallback.style.display = 'inline-block';
        }
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id || !GIS_CLIENT_ID) {
        mostrarFallback();
        return;
    }
    try {
        google.accounts.id.initialize({
            client_id: GIS_CLIENT_ID,
            callback: manejarCredencialGoogle,
            auto_select: false,
            ux_mode: 'popup'
        });
        if (boton) {
            google.accounts.id.renderButton(boton, {
                type: 'standard', theme: 'filled_blue', size: 'large',
                text: 'continue_with', shape: 'rectangular', width: 300
            });
        }
    } catch (e) {
        console.error('Google Identity error:', e);
        mostrarFallback();
    }
}
if (window.google && window.google.accounts && window.google.accounts.id) {
    inicializarGoogleIdentity();
} else {
    window.addEventListener('load', inicializarGoogleIdentity);
}

// If running against the emulator, show emulator login UI and wire email/password handlers
if (USE_EMULATOR) {
    const emBox = document.getElementById('emulatorLogin');
    const emMsg = document.getElementById('emMsg');
    if (emBox) emBox.style.display = 'block';

    const emSignUp = document.getElementById('btnEmSignUp');
    const emSignIn = document.getElementById('btnEmSignIn');
    const emEmail = document.getElementById('emEmail');
    const emPass = document.getElementById('emPass');

    if (emSignUp) emSignUp.addEventListener('click', async () => {
        try {
            emMsg.textContent = 'Creando cuenta…';
            await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js').then(m => {
                const { getAuth, createUserWithEmailAndPassword } = m;
                const authClient = getAuth();
                createUserWithEmailAndPassword(authClient, emEmail.value, emPass.value).then(() => { emMsg.textContent = 'Cuenta creada.'; }).catch(e => { emMsg.textContent = e.message; });
            });
        } catch (e) { console.error(e); if (emMsg) emMsg.textContent = e.message || 'Error'; }
    });

    if (emSignIn) emSignIn.addEventListener('click', async () => {
        try {
            emMsg.textContent = 'Iniciando…';
            await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js').then(m => {
                const { getAuth, signInWithEmailAndPassword } = m;
                const authClient = getAuth();
                signInWithEmailAndPassword(authClient, emEmail.value, emPass.value).then(() => { emMsg.textContent = 'Sesión iniciada.'; }).catch(e => { emMsg.textContent = e.message; });
            });
        } catch (e) { console.error(e); if (emMsg) emMsg.textContent = e.message || 'Error'; }
    });
}

const LS_RAMOS = 'malla_unif_ramos';
const LS_CARRERA = 'malla_unif_carrera_activa';
const LS_PREFIX_ESTADO = 'malla_unif_estado_';
const LS_PREFIX_PREREQ = 'malla_unif_prereq_';
const LS_PREFIX_LINK = 'malla_unif_link_';
const LS_UID_DUENO = 'malla_unif_uid_dueno';

let usuarioActual = null;
let tokenSesionActual = 0;
let ultimaVersionConocida = null;
let unsubscribeNube = null;
let timerSincronizacion = null;
let aplicandoDesdeNube = false;
// Se activa cuando Firestore no está disponible (reglas no desplegadas, DB no
// creada, sin conexión). Evita reintentar sincronización en cada guardado y
// que la consola se llene de errores 403 repetidos.
let syncDeshabilitado = false;

function cargarJSONLocal(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
}
function guardarJSONLocal(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function recolectarEstadoCompleto() {
    const estados = {}, prereqs = {}, links = {};
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(LS_PREFIX_ESTADO)) estados[key.replace(LS_PREFIX_ESTADO, '')] = cargarJSONLocal(key, {});
        else if (key.startsWith(LS_PREFIX_PREREQ)) prereqs[key.replace(LS_PREFIX_PREREQ, '')] = cargarJSONLocal(key, {});
        else if (key.startsWith(LS_PREFIX_LINK)) links[key.replace(LS_PREFIX_LINK, '')] = cargarJSONLocal(key, {});
    });
    return {
        ramos: cargarJSONLocal(LS_RAMOS, []),
        carreraActiva: localStorage.getItem(LS_CARRERA) || 'sin_asignar',
        estados, prereqs, links,
        actualizadoEn: Date.now()
    };
}

function limpiarEstadoLocal() {
    localStorage.removeItem(LS_RAMOS);
    localStorage.removeItem(LS_CARRERA);
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(LS_PREFIX_ESTADO) || key.startsWith(LS_PREFIX_PREREQ) || key.startsWith(LS_PREFIX_LINK)) {
            localStorage.removeItem(key);
        }
    });
    if (window.recargarRamosDesdeStorage) window.recargarRamosDesdeStorage();
    if (window.recargarCarreraDesdeStorage) window.recargarCarreraDesdeStorage();
}

function aplicarEstadoCompleto(data) {
    if (!data) return;
    aplicandoDesdeNube = true;

    guardarJSONLocal(LS_RAMOS, data.ramos || []);
    const carreraRemota = data.carreraActiva || 'sin_asignar';
    // Ignorar carreras que ya no existen en la app (p. ej. se eliminó Minas).
    if (typeof window.carrerasExistentes === 'function' && window.carrerasExistentes().includes(carreraRemota)) {
        localStorage.setItem(LS_CARRERA, carreraRemota);
    } else if (carreraRemota !== 'sin_asignar') {
        localStorage.setItem(LS_CARRERA, 'computacion');
    } else {
        localStorage.setItem(LS_CARRERA, carreraRemota);
    }

    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(LS_PREFIX_ESTADO) || key.startsWith(LS_PREFIX_PREREQ) || key.startsWith(LS_PREFIX_LINK)) {
            localStorage.removeItem(key);
        }
    });
    Object.entries(data.estados || {}).forEach(([carreraId, val]) => guardarJSONLocal(LS_PREFIX_ESTADO + carreraId, val));
    Object.entries(data.prereqs || {}).forEach(([carreraId, val]) => guardarJSONLocal(LS_PREFIX_PREREQ + carreraId, val));
    Object.entries(data.links || {}).forEach(([carreraId, val]) => guardarJSONLocal(LS_PREFIX_LINK + carreraId, val));

    if (window.recargarRamosDesdeStorage) window.recargarRamosDesdeStorage();
    if (window.recargarCarreraDesdeStorage) window.recargarCarreraDesdeStorage();

    aplicandoDesdeNube = false;
}

function mostrarEstadoSync(texto, esError) {
    const el = document.getElementById('syncEstado');
    if (!el) return;
    el.textContent = texto;
    el.classList.toggle('sync-error', !!esError);
    let btnRetry = document.getElementById('syncRetryBtn');
    if (esError) {
        if (!btnRetry) {
            btnRetry = document.createElement('button');
            btnRetry.id = 'syncRetryBtn';
            btnRetry.type = 'button';
            btnRetry.className = 'sync-retry-btn';
            btnRetry.textContent = 'Reintentar';
            btnRetry.onclick = () => { if (usuarioActual) onAuthStateChanged(auth, () => {}); location.reload(); };
            el.insertAdjacentElement('afterend', btnRetry);
        }
    } else if (btnRetry) {
        btnRetry.remove();
    }
}

function programarSincronizacionNube() {
    if (!usuarioActual || aplicandoDesdeNube || syncDeshabilitado) return;
    mostrarEstadoSync('Guardando…');
    clearTimeout(timerSincronizacion);
    timerSincronizacion = setTimeout(() => {
        timerSincronizacion = null;
        subirEstadoActual();
    }, 1200);
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSincronizacionPendiente();
});
window.addEventListener('pagehide', flushSincronizacionPendiente);

function flushSincronizacionPendiente() {
    if (syncDeshabilitado) return;
    if (timerSincronizacion) {
        clearTimeout(timerSincronizacion);
        timerSincronizacion = null;
        subirEstadoActual();
    }
}

async function subirEstadoActual() {
    if (!usuarioActual || syncDeshabilitado) return;
    const refDoc = doc(db, 'usuarios', usuarioActual.uid);
    try {
        let huboConflicto = false;
        await runTransaction(db, async (transaction) => {
            const snapRemoto = await transaction.get(refDoc);
            const remoto = snapRemoto.exists() ? snapRemoto.data() : null;
            if (remoto && ultimaVersionConocida && remoto.actualizadoEn > ultimaVersionConocida) {
                huboConflicto = true;
                return;
            }
            const nuevoEstado = recolectarEstadoCompleto();
            transaction.set(refDoc, nuevoEstado);
            ultimaVersionConocida = nuevoEstado.actualizadoEn;
        });

        if (huboConflicto) {
            const snapRemoto = await getDoc(refDoc);
            if (snapRemoto.exists()) {
                aplicarEstadoCompleto(snapRemoto.data());
                ultimaVersionConocida = snapRemoto.data().actualizadoEn || null;
            }
            mostrarEstadoSync('Actualizado desde otro dispositivo');
            return;
        }

        mostrarEstadoSync('Sincronizado ✓');
    } catch (e) {
        // Sin Firestore disponible (reglas sin desplegar, DB no creada, red) no
        // tiene sentido reintentar en cada cambio: se deshabilita la sync y se
        // avisa una sola vez, para no inundar la consola con 403 repetidos.
        const esPermiso = e && (e.code === 'permission-denied' || e.code === 'unavailable' || e.code === 'not-found');
        if (esPermiso) {
            if (!syncDeshabilitado) {
                syncDeshabilitado = true;
                console.warn('Sincronización deshabilitada: Firestore no está disponible (reglas no desplegadas o DB sin crear). La app sigue funcionando en modo local.');
            }
            mostrarEstadoSync('Sin sincronización (modo local)', false);
            return;
        }
        console.error(e);
        mostrarEstadoSync('Error al sincronizar', true);
    }
}

window.notificarCambioParaNube = () => programarSincronizacionNube();

window.modoInvitadoActivo = false;

function mostrarOverlayLogin(mostrar) {
    const esVisible = (mostrar === true || mostrar === 'true');
    // NOTA: no tocar `modoInvitadoActivo` aquí. Ese flag solo lo maneja
    // entrarModoInvitado (true), onAuthStateChanged con usuario (false) y
    // cerrarSesionUsuario (false). Antes, mostrarOverlayLogin(false) lo ponía
    // en true aunque hubiera un usuario logueado, y si la sesión expiraba el
    // overlay de login nunca volvía a aparecer.
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.style.setProperty('display', esVisible ? 'flex' : 'none', 'important');
    }

    document.documentElement.classList.toggle('sesion-bloqueada', esVisible);

    Array.from(document.body.children).forEach((el) => {
        if (el === overlay) return;
        if (esVisible) {
            el.setAttribute('inert', '');
        } else {
            el.removeAttribute('inert');
        }
    });

    if (!esVisible && typeof window.recargarCarreraDesdeStorage === 'function') {
        window.recargarCarreraDesdeStorage();
    }
}

// Exponer control desde UI (delegador) para abrir/cerrar overlay
window.mostrarOverlayLogin = mostrarOverlayLogin;

// Función dedicada para entrar en modo invitado (sin cuenta)
// Se llama desde data-action="entrarModoInvitado" en el botón del login overlay
window.entrarModoInvitado = function() {
    window.modoInvitadoActivo = true;
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.setProperty('display', 'none', 'important');
    document.documentElement.classList.remove('sesion-bloqueada');
    document.querySelectorAll('[inert]').forEach(el => el.removeAttribute('inert'));
    if (typeof window.recargarCarreraDesdeStorage === 'function') {
        window.recargarCarreraDesdeStorage();
    }
    const msg = document.getElementById('loginEstadoMsg');
    if (msg) msg.textContent = '';
    console.log('Modo invitado activado');
};

// Exponer info de usuario para uso desde UI si es necesario
window.mostrarInfoUsuario = mostrarInfoUsuario;

// UI wrappers para mostrar mensajes y desactivar botones mientras se procesa
window.uiRequestSignIn = async function () {
    const btn = document.getElementById('btnLoginGoogle');
    const msg = document.getElementById('loginEstadoMsg');
    if (msg) msg.textContent = 'Iniciando sesión…';
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    try {
        if (typeof window.iniciarSesionConGoogle === 'function') {
            await window.iniciarSesionConGoogle();
        }
    } catch (e) {
        console.error(e);
        if (msg) msg.textContent = 'Error iniciando sesión.';
    } finally {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
    }
};

window.uiRequestSignOut = async function () {
    const btn = document.getElementById('btnGestionarCuenta');
    const sync = document.getElementById('syncEstado');
    if (sync) sync.textContent = 'Cerrando sesión…';
    if (btn) btn.disabled = true;
    try {
        if (typeof window.cerrarSesionUsuario === 'function') await window.cerrarSesionUsuario();
    } catch (e) {
        console.error(e);
        if (sync) sync.textContent = 'Error al cerrar sesión';
    } finally {
        if (btn) btn.disabled = false;
    }
};

// Botón siempre visible en el header para gestionar la cuenta:
// - con sesión activa cierra la sesión y muestra el overlay para cambiar de cuenta
//   o entrar en modo invitado;
// - sin sesión (modo invitado) muestra directamente el overlay de login.
window.uiGestionarCuenta = function () {
    if (usuarioActual) {
        window.uiRequestSignOut();
    } else {
        mostrarOverlayLogin(true);
    }
};

(function () {
    const origen = document.querySelector('.header-brand');
    const destino = document.getElementById('ttLogos');
    if (origen && destino) destino.innerHTML = origen.innerHTML;
})();

function mostrarInfoUsuario(user) {
    const cont = document.getElementById('usuarioInfo');
    if (!cont) return;
    if (user) {
        document.getElementById('usuarioFoto').src = user.photoURL || '';
        document.getElementById('usuarioNombre').textContent = user.displayName || user.email || '';
        cont.classList.remove('hidden');
        cont.style.display = 'flex';
    } else {
        cont.classList.add('hidden');
        cont.style.display = 'none';
    }
}

const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

window.iniciarSesionConGoogle = async () => {
    const msg = document.getElementById('loginEstadoMsg');
    if (msg) msg.textContent = 'Procesando inicio de sesión...';
    try {
        if (esMovil) {
            await signInWithRedirect(auth, proveedorGoogle);
            return;
        }
        await signInWithPopup(auth, proveedorGoogle);
    } catch (e) {
        console.error('Firebase Auth Error:', e);
        let mensajeError = 'No se pudo iniciar sesión. Intenta de nuevo.';
        if (e && e.code === 'auth/unauthorized-domain') {
            mensajeError = `Dominio no autorizado (${window.location.hostname}). Añádelo en Firebase Console > Auth > Settings > Authorized domains.`;
        } else if (e && e.code === 'auth/popup-closed-by-user') {
            mensajeError = 'Ventana de inicio de sesión cerrada antes de completar.';
        } else if (e && e.code === 'auth/operation-not-allowed') {
            mensajeError = 'El proveedor de Google no está habilitado en tu consola de Firebase.';
        } else if (e && e.message) {
            mensajeError = e.message;
        }
        if (msg) msg.textContent = mensajeError;
    }
};

getRedirectResult(auth).then((result) => {
    // Solo actuar si hay un resultado real de redirect
    if (result && result.user) {
        console.log('Redirect login exitoso:', result.user.email);
    }
}).catch((e) => {
    // Solo mostrar error si hubo un intento de redirect real (no en cargas normales)
    if (e && e.code && e.code !== 'auth/popup-closed-by-user') {
        console.warn('getRedirectResult error (puede ser normal en carga inicial):', e.code);
    }
});

window.cerrarSesionUsuario = async () => {
    window.modoInvitadoActivo = false;
    if (unsubscribeNube) { unsubscribeNube(); unsubscribeNube = null; }
    await signOut(auth);
    mostrarOverlayLogin(true);
};

onAuthStateChanged(auth, async (user) => {
    const miToken = ++tokenSesionActual;
    usuarioActual = user;
    if (unsubscribeNube) { unsubscribeNube(); unsubscribeNube = null; }

    if (!user) {
        if (!window.modoInvitadoActivo) {
            mostrarOverlayLogin(true);
        }
        mostrarInfoUsuario(null);
        return;
    }

    window.modoInvitadoActivo = false;
    mostrarInfoUsuario(user);
    mostrarEstadoSync('Cargando…');

    const uidDueno = localStorage.getItem(LS_UID_DUENO);
    if (uidDueno && uidDueno !== user.uid) {
        limpiarEstadoLocal();
    }

    const refDoc = doc(db, 'usuarios', user.uid);
    let snap;
    try {
        snap = await getDoc(refDoc);
    } catch (e) {
        if (!syncDeshabilitado) {
            syncDeshabilitado = true;
            console.warn('Firestore no disponible (puede que no esté creada la DB o reglas sin desplegar):', e.message || e);
        }
        if (miToken !== tokenSesionActual) return;
        mostrarEstadoSync('Sin sincronización (modo local)', false);
        // Aún así cerrar el overlay y dejar usar la app localmente
        mostrarOverlayLogin(false);
        localStorage.setItem(LS_UID_DUENO, user.uid);
        return;
    }

    if (miToken !== tokenSesionActual) return;
    syncDeshabilitado = false;

    let esPrimeraVezEstaCuenta = false;
    if (snap.exists()) {
        aplicarEstadoCompleto(snap.data());
        ultimaVersionConocida = snap.data().actualizadoEn || null;
    } else {
        esPrimeraVezEstaCuenta = true;
        await subirEstadoActual();
        if (miToken !== tokenSesionActual) return;
    }
    localStorage.setItem(LS_UID_DUENO, user.uid);
    mostrarEstadoSync('Sincronizado ✓');
    mostrarOverlayLogin(false);

    if (esPrimeraVezEstaCuenta) {
        setTimeout(() => {
            const modal = document.getElementById('tutorialModal');
            if (modal) modal.style.display = 'flex';
        }, 400);
    }

    unsubscribeNube = onSnapshot(refDoc, (docSnap) => {
        if (miToken !== tokenSesionActual) return;
        if (!docSnap.exists()) return;
        if (docSnap.metadata.hasPendingWrites) return;

        const actualizadoEnRemoto = docSnap.data().actualizadoEn || null;
        if (actualizadoEnRemoto && actualizadoEnRemoto === ultimaVersionConocida) return;

        aplicarEstadoCompleto(docSnap.data());
        ultimaVersionConocida = actualizadoEnRemoto;
        mostrarEstadoSync('Actualizado desde otro dispositivo');
    });
});
