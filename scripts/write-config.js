const fs = require('fs');

const cfg = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyCKLk2d35soUmINSgNNndw5ti9rnttcJqY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'mi-proyecto-academico.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'mi-proyecto-academico',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mi-proyecto-academico.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '84097857916',
  appId: process.env.FIREBASE_APP_ID || '1:84097857916:web:820091b7c4783fbcc50cf9',
  gisClientId: process.env.GIS_CLIENT_ID || '',
  useEmulator: !!process.env.FIREBASE_USE_EMULATOR
};

const out = `window.__FIREBASE_CONFIG = ${JSON.stringify(cfg)};`;
fs.writeFileSync('js/__config__.js', out);
console.log('Wrote js/__config__.js');
