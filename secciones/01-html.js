window.__SECC = window.__SECC || {};
window.__SECC["html"] = `<h1>HTML y el punto de entrada</h1>
<p class="subtitulo">El primer milisegundo de la web: del URL al primer pixel.</p>

<p class="lead">Toda web empieza por un fichero HTML. En proyectos React ese fichero es <strong>mínimo</strong>: una caja vacía y un script. Lo que importa no es cuánto HTML hay, sino qué hace el navegador con él. Vamos a recorrer toda esa cadena en orden: usuario teclea URL → el HTML llega → se parsea → arranca React → primer render.</p>

<h2>1. La historia del primer render, paso a paso</h2>

<p>Antes de leer una sola etiqueta, ten en la cabeza esta secuencia. Es la misma cada vez que alguien entra en la web.</p>

<figure class="diagrama">
  <figcaption>Pipeline desde URL hasta primer paint</figcaption>
  <pre class="mermaid">
sequenceDiagram
  autonumber
  participant U as Usuario
  participant N as Navegador
  participant V as Vite Dev Server
  U->>N: Teclea http://localhost:5173/
  N->>V: GET /
  V-->>N: index.html (50 líneas)
  Note over N: Parser HTML → árbol DOM
  N->>V: GET fuentes (Google, Bootstrap Icons) + main.jsx
  V-->>N: CSS → CSSOM (en paralelo)
  V-->>N: main.jsx ya transpilado
  N->>N: Ejecuta main.jsx
  N->>N: createRoot(#root).render(&lt;App /&gt;)
  N->>N: React monta App, JSX → DOM
  Note over N: Layout + Paint → primer pixel
  </pre>
</figure>

<div class="tip-regla">
  Memoriza el orden: <strong>HTML → DOM → CSSOM → Render Tree → Layout → Paint</strong>. Si te preguntan "por qué se ve la página en blanco un instante", la respuesta vive en uno de estos pasos.
</div>

<h2>2. ¿Qué es HTML, mentalmente?</h2>

<p>HTML (HyperText Markup Language) es un lenguaje de <em>etiquetas</em>. El navegador lo lee de arriba abajo y construye un <strong>árbol</strong> en memoria llamado <strong>DOM</strong> (Document Object Model). Cada etiqueta es un nodo, igual que un árbol genealógico:</p>

<div class="code-wrap">
  <span class="file-label">ejemplo.html — la pieza mínima</span>
<pre><code class="language-html">&lt;!doctype html&gt;
&lt;html lang="es"&gt;
  &lt;head&gt;
    &lt;title&gt;Hola&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;Hola, mundo&lt;/h1&gt;
    &lt;p&gt;Bienvenido a la web.&lt;/p&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
</div>

<p>JavaScript puede luego manipular ese árbol en vivo: añadir hijos, cambiar texto, borrar nodos. React es básicamente un <em>generador</em> automatizado de esas manipulaciones.</p>

<h2>3. El <code>index.html</code> de DaWeb, comentado</h2>

<p>Está en <code>daweb/daweb/index.html</code>. Es muy corto: una caja vacía y un script de entrada.</p>

<div class="code-wrap">
  <span class="file-label">daweb/index.html</span>
<pre><code class="language-html">&lt;!doctype html&gt;
&lt;html lang="es"&gt;
  &lt;head&gt;
    &lt;meta charset="utf-8" /&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0" /&gt;
    &lt;link rel="icon" type="image/svg+xml" href="/favicon.svg" /&gt;
    &lt;link rel="preconnect" href="https://fonts.googleapis.com" /&gt;
    &lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /&gt;
    &lt;link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&amp;display=swap" rel="stylesheet" /&gt;
    &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" /&gt;
    &lt;title&gt;DaWeb Reventas&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;div id="root"&gt;&lt;/div&gt;
    &lt;script type="module" src="/src/main.jsx"&gt;&lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
</div>

<h3>Línea a línea, en orden de carga</h3>

<table>
  <tr><th>Línea</th><th>Qué hace y por qué importa</th></tr>
  <tr><td><code>&lt;!doctype html&gt;</code></td><td>Le dice al navegador "esto es HTML5". Sin esto entra en modo <em>quirks</em> (compatibilidad antigua) y heredas bugs de los 90.</td></tr>
  <tr><td><code>&lt;html lang="es"&gt;</code></td><td>Idioma para buscadores, lectores de pantalla y corrector ortográfico del navegador.</td></tr>
  <tr><td><code>&lt;meta charset="utf-8"&gt;</code></td><td>Codificación: UTF-8 soporta tildes, eñes, emojis. Sin esto verías "â€™" en lugar de "'".</td></tr>
  <tr><td><code>&lt;meta name="viewport" ...&gt;</code></td><td><strong>Imprescindible</strong> en móvil: dice que el ancho lógico = ancho del dispositivo. Sin esto el móvil hace zoom-out automático.</td></tr>
  <tr><td><code>&lt;link rel="icon"&gt;</code></td><td>Favicon de la pestaña.</td></tr>
  <tr><td><code>&lt;link rel="preconnect"&gt;</code></td><td>Pista al navegador: "abre TCP+TLS con esa CDN cuanto antes". Ahorra 100-200 ms en la primera carga.</td></tr>
  <tr><td><code>&lt;link href=".../Google+Sans+Flex..."&gt;</code></td><td>CSS con declaraciones <code>@font-face</code> que apuntan a los archivos de fuente.</td></tr>
  <tr><td><code>&lt;link href=".../bootstrap-icons..."&gt;</code></td><td>Familia de iconos. Por eso luego escribes <code>&lt;i class="bi bi-search"&gt;</code>.</td></tr>
  <tr><td><code>&lt;title&gt;</code></td><td>Texto de la pestaña. También título por defecto en marcadores.</td></tr>
  <tr><td><code>&lt;div id="root"&gt;&lt;/div&gt;</code></td><td>⭐ <strong>La caja donde React inyecta toda la web.</strong> Único acoplamiento entre el HTML y el JS.</td></tr>
  <tr><td><code>&lt;script type="module" src="/src/main.jsx"&gt;</code></td><td>Carga el JS de entrada. <code>type="module"</code> activa ES Modules y aplica <em>defer</em> implícito.</td></tr>
</table>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> La gran idea</div>
  <p>El HTML de una SPA es <strong>casi vacío</strong>. Toda la interfaz se monta luego con JavaScript. Es la diferencia con una web tradicional, donde el servidor envía HTML completo y JS sólo añade interactividad.</p>
</div>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-diagram-3"></i> SOLID · SRP (Single Responsibility)</span>
  <p>El <code>&lt;div id="root"&gt;</code> tiene UNA sola responsabilidad: ser punto de anclaje de React. No metas markup propio dentro, no le pongas estilos directos, no le añadas otros scripts inline. Si lo haces, mezclas dos contratos (HTML estático + React) y React acabará pisándolo.</p>
</div>

<h2>4. El arranque de React: <code>src/main.jsx</code></h2>

<p>El script de entrada es minúsculo. Hace lo justo: importa lo necesario, encuentra el <code>#root</code> y le dice a React "monta aquí".</p>

<div class="code-wrap">
  <span class="file-label">src/main.jsx</span>
<pre><code class="language-jsx">import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'  // CSS global como side-effect
import './index.css'
import './theme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  &lt;StrictMode&gt;
    &lt;App /&gt;
  &lt;/StrictMode&gt;,
)</code></pre>
</div>

<h3>Cada línea, traducida a humano</h3>

<div class="tabla-wrap">
<table class="anotada">
  <tr>
    <td class="code">import { StrictMode } from 'react'</td>
    <td class="nota"><strong>StrictMode</strong> es un componente que avisa de prácticas obsoletas o efectos mal escritos durante desarrollo. En producción no hace nada.</td>
  </tr>
  <tr>
    <td class="code">import { createRoot } from 'react-dom/client'</td>
    <td class="nota"><strong>react-dom</strong> es el puente entre React y el DOM real. <code>createRoot</code> es la API moderna (React 18+) para iniciar una app concurrent-ready.</td>
  </tr>
  <tr>
    <td class="code">import 'bootstrap/.../bootstrap.min.css'</td>
    <td class="nota">Import sin variable = se ejecuta por su <strong>efecto secundario</strong> (inyectar CSS en el head). Vite lo procesa al bundlear.</td>
  </tr>
  <tr>
    <td class="code">import App from './App.jsx'</td>
    <td class="nota">Trae el componente raíz. Por convención el archivo y el componente comparten nombre.</td>
  </tr>
  <tr>
    <td class="code">createRoot(document.getElementById('root')).render(...)</td>
    <td class="nota">"Coge la caja con id <code>root</code> y dibuja dentro este árbol". Único punto donde React conecta con el DOM real.</td>
  </tr>
</table>
</div>

<h2>5. ¿Por qué <code>type="module"</code> es especial?</h2>

<p>Aquí está la mitad de la magia que permite que el script viva en el <code>&lt;head&gt;</code> sin bloquear nada. Los módulos ES no son como los scripts clásicos:</p>

<table>
  <tr><th>Característica</th><th>Script clásico</th><th><code>type="module"</code></th></tr>
  <tr><td>Bloquea el parser HTML</td><td>Sí, si no tiene <code>defer</code>/<code>async</code></td><td><strong>Nunca</strong> (defer implícito)</td></tr>
  <tr><td>Modo estricto</td><td>Opcional (<code>'use strict'</code>)</td><td>Siempre activado</td></tr>
  <tr><td><code>import</code> / <code>export</code></td><td>SyntaxError</td><td>Funciona</td></tr>
  <tr><td>Scope</td><td>Global (variables son <code>window.x</code>)</td><td>Local al módulo</td></tr>
  <tr><td>Cuándo se ejecuta</td><td>Inmediatamente al descargar</td><td>Cuando el DOM ya está construido</td></tr>
</table>

<div class="tip-regla">
  <strong><code>type="module"</code> ⇒ defer gratis.</strong> Por eso puede vivir en el <code>&lt;head&gt;</code> sin bloquear el render. Si algún día creas tu propio HTML, no te olvides del <code>type="module"</code> cuando uses <code>import</code>.
</div>

<h2>6. El detalle del <code>crossorigin</code> en preconnect</h2>

<div class="code-wrap">
<pre><code class="language-html">&lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /&gt;</code></pre>
</div>

<p>El atributo <code>crossorigin</code> le indica al navegador que la futura petición usará credenciales CORS anónimas. Sin él, el navegador abriría DOS conexiones distintas (una con credenciales, otra sin) y el preconnect no serviría de nada para las fuentes. Con él, reutiliza la conexión pre-establecida y la fuente carga unos ms antes.</p>

<h2>7. StrictMode: por qué tu efecto corre dos veces en dev</h2>

<p>En producción, un efecto se ejecuta una vez por montaje. En desarrollo, StrictMode hace <em>deliberadamente</em>:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Monta el componente y ejecuta los efectos.</div>
  <div class="flujo-paso"><span class="num">2</span> Desmonta y ejecuta las funciones de limpieza.</div>
  <div class="flujo-paso"><span class="num">3</span> Vuelve a montar y ejecuta los efectos otra vez.</div>
</div>

<p>El objetivo: forzarte a escribir efectos con función de limpieza correcta. Si tu efecto suma una visualización y no se protege, la verás <strong>x2</strong> en dev. Por eso <code>DetalleProducto.jsx</code> usa <code>visualizacionContadaRef</code>: recuerda qué producto ya contó y no cuenta dos veces aunque el efecto corra dos veces.</p>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> SPA: la trampa del refresh en producción</div>
  <p>En <code>npm run dev</code>, abrir directamente <code>http://localhost:5173/productos</code> funciona porque Vite sirve <code>index.html</code> para cualquier ruta. En producción con nginx, esa URL busca un fichero físico <code>/productos</code>, no lo encuentra y devuelve 404. Solución estándar: <code>try_files $uri /index.html;</code> en nginx, para que cualquier ruta sirva el index y React Router decida qué pintar.</p>
</div>

<h2>8. Preguntas trampa frecuentes</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué pasa si el usuario tiene JavaScript desactivado?"</div>
  <p><strong>Respuesta:</strong> ve un <code>div</code> vacío. No hay fallback porque es una SPA pura (CSR). Para mejorarlo añadirías un <code>&lt;noscript&gt;</code> con un mensaje, o moverías a SSR con Next.js. DaWeb no lo hace.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Afecta esto al SEO?"</div>
  <p><strong>Respuesta:</strong> sí, negativamente. Googlebot ejecuta JS pero hay límites de tiempo y recursos. Una SPA pura tiene peor indexación que HTML estático. Para un marketplace real en producción usarías SSR o pre-rendering para las páginas de producto.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué dos <code>&lt;link rel="preconnect"&gt;</code> a Google Fonts?"</div>
  <p><strong>Respuesta:</strong> son dos dominios distintos. <code>fonts.googleapis.com</code> sirve el CSS (sin credenciales). <code>fonts.gstatic.com</code> sirve los WOFF (CORS anónimo). El preconnect establece TCP+TLS a ambos antes de que el navegador descubra que los necesita.</p>
</div>

<h2>9. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta</div>
  <p class="quiz-pregunta">¿Por qué el <code>&lt;div id="root"&gt;</code> está vacío?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Porque es un placeholder que el diseñador no rellenó.</button>
    <button class="quiz-opcion" data-correcta="1">Porque React lo rellenará en tiempo de ejecución desde <code>main.jsx</code>.</button>
    <button class="quiz-opcion" data-correcta="0">Porque el contenido lo añade el servidor antes de enviar el HTML.</button>
    <button class="quiz-opcion" data-correcta="0">Porque los <code>div</code> se rellenan solos por defecto.</button>
  </div>
  <p class="quiz-feedback" data-ok="Eso es: React necesita un nodo del DOM donde montar su árbol." data-ko="React necesita un punto de anclaje en el DOM real para empezar a pintar."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta</div>
  <p class="quiz-pregunta">¿Para qué sirve <code>type="module"</code> en la etiqueta <code>&lt;script&gt;</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Para que el script bloquee el render.</button>
    <button class="quiz-opcion" data-correcta="1">Para activar ES Modules (<code>import</code>/<code>export</code>) y aplicar defer implícito.</button>
    <button class="quiz-opcion" data-correcta="0">Para que el script sea visible en Google Analytics.</button>
    <button class="quiz-opcion" data-correcta="0">Para indicar que es TypeScript.</button>
  </div>
  <p class="quiz-feedback" data-ok="Sin module, escribir 'import' lanza SyntaxError." data-ko="Pista: prueba a usar 'import' en un script clásico → SyntaxError."></p>
</div>

<h2>10. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Cambiar el título de la pestaña</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <ol>
    <li>Abre <code>daweb/index.html</code>.</li>
    <li>Cambia <code>&lt;title&gt;DaWeb Reventas&lt;/title&gt;</code> por <code>&lt;title&gt;Marketplace de prueba&lt;/title&gt;</code>.</li>
    <li>Guarda y mira la pestaña del navegador.</li>
  </ol>
  <details>
    <summary>Si no se actualiza</summary>
    <p>Vite recarga el HTML completo al modificarlo. Si no aparece el nuevo título, recarga manualmente con <span class="kbd">Ctrl</span>+<span class="kbd">R</span>.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Añadir una fuente de Google adicional</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <ol>
    <li>En <code>index.html</code>, añade tras Google Sans Flex: <code>&lt;link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap" rel="stylesheet" /&gt;</code>.</li>
    <li>En <code>theme.css</code>, añade en <code>body</code>: <code>font-family: 'Inter', sans-serif;</code> y observa el cambio.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Romper React a propósito</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <ol>
    <li>En <code>index.html</code>, cambia <code>id="root"</code> por <code>id="raiz"</code>.</li>
    <li>Guarda. La página estará en blanco.</li>
    <li>Abre la consola (F12) y verás <code>Cannot read properties of null</code> porque <code>getElementById('root')</code> devuelve <code>null</code>.</li>
    <li>Deshaz el cambio.</li>
  </ol>
  <details>
    <summary>¿Qué hemos aprendido?</summary>
    <p>El id del div tiene que coincidir EXACTO con el <code>getElementById</code> de <code>main.jsx</code>. Es el único acoplamiento HTML↔JS y, justamente por eso, no se debe tocar a la ligera.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Splash screen "no-React"</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Pon dentro del <code>&lt;div id="root"&gt;</code> un texto: <code>&lt;p&gt;Cargando…&lt;/p&gt;</code>. Recarga. ¿Qué ves?</p>
  <details>
    <summary>Respuesta</summary>
    <p>Aparece "Cargando…" un instante y desaparece. React, al renderizar, <strong>sustituye</strong> todo el contenido de <code>#root</code> por su árbol. Esta técnica se usa como splash mientras carga el bundle.</p>
  </details>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Para la entrevista</div>
  <p>Si te preguntan "¿qué hay en el HTML del proyecto?", respuesta corta: <em>"Sólo lo justo: metas, links a fuentes y CSS, un div con id root y el script de entrada main.jsx. Todo lo demás lo monta React en cliente."</em></p>
</div>
`;
