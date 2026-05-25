window.__SECC = window.__SECC || {};
window.__SECC["intro"] = `<h1>Introducción y puesta en marcha</h1>
<p class="subtitulo">Visión global del proyecto, tecnologías y cómo levantar el entorno desde cero.</p>

<p class="lead">DaWeb Reventas es un marketplace de productos de segunda mano (estilo Wallapop). Antes de tocar una sola línea de código necesitas dos cosas: un <strong>modelo mental</strong> de qué pieza vive dónde (frontend, backend, base de datos, navegador) y un <strong>vocabulario común</strong> con el resto de tecnologías que aparecerán durante el tutorial. Esta sección cumple las dos.</p>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Cómo leer el tutorial</div>
  <p>Cada sección está pensada para leerse de principio a fin. Los conceptos se introducen una vez y se reutilizan después, así que no saltes hacia adelante. Si una palabra te suena rara, búscala con <span class="kbd">Ctrl</span> + <span class="kbd">K</span>.</p>
</div>

<h2>1. El problema que resuelve DaWeb</h2>

<p>Un usuario quiere vender una bici de segunda mano. La sube con foto, precio y descripción. Otro usuario la encuentra filtrando por categoría y precio, ve el detalle, y la compra. El sistema debe recordar quién hizo qué, quién pagó, y mostrar a cada usuario "sus" cosas. <strong>Eso</strong> es DaWeb. Cualquier complejidad técnica que veas más adelante existe para soportar ese flujo.</p>

<p>Ese flujo se reparte entre <strong>dos mundos</strong> que viven en máquinas distintas pero hablan entre sí:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4><i class="bi bi-window"></i> Frontend (tu navegador)</h4>
    <p>La interfaz visible. Hecha de:</p>
    <ul>
      <li><strong>HTML</strong>: la estructura.</li>
      <li><strong>CSS</strong>: la apariencia.</li>
      <li><strong>JavaScript</strong>: el comportamiento.</li>
    </ul>
    <p>En DaWeb construido con <strong>React</strong>, que añade superpoderes a HTML+CSS+JS para componer interfaces reutilizables.</p>
  </div>
  <div class="tarjeta">
    <h4><i class="bi bi-hdd-stack"></i> Backend (un servidor)</h4>
    <p>La lógica de negocio y la base de datos. No lo ves. Vive en otra máquina (o en otro puerto). Guarda usuarios, productos y compraventas en <strong>MySQL</strong> y responde a las peticiones HTTP del frontend.</p>
    <p>En DaWeb es un proyecto Java de la asignatura ArSo, expuesto como API REST en <code>http://localhost:8090</code>. No lo tocas en este tutorial; sólo lo consumes.</p>
  </div>
</div>

<h2>2. Modelo mental: cómo se hablan las piezas</h2>

<p>Antes del código, fíjate en este diagrama. Es el mismo flujo que se repite en cada acción de la web: el navegador pide, alguien responde.</p>

<figure class="diagrama">
  <figcaption>Flujo de una petición típica</figcaption>
  <pre class="mermaid">
sequenceDiagram
  autonumber
  participant N as Navegador
  participant V as Vite Dev Server (:5173)
  participant B as Backend ArSo (:8090)
  participant DB as MySQL
  N->>V: GET / (carga index.html)
  V-->>N: HTML + main.jsx
  N->>N: React monta App y pinta UI
  N->>V: fetch('/api/productos')
  V->>B: GET /productos (proxy)
  B->>DB: SELECT * FROM productos
  DB-->>B: filas
  B-->>V: JSON HAL
  V-->>N: JSON HAL
  N->>N: setState → React re-renderiza la lista
  </pre>
</figure>

<div class="tip-regla">
  Cuando algo no funciona en la web, <strong>localiza primero el paso del diagrama que falla</strong>: ¿el navegador pidió bien? ¿el backend respondió? ¿el JSON era el esperado? Eso reduce el bug a una sola capa.
</div>

<h2>3. Arquitectura completa del sistema</h2>

<p>El diagrama anterior es la película de UNA petición. Este otro es la foto del sistema entero (qué módulo vive dónde):</p>

<figure class="diagrama">
  <figcaption>Mapa físico de las piezas</figcaption>
  <pre class="mermaid">
flowchart TB
  subgraph Nav["NAVEGADOR (Chrome / Firefox)"]
    direction TB
    Pages["pages/*.jsx (rutas)"]
    Components["components/*.jsx"]
    Context["context/AuthContext"]
    Api["api/*.js + client.js"]
    LS[("localStorage<br/>(JWT)")]
    Pages --> Components
    Pages --> Context
    Pages --> Api
    Context --> LS
    Api --> Context
  end
  Nav -- "fetch('/api/...')" --> Vite
  Vite["Vite Dev Server :5173<br/>· sirve index.html + JS<br/>· proxy /api → :8090<br/>· HMR vía WebSocket"]
  Vite -- "HTTP (sin CORS, mismo origen)" --> Back
  Back["Backend ArSo (Java :8090)<br/>· REST + Spring HATEOAS<br/>· JWT firmado HS256<br/>· OAuth2 con GitHub"]
  Back -- "JDBC" --> DB[("MySQL<br/>usuarios · productos<br/>compraventas · categorías")]
  </pre>
</figure>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Cómo leer este diagrama</div>
  <p>Las flechas son "llama a" o "envía datos a". <code>api/client.js</code> es el nodo más profundo del frontend: si lo modificas, afecta a TODA la app. Si modificas una página, sólo le afecta a ella. Esto te dará la regla "tocar de fuera hacia dentro" cuando hagas cambios.</p>
</div>

<h2>4. Las tecnologías y por qué cada una</h2>

<p>Cuando alguien lista tecnologías sin justificar, queda como una sopa de letras. Aquí cada fila responde a "<em>¿qué se rompería sin esto?</em>":</p>

<table>
  <thead>
    <tr><th>Tecnología</th><th>Qué se rompe sin ella</th><th>Dónde se ve en el código</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>HTML</strong></td><td>No hay estructura. El navegador sólo ve texto plano.</td><td><code>index.html</code></td></tr>
    <tr><td><strong>CSS</strong></td><td>Todo se vería como Word de los 90: sin colores ni layout.</td><td><code>*.css</code></td></tr>
    <tr><td><strong>JavaScript (ES6+)</strong></td><td>La página sería estática: ni clicks, ni fetch, ni cambios sin recargar.</td><td><code>*.js</code>, <code>*.jsx</code></td></tr>
    <tr><td><strong>React</strong></td><td>Tendrías que sincronizar a mano DOM y datos. Bug factory.</td><td><code>*.jsx</code></td></tr>
    <tr><td><strong>JSX</strong></td><td>Tendrías que escribir <code>React.createElement(...)</code> a mano por cada nodo.</td><td><code>*.jsx</code></td></tr>
    <tr><td><strong>React Router DOM</strong></td><td>No habría URLs distintas por página, sólo una.</td><td><code>App.jsx</code></td></tr>
    <tr><td><strong>React Bootstrap</strong></td><td>Tendrías que estilar botones, tablas, modales desde cero.</td><td>imports de <code>react-bootstrap</code></td></tr>
    <tr><td><strong>Bootstrap 5</strong></td><td>Sin grid responsive ni utilidades CSS estandarizadas.</td><td>clases <code>col-md-6</code>, <code>d-flex</code>…</td></tr>
    <tr><td><strong>Vite</strong></td><td>El navegador no entendería JSX ni los <code>import</code> de npm.</td><td><code>vite.config.js</code></td></tr>
    <tr><td><strong>Fetch API</strong></td><td>No podrías hablar con el backend desde el navegador.</td><td><code>api/client.js</code></td></tr>
    <tr><td><strong>JWT</strong></td><td>El backend no sabría quién es el usuario en cada petición.</td><td><code>localStorage['arso_token']</code></td></tr>
    <tr><td><strong>OAuth2 (GitHub)</strong></td><td>No podrías iniciar sesión con tu cuenta de GitHub.</td><td><code>pages/Login.jsx</code></td></tr>
  </tbody>
</table>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-diagram-3"></i> SOLID · DIP (Dependency Inversion)</span>
  <p>El frontend depende de la <strong>abstracción</strong> <code>/api/...</code> (URL relativa), no del concreto <code>http://localhost:8090</code>. Por eso si mañana el backend se mueve a otro servidor, sólo tocas el proxy de Vite o la variable <code>VITE_API_BASE</code>, jamás los componentes.</p>
<div class="code-wrap">
  <span class="file-label">api/client.js — extracto</span>
<pre><code class="language-js">// MAL (acopla a localhost): la URL del backend vive en el componente.
fetch('http://localhost:8090/productos');

// BIEN (depende de abstracción): URL relativa; Vite/nginx la resuelve.
fetch('/api/productos');</code></pre>
</div>
</div>

<h2>5. Estructura del proyecto</h2>

<p>Antes de arrancar nada, conviene tener en la cabeza dónde vive cada cosa. Si visualizas el árbol como capas concéntricas (de fuera hacia dentro: páginas → componentes → contexto → api → backend), sabrás siempre por dónde empezar a buscar.</p>

<figure class="diagrama">
  <figcaption>Carpetas del frontend</figcaption>
  <pre class="mermaid">
flowchart TB
  Root["daweb/ (repo)"]
  Front["daweb/daweb/ (frontend)"]
  Root --> Front
  Front --> Public["public/<br/>archivos estáticos"]
  Front --> Src["src/"]
  Front --> Index["index.html<br/>HTML que recibe el navegador"]
  Front --> Vite["vite.config.js<br/>config + proxy"]
  Front --> Pkg["package.json<br/>deps + scripts"]
  Src --> Api["api/<br/>llamadas al backend"]
  Src --> Comp["components/<br/>piezas reutilizables"]
  Src --> Ctx["context/<br/>estado global (auth)"]
  Src --> Pages["pages/<br/>una por cada URL"]
  Src --> Assets["assets/<br/>imágenes"]
  Src --> App["App.jsx<br/>define las rutas"]
  Src --> Main["main.jsx<br/>arranca React"]
  Src --> Css["index.css + theme.css"]
  </pre>
</figure>

<div class="tip-regla">
  <strong>Regla de oro de navegación:</strong> si una funcionalidad afecta a UNA ruta → vive en <code>pages/</code>. Si se reutiliza en varias → <code>components/</code>. Si la usan páginas distintas como "estado compartido" → <code>context/</code>. Si habla con el backend → <code>api/</code>.
</div>

<h2>6. Cómo arrancar el proyecto</h2>

<h3>Requisitos</h3>
<ul>
  <li><strong>Node.js</strong> 18 o superior. Comprueba la versión con <code>node --version</code>. Vite 8 lo requiere.</li>
  <li>Opcional pero recomendado: el backend ArSo corriendo en <code>http://localhost:8090</code> para que las llamadas devuelvan datos reales.</li>
</ul>

<h3>Pasos</h3>
<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Abre una terminal en <code>daweb/daweb/</code>.</div>
  <div class="flujo-paso"><span class="num">2</span> La primera vez: <code>npm install</code> (descarga las librerías a <code>node_modules/</code>).</div>
  <div class="flujo-paso"><span class="num">3</span> <code>npm run dev</code> (arranca el servidor de desarrollo en el puerto 5173 con HMR).</div>
  <div class="flujo-paso"><span class="num">4</span> Abre <code>http://localhost:5173/</code> en el navegador.</div>
</div>

<h3>Comandos a conocer</h3>
<table>
  <tr><th>Comando</th><th>Para qué</th><th>Cuándo</th></tr>
  <tr><td><code>npm install</code></td><td>Instala las dependencias del <code>package.json</code>.</td><td>Una vez, o tras añadir/borrar libs.</td></tr>
  <tr><td><code>npm ci</code></td><td>Instala EXACTAMENTE lo que dice <code>package-lock.json</code>.</td><td>En servidores de CI/CD.</td></tr>
  <tr><td><code>npm run dev</code></td><td>Servidor con recarga en caliente.</td><td>Mientras desarrollas.</td></tr>
  <tr><td><code>npm run build</code></td><td>Versión optimizada en <code>dist/</code>.</td><td>Para desplegar.</td></tr>
  <tr><td><code>npm run preview</code></td><td>Sirve <code>dist/</code> en local.</td><td>Para comprobar el build antes de subir.</td></tr>
</table>

<div class="tip-regla">
  <strong>npm install vs npm ci:</strong> <code>install</code> puede actualizar versiones compatibles y reescribir el lock; <code>ci</code> es estricto e idempotente. Regla: tu máquina = <code>install</code>; servidor automatizado = <code>ci</code>.
</div>

<h2>7. Conceptos de fondo que necesitas dominar</h2>

<p>El entrevistador no te va a preguntar "¿qué es npm?" a secas: te preguntará algo de la web y, si la respuesta delata que no entiendes el ecosistema, escarbará. Estos cuatro conceptos son los más explotables.</p>

<h3>7.1 npm: dependencies vs devDependencies</h3>

<p><strong>npm</strong> (Node Package Manager) es el gestor de paquetes de JavaScript. <code>package.json</code> declara qué necesitas; <code>npm install</code> descarga los paquetes a <code>node_modules/</code>; <code>package-lock.json</code> congela las versiones exactas para que cualquier desarrollador reproduzca el mismo entorno.</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4><code>dependencies</code></h4>
    <p>Librerías que viven en <strong>producción</strong>: React, React Router, Bootstrap. El usuario final descarga estas.</p>
<pre><code class="language-json">"dependencies": {
  "react": "^19.2.6",
  "bootstrap": "^5.3.8"
}</code></pre>
  </div>
  <div class="tarjeta">
    <h4><code>devDependencies</code></h4>
    <p>Sólo para <strong>desarrollar/compilar</strong>: Vite, plugins, tipos. No acaban en el bundle final.</p>
<pre><code class="language-json">"devDependencies": {
  "vite": "^8.0.12",
  "@vitejs/plugin-react": "^6.0.1"
}</code></pre>
  </div>
</div>

<div class="tip-regla">
  <strong>Analogía:</strong> en un restaurante, los <em>dependencies</em> son los ingredientes que llegan al plato (los come el cliente). Los <em>devDependencies</em> son los cuchillos del chef: imprescindibles para cocinar, pero no acaban en el plato.
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> ¿Por qué <code>node_modules/</code> nunca se sube a git?</div>
  <p>Pesa de 200 MB a 1 GB. Además, dependencias nativas se compilan distinto por sistema operativo. El <code>package-lock.json</code> es suficiente para reproducir el entorno con <code>npm ci</code>.</p>
</div>

<h3>7.2 ¿Por qué necesitas Node.js si esto corre en el navegador?</h3>

<p>El navegador <strong>no</strong> sabe leer <code>.jsx</code> ni resolver <code>import 'react'</code> (que apunta a <code>node_modules/</code>). Necesitas una cadena de transformación que pase tu código moderno a JS plano. Esa cadena la ejecuta Node.js a través de Vite:</p>

<figure class="diagrama">
  <figcaption>De tu código al navegador</figcaption>
  <pre class="mermaid">
flowchart LR
  Src["src/App.jsx<br/>(JSX + import 'react')"] --> Vite["Vite<br/>(programa Node.js)"]
  Vite -- "transforma JSX" --> JS["React.createElement(...)"]
  Vite -- "resuelve imports npm" --> ESM["ES modules estándar"]
  JS --> Browser["Navegador<br/>ejecuta JS plano"]
  ESM --> Browser
  </pre>
</figure>

<p>Node.js, en este proyecto, es como el andamio de una obra: imprescindible durante la construcción, no forma parte del edificio final.</p>

<h3>7.3 Librería vs Framework: inversión de control</h3>

<table>
  <tr><th>Concepto</th><th>Quién llama a quién</th><th>Ejemplos</th></tr>
  <tr><td><strong>Librería</strong></td><td>Tú llamas a su código.</td><td>React, Bootstrap, lodash.</td></tr>
  <tr><td><strong>Framework</strong></td><td>El framework llama a tu código.</td><td>Angular, Spring, Django.</td></tr>
</table>
<p>React es una <strong>librería</strong> de UI: sólo gestiona renderizado. No opina sobre routing, estado global ni peticiones HTTP. Por eso DaWeb suma React Router, Bootstrap y un cliente fetch propio: cada pieza independiente, elegida a propósito.</p>

<div class="tip-regla">
  Si oyes "el framework de React" en una entrevista, corrige amablemente: React es una <strong>librería</strong>. Lo que sí podrías llamar framework es Next.js, que orquesta React.
</div>

<h3>7.4 Entorno dev vs producción: dónde nacen los bugs raros</h3>

<table>
  <tr><th>Característica</th><th>Dev (<code>npm run dev</code>)</th><th>Prod (<code>npm run build</code>)</th></tr>
  <tr><td>Arranque</td><td>Instantáneo (no bundlea).</td><td>Compila (10-30 s).</td></tr>
  <tr><td>Source maps</td><td>Sí (ves el código original).</td><td>Opcionales.</td></tr>
  <tr><td>Minificación</td><td>No.</td><td>Sí (ilegible, pesa menos).</td></tr>
  <tr><td>StrictMode</td><td>Doble montaje de componentes.</td><td>Sin doble montaje.</td></tr>
  <tr><td>HMR</td><td>Sí (recarga en caliente).</td><td>No.</td></tr>
  <tr><td>Proxy Vite</td><td>Sí (<code>/api</code> → <code>:8090</code>).</td><td><strong>No existe</strong> (configurar nginx).</td></tr>
</table>

<div class="callout danger">
  <div class="callout-titulo"><i class="bi bi-x-circle"></i> Gotcha: el doble montaje de StrictMode</div>
  <p>En desarrollo, React monta → desmonta → vuelve a montar cada componente para forzarte a escribir efectos limpios. Si tu <code>useEffect</code> incrementa un contador sin protección, en dev verás <strong>2</strong> incrementos por visita; en prod, 1. El <code>useRef</code> protector que verás en <code>DetalleProducto.jsx</code> existe precisamente por eso.</p>
</div>

<h2>8. Pequeño experimento mental</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta rápida</div>
  <p class="quiz-pregunta">Cuando ejecutas <code>npm run dev</code> y abres <code>http://localhost:5173/productos</code>, ¿quién devuelve la lista de productos?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">El servidor Vite, leyendo un fichero local.</button>
    <button class="quiz-opcion" data-correcta="0">El navegador, generándolos al vuelo con React.</button>
    <button class="quiz-opcion" data-correcta="1">El backend Java en el puerto 8090, al que Vite redirige las peticiones <code>/api/...</code>.</button>
    <button class="quiz-opcion" data-correcta="0">La librería React Router, que tiene los datos en memoria.</button>
  </div>
  <p class="quiz-feedback" data-ok="Vite sólo sirve el frontend; los datos vienen siempre del backend." data-ko="Vite sirve el código del frontend, pero los datos los pide React al backend Java vía proxy."></p>
</div>

<h2>9. Preguntas trampa frecuentes</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué versión mínima de Node.js necesitas?"</div>
  <p><strong>Respuesta:</strong> Node 18+. Vite 8 lo requiere explícitamente. Compruebas con <code>node --version</code>. Si tienes una versión antigua, Vite falla al arrancar.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Diferencia entre <code>npm install</code> y <code>npm ci</code>?"</div>
  <p><strong>Respuesta:</strong> <code>install</code> puede actualizar versiones compatibles y reescribe el lock. <code>ci</code> borra <code>node_modules/</code>, instala EXACTO lo del lock y falla si hay discrepancias. <code>ci</code> es para servidores de CI/CD donde quieres reproducibilidad.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué partes funcionan sin el backend?"</div>
  <p><strong>Respuesta:</strong> Las páginas estáticas (Home, Error 404) muestran su estructura. Todo lo que pide datos (productos, login, perfil) falla con error de red. El frontend es independiente del backend en <em>estructura</em>, pero dependiente en <em>datos</em>.</p>
</div>

<h2>10. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Inspeccionar la estructura</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <p>Abre <code>daweb/daweb/</code> en tu editor y responde mentalmente:</p>
  <ol>
    <li>¿Cuántos ficheros hay en <code>src/pages/</code>?</li>
    <li>¿Cuántos en <code>src/api/</code>?</li>
    <li>¿Cuál es la dependencia principal según el orden de <code>package.json</code>?</li>
  </ol>
  <details>
    <summary>Ver respuestas</summary>
    <p>15 páginas (Home, Login, Registro, Productos, DetalleProducto, NuevoProducto, EditarProducto, Perfil, PerfilProductos, PerfilVentas, PerfilCompras, PerfilUsuario, AdminUsuarios, AdminTransacciones, Error404).</p>
    <p>7 ficheros en <code>api/</code>: <code>auth.js</code>, <code>categorias.js</code>, <code>client.js</code>, <code>compraventas.js</code>, <code>productos.js</code>, <code>usuarios.js</code>, <code>util.js</code>.</p>
    <p>La dependencia principal es <code>react</code> (con su pareja <code>react-dom</code>).</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Arrancar el proyecto y modificar algo en caliente</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <ol>
    <li>Ejecuta <code>npm install</code> y después <code>npm run dev</code>.</li>
    <li>Abre <code>http://localhost:5173/</code>.</li>
    <li>Sin parar el servidor, abre <code>src/pages/Home.jsx</code> y cambia el texto del <code>&lt;h1&gt;</code> (línea ~20). Guarda.</li>
    <li>Mira el navegador: el cambio aparece sin recargar.</li>
  </ol>
  <details>
    <summary>¿Por qué ha funcionado sin recargar?</summary>
    <p>Vite tiene <strong>Hot Module Replacement (HMR)</strong>: detecta el cambio, recompila sólo el módulo afectado y lo envía al navegador por WebSocket. El estado de React se preserva.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Detectar el proxy con DevTools</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <ol>
    <li>Con la web abierta, pulsa <span class="kbd">F12</span>.</li>
    <li>Ve a la pestaña <strong>Network / Red</strong>.</li>
    <li>Recarga (<span class="kbd">F5</span>) y navega a <code>/productos</code>.</li>
    <li>Identifica las peticiones a <code>/api/...</code>. La <em>Request URL</em> es <code>http://localhost:5173/api/productos</code>, pero quien responde es el puerto 8090 (lo verás en headers del backend).</li>
  </ol>
  <details>
    <summary>Solución y pista</summary>
    <p>Mira <code>vite.config.js</code>: la sección <code>server.proxy</code> redirige <code>/api</code> a <code>http://localhost:8090</code> y quita el prefijo con <code>rewrite</code>.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Sin backend</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Si todavía no tienes ArSo corriendo: ¿qué partes de la web funcionan y cuáles no? Pruébalo.</p>
  <details>
    <summary>Lo que debería pasar</summary>
    <ul>
      <li>Páginas estáticas (Home, Error 404): funcionan, no piden nada.</li>
      <li><code>/productos</code>: la página se monta pero queda en estado de error o lista vacía.</li>
      <li>Login: el formulario aparece, pero al enviar devuelve error de red.</li>
    </ul>
  </details>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Truco para la entrevista</div>
  <p>Si te preguntan "¿qué pasa cuando un usuario abre la web?", responde con los pasos del primer diagrama de esta sección: navegador → Vite sirve <code>index.html</code> → carga <code>main.jsx</code> → React monta <code>App</code> → Router lee la URL → pinta la página → la página llama a la API → el proxy redirige al backend → el backend consulta MySQL.</p>
</div>
`;
