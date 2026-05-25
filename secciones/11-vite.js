window.__SECC = window.__SECC || {};
window.__SECC["vite"] = `<h1>Vite, proxy y build</h1>
<p class="subtitulo">El servidor de desarrollo, el truco CORS y cómo empaquetar para producción.</p>

<p class="lead">Vite es la herramienta que pone en marcha el proyecto. En desarrollo te da un servidor con recarga instantánea; en producción genera una versión optimizada en <code>dist/</code>. En esta sección recorremos su <code>vite.config.js</code>, el proxy que evita CORS y los tres comandos del <code>package.json</code>.</p>

<h2>1. ¿Por qué Vite y no algo más simple?</h2>

<p>Tu navegador NO sabe leer JSX, ni ES Modules importando otros .jsx, ni archivos <code>.css</code> tan bonitos. Necesita un <strong>traductor</strong> que tome tu código y lo convierta en JavaScript "plano" que sí entiende. Eso es un <strong>bundler</strong>.</p>

<table>
  <tr><th>Bundler</th><th>Velocidad arranque</th><th>Configuración</th></tr>
  <tr><td>Webpack</td><td>Lento en proyectos grandes</td><td>Compleja (archivo gigante)</td></tr>
  <tr><td>Parcel</td><td>Medio</td><td>Cero config (pero menos flexible)</td></tr>
  <tr><td><strong>Vite</strong></td><td>Instantáneo</td><td>Pequeñísima</td></tr>
</table>

<p>Vite es rápido porque en desarrollo NO empaqueta nada: usa los ES Modules nativos del navegador y compila los archivos uno a uno, al vuelo, sólo cuando los pides.</p>

<h2>2. El <code>package.json</code></h2>

<div class="code-wrap">
  <span class="file-label">daweb/package.json</span>
<pre><code class="language-json">{
  "name": "daweb",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "bootstrap": "^5.3.8",
    "react": "^19.2.6",
    "react-bootstrap": "^2.10.10",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.15.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.12"
  }
}</code></pre>
</div>

<h3>Campos clave</h3>
<ul>
  <li><code>"type": "module"</code>: marca el proyecto como ES Modules (permite <code>import</code>/<code>export</code> en archivos JS).</li>
  <li><code>scripts</code>: comandos disponibles con <code>npm run &lt;nombre&gt;</code>.</li>
  <li><code>dependencies</code>: librerías necesarias en producción.</li>
  <li><code>devDependencies</code>: sólo en desarrollo (Vite, tipos de TypeScript, plugins).</li>
  <li>Las versiones empiezan por <code>^</code>: acepta actualizaciones menores (de 19.2.6 a 19.x.x) pero no mayores (no salta a 20).</li>
</ul>

<h2>3. <code>vite.config.js</code> en DaWeb</h2>

<div class="code-wrap">
  <span class="file-label">daweb/vite.config.js</span>
<pre><code class="language-js">import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        rewrite: (path) =&gt; path.replace(/^\\/api/, ''),
      },
      '/oauth2': {
        target: 'http://localhost:8090',
        changeOrigin: false,
      },
      '/login/oauth2': {
        target: 'http://localhost:8090',
        changeOrigin: false,
      },
    },
  },
})</code></pre>
</div>

<h3>Desglose</h3>
<table>
  <tr><th>Línea</th><th>Significado</th></tr>
  <tr><td><code>plugins: [react()]</code></td><td>Activa el soporte para JSX, Fast Refresh, etc.</td></tr>
  <tr><td><code>server.proxy['/api']</code></td><td>Cuando el frontend pide <code>/api/productos</code>, Vite reenvía a <code>http://localhost:8090/productos</code> (el rewrite quita el prefijo).</td></tr>
  <tr><td><code>changeOrigin: true</code></td><td>Modifica el header <code>Host</code> para que el backend reciba <code>localhost:8090</code>, no <code>localhost:5173</code>.</td></tr>
  <tr><td><code>'/oauth2'</code> y <code>'/login/oauth2'</code></td><td>Redirección directa (sin rewrite) para el flujo OAuth con GitHub.</td></tr>
</table>

<h2>4. El problema CORS y por qué necesitamos proxy</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-shield-exclamation"></i> Same-Origin Policy</div>
  <p>Por seguridad, los navegadores bloquean peticiones de JS desde un origen (ej. <code>http://localhost:5173</code>) a otro origen (ej. <code>http://localhost:8090</code>) salvo que el segundo responda con un header <code>Access-Control-Allow-Origin: ...</code>.</p>
</div>

<p>Hay dos formas de resolverlo:</p>

<ol>
  <li><strong>Configurar CORS en el backend</strong>: que el backend mande el header. Requiere tocar ArSo.</li>
  <li><strong>Proxy en el frontend</strong> (lo que hace DaWeb): el navegador NUNCA habla con <code>:8090</code>. Sólo con <code>:5173</code> (el propio Vite). El reenvío lo hace Vite por debajo, en el servidor (sin política CORS).</li>
</ol>

<h3>Flujo de una petición vía proxy</h3>
<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> <code>fetch('/api/productos')</code> desde el navegador.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> El navegador hace una petición a <code>http://localhost:5173/api/productos</code> (mismo origen, sin CORS).</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> Vite intercepta. Ve el prefijo <code>/api</code>. Lo reescribe quitándolo.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> Vite hace una petición SERVIDOR-A-SERVIDOR a <code>http://localhost:8090/productos</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> Recibe la respuesta del backend y la reenvía al navegador.</div>
</div>

<h2>5. Hot Module Replacement (HMR)</h2>
<p>Cuando guardas un cambio en un <code>.jsx</code>, Vite no recarga la página entera: recompila sólo ese módulo, lo envía al navegador por WebSocket y React lo "intercambia" en vivo conservando el estado.</p>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Pruébalo</div>
  <p>Abre una página con un contador (<code>ProductoCard</code> con tu botón "Me gusta" de la sección 03). Pulsa varias veces hasta llegar a 5. Modifica el JSX del botón. Tras guardar, el contador sigue en 5 — pero el estilo del botón cambió. Eso es HMR.</p>
</div>

<h2>6. Los tres comandos</h2>

<div class="dos-cols">
  <div class="tarjeta">
    <h4><code>npm run dev</code></h4>
    <p>Arranca el servidor de desarrollo en <code>http://localhost:5173</code>. HMR activo. <strong>Sólo para desarrollo</strong>: no es eficiente para producción.</p>
  </div>
  <div class="tarjeta">
    <h4><code>npm run build</code></h4>
    <p>Genera la versión final en <code>dist/</code>. Minifica JS, optimiza imágenes, hace tree-shaking (elimina código no usado), trocea por chunks. Producción.</p>
  </div>
  <div class="tarjeta">
    <h4><code>npm run preview</code></h4>
    <p>Sirve la carpeta <code>dist/</code> como lo haría un servidor real. Te permite comprobar que la versión de producción funciona antes de desplegarla.</p>
  </div>
  <div class="tarjeta">
    <h4><code>npm install</code></h4>
    <p>Lee <code>package.json</code> y baja todas las dependencias a <code>node_modules/</code>. Crea <code>package-lock.json</code> con las versiones exactas.</p>
  </div>
</div>

<h2>7. Qué pasa al hacer <code>npm run build</code></h2>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Vite lee <code>index.html</code> y desde ahí sigue todos los imports.</div>
  <div class="flujo-paso"><span class="num">2</span> Compila JSX → JS, agrupa módulos, minifica.</div>
  <div class="flujo-paso"><span class="num">3</span> Procesa los CSS y los une en uno o varios bundles.</div>
  <div class="flujo-paso"><span class="num">4</span> Copia <code>public/</code> tal cual (favicons, etc.).</div>
  <div class="flujo-paso"><span class="num">5</span> Genera <code>dist/index.html</code> con referencias hash a los assets.</div>
  <div class="flujo-paso"><span class="num">6</span> Resultado: una carpeta estática lista para subir a cualquier servidor.</div>
</div>

<h3>Estructura típica de <code>dist/</code></h3>
<div class="code-wrap">
<pre><code class="language-bash">dist/
├── index.html             ← entry point listo para servir
├── favicon.svg
└── assets/
    ├── index-AbCdEf12.js  ← código JS minificado
    ├── index-XyZ34uV5.css ← CSS minificado
    └── trato-Q9w8e7r6.jpg ← imagen optimizada</code></pre>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Los hashes en los nombres</div>
  <p>Cada vez que cambia el contenido, cambia el hash en el nombre del archivo. Esto permite que el navegador cachee los archivos para siempre: si cambian, su URL cambia y se vuelven a descargar.</p>
</div>

<h2>8. Diferencia desarrollo vs producción</h2>

<table>
  <tr><th>Desarrollo (<code>npm run dev</code>)</th><th>Producción (<code>npm run preview</code> / despliegue)</th></tr>
  <tr><td>Servidor Vite en :5173</td><td>Cualquier servidor estático (Nginx, S3, Vercel…)</td></tr>
  <tr><td>HMR</td><td>Sin HMR</td></tr>
  <tr><td>Sin minificar (más fácil de depurar)</td><td>Minificado</td></tr>
  <tr><td>Proxy a :8090</td><td>El frontend NO se sirve desde Vite. Las URLs <code>/api/...</code> deben llegar al backend de alguna otra forma (mismo dominio o CORS en backend).</td></tr>
</table>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> El proxy no existe en producción</div>
  <p>En producción no hay Vite. Para que <code>/api/...</code> funcione hay dos opciones: desplegar frontend y backend bajo el MISMO dominio (con Nginx que enrute <code>/api</code> al backend), o cambiar <code>API_BASE</code> al dominio real del backend Y configurar CORS allí.</p>
</div>

<h2>9. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>¿Qué hace realmente un bundler?</h3>
<p>El problema que soluciona: si tu app tiene 100 archivos JavaScript y cada uno hace <code>import</code> de otros, el navegador tendría que hacer 100 peticiones HTTP independientes para cargarlos. Cada petición tiene overhead (DNS, TCP, headers). Un bundler los une en uno o pocos archivos:</p>

<div class="code-wrap">
  <span class="file-label">sin bundler vs con bundler</span>
<pre><code class="language-text">Sin bundler (100 peticiones):      Con bundler — dist/ (2 peticiones):
main.jsx                           assets/index-AbCd12.js  (app completa)
├── App.jsx                        assets/vendor-XyZ34.js  (React + librerías)
├── Header.jsx
├── Productos.jsx                  1-2 peticiones en lugar de 100+
└── ...                            Código minificado y optimizado</code></pre>
</div>

<p>Vite en desarrollo NO hace bundling: usa los ES Modules nativos del navegador. Cada archivo se sirve por separado pero Vite los transforma al vuelo con esbuild (escrito en Go, 10-100× más rápido que los transformadores JS). Esto hace que el arranque sea instantáneo.</p>

<h3>Tree shaking: el bundler elimina lo que no usas</h3>
<p>Si importas solo lo que necesitas, el bundler puede eliminar el resto de la librería del bundle final:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Import específico (tree shakeable)</h4>
<pre><code class="language-jsx">// Solo Button y Card entran en el bundle
import { Button, Card } from 'react-bootstrap';

// Solo el icono BsSearch entra
import { BsSearch } from 'react-icons/bs';</code></pre>
  </div>
  <div class="tarjeta">
    <h4>Import de todo (sin tree shaking)</h4>
<pre><code class="language-jsx">// Toda react-bootstrap entra (mucho más grande)
import ReactBootstrap from 'react-bootstrap';

// Todos los iconos entran
import * as Icons from 'react-icons/bs';</code></pre>
  </div>
</div>

<p>DaWeb usa imports nombrados de <code>react-bootstrap</code> y <code>react-icons/bs</code> precisamente para beneficiarse de tree shaking. El bundle final contiene solo los componentes e iconos que se usan realmente.</p>

<h3>Hot Module Replacement (HMR): cómo funciona internamente</h3>
<p>Cuando guardas un cambio en un <code>.jsx</code>:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Vite detecta el cambio mediante el sistema de ficheros.</div>
  <div class="flujo-paso"><span class="num">2</span> Recompila <strong>solo ese módulo</strong> (y sus dependientes directos), no toda la app.</div>
  <div class="flujo-paso"><span class="num">3</span> Vite envía el módulo actualizado al navegador por <strong>WebSocket</strong> (visible en DevTools → Network → WS).</div>
  <div class="flujo-paso"><span class="num">4</span> El plugin React (<code>@vitejs/plugin-react</code>) usa React Fast Refresh para actualizar el componente <strong>sin desmontar el árbol</strong>.</div>
  <div class="flujo-paso"><span class="num">5</span> El estado del componente se preserva. Un contador en 5 sigue en 5 tras cambiar el estilo del botón.</div>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Cuándo el HMR NO puede preservar el estado</div>
  <p>Si cambias la <em>estructura</em> del estado (añades/quitas un <code>useState</code>, cambias el tipo de un valor), React Fast Refresh tiene que reiniciar el componente para que el estado sea coherente con el nuevo código. Lo verás como una recarga parcial de ese componente específico.</p>
</div>

<h3>Variables de entorno en Vite: la regla <code>VITE_</code></h3>
<p>Vite expone variables de entorno al cliente solo si empiezan por <code>VITE_</code>. Variables sin ese prefijo son solo del servidor (proceso Node) y no llegan al bundle del navegador:</p>

<div class="code-wrap">
<pre><code class="language-bash"># .env
VITE_API_URL=/api       # se expone al cliente
DB_PASSWORD=secreto     # NO se expone (no empieza por VITE_)</code></pre>
</div>

<div class="code-wrap">
<pre><code class="language-jsx">// En cualquier componente o módulo JS
const base   = import.meta.env.VITE_API_URL;  // '/api'
const esDev  = import.meta.env.DEV;            // true en npm run dev
const esProd = import.meta.env.PROD;           // true en npm run build</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Secretos en variables VITE_</div>
  <p>Todo lo que empieza por <code>VITE_</code> se incluye literalmente en el bundle JavaScript. Cualquiera puede abrir DevTools → Sources y buscar el valor. <strong>Nunca poner claves API, contraseñas o secrets</strong> en variables <code>VITE_</code>. Solo URLs y configuración pública.</p>
</div>

<h3><code>npm run build</code> paso a paso</h3>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Vite lee <code>vite.config.js</code> para la configuración (plugins, aliases, etc.).</div>
  <div class="flujo-paso"><span class="num">2</span> Empieza desde el entry point (<code>index.html</code> → <code>src/main.jsx</code>) y sigue todos los imports recursivamente (el "grafo de módulos").</div>
  <div class="flujo-paso"><span class="num">3</span> Transforma JSX → JS estándar (esbuild, extremadamente rápido).</div>
  <div class="flujo-paso"><span class="num">4</span> Aplica tree shaking: elimina exports no usados.</div>
  <div class="flujo-paso"><span class="num">5</span> Minifica: elimina espacios, acorta nombres de variables, comprime strings.</div>
  <div class="flujo-paso"><span class="num">6</span> Genera hash de contenido en el nombre del archivo (<code>index-AbCd12.js</code>). Si el contenido no cambia entre builds, el hash tampoco → el navegador puede cachear indefinidamente.</div>
  <div class="flujo-paso"><span class="num">7</span> Escribe todo en <code>dist/</code>.</div>
</div>

<h3>El proxy NO existe en producción: las dos soluciones</h3>
<p>El proxy de Vite (<code>vite.config.js</code>) solo funciona con <code>npm run dev</code>. En producción el frontend es una carpeta estática de archivos, sin lógica de proxy. Para que <code>/api/...</code> funcione hay dos opciones:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Opción 1: Nginx como proxy inverso</h4>
<pre><code class="language-nginx">server {
  listen 80;
  root /var/www/daweb/dist;
  # SPA: cualquier ruta → index.html
  location / {
    try_files $uri $uri/ /index.html;
  }
  # Proxy de API al backend
  location /api/ {
    proxy_pass http://localhost:8090/;
  }
}</code></pre>
    <p>Frontend y backend en el mismo dominio. El navegador nunca ve el cambio de origen. Sin CORS.</p>
  </div>
  <div class="tarjeta">
    <h4>Opción 2: CORS habilitado en el backend</h4>
<pre><code class="language-text">Frontend en:
  https://daweb.ejemplo.com

Backend en:
  https://api.daweb.ejemplo.com

Backend añade:
  Access-Control-Allow-Origin:
    https://daweb.ejemplo.com
  Access-Control-Allow-Headers:
    Authorization, Content-Type

Frontend cambia API_BASE:
  'https://api.daweb.ejemplo.com'</code></pre>
    <p>Flexible para microservicios. Requiere configuración CORS explícita en el backend.</p>
  </div>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué pasaría si subieras la carpeta <code>dist/</code> tal cual a un servidor sin configurar?"</strong> — Las páginas estáticas (<code>/</code>, <code>/login</code>) funcionarían si el usuario navega desde la home. Pero si recarga en <code>/productos/42</code>, el servidor busca el archivo <code>/productos/42</code>, no lo encuentra y devuelve 404. Además, todas las llamadas a <code>/api/...</code> fallarían porque no hay proxy que las redirija al backend.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué Vite es tan rápido en desarrollo comparado con webpack?"</strong> — Vite NO empaqueta en desarrollo. Sirve los módulos ES nativos directamente al navegador, uno por uno, transformando JSX al vuelo con esbuild (escrito en Go, 10-100× más rápido que los transformadores JS). Webpack lee el proyecto entero y genera un bundle antes de servir nada. En proyectos grandes, Vite arranca en &lt;1s; webpack puede tardar 30-60s.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué diferencia hay entre <code>npm run dev</code> y <code>npm run preview</code>?"</strong> — <code>dev</code> arranca Vite con HMR, source maps y proxy; los módulos se sirven sin bundling. <code>preview</code> sirve la carpeta <code>dist/</code> como un servidor estático sin HMR ni proxy — simula el entorno de producción. Si algo falla en <code>preview</code> pero no en <code>dev</code>, es un bug específico de la build (tree shaking agresivo, variables de entorno mal configuradas, etc.).</p>
</div>

<h2>10. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">Por qué <code>/api</code> y no <code>http://localhost:8090</code> en las URLs del proyecto?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Porque <code>localhost</code> no se puede usar.</button>
    <button class="quiz-opcion" data-correcta="1">Para mantener el mismo origen del frontend y dejar que Vite haga el proxy (evita CORS).</button>
    <button class="quiz-opcion" data-correcta="0">Porque <code>/api</code> es más corto y se escribe antes.</button>
    <button class="quiz-opcion" data-correcta="0">Por SEO.</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. Y bonus: en producción puedes cambiar a qué URL apunta /api sin tocar nada del frontend." data-ko="Si fuera URL completa de otro origen, el navegador bloquearía la petición por CORS."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué hace <code>rewrite: (path) =&gt; path.replace(/^\\/api/, '')</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Convierte el path en JSON.</button>
    <button class="quiz-opcion" data-correcta="1">Quita el prefijo <code>/api</code> al reenviar al backend (así <code>/api/productos</code> llega como <code>/productos</code>).</button>
    <button class="quiz-opcion" data-correcta="0">Añade <code>/api</code> dos veces.</button>
    <button class="quiz-opcion" data-correcta="0">Reemplaza la URL completa.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. El backend no sabe nada de '/api'; ese prefijo es sólo una convención del frontend." data-ko="La regex /^\\\\/api/ busca el prefijo /api al principio y lo elimina."></p>
</div>

<h2>11. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Cambiar el puerto del servidor de desarrollo</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <p>Modifica <code>vite.config.js</code>:</p>
<pre><code class="language-js">export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,         // ⬅ añade esto
    proxy: { ... }
  },
})</code></pre>
  <p>Para el dev server y arráncalo de nuevo. Ahora la web vive en <code>http://localhost:3000</code>.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Cambiar el target del proxy</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Imagina que ahora el backend ArSo corre en el puerto 9000. Modifica <code>vite.config.js</code> cambiando todos los <code>target: 'http://localhost:8090'</code> por <code>target: 'http://localhost:9000'</code>.</p>
  <p>Reinicia el dev server (cambios en <code>vite.config.js</code> NO se aplican con HMR).</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Generar la build</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <ol>
    <li>Ejecuta <code>npm run build</code>.</li>
    <li>Mira la carpeta <code>dist/</code>: lista su contenido.</li>
    <li>Ejecuta <code>npm run preview</code>. Abre la URL que indica (suele ser <code>http://localhost:4173</code>).</li>
    <li>Comprueba que la web funciona igual (excepto las llamadas al backend, porque <code>preview</code> NO tiene proxy).</li>
  </ol>
  <details>
    <summary>Solución para que funcione el backend en preview</summary>
    <p>Añade al config: <code>preview: { proxy: { '/api': { target: 'http://localhost:8090', rewrite: ... } } }</code></p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Añadir una nueva regla de proxy</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Imagina que tienes un segundo microservicio en <code>http://localhost:7000</code> que sirve imágenes en <code>/imagenes</code>. Añade al proxy:</p>
<pre><code class="language-js">'/imagenes': {
  target: 'http://localhost:7000',
  changeOrigin: true,
},</code></pre>
  <p>Ahora <code>&lt;img src="/imagenes/foo.jpg" /&gt;</code> traería la imagen desde el otro servicio sin problemas CORS.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 5</span>
    <span>Variables de entorno</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Vite soporta archivos <code>.env</code>. Crea <code>daweb/.env</code>:</p>
<pre><code class="language-bash">VITE_API_URL=/api
VITE_PUERTO_BACKEND=8090</code></pre>
  <p>Y en cualquier <code>.js</code> léelo:</p>
<pre><code class="language-js">const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl);</code></pre>
  <details>
    <summary>Reglas</summary>
    <ul>
      <li>Sólo las variables que empiezan por <code>VITE_</code> se exponen al cliente.</li>
      <li>Crea <code>.env.development</code> y <code>.env.production</code> para diferenciar entornos.</li>
      <li><strong>Nunca</strong> pongas secretos ahí: cualquier valor expuesto al cliente es público.</li>
    </ul>
  </details>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Para la entrevista</div>
  <p>Pregunta típica: "¿qué pasa cuando arrancas el proyecto?". Respuesta-modelo: "Ejecuto <code>npm run dev</code>. Vite levanta un servidor en :5173 con HMR, sirve <code>index.html</code> y compila <code>main.jsx</code> al vuelo. Las llamadas a <code>/api/...</code> las intercepta el proxy configurado en <code>vite.config.js</code> y las redirige al backend ArSo en :8090. En producción haría <code>npm run build</code>, obtendría <code>dist/</code> y lo serviría con un servidor estático, configurando el routing del backend bien con un proxy de Nginx o bien con CORS abierto en ArSo."</p>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-trophy"></i> ¡Has llegado al final!</div>
  <p>Ya conoces de punta a punta todas las tecnologías del proyecto: HTML, JS moderno, React (componentes, hooks, contexto), React Router, CSS responsivo, llamadas HTTP, autenticación JWT y OAuth, rutas protegidas, cada página y su funcionamiento, y Vite como herramienta de build. Vuelve a la sección que necesites con <span class="kbd">Ctrl</span>+<span class="kbd">K</span> para la entrevista. ¡Suerte!</p>
</div>
`;
