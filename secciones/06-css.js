window.__SECC = window.__SECC || {};
window.__SECC["css"] = `<h1>CSS y diseño responsive</h1>
<p class="subtitulo">Cómo se construye el aspecto visual de DaWeb y cómo se adapta a móviles.</p>

<p class="lead">El diseño descansa sobre cuatro pilares que se entienden mejor en este orden: <strong>variables CSS</strong> (la paleta), <strong>el modelo de caja</strong> (cómo mide cada elemento), <strong>Flexbox + Bootstrap</strong> (cómo se reparte el espacio) y <strong>CSS Grid + media queries</strong> (cómo se adapta a tamaños). Cada uno alimenta al siguiente.</p>

<h2>1. Tres formas de aplicar CSS y cuándo cada una</h2>

<table>
  <tr><th>Forma</th><th>Cuándo</th><th>Ejemplo en DaWeb</th></tr>
  <tr><td>Hoja externa global</td><td>Estilos compartidos por toda la app</td><td><code>theme.css</code>, <code>index.css</code></td></tr>
  <tr><td>CSS asociado a un componente</td><td>Estilos específicos de una página</td><td><code>pages/Productos.css</code>, <code>components/Header.css</code></td></tr>
  <tr><td>Inline (objeto JS)</td><td>Valores dinámicos puntuales</td><td><code>style={{ color: 'var(--ink)' }}</code></td></tr>
</table>

<div class="code-wrap">
<pre><code class="language-jsx">&lt;h4 style={{ color: 'var(--ink)' }}&gt;Hola&lt;/h4&gt;</code></pre>
</div>

<p>Dos llaves: las del JSX para meter expresión, y las del objeto JS. Propiedades en <strong>camelCase</strong> (<code>backgroundColor</code>, no <code>background-color</code>).</p>

<h2>2. Variables CSS: una paleta única, toda la app respira igual</h2>

<p>Definidas en <code>:root</code>, se heredan por TODA la página. La identidad visual del proyecto vive aquí:</p>

<div class="code-wrap">
  <span class="file-label">src/theme.css</span>
<pre><code class="language-css">:root {
  --petal-frost: #ffd6ff;
  --mauve: #e7c6ff;
  --mauve-2: #c8b6ff;
  --periwinkle: #b8c0ff;

  --surface: #ffffff;
  --surface-soft: #f6f4fb;
  --primary: #c8b6ff;
  --ink: #2a2440;

  --radius-card: 1rem;
  --shadow-soft: 0 6px 20px rgba(122, 102, 168, 0.14);
  --transition: 0.25s ease;
}</code></pre>
</div>

<p>Se usan con <code>var(--nombre)</code>:</p>

<div class="code-wrap">
<pre><code class="language-css">.card { border-radius: var(--radius-card); box-shadow: var(--shadow-soft); }
.btn-lav { background: var(--ink); color: #fff; border-radius: 999px; }
.seccion-titulo { border-left: 4px solid var(--primary); }</code></pre>
</div>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-arrow-up-circle"></i> SOLID · OCP (Open/Closed)</span>
  <p>Las variables CSS son OCP puro. Para cambiar TODA la paleta de la app cambias UNA línea en <code>:root</code>. Los 50 selectores que usan <code>var(--primary)</code> no se tocan; quedan <em>cerrados</em>. La paleta queda <em>abierta</em> a redefinición.</p>
<div class="code-wrap">
<pre><code class="language-css">/* Cambiar de lila a azul: una sola edición */
:root { --primary: #1971c2; }
/* ✅ cards, focus, bordes, botones → todos en azul */</code></pre>
</div>
</div>

<p>El truco: como <code>:root</code> es el ancestro de todo, las variables se propagan en cascada. Sobrescribir dentro de un subtree local también funciona:</p>

<div class="code-wrap">
<pre><code class="language-css">.seccion-oscura { --primary: #8a2be2; }
/* dentro de .seccion-oscura, var(--primary) vale otro color */</code></pre>
</div>

<h2>3. El modelo de caja: cómo mide un elemento</h2>

<figure class="diagrama">
  <figcaption>Box model</figcaption>
  <pre class="mermaid">
flowchart TB
  subgraph Margin["margin (espacio externo, transparente)"]
    direction TB
    subgraph Border["border"]
      direction TB
      subgraph Padding["padding (espacio interno)"]
        Content["content<br/>(width × height)"]
      end
    end
  end
  </pre>
</figure>

<p>Hay dos modos de calcular el <code>width</code>:</p>

<ul>
  <li><code>box-sizing: content-box</code> (por defecto CSS): <code>width</code> = solo el contenido. Padding suma <em>extra</em>.</li>
  <li><code>box-sizing: border-box</code> (Bootstrap lo aplica globalmente): <code>width</code> incluye padding y border. Mucho más intuitivo.</li>
</ul>

<div class="code-wrap">
<pre><code class="language-css">/* Bootstrap globalmente */
*, *::before, *::after { box-sizing: border-box; }

/* Efecto: col con width:300px y padding:16px
   tiene 268px de contenido, NO desborda. */</code></pre>
</div>

<div class="tip-regla">
  <strong><code>border-box</code> es lo que esperas: "el ancho que pido es el ancho real ocupado".</strong> Bootstrap lo activa global; si trabajas sin Bootstrap, ponlo siempre.
</div>

<h2>4. Flexbox: el corazón del layout</h2>

<p>Bootstrap (Row/Col, <code>d-flex</code>…) es Flexbox por dentro. Si entiendes Flexbox, entiendes cualquier <code>d-flex gap-2 align-items-center</code>.</p>

<div class="code-wrap">
<pre><code class="language-css">.d-flex { display: flex; }
/* defaults: flex-direction: row, flex-wrap: nowrap */

/* Eje principal (X si row) */
.justify-content-between { justify-content: space-between; }
.justify-content-center  { justify-content: center; }

/* Eje cruzado (Y si row) */
.align-items-center { align-items: center; }

/* Separación */
.gap-2 { gap: 0.5rem; }</code></pre>
</div>

<div class="tip-regla">
  <strong><code>justify-content</code> → eje principal · <code>align-items</code> → eje cruzado.</strong> Si tu <code>flex-direction</code> es <code>row</code>, principal = horizontal y cruzado = vertical. Cambias a <code>column</code> y se invierten. Memorízalo: una vez sabido, no se olvida.
</div>

<h3>Uso real en el Header</h3>

<div class="code-wrap">
<pre><code class="language-jsx">&lt;div className="d-flex gap-2 align-items-center"&gt;
  &lt;button className="header-btn" onClick={salir}&gt;Salir&lt;/button&gt;
  &lt;span&gt;{usuario.nombre}&lt;/span&gt;
&lt;/div&gt;</code></pre>
</div>

<p>Contenedor flex: hijos en fila, alineados al centro verticalmente, 0.5rem de gap.</p>

<h2>5. Bootstrap 5: el sistema de 12 columnas</h2>

<div class="code-wrap">
  <span class="file-label">src/pages/DetalleProducto.jsx</span>
<pre><code class="language-jsx">&lt;Container className="py-4"&gt;
  &lt;Row className="g-4"&gt;
    &lt;Col lg={7}&gt; ...izquierda... &lt;/Col&gt;
    &lt;Col lg={5}&gt; ...derecha... &lt;/Col&gt;
  &lt;/Row&gt;
&lt;/Container&gt;</code></pre>
</div>

<p>En pantallas grandes (<code>lg</code> y más), izquierda = 7/12 (60%), derecha = 5/12 (40%). En móvil (por debajo de lg), Bootstrap apila ambas a 12/12.</p>

<h3>Breakpoints</h3>

<table>
  <tr><th>Sufijo</th><th>Mínimo</th><th>Caso típico</th></tr>
  <tr><td><code>xs</code> (implícito)</td><td>0</td><td>Móviles</td></tr>
  <tr><td><code>sm</code></td><td>≥ 576px</td><td>Móviles grandes</td></tr>
  <tr><td><code>md</code></td><td>≥ 768px</td><td>Tabletas</td></tr>
  <tr><td><code>lg</code></td><td>≥ 992px</td><td>Portátiles</td></tr>
  <tr><td><code>xl</code></td><td>≥ 1200px</td><td>Monitores</td></tr>
</table>

<div class="tip-regla">
  <strong>Mobile-first:</strong> escribes el CSS para móvil y subes con <code>@media (min-width: ...)</code>. Las clases sin sufijo (<code>col-6</code>) aplican siempre; las con sufijo (<code>col-md-4</code>) aplican <em>a partir de</em> ese breakpoint.
</div>

<h3>Utilidades más usadas en DaWeb</h3>

<table>
  <tr><th>Prefijo</th><th>Significa</th><th>Ejemplo</th></tr>
  <tr><td><code>m-N</code>, <code>p-N</code></td><td>margin / padding (0-5)</td><td><code>mb-3</code></td></tr>
  <tr><td><code>py-N</code>, <code>px-N</code></td><td>padding vertical/horizontal</td><td><code>py-4</code></td></tr>
  <tr><td><code>d-flex</code></td><td>display: flex</td><td><code>d-flex gap-2</code></td></tr>
  <tr><td><code>justify-content-*</code></td><td>alineación eje principal</td><td><code>justify-content-between</code></td></tr>
  <tr><td><code>align-items-*</code></td><td>alineación eje cruzado</td><td><code>align-items-center</code></td></tr>
  <tr><td><code>text-*</code> / <code>fw-*</code></td><td>texto, peso</td><td><code>text-muted fw-bold</code></td></tr>
  <tr><td><code>w-100</code> / <code>h-100</code></td><td>100% ancho/alto</td><td><code>w-100</code></td></tr>
  <tr><td><code>d-none</code> / <code>d-md-block</code></td><td>ocultar/mostrar por breakpoint</td><td>ocultar imagen móvil en Login</td></tr>
</table>

<div class="code-wrap">
  <span class="file-label">src/pages/Login.jsx — mostrar/ocultar</span>
<pre><code class="language-jsx">&lt;Col md={6} className="d-none d-md-block" style={{ background: 'var(--primary)' }} /&gt;</code></pre>
</div>

<p>Lectura: oculto siempre (<code>d-none</code>) <strong>excepto</strong> a partir de <code>md</code> (<code>d-md-block</code>). En móvil desaparece para no robar espacio al formulario.</p>

<h2>6. CSS Grid: cuadrículas que se auto-ajustan</h2>

<p>Para listas de tarjetas, Grid es más potente que Bootstrap. El proyecto lo usa en la página de productos:</p>

<div class="code-wrap">
  <span class="file-label">src/pages/Productos.css</span>
<pre><code class="language-css">.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1.5rem;
}
@media (max-width: 576px) {
  .productos-grid { grid-template-columns: 1fr; }
}</code></pre>
</div>

<p>Lectura: <code>auto-fill</code> mete cuantas columnas quepan; <code>minmax(16rem, 1fr)</code> cada una mide entre 16rem y 1 fracción del espacio. Resultado: 4-5 cards en grande, 3 en mediana, 2 en pequeña, 1 en móvil. <strong>Sin escribir media queries para cada tamaño</strong>.</p>

<h2>7. Media queries: el resto del responsive</h2>

<div class="code-wrap">
  <span class="file-label">src/Home.css — fragmento</span>
<pre><code class="language-css">@media (max-width: 991.98px) {
  .home-hero__titulo { font-size: 2.4rem; }
}

@media (max-width: 767.98px) {
  .marquee { grid-template-columns: 1fr; height: auto; }
  .marquee__track--down { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track--up,
  .marquee__track--down { animation: none; }
}</code></pre>
</div>

<p>Esa última es accesibilidad: usuarios que en su SO han pedido reducir movimiento dejan de ver animaciones.</p>

<h2>8. Animaciones con <code>@keyframes</code></h2>

<p>La home tiene un carrusel vertical infinito ("marquee") hecho con CSS:</p>

<div class="code-wrap">
  <span class="file-label">src/Home.css</span>
<pre><code class="language-css">.marquee__track--up {
  animation: marquee-up 24s linear infinite;
}
@keyframes marquee-up {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}</code></pre>
</div>

<p>Truco del bucle perfecto: el contenido se duplica en JSX (<code>[...BLOQUES, ...BLOQUES]</code>) → 8 items en lugar de 4. La animación llega al -50% justo cuando los 4 segundos están en la posición inicial de los 4 primeros. El siguiente fotograma es visualmente idéntico al inicio → bucle invisible sin parpadeo.</p>

<h2>9. La cascada y la especificidad: quién gana</h2>

<p>Dos reglas apuntan al mismo elemento. ¿Cuál se aplica? La más <strong>específica</strong>. La especificidad se cuenta como tupla (IDs, clases, etiquetas):</p>

<figure class="diagrama">
  <figcaption>Especificidad: de más débil a más fuerte</figcaption>
  <pre class="mermaid">
flowchart LR
  T["tag<br/>(0,0,1)"] --> C["class / attr / pseudo<br/>(0,1,0)"]
  C --> CT["class + tag<br/>(0,1,1)"]
  CT --> ID["#id<br/>(1,0,0)"]
  ID --> IL["style inline<br/>(1,0,0,0)"]
  IL --> IMP["!important<br/>(gana sobre todo)"]
  </pre>
</figure>

<div class="code-wrap">
<pre><code class="language-css">/* Bootstrap: .btn-primary { background: #0d6efd; }  → (0,1,0) */

/* Override con misma especificidad, cargado DESPUÉS */
.btn-lav { background: var(--ink); }              /* (0,1,0) — funciona si carga después */

/* Override más específico, gana independientemente del orden */
button.btn-lav { background: var(--ink); }        /* (0,1,1) > (0,1,0) */</code></pre>
</div>

<p>En DaWeb, <code>theme.css</code> se carga DESPUÉS de Bootstrap, por lo que los estilos personalizados sobrescriben sin necesidad de mayor especificidad:</p>

<div class="code-wrap">
  <span class="file-label">main.jsx — orden importa</span>
<pre><code class="language-jsx">import 'bootstrap/dist/css/bootstrap.min.css'  // 1º Bootstrap
import './index.css'                            // 2º base
import './theme.css'                            // 3º tema (gana)</code></pre>
</div>

<h2>10. Preguntas trampa frecuentes</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué Bootstrap usa <code>border-box</code> global?"</div>
  <p>Porque <code>content-box</code> es contraintuitivo: <code>width: 100%</code> + padding desborda el contenedor. Con <code>border-box</code>, el ancho incluye padding y todo encaja como esperas.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué es la cascada CSS y por qué importa el orden de import?"</div>
  <p>Cascada: a igual especificidad gana la regla declarada DESPUÉS. En <code>main.jsx</code>, Bootstrap primero y <code>theme.css</code> después → tema gana sin <code>!important</code>.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "<code>display: none</code> vs <code>visibility: hidden</code>"</div>
  <p><code>display: none</code> saca el elemento del flujo: no ocupa espacio, no recibe clicks. <code>visibility: hidden</code> lo hace invisible pero sigue reservando espacio. <code>.d-none</code> usa <code>display: none</code>.</p>
</div>

<h2>11. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">Si cambio <code>--primary</code> en <code>theme.css</code>, ¿qué pasa?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Nada hasta que toque cada card manualmente.</button>
    <button class="quiz-opcion" data-correcta="1">Cualquier sitio que use <code>var(--primary)</code> hereda el nuevo color.</button>
    <button class="quiz-opcion" data-correcta="0">Sólo afecta a las páginas que importen <code>theme.css</code> de nuevo.</button>
    <button class="quiz-opcion" data-correcta="0">Error: <code>--primary</code> está reservada.</button>
  </div>
  <p class="quiz-feedback" data-ok="Las variables CSS propagan en cascada." data-ko="La gracia de las variables: un cambio, mil sitios."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué significa <code>&lt;Col md={6} className="d-none d-md-block"&gt;</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Ocupa 6 cols en móvil y se oculta en escritorio.</button>
    <button class="quiz-opcion" data-correcta="1">Oculta en móvil; a partir de md, bloque, 6/12.</button>
    <button class="quiz-opcion" data-correcta="0">6 píxeles en md.</button>
    <button class="quiz-opcion" data-correcta="0">Responsive con 6 cols siempre.</button>
  </div>
  <p class="quiz-feedback" data-ok="d-none oculta; d-md-block re-muestra en md." data-ko="Las responsive de Bootstrap se acumulan: la última que aplica gana."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 3</div>
  <p class="quiz-pregunta">¿Qué hace <code>repeat(auto-fill, minmax(16rem, 1fr))</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Crea 16 columnas siempre.</button>
    <button class="quiz-opcion" data-correcta="1">Mete tantas columnas como quepan, cada una entre 16rem y 1fr.</button>
    <button class="quiz-opcion" data-correcta="0">Repite la primera columna 16 veces.</button>
    <button class="quiz-opcion" data-correcta="0">Selector inválido.</button>
  </div>
  <p class="quiz-feedback" data-ok="Sustituye varias media queries por una línea." data-ko="auto-fill: cuantas quepan; minmax(min, max): rango por columna."></p>
</div>

<h2>12. Ejercicios sobre el proyecto</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Cambiar el color primario</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <p>En <code>theme.css</code>, cambia <code>--primary</code> a <code>#1971c2</code>. Recarga la web: barras de título, focus, botones.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Modificar la grid de productos</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>En <code>Productos.css</code>, cambia <code>minmax(16rem, 1fr)</code> por <code>minmax(12rem, 1fr)</code>. Observa: caben más tarjetas. Prueba 22rem para menos.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Breakpoint extra para tablet</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
<pre><code class="language-css">@media (min-width: 577px) and (max-width: 768px) {
  .productos-grid { grid-template-columns: repeat(2, 1fr); }
}</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Nueva clase utility .btn-peri</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
<pre><code class="language-css">.btn-peri {
  background: var(--periwinkle);
  border: none;
  color: var(--ink);
  border-radius: 999px;
  padding: 0.6rem 1.5rem;
  font-weight: 500;
  transition: background var(--transition);
}
.btn-peri:hover { background: var(--periwinkle-2); }</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 5</span>
    <span>Modo oscuro casero</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
<pre><code class="language-css">@media (prefers-color-scheme: dark) {
  :root {
    --surface: #1a1727;
    --surface-soft: #2a2440;
    --ink: #f6f4fb;
    --ink-soft: #c8b6ff;
  }
}</code></pre>
  <p>Con el SO en oscuro, la web invierte. Variante: <code>:root[data-tema="oscuro"]</code> y togglear el atributo desde JS.</p>
</div>
`;
