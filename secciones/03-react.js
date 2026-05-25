window.__SECC = window.__SECC || {};
window.__SECC["react"] = `<h1>React: componentes y JSX</h1>
<p class="subtitulo">El bloque de construcción central de toda la aplicación.</p>

<p class="lead">React es una librería de JavaScript para construir interfaces. Su idea central: divides la página en <strong>componentes</strong> (piezas reutilizables) y los compones como bloques de LEGO. Cada componente es una función que devuelve HTML (en una sintaxis llamada JSX). En esta sección desmenuzamos cómo se construye DaWeb pieza a pieza.</p>

<h2>1. ¿Qué es un componente?</h2>
<p>Un <strong>componente</strong> es simplemente una función de JavaScript que devuelve algo que React sabe pintar.</p>

<div class="code-wrap">
  <span class="file-label">componente mínimo</span>
<pre><code class="language-jsx">function Saludo() {
  return &lt;h1&gt;Hola, mundo&lt;/h1&gt;;
}

export default Saludo;</code></pre>
</div>

<p>Reglas básicas:</p>
<ul>
  <li>El nombre del componente <strong>empieza por mayúscula</strong> (así React lo distingue de etiquetas HTML normales).</li>
  <li>Devuelve un único elemento raíz (puedes envolver varios en un Fragment <code>&lt;&gt;...&lt;/&gt;</code>).</li>
  <li>Se exporta normalmente con <code>export default</code>.</li>
  <li>Se usa como una etiqueta: <code>&lt;Saludo /&gt;</code>.</li>
</ul>

<h2>2. JSX: HTML dentro de JS</h2>
<p>JSX es una sintaxis especial que parece HTML pero en realidad es JavaScript. Un compilador (Babel/Vite) la convierte en llamadas a <code>React.createElement(...)</code>.</p>

<h3>Lo que parece HTML pero NO lo es</h3>
<table>
  <tr><th>HTML</th><th>JSX</th><th>Motivo</th></tr>
  <tr><td><code>class="..."</code></td><td><code>className="..."</code></td><td><code>class</code> es palabra reservada en JS.</td></tr>
  <tr><td><code>for="..."</code></td><td><code>htmlFor="..."</code></td><td><code>for</code> también es reservada.</td></tr>
  <tr><td><code>onclick="..."</code></td><td><code>onClick={...}</code></td><td>camelCase y JS, no string.</td></tr>
  <tr><td><code>style="color: red"</code></td><td><code>style={{ color: 'red' }}</code></td><td>Objeto JS con propiedades camelCase.</td></tr>
  <tr><td><code>&lt;input&gt;</code></td><td><code>&lt;input /&gt;</code></td><td>Etiquetas vacías cierran con <code>/&gt;</code>.</td></tr>
</table>

<h3>Interpolar JS con llaves <code>{}</code></h3>
<div class="code-wrap">
  <span class="file-label">ejemplos</span>
<pre><code class="language-jsx">const nombre = 'Ana';
const edad = 25;

// Interpolar valores
return &lt;h1&gt;Hola {nombre}, tienes {edad} años&lt;/h1&gt;;

// Atributos dinámicos
return &lt;img src={imagen} alt={descripcion} /&gt;;

// Expresiones (no instrucciones)
return &lt;p&gt;{edad &gt;= 18 ? 'Mayor' : 'Menor'}&lt;/p&gt;;

// Llamar funciones
return &lt;p&gt;{nombre.toUpperCase()}&lt;/p&gt;;</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Importante</div>
  <p>Dentro de <code>{}</code> sólo van <strong>expresiones</strong> (cosas que devuelven valor). No puedes meter un <code>if</code>, un <code>for</code> o un <code>const</code>. Para condicionar, usa el operador ternario o <code>&amp;&amp;</code>.</p>
</div>

<h3>Renderizado condicional</h3>
<div class="code-wrap">
  <span class="file-label">src/components/ProductoCard.jsx — fragmento</span>
<pre><code class="language-jsx">{producto.vendido &amp;&amp; (
  &lt;Badge pill bg="dark" className="position-absolute"&gt;
    Vendido
  &lt;/Badge&gt;
)}</code></pre>
</div>
<p>La regla: <code>{expresion &amp;&amp; jsx}</code>. Si <code>expresion</code> es truthy, se pinta el JSX; si no, no.</p>

<div class="code-wrap">
  <span class="file-label">src/components/Header.jsx — fragmento</span>
<pre><code class="language-jsx">{usuario ? (
  &lt;div className="d-flex gap-2 align-items-center"&gt;
    &lt;button className="header-btn" onClick={salir}&gt;Salir&lt;/button&gt;
  &lt;/div&gt;
) : (
  &lt;Link to="/login" className="header-btn"&gt;Iniciar sesión&lt;/Link&gt;
)}</code></pre>
</div>
<p>La regla: <code>{condicion ? jsxA : jsxB}</code>. Es el operador ternario aplicado al JSX.</p>

<h3>Listas con <code>.map()</code></h3>
<div class="code-wrap">
  <span class="file-label">src/pages/Productos.jsx — fragmento</span>
<pre><code class="language-jsx">&lt;div className="productos-grid"&gt;
  {productos.map((p) =&gt; (
    &lt;ProductoCard key={p.id} producto={p} /&gt;
  ))}
&lt;/div&gt;</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Atributo <code>key</code></div>
  <p>Cuando renderizas una lista, cada elemento necesita un <code>key</code> único y estable. React lo usa para saber qué elementos cambiaron sin volver a pintar todo. Usa el <strong>id</strong> de la entidad, no el índice del array.</p>
</div>

<h2>3. Props: pasar datos al componente</h2>
<p>Las <strong>props</strong> (de <em>properties</em>) son los argumentos que recibe un componente, igual que los parámetros de una función. Se pasan como atributos JSX.</p>

<h3>Ejemplo del proyecto</h3>

<div class="code-wrap">
  <span class="file-label">src/components/ProductoCard.jsx</span>
<pre><code class="language-jsx">import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { etiquetaEstado } from '../api/productos';

function ProductoCard({ producto }) {            //  ⬅ recibe la prop "producto"
  return (
    &lt;Card className="h-100 card-hover position-relative"&gt;
      {producto.vendido &amp;&amp; (
        &lt;Badge pill bg="dark" className="position-absolute"&gt;Vendido&lt;/Badge&gt;
      )}
      &lt;Card.Body className="d-flex flex-column"&gt;
        &lt;Card.Title className="text-truncate"&gt;{producto.titulo}&lt;/Card.Title&gt;
        &lt;Card.Text className="small mb-2"&gt;
          {etiquetaEstado(producto.estado)}
          {producto.lugarDeRecogida?.recogida &amp;&amp; \` · \${producto.lugarDeRecogida.recogida}\`}
        &lt;/Card.Text&gt;
        &lt;h4 className="mb-3"&gt;{producto.precio} €&lt;/h4&gt;
        &lt;Link to={\`/productos/\${producto.id}\`} className="btn btn-lav mt-auto"&gt;
          Ver detalle
        &lt;/Link&gt;
      &lt;/Card.Body&gt;
    &lt;/Card&gt;
  );
}

export default ProductoCard;</code></pre>
</div>

<h3>Cómo se usa</h3>
<div class="code-wrap">
  <span class="file-label">src/pages/Productos.jsx</span>
<pre><code class="language-jsx">{productos.map((p) =&gt; (
  &lt;ProductoCard key={p.id} producto={p} /&gt;
))}</code></pre>
</div>

<p>Aquí <code>producto={p}</code> envía el objeto producto al componente. Dentro de <code>ProductoCard</code>, las llaves del parámetro <code>{ producto }</code> son destructuring: equivale a <code>function ProductoCard(props) { const producto = props.producto; ... }</code>.</p>

<h3>Props con valores por defecto</h3>
<div class="code-wrap">
  <span class="file-label">src/components/RutaProtegida.jsx</span>
<pre><code class="language-jsx">function RutaProtegida({ children, soloAdmin = false }) {   //  ⬅ defaults
  const { usuario, esAdmin } = useAuth();
  if (!usuario) return &lt;Navigate to="/login" replace /&gt;;
  if (soloAdmin &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;
  return children;
}</code></pre>
</div>

<h3>La prop especial <code>children</code></h3>
<p>Es lo que pones <em>entre</em> las etiquetas de apertura y cierre del componente.</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Uso</h4>
<pre><code class="language-jsx">&lt;RutaProtegida&gt;
  &lt;NuevoProducto /&gt;       {/* ← esto es children */}
&lt;/RutaProtegida&gt;</code></pre>
  </div>
  <div class="tarjeta">
    <h4>Recepción</h4>
<pre><code class="language-jsx">function RutaProtegida({ children }) {
  // children = &lt;NuevoProducto /&gt;
  return children;
}</code></pre>
  </div>
</div>

<h2>4. Composición de componentes</h2>
<p>Los componentes se anidan. <code>App</code> contiene <code>Header</code>, <code>Productos</code>, <code>Footer</code>… <code>Productos</code> contiene N <code>ProductoCard</code>… Y así.</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> <code>App</code> es el componente raíz (en <code>src/App.jsx</code>).</div>
  <div class="flujo-paso"><span class="num">2</span> Dentro renderiza <code>&lt;Header /&gt;</code>, las rutas y <code>&lt;Footer /&gt;</code>.</div>
  <div class="flujo-paso"><span class="num">3</span> Cada ruta carga una página (componente) como <code>&lt;Productos /&gt;</code>.</div>
  <div class="flujo-paso"><span class="num">4</span> <code>Productos</code> renderiza filtros, listas, <code>&lt;ProductoCard /&gt;</code>, <code>&lt;Paginacion /&gt;</code>…</div>
</div>

<h2>5. React Bootstrap: componentes ya hechos</h2>
<p>El proyecto importa componentes precocinados del paquete <code>react-bootstrap</code> para no escribir el HTML/CSS desde cero.</p>

<table>
  <tr><th>Componente importado</th><th>Equivale a</th><th>Dónde se usa</th></tr>
  <tr><td><code>Container</code></td><td>Caja centrada con máximo ancho</td><td>Casi todas las páginas</td></tr>
  <tr><td><code>Row</code> / <code>Col</code></td><td>Sistema de columnas (12 cols)</td><td>Layout de páginas</td></tr>
  <tr><td><code>Card</code> / <code>Card.Body</code></td><td>Tarjeta con sombra</td><td><code>ProductoCard</code>, <code>Login</code>, perfiles</td></tr>
  <tr><td><code>Form</code> / <code>Form.Control</code> / <code>Form.Select</code></td><td>Inputs estilizados</td><td>Todos los formularios</td></tr>
  <tr><td><code>Button</code></td><td>Botón estilizado</td><td>Acciones varias</td></tr>
  <tr><td><code>Alert</code></td><td>Mensaje de error / éxito</td><td>Tras envío de formularios</td></tr>
  <tr><td><code>Spinner</code></td><td>Indicador de carga</td><td>Listas mientras cargan</td></tr>
  <tr><td><code>Badge</code></td><td>Etiqueta pequeña</td><td>Estados "Vendido", "Admin"</td></tr>
  <tr><td><code>Table</code></td><td>Tabla</td><td>Páginas de admin</td></tr>
  <tr><td><code>Pagination</code></td><td>Componentes para paginar</td><td>Dentro de <code>Paginacion.jsx</code></td></tr>
</table>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Por qué usarlos</div>
  <p>Cada uno acepta props específicos (<code>variant</code>, <code>size</code>, <code>pill</code>…) que se traducen a clases de Bootstrap. Ahorran muchísimo CSS y dan coherencia visual.</p>
</div>

<h2>6. Componentes del proyecto, uno a uno</h2>

<h3>Header (<code>src/components/Header.jsx</code>)</h3>
<p>Barra superior con logo, buscador, links de navegación y botón de login/logout.</p>
<ul>
  <li>Usa <code>useState</code> (sección 04) para el estado del menú móvil y el texto del buscador.</li>
  <li>Usa <code>useAuth()</code> (sección 07) para saber si hay usuario.</li>
  <li>Renderiza enlaces de admin sólo si <code>esAdmin</code>.</li>
  <li>Al enviar el formulario de búsqueda, navega a <code>/productos?descripcion=...</code>.</li>
</ul>

<h3>Footer (<code>src/components/Footer.jsx</code>)</h3>
<p>Pie de página. Trivial: un <code>&lt;footer&gt;</code> con un texto.</p>

<h3>ProductoCard (<code>src/components/ProductoCard.jsx</code>)</h3>
<p>Tarjeta para mostrar un producto en una lista. Recibe la prop <code>producto</code> y muestra título, estado, precio y un botón "Ver detalle".</p>

<h3>Paginacion (<code>src/components/Paginacion.jsx</code>)</h3>
<p>Paginador genérico. Recibe <code>page</code>, <code>totalPaginas</code> y <code>onChange</code>. Se usa en Productos, PerfilVentas, PerfilCompras, AdminTransacciones…</p>

<h3>BotonVolver (<code>src/components/BotonVolver.jsx</code>)</h3>
<p>Botón "← Volver". Usa <code>useNavigate(-1)</code> para retroceder en el historial.</p>

<h3>RutaProtegida (<code>src/components/RutaProtegida.jsx</code>)</h3>
<p>Envoltorio que comprueba sesión y rol; lo veremos a fondo en la sección 09.</p>

<h2>7. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>El Virtual DOM y el algoritmo de reconciliación (Fiber)</h3>
<p>React mantiene en memoria una representación del árbol de la interfaz llamada <strong>Virtual DOM</strong>. Es simplemente un árbol de objetos JavaScript — más barato de crear y comparar que el DOM real del navegador.</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> El estado cambia → React llama a la función del componente de nuevo → genera un <strong>nuevo</strong> árbol Virtual DOM.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> React compara el árbol nuevo con el anterior (algoritmo de <em>diffing</em>). Solo calcula las diferencias mínimas.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> React aplica SOLO esos cambios al DOM real. Si un <code>&lt;h1&gt;</code> no cambió, no lo toca.</div>
</div>

<p>Analogía: un arquitecto que compara dos planos y sólo da instrucciones para mover los tabiques que cambiaron, no derriba el edificio entero.</p>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Re-render ≠ repintar DOM</div>
  <p>Cuando React "re-renderiza" un componente, ejecuta su función y genera el Virtual DOM. Pero si el resultado es idéntico al anterior, el DOM real no cambia. Son dos fases distintas: <strong>render</strong> (generar VDOM) y <strong>commit</strong> (aplicar al DOM).</p>
</div>

<h3>JSX se compila a <code>React.createElement</code></h3>
<p>JSX no es HTML ni es magia. Es azúcar sintáctico que el compilador (Vite/Babel) transforma antes de que el navegador lo vea:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Lo que tú escribes</h4>
<pre><code class="language-jsx">&lt;ProductoCard
  key={p.id}
  producto={p}
/&gt;</code></pre>
  </div>
  <div class="tarjeta">
    <h4>Lo que el compilador genera</h4>
<pre><code class="language-js">React.createElement(
  ProductoCard,
  { key: p.id, producto: p }
)</code></pre>
  </div>
</div>

<p>Con hijos:</p>
<div class="dos-cols">
  <div class="tarjeta">
<pre><code class="language-jsx">&lt;div className="grid"&gt;
  &lt;span&gt;Hola&lt;/span&gt;
&lt;/div&gt;</code></pre>
  </div>
  <div class="tarjeta">
<pre><code class="language-js">React.createElement(
  'div',
  { className: 'grid' },
  React.createElement('span', null, 'Hola')
)</code></pre>
  </div>
</div>

<p>Por eso las etiquetas HTML en JSX van en minúscula (<code>'div'</code> = string) y los componentes en mayúscula (<code>ProductoCard</code> = referencia a función). Si pones <code>&lt;productoCard /&gt;</code> React busca el elemento HTML "productocard" y no lo encuentra.</p>

<h3>¿Cuándo re-renderiza React un componente?</h3>
<p>Un componente vuelve a ejecutarse (re-renderiza) cuando ocurre cualquiera de estas tres cosas:</p>

<table>
  <tr><th>Causa</th><th>Ejemplo en DaWeb</th></tr>
  <tr><td>1. Su estado cambia</td><td><code>setProductos([...])</code> en <code>Productos.jsx</code></td></tr>
  <tr><td>2. Sus props cambian</td><td><code>ProductoCard</code> re-renderiza si la prop <code>producto</code> cambia</td></tr>
  <tr><td>3. Su componente padre re-renderiza</td><td>Si <code>Productos.jsx</code> re-renderiza, todos sus <code>ProductoCard</code> también lo hacen por defecto</td></tr>
</table>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Re-render ≠ lentitud</div>
  <p>Re-renderizar no es automáticamente malo. React es rápido precisamente porque el re-render en Virtual DOM es barato; sólo es un problema si hay miles de componentes re-renderizando innecesariamente. En DaWeb, el tamaño de la app hace que sea irrelevante.</p>
</div>

<h3>La prop <code>key</code>: cómo React rastrea listas</h3>
<p>Cuando renderizas una lista con <code>.map()</code>, React necesita saber qué elemento es qué para no confundirlos entre renders. Para eso usa la prop <code>key</code>.</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Sin key (o con índice)</h4>
<pre><code class="language-jsx">// Peligroso si la lista puede reordenarse
{items.map((item, i) =&gt; (
  &lt;Item key={i} data={item} /&gt;
))}</code></pre>
    <p>Si el elemento 0 desaparece, React "reutiliza" el componente del índice 0 para el que antes era el 1. Si ese componente tenía estado interno (un input con texto), ese estado se queda en el lugar incorrecto.</p>
  </div>
  <div class="tarjeta">
    <h4>Con key estable (correcto)</h4>
<pre><code class="language-jsx">// Correcto: usa el id del dato
{productos.map((p) =&gt; (
  &lt;ProductoCard key={p.id} producto={p} /&gt;
))}</code></pre>
    <p>React puede identificar exactamente qué elemento es cuál, aunque el orden cambie. El estado interno del componente se mantiene vinculado al <em>dato correcto</em>.</p>
  </div>
</div>

<h3>Props: inmutabilidad como contrato</h3>
<p>Un componente es una función. Sus props son sus parámetros. <strong>Nunca modificar props directamente</strong> — es un contrato de React, no sólo una convención:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Incorrecto (bug)</h4>
<pre><code class="language-jsx">function Card({ producto }) {
  producto.precio = 0; // ❌ NUNCA
  return &lt;p&gt;{producto.precio}&lt;/p&gt;;
}</code></pre>
    <p>Mutarías el objeto original en el componente padre. El padre no se enteraría y el estado del componente padre quedaría inconsistente con lo que muestra Card.</p>
  </div>
  <div class="tarjeta">
    <h4>Correcto</h4>
<pre><code class="language-jsx">function Card({ producto }) {
  // Si necesitas modificar, crea una copia
  const precioMostrar = Math.floor(producto.precio);
  return &lt;p&gt;{precioMostrar}&lt;/p&gt;;
}</code></pre>
    <p>El estado del padre no se toca. Card sólo <em>lee</em> sus props y produce un resultado.</p>
  </div>
</div>

<h3>El árbol de componentes de DaWeb y quién re-renderiza a quién</h3>
<div class="code-wrap">
  <span class="file-label">jerarquía simplificada</span>
<pre><code class="language-text">App
└── AuthProvider      ← re-renderiza toda la app cuando cambia usuario
    └── BrowserRouter
        └── Layout
            ├── Header        ← usa useAuth(), re-renderiza en login/logout
            ├── Routes
            │   └── Productos ← re-renderiza al cambiar filtros/página
            │       └── ProductoCard × N  ← cada tarjeta
            └── Footer</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué el header se actualiza cuando haces login?"</strong> — Porque <code>Header</code> llama a <code>useAuth()</code>. Cuando el login tiene éxito, <code>AuthProvider</code> llama a <code>setUsuario(u)</code>. Eso re-renderiza <code>AuthProvider</code>, lo cual re-renderiza <em>todos</em> sus hijos: Layout, Header, etc. Header, al ejecutarse de nuevo, ya tiene el nuevo <code>usuario</code> del contexto.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué pasa si usas el índice del array como key?"</strong> — Si la lista se puede reordenar, filtrar o eliminar elementos, los índices cambian. React reutilizará el componente incorrecto. Los inputs con estado interno mostrarán el valor equivocado. En DaWeb, el id del producto es la key correcta porque es estable y único.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué diferencia hay entre <code>&lt;div&gt;</code> y <code>&lt;Fragment&gt;</code> (<code>&lt;&gt;&lt;/&gt;</code>)?"</strong> — <code>div</code> añade un elemento real al DOM. <code>Fragment</code> es un wrapper invisible: agrupa hijos en JSX sin añadir nada al DOM. Útil cuando JSX necesita un único elemento raíz pero no quieres un div extra (p.ej. celdas de tabla, donde un div dentro de un <code>&lt;tr&gt;</code> es HTML inválido).</p>
</div>

<h2>8. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Por qué los nombres de componentes empiezan por mayúscula?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Es una convención sin efecto técnico.</button>
    <button class="quiz-opcion" data-correcta="1">React usa la mayúscula para distinguir un componente de una etiqueta HTML.</button>
    <button class="quiz-opcion" data-correcta="0">Para que se ordenen alfabéticamente antes en la importación.</button>
    <button class="quiz-opcion" data-correcta="0">Porque las funciones en JS deben empezar por mayúscula.</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. Si fuera minúscula, React intentaría renderizar &lt;saludo&gt; como una etiqueta HTML." data-ko="Tiene un efecto técnico real: JSX trata las minúsculas como tags HTML y las mayúsculas como componentes JS."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué hace este JSX?<br><code>&lt;ul&gt;{items.map(i =&gt; &lt;li&gt;{i}&lt;/li&gt;)}&lt;/ul&gt;</code></p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">No hace nada porque falta <code>return</code>.</button>
    <button class="quiz-opcion" data-correcta="1">Renderiza un <code>&lt;li&gt;</code> por cada elemento de items (faltaría la prop <code>key</code>).</button>
    <button class="quiz-opcion" data-correcta="0">Renderiza sólo el primer item.</button>
    <button class="quiz-opcion" data-correcta="0">Concatena los items en un único <code>&lt;li&gt;</code>.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. Y el warning te recordará añadir key={i} o key={index}." data-ko=".map devuelve un array de elementos; React lo pinta uno tras otro."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 3</div>
  <p class="quiz-pregunta">En <code>&lt;RutaProtegida soloAdmin&gt;...&lt;/RutaProtegida&gt;</code>, ¿qué valor recibe la prop <code>soloAdmin</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">"soloAdmin" (string).</button>
    <button class="quiz-opcion" data-correcta="1">true (booleano).</button>
    <button class="quiz-opcion" data-correcta="0">undefined.</button>
    <button class="quiz-opcion" data-correcta="0">Error de sintaxis.</button>
  </div>
  <p class="quiz-feedback" data-ok="Sí. En JSX, una prop sin valor equivale a true." data-ko="JSX tiene atajo: una prop sin '=' equivale a true."></p>
</div>

<h2>9. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Crear un componente Saludo</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <ol>
    <li>Crea <code>src/components/Saludo.jsx</code>:</li>
  </ol>
<pre><code class="language-jsx">function Saludo({ nombre = 'visitante' }) {
  return &lt;p&gt;Hola, {nombre}!&lt;/p&gt;;
}
export default Saludo;</code></pre>
  <ol start="2">
    <li>Impórtalo en <code>src/pages/Home.jsx</code> y úsalo: <code>&lt;Saludo nombre="Jiahui" /&gt;</code> dentro del hero.</li>
  </ol>
  <details>
    <summary>Comprobar</summary>
    <p>Al recargar deberías ver "Hola, Jiahui!" en la home.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Añadir una prop a ProductoCard</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Modifica <code>ProductoCard</code> para aceptar una prop <code>mostrarPrecio = true</code>. Si llega como <code>false</code>, oculta el precio.</p>
  <details>
    <summary>Solución</summary>
<pre><code class="language-jsx">function ProductoCard({ producto, mostrarPrecio = true }) {
  // ...
  {mostrarPrecio &amp;&amp; (
    &lt;h4 className="mb-3" style={{ color: 'var(--ink)' }}&gt;{producto.precio} €&lt;/h4&gt;
  )}
  // ...
}</code></pre>
    <p>Y en alguna página: <code>&lt;ProductoCard producto={p} mostrarPrecio={false} /&gt;</code>.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Renderizado condicional invertido</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>En <code>ProductoCard</code>, en lugar de un <code>Badge</code> "Vendido" si <code>producto.vendido</code>, añade un <code>Badge</code> "Disponible" verde si NO está vendido.</p>
  <details>
    <summary>Solución</summary>
<pre><code class="language-jsx">{!producto.vendido &amp;&amp; (
  &lt;Badge pill bg="success" className="position-absolute"
    style={{ top: '0.75rem', right: '0.75rem', zIndex: 1 }}&gt;
    Disponible
  &lt;/Badge&gt;
)}</code></pre>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Children explícito</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Crea un componente <code>Cuadro</code> en <code>components/Cuadro.jsx</code> que envuelva sus <code>children</code> en una caja con borde y sombra:</p>
<pre><code class="language-jsx">function Cuadro({ titulo, children }) {
  return (
    &lt;div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}&gt;
      {titulo &amp;&amp; &lt;h3&gt;{titulo}&lt;/h3&gt;}
      {children}
    &lt;/div&gt;
  );
}
export default Cuadro;</code></pre>
  <p>Y úsalo en cualquier página:</p>
<pre><code class="language-jsx">&lt;Cuadro titulo="Prueba"&gt;
  &lt;p&gt;Cualquier contenido va aquí.&lt;/p&gt;
  &lt;button&gt;OK&lt;/button&gt;
&lt;/Cuadro&gt;</code></pre>
  <details>
    <summary>Por qué es importante</summary>
    <p>Este patrón se llama "compound component" o "slot". Lo verás en <code>RutaProtegida</code> de DaWeb, y es la base de cómo se componen layouts y modales.</p>
  </details>
</div>
`;
