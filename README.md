# Mi Progreso Académico — Despliegue en Vercel + Firebase

Este documento explica cómo desplegar la app estática en Vercel y configurar la integración con Firebase (Auth + Firestore) de forma segura.

## Resumen

- Hosting: Vercel (servir archivos estáticos).
- Auth: Firebase Authentication (Google Sign-In / GIS).
- Datos: Firestore (colección `usuarios/{uid}` donde se guarda el estado del usuario).
- Seguridad: evitar exponer credenciales en el repo; aplicar CSP.

---

## 1. Requisitos previos

- Cuenta en Firebase ([Firebase Console](https://console.firebase.google.com)).
- Cuenta en Vercel ([Vercel](https://vercel.com)) y acceso al repo (GitHub/GitLab/Bitbucket).
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

## 3. Configurar variables de entorno en Vercel (recomendado)

No dejes el `firebaseConfig` ni `GIS_CLIENT_ID` codificados en el repo. En Vercel: Project → Settings → Environment Variables.

Variables sugeridas:

- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- GIS_CLIENT_ID

---

## 4. Estrategia de build para inyectar variables

La app carga `js/cloud.js` como módulo.

Para evitar exponer valores en el repo, `npm run build` genera `js/__config__.js` con las variables desde el entorno (ver `scripts/write-config.js`).

En Vercel, el `vercel.json` define el build command (`npm run build`) y el directorio de salida (`.`).

---

## 5. Cabeceras y CSP

- `vercel.json` ya incluye las cabeceras CSP y de seguridad aplicadas a todas las rutas.
- Si necesitas otras cabeceras, edita `vercel.json`.

---

## 6. Pruebas locales y despliegue

Prueba localmente con un servidor estático:

```bash
npm run serve
```

Para desplegar en Vercel:

1. Conecta el repo (o sube manualmente con `npx vercel`).
1. Ajusta las Environment variables mencionadas.
1. `vercel.json` ya define build y output directory (raíz del repo).
1. Despliega.

---

## 7. Notas de seguridad y mantenimiento

- Nunca subas `js/__config__.js` con credenciales a un repo público.
- Revisa las reglas de Firestore después de desplegar.
- El archivo `.env` local no se sube al repo (ver `.gitignore`).

---

## 8. Comprobaciones rápidas posterior al deploy

- Inicio de sesión con Google funciona (popup/redirect según plataforma).
- Guardado y sincronización con Firestore funcionan en cuentas distintas (cada `usuarios/{uid}`).
- Cabeceras CSP y seguridad presentes (revisar en DevTools → Network → Response Headers).