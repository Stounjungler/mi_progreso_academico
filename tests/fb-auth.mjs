// Stub de firebase-auth para el harness de tests (T13). No toca producción.
// Guarda el callback de onAuthStateChanged para poder simular login desde el test.
export const __authState = { __cb: null };

export function getAuth() { return __authState; }
export function GoogleAuthProvider() { return {}; }
export function signInWithPopup() { return Promise.resolve({}); }
export function signInWithRedirect() { return Promise.resolve(); }
export function getRedirectResult() { return Promise.resolve(null); }
export function signInWithCredential() { return Promise.resolve({}); }
export function signOut() { return Promise.resolve(); }
export function onAuthStateChanged(auth, cb) {
    __authState.__cb = cb;
    return () => { __authState.__cb = null; };
}
export function connectAuthEmulator() {}
