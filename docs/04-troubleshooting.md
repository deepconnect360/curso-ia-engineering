# 04 — Troubleshooting

Problemas frecuentes, su causa y cómo resolverlos.

---

## El curso no carga en WordPress

**Síntomas:** página en blanco, error 404 en los assets, o solo el header de WordPress.

**Causas y soluciones:**

1. **El build no está en la ruta correcta.**
   Verifica que en `/wp-content/uploads/curso-ia/` existe `index.html` y la
   carpeta `assets/`. Si no, ejecuta `npm run build` y sube `dist/`.

2. **La plantilla no está asignada a la página.**
   En WordPress, edita la página del curso → Atributos → Plantilla → selecciona
   "Curso IA Engineering".

3. **La plantilla no está en el tema.**
   Verifica que `template-curso-ia.php` está en `/wp-content/themes/TU-TEMA/`.

4. **El tema no soporta plantillas de página.**
   Algunos constructores (Elementor, Divi) gestionan las plantillas de forma
   distinta. Consulta la documentación de tu tema.

---

## Error 403 en las llamadas a la REST API

**Síntomas:** en la consola del navegador aparece `HTTP 403` en peticiones a
`/wp-json/curso-ia/v1/...`.

**Causas y soluciones:**

1. **Nonce expirado.** El alumno tiene la página abierta hace más de 12 horas.
   El alumno debe recargar la página. El Heartbeat debería evitar esto —
   comprueba que el plugin está activo y que el tema no desactiva el Heartbeat.

2. **El alumno no está logueado.** Verifica que WordPress tiene la sesión activa.

3. **El plugin no está activado.** Plugins → comprueba que "Curso IA Engineering
   — Progreso" aparece como activo.

4. **Conflicto con plugin de caché.** Algunos plugins de caché (W3TC, WP Rocket)
   interceptan las peticiones REST. Añade `/wp-json/` a las exclusiones de caché.

---

## Error 403 en el proxy de Vercel

**Síntomas:** el chat no responde y en la consola aparece `HTTP 403` en la
llamada al proxy.

**Causa:** `ALLOWED_ORIGIN` en Vercel no coincide con el dominio de WordPress.

**Solución:**
1. En Vercel → Settings → Environment Variables
2. Verifica que `ALLOWED_ORIGIN` es exactamente `https://tudominio.com`
   (sin barra final, con `https://`)
3. Redeploya (Deployments → Redeploy)

---

## El proxy responde 500

**Síntomas:** el chat falla con error 500.

**Causas y soluciones:**

1. **Falta la API key.** En Vercel → Environment Variables → verifica que
   `ANTHROPIC_API_KEY` está configurada y empieza por `sk-ant-`.

2. **La API key es incorrecta o está revocada.** Genera una nueva en
   [console.anthropic.com](https://console.anthropic.com).

3. **Saldo agotado en Anthropic.** Revisa tu cuenta en la consola de Anthropic.

---

## El progreso no se guarda entre sesiones

**Síntomas:** el alumno recarga y el progreso ha desaparecido.

**Causas y soluciones:**

1. **`window.CursoIAConfig` no existe.** Abre la consola del navegador y
   escribe `window.CursoIAConfig`. Si es `undefined`, la plantilla PHP no está
   inyectando la configuración. Verifica que la página usa la plantilla correcta.

2. **El plugin no está activo.** Comprueba que el plugin está activado en WordPress.

3. **Error en las llamadas REST.** En la consola del navegador, busca errores
   en peticiones a `/wp-json/curso-ia/v1/`. Si hay un 401, el alumno no está
   logueado cuando intenta guardar.

4. **Usuario no logueado.** Si el plugin de membresía no fuerza el login antes
   de cargar la página, el alumno puede ver el curso sin estar logueado y el
   progreso no se asocia a ninguna cuenta. Asegúrate de que la plantilla redirige
   al login si no hay sesión (ya está en la plantilla por defecto).

---

## El Heartbeat no refresca el nonce

**Síntomas:** después de varias horas, las guardados de progreso empiezan a
fallar con 403.

**Causas y soluciones:**

1. **El Heartbeat está desactivado por un plugin de rendimiento.**
   Plugins como Perfmatters o Heartbeat Control pueden desactivarlo fuera del
   admin. Configúralos para que permitan el Heartbeat en el frontend, o
   añade una excepción para la página del curso.

2. **El tema no llama a `wp_footer()`.** El Heartbeat necesita que el script
   esté en cola. Verifica que tu plantilla o tema incluye `wp_footer()` al final.

3. **jQuery no está cargado.** El Heartbeat depende de jQuery. Comprueba en la
   consola que `window.jQuery` existe.

---

## El evaluador aprueba sin emitir la etiqueta

**Síntomas:** el instructor certifica al alumno en el chat pero la semana no se
desbloquea y el expediente no se actualiza.

**Soluciones:**

1. **Usa "Solicitar evaluación"**: el botón fuerza al instructor a emitir la
   etiqueta `[EVALUACIÓN: APROBADO]` en el formato exacto.

2. **Usa el override del especialista**: en el detalle de la semana o en la
   cabecera del chat, el enlace "override del especialista · aprobar manualmente"
   marca la semana como aprobada directamente.

---

## El certificado no abre la ventana de impresión

**Síntomas:** al pulsar "Descargar como PDF" no ocurre nada o aparece un aviso.

**Causa:** el navegador está bloqueando las ventanas emergentes (pop-ups).

**Solución:** el usuario debe permitir pop-ups para el dominio del curso.
En Chrome: icono de la barra de direcciones → "Ventanas emergentes bloqueadas" →
"Permitir siempre ventanas emergentes de [dominio]".

---

## Cómo depurar en general

```js
// En la consola del navegador:
window.CursoIAConfig           // Debe tener nonce, restUrl, userId, userName
window.jQuery                  // Debe existir para el Heartbeat
```

```bash
# En el servidor, logs de WordPress (si tienes acceso SSH):
tail -f /var/log/nginx/error.log
tail -f /wp-content/debug.log  # activa WP_DEBUG en wp-config.php
```

Para activar el log de WordPress:
```php
// En wp-config.php:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
```
