// Use Firebase Admin SDK to interact with Auth + Firestore emulators reliably.
// This avoids REST path mismatches between emulator versions.
const adminApp = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
(async () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-no-project';
  // Ensure emulator env vars are set (defaults)
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

  console.log('Initializing Firebase Admin with projectId:', projectId);
  adminApp.initializeApp({ projectId });

  const email = `testuser+${Date.now()}@example.local`;
  const password = 'password123';

  console.log('Creating user in Auth emulator:', email);
  const auth = getAuth();
  const userRecord = await auth.createUser({ email, password });
  const uid = userRecord.uid;
  console.log('Created uid:', uid);

  console.log('Writing document to Firestore emulator usuarios/' + uid);
  const firestore = getFirestore();
  await firestore.doc(`usuarios/${uid}`).set({
    ramos: [],
    carreraActiva: 'sin_asignar',
    actualizadoEn: Date.now()
  });

  console.log('Write OK. Emulator auth+firestore flow test PASSED');
  process.exit(0);
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(2);
});
