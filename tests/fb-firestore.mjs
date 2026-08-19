// Stub de firebase-firestore para el harness de tests (T13). No toca producción.
//
// COBERTURA QUE EL STUB SÍ PRETENDE MODELAR:
//   - doc/coleccion/id  -> referencia serializable
//   - getDoc / txn.get  -> snapshot desde un "almacén" en memoria clave=coleccion/id
//   - txn.set           -> escritura inmediata en el almacén
//   - runTransaction    -> ejecuta el callback de forma atómica (una sola vez)
//   - onSnapshot        -> devuelve unsubscribe y NO invoca el callback
//
// COMPORTAMIENTO REAL DE FIRESTORE QUE EL STUB NO MODELA (y por lo tanto NO queda
// cubierto por T13):
//   - Atomicidad real entre operaciones de la transacción (rollback ante fallo a
//     mitad de camino). Aquí el callback corre síncrono y si lanza, nada se aplica.
//   - Reintentos de runTransaction por contención de versión. Aquí corre 1 sola vez.
//   - Errores de permisos REALES: se simulan con __failNext({ code: 'permission-denied' }).
//     No se verifica contra el servidor real ni el mensaje exacto de la API.
//   - Latencia/red: subirEstadoActual/onAuthStateChanged corren sin delay.
//   - onSnapshot en tiempo real (cambios remotos) no se ejerce.
//   - El emulador (connectFirestoreEmulator) no se usa (USE_EMULATOR=false).
export const __store = {};
let __fail = null; // { op: 'runTransaction' | 'getDoc', err }

export function __reset() {
    for (const k of Object.keys(__store)) delete __store[k];
    __fail = null;
}
export function __failNext(op, err) { __fail = { op, err }; }

export function getFirestore() { return {}; }
export function connectFirestoreEmulator() {}
export function doc(db, collection, id) { return { __type: 'ref', collection, id }; }

const keyDe = (ref) => `${ref.collection}/${ref.id}`;

export async function getDoc(ref) {
    if (__fail && __fail.op === 'getDoc') { const e = __fail.err; __fail = null; throw e; }
    const snap = __store[keyDe(ref)];
    return {
        exists: () => snap !== undefined,
        data: () => (snap !== undefined ? JSON.parse(JSON.stringify(snap)) : null),
        metadata: { hasPendingWrites: false },
    };
}

export async function runTransaction(db, fn) {
    if (__fail && __fail.op === 'runTransaction') { const e = __fail.err; __fail = null; throw e; }
    const txn = {
        async get(ref) { return getDoc(ref); },
        async set(ref, data) { __store[keyDe(ref)] = JSON.parse(JSON.stringify(data)); },
        async update(ref, data) { Object.assign(__store[keyDe(ref)] || {}, JSON.parse(JSON.stringify(data))); },
        async delete(ref) { delete __store[keyDe(ref)]; },
    };
    return fn(txn);
}

export function onSnapshot(ref, cb) {
    return () => {};
}
