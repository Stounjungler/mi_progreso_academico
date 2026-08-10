// Simple smoke test: fetch the app root and check for main markers.
const url = process.env.TEST_URL || 'http://localhost:8080/';

async function run() {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('Mi Progreso Académico')) throw new Error('Missing app title');
    if (!text.includes('id="appRoot"')) throw new Error('Missing #appRoot');
    console.log('SMOKE TEST OK — app root reachable and basic markers present');
    process.exit(0);
  } catch (e) {
    console.error('SMOKE TEST FAILED:', e.message || e);
    process.exit(2);
  }
}

run();
