window.__SECC = window.__SECC || {};
window.__SECC["estado"] = `<h1>Estado y efectos (hooks)</h1>
<p class="subtitulo">Cómo los componentes "recuerdan" y reaccionan a cambios.</p>

<p class="lead">Hasta ahora hemos visto componentes que sólo dibujan. Pero las páginas reales <em>cambian</em>: se escriben formularios, se cargan datos del servidor, aparecen errores. Para esto, React tiene <strong>hooks</strong>: funciones especiales (siempre empiezan por <code>use…</code>) que dan superpoderes a los componentes. En esta sección verás los 3 hooks que aparecen en DaWeb: <code>useState</code>, <code>useEffect</code> y <code>useRef</code>.</p>

<h2>1. ¿Qué es el "estado"?</h2>
<p>El estado son los <strong>datos cambiantes</strong> de un componente. Cuando cambian, React redibuja el componente automáticamente.</p>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Idea clave</div>
  <p>Si modificas una variable normal con <code>=</code>, React no se entera y no redibuja. Tienes que usar <code>useState</code> para que React vigile el cambio.</p>
</div>

<h2>2. <code>useState</code></h2>

<div class="code-wrap">
  <span class="file-label">forma general</span>
<pre><code class="language-jsx">import { useState } from 'react';

function MiComponente() {
  const [valor, setValor] = useState(valorInicial);
  // ...
  return &lt;button onClick={() =&gt; setValor(valor + 1)}&gt;{valor}&lt;/button&gt;;
}</code></pre>
</div>

<p>Lectura del destructuring:</p>
<ul>
  <li><code>valor</code>: la variable de estado actual.</li>
  <li><code>setValor</code>: la función para actualizarla. Al llamarla, React vuelve a renderizar el componente.</li>
  <li>El argumento de <code>useState(...)</code> es el valor inicial.</li>
</ul>

<h3>Ejemplo del proyecto: el buscador del header</h3>

<div class="code-wrap">
  <span class="file-label">src/components/Header.jsx</span>
<pre><code class="language-jsx">function Header() {
  const [isOpen, setIsOpen] = useState(false);      // menú hamburguesa abierto?
  const [busqueda, setBusqueda] = useState('');     // texto del buscador
  // ...
  return (
    &lt;form onSubmit={buscar}&gt;
      &lt;input
        type="search"
        value={busqueda}                            // ⬅ controlado
        onChange={(e) =&gt; setBusqueda(e.target.value)} // ⬅ actualiza el estado
      /&gt;
    &lt;/form&gt;
  );
}</code></pre>
</div>

<h3>Formularios "controlados"</h3>
<p>Un input se llama <strong>controlado</strong> cuando React es la fuente de verdad de su valor. El patrón es siempre:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Estado <code>const [x, setX] = useState('')</code>.</div>
  <div class="flujo-paso"><span class="num">2</span> Atributo <code>value={x}</code>.</div>
  <div class="flujo-paso"><span class="num">3</span> Atributo <code>onChange={e =&gt; setX(e.target.value)}</code>.</div>
</div>

<h3>Estado complejo: un objeto entero</h3>
<p>Cuando hay muchos campos, se usa UN solo <code>useState</code> con un objeto:</p>

<div class="code-wrap">
  <span class="file-label">src/pages/Registro.jsx</span>
<pre><code class="language-jsx">const [datos, setDatos] = useState({
  nombre: '', apellidos: '', correo: '',
  clave: '', fechaNacimiento: '', telefono: '',
});

const cambiar = (e) =&gt;
  setDatos({ ...datos, [e.target.name]: e.target.value });   // ⬅ spread + clave dinámica</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> ¡No mutes!</div>
  <p>NUNCA hagas <code>datos.nombre = 'Ana'</code> y luego <code>setDatos(datos)</code>: React no detectaría el cambio (la referencia del objeto es la misma). Crea SIEMPRE un objeto nuevo con <code>{ ...datos, campo: valor }</code>.</p>
</div>

<h3>El valor inicial: función "perezosa"</h3>
<p>Si calcular el valor inicial es costoso, pásalo como una función:</p>

<div class="code-wrap">
  <span class="file-label">src/context/AuthContext.jsx</span>
<pre><code class="language-jsx">const [usuario, setUsuario] = useState(usuarioDesdeToken);
// Lo pasamos como referencia a la función, no llamándola.
// React la ejecuta UNA SOLA VEZ, al montar el componente.</code></pre>
</div>

<h2>3. <code>useEffect</code>: efectos secundarios</h2>
<p>"Efecto secundario" es todo lo que pasa fuera del flujo puro de "dibujar JSX": hacer una petición HTTP, suscribirse a un evento, modificar el título de la pestaña, arrancar un timer…</p>

<div class="code-wrap">
  <span class="file-label">forma general</span>
<pre><code class="language-jsx">useEffect(() =&gt; {
  // código que se ejecuta tras renderizar
  return () =&gt; {
    // (opcional) limpieza al desmontar o antes de re-ejecutar
  };
}, [dependencias]);</code></pre>
</div>

<h3>El segundo argumento (array de dependencias) decide CUÁNDO se ejecuta</h3>
<table>
  <tr><th>Forma</th><th>Cuándo se ejecuta</th></tr>
  <tr><td>Sin segundo argumento</td><td>Después de cada render. Casi nunca quieres esto.</td></tr>
  <tr><td><code>[]</code></td><td>Sólo una vez, al montar.</td></tr>
  <tr><td><code>[x, y]</code></td><td>Al montar y cada vez que <code>x</code> o <code>y</code> cambien.</td></tr>
</table>

<h3>Ejemplo 1: cargar datos al montar</h3>

<div class="code-wrap">
  <span class="file-label">src/pages/Productos.jsx — fragmento</span>
<pre><code class="language-jsx">// 1) Cargar categorías UNA VEZ al montar
useEffect(() =&gt; {
  categoriasApi.listarCategoriasRaiz()
    .then((lista) =&gt; setCategorias(lista ?? []))
    .catch(() =&gt; setCategorias([]));
}, []);                                              // ← array vacío

// 2) Cargar productos cuando cambien filtros o página
useEffect(() =&gt; {
  setCargando(true);
  setError('');
  productosApi
    .listarProductos({ ...filtros, page, size: TAMANYO_PAGINA })
    .then((res) =&gt; {
      setProductos(desempaquetar(res, 'productoList'));
      setTotalPaginas(totalPaginasRes(res));
    })
    .catch((err) =&gt; setError(err.message))
    .finally(() =&gt; setCargando(false));
}, [filtros, page]);                                  // ← dependencias</code></pre>
</div>

<h3>Ejemplo 2: limpieza con función de retorno</h3>

<div class="code-wrap">
  <span class="file-label">src/pages/Login.jsx — fragmento</span>
<pre><code class="language-jsx">const intervaloRef = useRef(null);

useEffect(() =&gt; () =&gt; {
  // Función de limpieza: se ejecuta al desmontar el componente
  if (intervaloRef.current) clearInterval(intervaloRef.current);
}, []);</code></pre>
</div>

<p>El patrón <code>() =&gt; () =&gt; { ... }</code> puede confundir: es una arrow function que devuelve otra arrow function. La interior es la limpieza.</p>

<h3>Cuidado: efecto async</h3>
<p>El callback de <code>useEffect</code> NO debe ser async directamente. Hay dos formas:</p>

<div class="tabs">
  <div class="tabs-cabecera">
    <button class="activa">.then (lo que usa el proyecto)</button>
    <button>Función interna async</button>
  </div>
  <div class="tabs-contenido">
    <div class="tabs-panel activa">
<pre><code class="language-jsx">useEffect(() =&gt; {
  productosApi.obtenerProducto(id)
    .then(setProducto)
    .catch((err) =&gt; setError(err.message));
}, [id]);</code></pre>
    </div>
    <div class="tabs-panel">
<pre><code class="language-jsx">useEffect(() =&gt; {
  const cargar = async () =&gt; {
    try {
      const p = await productosApi.obtenerProducto(id);
      setProducto(p);
    } catch (err) { setError(err.message); }
  };
  cargar();
}, [id]);</code></pre>
    </div>
  </div>
</div>

<h2>4. <code>useRef</code>: una "caja" que persiste sin redibujar</h2>
<p>Lo verás dos veces en el proyecto. Sirve cuando necesitas <strong>guardar un valor que persiste entre renders pero que no debe disparar un re-render al cambiar</strong>.</p>

<h3>Ejemplo 1: evitar contar una visualización dos veces</h3>

<div class="code-wrap">
  <span class="file-label">src/pages/DetalleProducto.jsx</span>
<pre><code class="language-jsx">const visualizacionContadaRef = useRef(null);

useEffect(() =&gt; {
  setCargando(true);
  productosApi.obtenerProducto(id)
    .then(setProducto)
    .catch((err) =&gt; setError(err.message))
    .finally(() =&gt; setCargando(false));

  if (visualizacionContadaRef.current !== id) {
    visualizacionContadaRef.current = id;             // ⬅ recordar id ya contado
    productosApi.sumarVisualizacion(id).catch(() =&gt; {});
  }
}, [id]);</code></pre>
</div>

<p>¿Por qué <code>useRef</code> y no <code>useState</code>? Porque <strong>queremos recordar el id contado sin volver a renderizar</strong> el componente. Si fuera <code>useState</code>, al cambiarlo se dispararía un re-render innecesario.</p>

<h3>Ejemplo 2: guardar un timer</h3>

<div class="code-wrap">
  <span class="file-label">src/pages/Login.jsx</span>
<pre><code class="language-jsx">const intervaloRef = useRef(null);

// ...arrancar el intervalo en una acción
intervaloRef.current = setInterval(() =&gt; { ... }, 400);

// ...cancelarlo cuando ya no haga falta
if (intervaloRef.current) clearInterval(intervaloRef.current);
intervaloRef.current = null;</code></pre>
</div>

<h2>5. Las reglas de los hooks</h2>
<ol>
  <li><strong>Sólo en componentes</strong> (o en otros hooks).</li>
  <li><strong>Siempre en el nivel superior</strong> del componente. NO los pongas dentro de <code>if</code>, <code>for</code>, <code>while</code> o funciones anidadas.</li>
  <li><strong>Siempre se llaman en el mismo orden</strong> en cada render.</li>
</ol>

<div class="callout danger">
  <div class="callout-titulo"><i class="bi bi-x-circle"></i> Esto rompe React</div>
<pre><code class="language-jsx">if (algo) {
  const [x, setX] = useState(0);   // ❌ MAL
}</code></pre>
  <p>El número y orden de llamadas a hooks DEBE ser idéntico en todos los renders. Si no, React no puede asociar el estado correctamente.</p>
</div>

<h2>6. Ciclo de vida en una página típica</h2>
<p>Tomemos <code>DetalleProducto</code> como caso real:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario hace click en "Ver detalle". React monta <code>&lt;DetalleProducto /&gt;</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> Primer render: useState inicializa <code>producto=null</code>, <code>cargando=true</code>. JSX muestra el spinner.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> useEffect se dispara: pide el producto a la API y suma la visualización.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> Llega la respuesta. <code>setProducto(...)</code> y <code>setCargando(false)</code> disparan un re-render.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> Segundo render: JSX muestra los datos del producto.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">6</span> Si el usuario hace click en "Comprar", la función async modifica el estado y re-renderiza con el mensaje de éxito.</div>
</div>

<h2>7. Playgrounds</h2>

<div class="try-it">
  <div class="try-it-cabecera"><i class="bi bi-play-circle"></i> Simular el patrón useState (sin React)</div>
  <textarea spellcheck="false">// Simulamos un contador "controlado"
let valor = 0;
const setValor = (nuevo) =&gt; {
  valor = nuevo;
  pintar();
};
const pintar = () =&gt; console.log('Estado actual:', valor);

pintar();
setValor(1);
setValor(2);
setValor(valor + 10);</textarea>
  <div class="try-it-acciones">
    <button class="btn-ejecutar"><i class="bi bi-play-fill"></i> Ejecutar</button>
    <button class="btn-limpiar secundario">Reiniciar</button>
  </div>
  <div class="try-it-salida"></div>
</div>

<div class="try-it">
  <div class="try-it-cabecera"><i class="bi bi-play-circle"></i> Inmutabilidad en objetos</div>
  <textarea spellcheck="false">// Cómo modificar un campo SIN mutar el original
const persona = { nombre: 'Ana', edad: 30 };

// ❌ Esto es lo que NO debes hacer en React
// persona.edad = 31;

// ✅ Esto sí
const cambiada = { ...persona, edad: 31 };
console.log('Original:', persona);
console.log('Cambiada:', cambiada);
console.log('¿Misma ref?', persona === cambiada);</textarea>
  <div class="try-it-acciones">
    <button class="btn-ejecutar"><i class="bi bi-play-fill"></i> Ejecutar</button>
    <button class="btn-limpiar secundario">Reiniciar</button>
  </div>
  <div class="try-it-salida"></div>
</div>

<h2>8. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>El modelo "snapshot": por qué setState no actualiza inmediatamente</h3>
<p>React renderiza un componente como una "foto" (snapshot) del estado en ese momento. Dentro de ese render, el valor de cada variable de estado está <strong>congelado</strong>. Llamar a <code>setX</code> no actualiza <code>x</code> dentro del render actual; le dice a React "en el próximo render, usa este nuevo valor".</p>

<div class="code-wrap">
  <span class="file-label">La trampa clásica del snapshot</span>
<pre><code class="language-jsx">// ❌ Esto NO suma 3 al contador
function sumarTres() {
  setContador(contador + 1);  // encola: nuevo valor = 0+1 = 1
  setContador(contador + 1);  // encola: nuevo valor = 0+1 = 1 (contador sigue siendo 0!)
  setContador(contador + 1);  // encola: nuevo valor = 0+1 = 1
}
// Resultado: el contador pasa a 1, no a 3.

// ✅ CORRECTO: usa la forma funcional que recibe el estado ACTUAL
function sumarTres() {
  setContador(prev => prev + 1);  // encola: nuevo = prev+1
  setContador(prev => prev + 1);  // encola: nuevo = (prev+1)+1
  setContador(prev => prev + 1);  // encola: nuevo = (prev+1+1)+1
}
// Resultado: el contador pasa a 3.</code></pre>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> La forma funcional en el proyecto</div>
  <p>En <code>Productos.jsx</code>, cuando se sincroniza con la URL: <code>setFiltros((prev) => ({ ...prev, descripcion: descripcionUrl }))</code>. Se usa la forma funcional <code>prev => ...</code> para asegurarse de que el spread usa el filtro más reciente, no el del snapshot anterior.</p>
</div>

<h3>State batching en React 18</h3>
<p>A partir de React 18, si llamas a varios <code>setState</code> dentro del mismo event handler, React los agrupa y sólo hace <strong>un solo re-render</strong> con todos los cambios aplicados. Esto se llama "batching automático".</p>

<div class="code-wrap">
<pre><code class="language-jsx">// En el handler del submit de Login.jsx:
const enviar = async (e) => {
  e.preventDefault();
  setError('');           // no re-renderiza aún
  setEnviando(true);      // no re-renderiza aún
  // React agrupa estas dos en UN solo re-render
  const res = await login(correo, clave);
  setEnviando(false);     // no re-renderiza aún
  if (res.ok) navegar('/');
  else setError(res.error); // no re-renderiza aún
  // Al final del handler, React hace UN solo re-render con ambos cambios
};</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Antes de React 18</div>
  <p>En React 17 y anteriores, el batching sólo ocurría en event handlers sintéticos de React. Dentro de <code>setTimeout</code>, <code>fetch</code> callbacks o Promises, cada <code>setState</code> disparaba un re-render separado. React 18 resuelve esto con "Automatic Batching".</p>
</div>

<h3>El stale closure problem: el bug más difícil de ver con useEffect</h3>
<p>Cuando un <code>useEffect</code> captura una variable en el momento de crearse, si esa variable cambia después, el efecto sigue viendo el valor <em>antiguo</em> (el del closure, que está "rancio" — stale).</p>

<div class="code-wrap">
  <span class="file-label">Stale closure — ejemplo del problema</span>
<pre><code class="language-jsx">// ❌ Bug: filtros en el efecto es siempre el valor inicial
useEffect(() => {
  productosApi.listarProductos(filtros)  // filtros SIEMPRE es el valor inicial
    .then(setProductos);
}, []);  // ← array vacío: el efecto no se re-ejecuta cuando filtros cambia

// ✅ Correcto: filtros en las dependencias
useEffect(() => {
  productosApi.listarProductos(filtros)
    .then(setProductos);
}, [filtros]);  // ← el efecto se re-ejecuta cada vez que filtros cambia</code></pre>
</div>

<p>En DaWeb, el efecto de carga de productos depende de <code>[filtros, page]</code>. Si olvidaras incluir <code>filtros</code>, cambiar los filtros no recargaría los productos — el efecto usaría siempre los filtros del momento en que se creó el closure (los filtros iniciales vacíos).</p>

<h3>Lazy initialization de useState: cuándo y por qué</h3>
<p>Hay dos formas de pasar el valor inicial a <code>useState</code>:</p>

<div class="code-wrap">
<pre><code class="language-jsx">// Forma 1: valor directo
const [usuario, setUsuario] = useState(usuarioDesdeToken());
// usuarioDesdeToken() se llama en CADA render del componente
// (aunque React descarte el resultado después del primero)
// Problema: parsear el JWT es una operación costosa

// Forma 2: función lazy (referencia, sin paréntesis)
const [usuario, setUsuario] = useState(usuarioDesdeToken);
// React llama a usuarioDesdeToken() UNA SOLA VEZ, en el primer render
// En los siguientes renders, ignora el initializer completamente</code></pre>
</div>

<p>En <code>AuthContext.jsx</code> se usa la Forma 2: <code>useState(usuarioDesdeToken)</code>. Si se usara la Forma 1, cada vez que <code>AuthProvider</code> re-renderizara (por ejemplo, al cambiar el idioma), llamaría a <code>usuarioDesdeToken()</code> innecesariamente (parsear JWT, acceder a localStorage). Con la Forma 2, eso ocurre sólo al montar.</p>

<h3>useRef vs useState: cuándo cada uno</h3>
<table>
  <tr><th>Característica</th><th><code>useState</code></th><th><code>useRef</code></th></tr>
  <tr><td>Cambiar el valor</td><td><code>setValor(nuevo)</code></td><td><code>ref.current = nuevo</code></td></tr>
  <tr><td>Dispara re-render</td><td><strong>Sí</strong></td><td><strong>No</strong></td></tr>
  <tr><td>Persiste entre renders</td><td>Sí</td><td>Sí</td></tr>
  <tr><td>Cuándo usar</td><td>Datos que la UI necesita mostrar</td><td>Timers, IDs ya procesados, referencias al DOM</td></tr>
</table>

<p>En <code>Login.jsx</code>, <code>intervaloRef</code> es un <code>useRef</code> porque guardar/limpiar el ID del intervalo no debe disparar un re-render. Si fuera <code>useState</code>, cada vez que se asignara el ID del intervalo, React re-renderizaría el formulario de login innecesariamente.</p>

<h3>Preguntas trampa del entrevistador</h3>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué no puedes hacer async el callback de useEffect?"</div>
  <p><strong>Respuesta</strong>: <code>useEffect</code> espera que su callback devuelva <code>undefined</code> o una función de limpieza. Una función <code>async</code> siempre devuelve una Promise, no una función de limpieza. React no sabe qué hacer con una Promise aquí y lo ignora, lo que puede causar memory leaks. La solución: definir una función <code>async</code> interna y llamarla inmediatamente, o usar <code>.then()</code> en el callback síncrono.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué pasa si haces <code>datos.nombre = 'Ana'; setDatos(datos)</code>?"</div>
  <p><strong>Respuesta</strong>: React no re-renderiza. React compara el nuevo estado con el anterior por referencia (<code>Object.is</code>). Como mutaste el objeto existente, la referencia es la misma. React detecta que el estado "no cambió" y omite el render. El valor está mutado en memoria, pero la UI no se actualiza. Por eso siempre <code>{ ...datos, nombre: 'Ana' }</code>: crea un objeto nuevo con referencia diferente.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué son las 'reglas de los hooks' y por qué existen?"</div>
  <p><strong>Reglas</strong>: (1) Sólo en componentes o custom hooks. (2) Siempre en el nivel superior (no dentro de if/for). <strong>Por qué</strong>: React no asocia los hooks por nombre, sino por <em>orden de llamada</em>. En cada render, el primer hook es el estado #0, el segundo es el #1, etc. Si pones un hook dentro de un <code>if</code>, en un render puede existir (posición 3) y en otro no (posición 3 pasa a ser otro hook) — React tendría los estados mezclados.</p>
</div>

<h2>9. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Qué hace <code>useEffect(() =&gt; { ... }, [])</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Se ejecuta antes de cada render.</button>
    <button class="quiz-opcion" data-correcta="1">Se ejecuta una vez, después del primer render (al montar).</button>
    <button class="quiz-opcion" data-correcta="0">Se ejecuta indefinidamente en bucle.</button>
    <button class="quiz-opcion" data-correcta="0">Es un error: el array no puede estar vacío.</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. Útil para llamadas iniciales (listar categorías, etc.)." data-ko="Array vacío = sin dependencias = corre sólo al montar."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Por qué <code>visualizacionContadaRef</code> en <code>DetalleProducto</code> es un <code>useRef</code> y no un <code>useState</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Porque <code>useState</code> no acepta <code>null</code>.</button>
    <button class="quiz-opcion" data-correcta="1">Para guardar el id sin disparar un re-render al actualizarlo.</button>
    <button class="quiz-opcion" data-correcta="0">Porque <code>useRef</code> es más rápido siempre.</button>
    <button class="quiz-opcion" data-correcta="0">Por error: debería ser <code>useState</code>.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien visto. useRef no avisa a React al cambiar .current." data-ko="Pista: cambiar un useState provoca render; cambiar un useRef no."></p>
</div>

<h2>9. Ejercicios sobre el proyecto</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Añadir un contador local al ProductoCard</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Modifica <code>ProductoCard</code> para que cada tarjeta tenga un botón "Me gusta" con contador (sin tocar el backend).</p>
<pre><code class="language-jsx">import { useState } from 'react';
// ...
function ProductoCard({ producto }) {
  const [megusta, setMegusta] = useState(0);
  // ... en el JSX:
  &lt;button onClick={() =&gt; setMegusta(megusta + 1)}&gt;
    ❤ {megusta}
  &lt;/button&gt;
}</code></pre>
  <details>
    <summary>Observa</summary>
    <p>Cada tarjeta mantiene SU PROPIO contador, independiente de las demás. Esto es porque <code>useState</code> es local al instance del componente.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Modificar dependencias de un useEffect</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>En <code>src/pages/Productos.jsx</code>, encuentra el efecto que carga productos y observa que sus dependencias son <code>[filtros, page]</code>. ¿Qué pasaría si pusieras <code>[]</code> en su lugar?</p>
  <details>
    <summary>Respuesta</summary>
    <p>Sólo se cargaría una vez al montar. Cambiar filtros o de página no traería productos nuevos. La lista se quedaría "congelada" mostrando los primeros resultados sin que los filtros tuvieran efecto.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Cambiar el título del documento dinámicamente</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>En <code>DetalleProducto.jsx</code>, añade un <code>useEffect</code> que cambie <code>document.title</code> al título del producto cuando éste se cargue:</p>
<pre><code class="language-jsx">useEffect(() =&gt; {
  if (producto?.titulo) {
    document.title = \`\${producto.titulo} · DaWeb Reventas\`;
  }
  return () =&gt; { document.title = 'DaWeb Reventas'; };
}, [producto]);</code></pre>
  <details>
    <summary>Para qué sirve la función de retorno</summary>
    <p>Cuando navegues fuera de la página, el título vuelve a ser "DaWeb Reventas". Sin esa limpieza, la pestaña se quedaría con el último producto visitado.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Detectar mutación accidental</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>En <code>Registro.jsx</code>, la función <code>cambiar</code> hace <code>setDatos({ ...datos, [e.target.name]: e.target.value })</code>. ¿Qué pasaría si lo cambiaras por <code>datos[e.target.name] = e.target.value; setDatos(datos);</code>?</p>
  <details>
    <summary>Respuesta</summary>
    <p>El input parecería no actualizarse. <code>setDatos(datos)</code> recibe la misma referencia que el estado anterior, así que React (con su comparación por referencia) decide que "nada ha cambiado" y NO vuelve a renderizar. El valor mutado existe en memoria pero la UI no se entera.</p>
    <p>Es una de las trampas clásicas. Por eso siempre spread: <code>{ ...datos, [campo]: valor }</code> crea una referencia nueva.</p>
  </details>
</div>
`;
