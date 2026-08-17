# Checklist de QA

Flujos críticos a probar antes de considerar el despliegue "listo". Marca cada caso con [x] al pasarlo.

## 0. Preparación
- [ ] `npm run build` genera `js/__config__.js` sin errores.
- [ ] `npm run serve` levanta el sitio localmente (puerto 8080).
- [ ] `npm run smoke-test` pasa (si falla con "fetch failed", usar `TEST_URL=http://127.0.0.1:8080/`).
- [ ] Consola de Firebase: reglas de Firestore desplegadas (`npx firebase deploy --only firestore:rules`).

## 1. Modo local / invitado (sin login)
- [ ] Al abrir la app aparece el overlay de login.
- [ ] "Usar en modo local (sin cuenta)" permite entrar sin autenticación.
- [ ] Los datos persisten al recargar la página (localStorage).
- [ ] El mensaje de estado de sync muestra algo apropiado en modo local.

## 2. Login con Google
- [ ] "Iniciar sesión con Google" abre el flujo popup/redirect y autentica.
- [ ] Después del login se muestra foto + nombre del usuario en el header.
- [ ] "Salir" cierra sesión y vuelve al overlay.
- [ ] En móvil: si se abre dentro de WhatsApp/Instagram, aparece la tarjeta "Abrí esta página en tu navegador".
- [ ] Dos cuentas distintas guardan estado separado (`usuarios/{uid}`).

## 3. Elección de carrera y malla
- [ ] El selector de carrera lista las carreras disponibles.
- [ ] Al elegir una carrera se renderiza la malla (mallaOficialModal abre y muestra semestres).
- [ ] Cambiar de carrera no pierde el estado de la anterior.

## 4. Mis Ramos (motor principal)
- [ ] Marcar un ramo de la malla como "cursando" crea su tarjeta en Mis Ramos.
- [ ] Marcar como "aprobado" mueve el ramo correctamente (deja de estar en cursando).
- [ ] Desmarcar/eliminar un ramo vuelve a dejarlo como pendiente en la malla (con confirmación).
- [ ] Los ramos se agregan desde la Malla Curricular (marcar como "cursando") y se eliminan con su tarjeta.
- [ ] Editar nombre, notas (cátedra/lab), pesos y cantidades recalcula el resultado en vivo.
- [ ] Botón "Calcular" muestra resultado (aprobado/reprobado/crítico) y proyección.
- [ ] Modo predictivo: se expande/colapsa y calcula la nota predicha.
- [ ] Cambiar tipo de ramo (carrera → cátedra/lab, etc.) ajusta el formulario.
- [ ] Toggle de examen, laboratorio, PAR y recuperativo actualiza el cálculo.
- [ ] Umbrales de eximición (config avanzada) se validan (nota 1-7).
- [ ] "📄 PDF" genera el reporte del ramo (se abre ventana de impresión/descarga).
- [ ] No hay errores en consola (F12) al usar estos controles.

## 5. Respaldo y restauración
- [ ] "⬇️ Descargar respaldo" descarga un `.json` con los ramos.
- [ ] "⬆️ Restaurar respaldo" pide confirmación mostrando la cantidad de ramos.
- [ ] Restaurar reemplaza el estado actual y vuelve a renderizar las tarjetas.
- [ ] Un archivo corrupto/no JSON muestra error sin romper la app.

## 6. Prerrequisitos
- [ ] Hacer clic en el ícono de prerrequisitos de un ramo abre el modal.
- [ ] Se pueden marcar/desmarcar prerrequisitos y el estado persiste.
- [ ] La malla refleja los prerrequisitos guardados (en la tarjeta del ramo).

## 7. Sincronización en la nube
- [ ] Con sesión iniciada, editar un ramo dispara la sincronización a Firestore.
- [ ] Abrir la misma cuenta en otro navegador recupera el estado remoto.
- [ ] Conflicto (mismo doc editado desde dos lugares): gana la versión más reciente y se avisa.
- [ ] Sin conexión: la app sigue funcionando y sincroniza al reconectarse (onSnapshot/visibilitychange).
- [ ] Error de Firestore (DB inexistente) no bloquea la app (modo offline).

## 8. CSP y seguridad
- [ ] No hay handlers inline (`onclick=`/`onchange=`) en `index.html` ni en templates generados por `js/app.js`.
- [ ] La consola no muestra errores de Content-Security-Policy.
- [ ] `js/__config__.js` no está commiteado (gitignored) y contiene los secrets del entorno.

## 9. Responsive y navegadores
- [ ] Chrome (desktop y móvil).
- [ ] Firefox.
- [ ] Safari (desktop y móvil).
- [ ] El diseño se ve bien en 360px, 768px y 1280px de ancho.
- [ ] El tutorial y los modales se abren/cierran y tienen focus trap.

## 10. Accesibilidad (básica)
- [ ] Navegación completa con teclado (Tab/Enter en modales y controles).
- [ ] Los modales tienen `aria-modal` y restauran el foco al cerrar.
- [ ] Estados de sync se anuncian (aria-live) o son visibles claramente.