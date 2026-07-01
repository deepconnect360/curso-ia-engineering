# 02 — Guía de instalación completa

Tiempo estimado: 2–3 horas la primera vez.

## Requisitos previos

- Dominio propio apuntando a tu hosting
- Acceso FTP o panel de archivos del hosting
- Cuenta en [Vercel](https://vercel.com) (gratuita)
- Cuenta en [GitHub](https://github.com) (gratuita)
- API key de Anthropic (`sk-ant-...`)
- Node.js 18+ instalado en tu máquina local

---

## Paso 1 — Repositorio en GitHub

```bash
# Clona o sube este repo a GitHub
git init
git add .
git commit -m "inicio: curso ia engineering"
git remote add origin https://github.com/TU-USUARIO/curso-ia-engineering.git
git push -u origin main
```

---

## Paso 2 — Desplegar el proxy en Vercel

El proxy protege tu API key. Debe estar en marcha antes que el curso.

1. Entra en [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repositorio de GitHub
3. Vercel detecta Vite automáticamente. En **Root Directory** escribe: `curso-app`
4. En **Environment Variables** añade:
   ```
   ANTHROPIC_API_KEY   =  sk-ant-api03-XXXXXXXXXX
   ALLOWED_ORIGIN      =  https://tudominio.com
   ```
5. Pulsa **Deploy**

Anota la URL del despliegue: `https://tu-proyecto.vercel.app`

---

## Paso 3 — Instalar WordPress

1. Desde el panel de tu hosting, instala WordPress (la mayoría tienen instalador
   de 1 clic: Softaculous, Installatron, etc.)
2. Apunta tu dominio al hosting si aún no lo has hecho (DNS → A record)
3. Completa la instalación de WordPress y accede al panel (`/wp-admin`)

---

## Paso 4 — Plugin de membresía y pago

Instala uno de estos (recomendado: **Paid Memberships Pro** es gratuito y robusto):

- **Paid Memberships Pro**: Plugins → Añadir nuevo → busca "Paid Memberships Pro"
- **MemberPress**: de pago, más pulido, misma función

Configura:
1. Un nivel de membresía de pago (ej. "Alumno del curso")
2. WooCommerce o Stripe para cobrar (PMPro tiene integración directa con Stripe)
3. Crea una Página en WordPress llamada "Curso" — **la proteges en el paso 7**

---

## Paso 5 — Instalar el mini-plugin del curso

El plugin registra los endpoints REST donde se guarda el progreso del alumno.

1. En tu máquina local, ve a la carpeta `wordpress/curso-ia-progreso/`
2. Sube la carpeta completa por FTP a:
   ```
   /wp-content/plugins/curso-ia-progreso/
   ```
3. En WordPress: **Plugins → Plugins instalados** → activa **Curso IA Engineering — Progreso**

Verifica que los endpoints están activos abriendo en el navegador:
```
https://tudominio.com/wp-json/curso-ia/v1/progress
```
Deberías ver `{"code":"rest_forbidden",...}` — correcto, significa que el endpoint
existe y requiere autenticación.

---

## Paso 6 — Configurar el curso para que apunte al proxy

Abre `curso-app/src/CursoIA.jsx` y en la línea 9 cambia:

```js
// Antes (mismo dominio Vercel):
const API_PROXY_URL = "/api/chat";

// Después (WordPress en dominio diferente a Vercel):
const API_PROXY_URL = "https://tu-proyecto.vercel.app/api/chat";
```

---

## Paso 7 — Generar el build y subirlo a WordPress

```bash
cd curso-app
npm install
npm run build
```

Esto genera la carpeta `curso-app/dist/`. Súbela por FTP a:
```
/wp-content/uploads/curso-ia/
```

La estructura en el servidor debe quedar:
```
wp-content/uploads/curso-ia/
    index.html
    assets/
        index-XXXXXXXX.js
        index-XXXXXXXX.css   (si existe)
```

---

## Paso 8 — Instalar la plantilla de página

1. Sube `wordpress/template-curso-ia.php` por FTP a la carpeta de tu tema activo:
   ```
   /wp-content/themes/TU-TEMA/template-curso-ia.php
   ```
2. En WordPress, ve a la Página "Curso" que creaste en el paso 4
3. En el panel derecho → **Atributos de página → Plantilla** → selecciona
   **Curso IA Engineering**
4. Guarda la página

---

## Paso 9 — Proteger la página con el plugin de membresía

En Paid Memberships Pro:
1. Edita la página "Curso"
2. En la sección de PMPro: activa "Requerir membresía" → selecciona el nivel
   de pago que configuraste en el paso 4
3. Guarda

Solo los alumnos que hayan pagado podrán acceder a la página del curso.

---

## Paso 10 — Desactivar la barrera de código del artifact

Como WordPress ya controla el acceso, la barrera de código del curso es redundante.
En `curso-app/src/CursoIA.jsx`, busca:

```js
const [unlocked, setUnlocked] = useState(false);
```

Cámbialo a:

```js
const [unlocked, setUnlocked] = useState(true);
```

Regenera el build (`npm run build`) y sube la carpeta `dist/` de nuevo.

---

## Paso 11 — Verificación final

Abre la página del curso con una cuenta de alumno de pago y comprueba:

- [ ] La página carga el curso correctamente
- [ ] El instructor responde en el chat
- [ ] El progreso se guarda: aprueba una semana de prueba y recarga la página
- [ ] El expediente se genera al recibir un veredicto
- [ ] La conversación persiste al recargar
- [ ] El nonce se refresca (abre la consola del navegador y espera ~120s; no
      deberías ver errores 403)

---

## Resumen de URLs y rutas importantes

| Qué                         | Dónde                                              |
|-----------------------------|----------------------------------------------------|
| Plugin del curso            | `/wp-content/plugins/curso-ia-progreso/`           |
| Plantilla                   | `/wp-content/themes/TU-TEMA/template-curso-ia.php` |
| Build del curso             | `/wp-content/uploads/curso-ia/`                    |
| Endpoints REST              | `https://tudominio.com/wp-json/curso-ia/v1/`       |
| Proxy Vercel                | `https://tu-proyecto.vercel.app/api/chat`          |
| Panel WP                    | `https://tudominio.com/wp-admin`                   |
