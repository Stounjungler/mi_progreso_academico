# Mi Progreso Académico — Despliegue en Netlify + Firebase

Este documento explica cómo desplegar la app estática en Netlify y configurar la integración con Firebase (Auth + Firestore) de forma segura.

## Resumen

- Hosting: Netlify (servir archivos estáticos desde la rama principal).
- Auth: Firebase Authentication (Google Sign-In / GIS).
- Datos: Firestore (colección `usuarios/{uid}` donde se guarda el estado del usuario).
- Seguridad: evitar exponer credenciales en el repo; aplicar CSP y SRI cuando sea posible.

---

## 1. Requisitos previos

- Cuenta en Firebase ([Firebase Console](https://console.firebase.google.com)).
- Cuenta en Netlify ([Netlify](https://app.netlify.com)) y acceso al repo (GitHub/GitLab/Bitbucket) o subir manualmente.
- Node.js (para pasos opcionales de build/bundle).

---

## 2. Preparar Firebase

1. Crea un nuevo proyecto en Firebase console y anota el `projectId`.

1. En Authentication → Sign-in method → habilita Google.

1. En Firestore Database crea una base en modo 'production' (modo de prueba solo temporalmente).

1. Reglas recomendadas para que cada usuario solo acceda a su documento (Firestore):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

1. En Project settings → Web apps → añade una app web y copia la configuración (`apiKey`, `authDomain`, `projectId`, etc.).

---

## 3. Configurar variables de entorno en Netlify (recomendado)

No dejes el `firebaseConfig` ni `GIS_CLIENT_ID` codificados en el repo. En Netlify: Site → Site settings → Build & deploy → Environment → Environment variables.

Variables sugeridas:

- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- GIS_CLIENT_ID

Opcional: empaquetar como JSON en una sola variable `FIREBASE_CONFIG` si prefieres.

---

## 4. Estrategia de build para inyectar variables (ejemplo simple)

La app carga `js/cloud.js` como módulo.

Para evitar exponer valores en el repo, genera en el build un pequeño archivo `js/__config__.js` con las variables desde el entorno.

Ejemplo de script Node (`scripts/write-config.js`):

```js
const fs = require('fs');
const cfg = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  gisClientId: process.env.GIS_CLIENT_ID
};
fs.writeFileSync('js/__config__.js', `window.__FIREBASE_CONFIG = ${JSON.stringify(cfg)};`);
```

En `index.html` antes de `js/cloud.js` importa el archivo generado (será servido desde `js/__config__.js`).

En `package.json` añade un paso de build:

```json
"scripts": {
  "build:config": "node scripts/write-config.js",
  "build": "npm run build:config && echo 'no-op'"
}
```

En Netlify, configura el comando de build para ejecutar `npm run build`.

---

## 5. Netlify: cabeceras y CSP

- Ya se incluye `_headers` con las cabeceras CSP y de seguridad. Netlify aplicará esas cabeceras al servir el sitio.

- Si usas otras cabeceras, actualiza `_headers` o `netlify.toml`.

Ejemplo mínimo `netlify.toml`:

```toml
[build]
  publish = "."
  command = "npm run build"

[[redirects]]
  from = "/admin/*"
  to = "/admin/index.html"
  status = 200
```

---

## 6. SRI y recursos externos

- Para recursos de terceros (CDNs), añade `integrity` y `crossorigin="anonymous"` cuando sea viable.

- Google Fonts y Google Identity cambian con frecuencia; si quieres SRI, descarga y sirve localmente o usa un bundler.

- Ver `SRI_RECOMMENDATIONS.txt` para más detalles.

---

## 7. Pruebas locales y despliegue

Prueba localmente con un servidor estático (por ejemplo `serve` o `http-server`):

```bash
npm install -g serve
serve -s .
# ó
npx http-server -c-1 .
```

Para desplegar en Netlify:

1. Conecta el repo (o arrastra el zip desde la UI).

1. Ajusta las Environment variables mencionadas.

1. Establece `build command` a `npm run build` (o vacío si no tienes build) y `publish directory` a `.` (raíz del repo).

1. Despliega.

---

## 8. Notas de seguridad y mantenimiento

- Nunca subas `js/__config__.js` con credenciales a un repo público.
- Revisa las reglas de Firestore después de desplegar.
- Si uses SRI, prepárate a actualizar hashes cuando actualices dependencias externas.

---

## 9. Comprobaciones rápidas posterior al deploy

- Inicio de sesión con Google funciona (popup/redirect según plataforma).
- Guardado y sincronización con Firestore funcionan en cuentas distintas (cada `usuarios/{uid}`).
- Cabeceras CSP y seguridad presentes (revisar en DevTools → Network → Response Headers).

---

Si quieres, puedo:

- Generar el script `scripts/write-config.js` y añadirlo al `package.json`.
- Empaquetar el SDK de Firebase para poder aplicar SRI a los assets.
- Preparar un `netlify.toml` más avanzado con reglas de cacheo.
