const fs = require('fs');
const path = require('path');

// Simple parser for local .env file (without committing secrets to git)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = process.env[key] || value.trim();
    }
  });
}

const cfg = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  gisClientId: process.env.GIS_CLIENT_ID || '',
  useEmulator: !!process.env.FIREBASE_USE_EMULATOR
};

const out = `window.__FIREBASE_CONFIG = ${JSON.stringify(cfg)};`;
fs.writeFileSync('js/__config__.js', out);
console.log('Wrote js/__config__.js');
