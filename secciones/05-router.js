window.__SECC = window.__SECC || {};
window.__SECC["router"] = `<h1>React Router: navegación sin recargar</h1>
<p class="subtitulo">Cómo DaWeb cambia entre páginas (URL distintas) sin que el navegador recargue.</p>

<p class="lead">DaWeb es una <strong>SPA</strong> (Single Page Application): el navegador carga UNA SOLA vez el HTML y luego JavaScript decide qué pintar según la URL. La librería que se encarga de eso es <code>react-router-dom</code>. En esta sección verás cómo está configurada en <code>App.jsx</code> y cómo se navega desde el código.</p>

<h2>1. SPA vs. página tradicional</h2>

<div class="dos-cols">
  <div class="tarjeta">
    <h4><i class="bi bi-arrow-clockwise"></i> Web tradicional</h4>
    <p>Cada link recarga la página: el navegador pide un HTML nuevo al servidor. La pantalla parpadea, el estado de JavaScript se pierde.</p>
  </div>
  <div class="tarjeta">
    <h4><i class="bi bi-window-stack"></i> SPA con React Router</h4>
    <p>El navegador NO recarga. React Router intercepta los clicks, cambia la URL con la API <em>History</em> del navegador y pinta el componente correspondiente. La transición es instantánea.</p>
  </div>
</div>

<h2>2. Piezas básicas de React Router</h2>

<table>
  <tr><th>Componente / hook</th><th>Para qué sirve</th></tr>
  <tr><td><code>&lt;BrowserRouter&gt;</code></td><td>Envuelve la app y activa el routing por URL.</td></tr>
  <tr><td><code>&lt;Routes&gt;</code></td><td>Caja donde se declaran las rutas.</td></tr>
  <tr><td><code>&lt;Route path="..." element={...}/&gt;</code></td><td>Una regla: si la URL coincide con <code>path</code>, renderiza <code>element</code>.</td></tr>
  <tr><td><code>&lt;Link to="..."&gt;</code></td><td>Como un <code>&lt;a&gt;</code> pero sin recargar.</td></tr>
  <tr><td><code>&lt;NavLink to="..."&gt;</code></td><td>Como <code>Link</code> pero añade clase "activa" si la ruta coincide.</td></tr>
  <tr><td><code>&lt;Navigate to="..." /&gt;</code></td><td>Redirección declarativa (renderizarlo navega).</td></tr>
  <tr><td><code>useNavigate()</code></td><td>Hook que devuelve una función para navegar imperativamente.</td></tr>
  <tr><td><code>useParams()</code></td><td>Lee los parámetros de la URL (<code>/productos/:id</code>).</td></tr>
  <tr><td><code>useSearchParams()</code></td><td>Lee/escribe los parámetros de query (<code>?descripcion=...</code>).</td></tr>
  <tr><td><code>useLocation()</code></td><td>Da la URL actual (path, search, hash).</td></tr>
  <tr><td><code>&lt;Outlet /&gt;</code></td><td>Punto donde se renderiza la ruta hija (rutas anidadas).</td></tr>
</table>

<h2>3. El mapa de rutas en <code>App.jsx</code></h2>

<div class="code-wrap">
  <span class="file-label">src/App.jsx</span>
<pre><code class="language-jsx">function App() {
  return (
    &lt;AuthProvider&gt;
      &lt;BrowserRouter&gt;
        &lt;Layout /&gt;
      &lt;/BrowserRouter&gt;
    &lt;/AuthProvider&gt;
  );
}</code></pre>
</div>

<p>Tres envoltorios anidados:</p>
<ol>
  <li><code>AuthProvider</code> aporta el estado de autenticación a toda la app (sección 07).</li>
  <li><code>BrowserRouter</code> escucha cambios de URL.</li>
  <li><code>Layout</code> contiene el header, el contenido (las rutas) y el footer.</li>
</ol>

<h3>El componente <code>Layout</code></h3>
<div class="code-wrap">
  <span class="file-label">src/App.jsx — Layout</span>
<pre><code class="language-jsx">function Layout() {
  const { pathname } = useLocation();
  const sinLayout = pathname === '/login' || pathname === '/registro';

  return (
    &lt;&gt;
      {!sinLayout &amp;&amp; &lt;Header /&gt;}            {/* Header oculto en login/registro */}
      &lt;main&gt;
        &lt;Routes&gt;
          &lt;Route path="/" element={&lt;Home /&gt;} /&gt;
          &lt;Route path="/login" element={&lt;Login /&gt;} /&gt;
          ...
        &lt;/Routes&gt;
      &lt;/main&gt;
      {!sinLayout &amp;&amp; &lt;Footer /&gt;}
    &lt;/&gt;
  );
}</code></pre>
</div>

<h3>Las rutas, una por una</h3>

<div class="code-wrap">
  <span class="file-label">src/App.jsx — Routes</span>
<pre><code class="language-jsx">&lt;Routes&gt;
  {/* Públicas */}
  &lt;Route path="/" element={&lt;Home /&gt;} /&gt;
  &lt;Route path="/login" element={&lt;Login /&gt;} /&gt;
  &lt;Route path="/registro" element={&lt;Registro /&gt;} /&gt;
  &lt;Route path="/productos" element={&lt;Productos /&gt;} /&gt;
  &lt;Route path="/productos/:id" element={&lt;DetalleProducto /&gt;} /&gt;

  {/* Protegidas (requieren login) */}
  &lt;Route
    path="/vender"
    element={
      &lt;RutaProtegida&gt;
        &lt;NuevoProducto /&gt;
      &lt;/RutaProtegida&gt;
    }
  /&gt;
  &lt;Route
    path="/productos/:id/editar"
    element={
      &lt;RutaProtegida&gt;
        &lt;EditarProducto /&gt;
      &lt;/RutaProtegida&gt;
    }
  /&gt;

  {/* Rutas anidadas: /perfil/* */}
  &lt;Route
    path="/perfil"
    element={
      &lt;RutaProtegida&gt;
        &lt;Perfil /&gt;
      &lt;/RutaProtegida&gt;
    }
  &gt;
    &lt;Route index element={&lt;Navigate to="productos" replace /&gt;} /&gt;
    &lt;Route path="productos" element={&lt;PerfilProductos /&gt;} /&gt;
    &lt;Route path="ventas" element={&lt;PerfilVentas /&gt;} /&gt;
    &lt;Route path="compras" element={&lt;PerfilCompras /&gt;} /&gt;
  &lt;/Route&gt;

  &lt;Route path="/usuarios/:id" element={
    &lt;RutaProtegida&gt;&lt;PerfilUsuario /&gt;&lt;/RutaProtegida&gt;
  } /&gt;

  {/* Sólo admin */}
  &lt;Route path="/admin/usuarios" element={
    &lt;RutaProtegida soloAdmin&gt;&lt;AdminUsuarios /&gt;&lt;/RutaProtegida&gt;
  } /&gt;
  &lt;Route path="/admin/transacciones" element={
    &lt;RutaProtegida soloAdmin&gt;&lt;AdminTransacciones /&gt;&lt;/RutaProtegida&gt;
  } /&gt;

  {/* 404 catch-all */}
  &lt;Route path="*" element={&lt;Error404 /&gt;} /&gt;
&lt;/Routes&gt;</code></pre>
</div>

<h2>4. Parámetros de URL</h2>
<p>Cuando el path lleva <code>:id</code>, React Router lo guarda como parámetro y lo lees con <code>useParams</code>:</p>

<div class="code-wrap">
  <span class="file-label">src/pages/DetalleProducto.jsx</span>
<pre><code class="language-jsx">import { useParams } from 'react-router-dom';

function DetalleProducto() {
  const { id } = useParams();          // ⬅ /productos/42 → id = "42"

  useEffect(() =&gt; {
    productosApi.obtenerProducto(id).then(setProducto);
  }, [id]);
  // ...
}</code></pre>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Es siempre un string</div>
  <p>Los parámetros de URL llegan como string, incluso <code>"42"</code> en lugar de <code>42</code>. Si el backend espera número, conviértelo con <code>Number(id)</code> o pasa el string directamente (a veces el backend acepta ambas).</p>
</div>

<h2>5. Query strings (los <code>?clave=valor</code>)</h2>
<p>Para parámetros opcionales como filtros usamos <code>useSearchParams</code>:</p>

<div class="code-wrap">
  <span class="file-label">src/pages/Productos.jsx</span>
<pre><code class="language-jsx">import { useSearchParams } from 'react-router-dom';

function Productos() {
  const [searchParams] = useSearchParams();
  const descripcionUrl = searchParams.get('descripcion') ?? '';
  // ...
}</code></pre>
</div>

<p>Es lo que permite que al pulsar buscar en el header se navegue a <code>/productos?descripcion=bici</code> y la página coja ese texto como filtro inicial.</p>

<h2>6. Navegación: <code>&lt;Link&gt;</code> vs <code>useNavigate()</code></h2>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Link / NavLink — declarativo</h4>
    <p>Cuando es un enlace que el usuario hace click.</p>
<pre><code class="language-jsx">import { Link, NavLink } from 'react-router-dom';

&lt;Link to={\`/productos/\${p.id}\`}&gt;Ver detalle&lt;/Link&gt;

// NavLink añade clase si la ruta coincide
&lt;NavLink to="/productos" className={({ isActive }) =&gt; isActive ? 'activo' : ''}&gt;
  Productos
&lt;/NavLink&gt;</code></pre>
  </div>
  <div class="tarjeta">
    <h4>useNavigate — imperativo</h4>
    <p>Cuando navegas como consecuencia de algo (login OK, formulario enviado, etc.).</p>
<pre><code class="language-jsx">import { useNavigate } from 'react-router-dom';

function Login() {
  const navegar = useNavigate();
  // ...
  if (res.ok) navegar('/');           // adelante
  navegar(-1);                        // atrás
  navegar('/productos', { replace: true }); // sin guardar en history
}</code></pre>
  </div>
</div>

<h3>Ejemplo real con NavLink en el perfil</h3>

<div class="code-wrap">
  <span class="file-label">src/pages/Perfil.jsx</span>
<pre><code class="language-jsx">const claseTab = ({ isActive }) =&gt; \`perfil-tab \${isActive ? 'activa' : ''}\`;

&lt;div className="perfil-tabs"&gt;
  &lt;NavLink to="/perfil/productos" className={claseTab}&gt;Mis productos&lt;/NavLink&gt;
  &lt;NavLink to="/perfil/ventas"    className={claseTab}&gt;Mis ventas&lt;/NavLink&gt;
  &lt;NavLink to="/perfil/compras"   className={claseTab}&gt;Mis compras&lt;/NavLink&gt;
&lt;/div&gt;
&lt;Outlet /&gt;</code></pre>
</div>

<h2>7. Rutas anidadas y <code>&lt;Outlet&gt;</code></h2>
<p>En <code>App.jsx</code>, la ruta <code>/perfil</code> tiene rutas hijas (<code>productos</code>, <code>ventas</code>, <code>compras</code>). El padre <code>Perfil.jsx</code> renderiza <code>&lt;Outlet /&gt;</code> en el lugar donde quiera que aparezca el hijo:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario va a <code>/perfil/ventas</code>.</div>
  <div class="flujo-paso"><span class="num">2</span> React Router monta <code>&lt;Perfil /&gt;</code>.</div>
  <div class="flujo-paso"><span class="num">3</span> Dentro de Perfil hay un <code>&lt;Outlet /&gt;</code> que actúa de "agujero".</div>
  <div class="flujo-paso"><span class="num">4</span> En ese agujero React Router pinta <code>&lt;PerfilVentas /&gt;</code> (la ruta hija que coincide).</div>
</div>

<p>La ruta <code>index</code> (sin path) actúa como hijo "por defecto":</p>
<div class="code-wrap">
  <span class="file-label">App.jsx</span>
<pre><code class="language-jsx">&lt;Route index element={&lt;Navigate to="productos" replace /&gt;} /&gt;</code></pre>
</div>
<p>Esto significa: si entras a <code>/perfil</code> exacto, redirige a <code>/perfil/productos</code>.</p>

<h2>8. La ruta comodín <code>*</code></h2>
<div class="code-wrap">
  <span class="file-label">App.jsx</span>
<pre><code class="language-jsx">&lt;Route path="*" element={&lt;Error404 /&gt;} /&gt;</code></pre>
</div>
<p>El asterisco coincide con cualquier URL que no haya matcheado antes. Es la ruta de "página no encontrada".</p>

<h2>9. Flujo de un click en "Ver detalle"</h2>
<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario está en <code>/productos</code> y hace click en una <code>&lt;Link to="/productos/42"&gt;</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> Link evita el comportamiento por defecto del navegador y llama a la History API.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> La URL cambia a <code>/productos/42</code> SIN recargar.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> <code>BrowserRouter</code> notifica el cambio. <code>Routes</code> matchea <code>/productos/:id</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> Se monta <code>&lt;DetalleProducto /&gt;</code>. Su <code>useParams()</code> devuelve <code>{ id: "42" }</code>. El <code>useEffect</code> pide el producto a la API.</div>
</div>

<h2>10. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>La History API del navegador: cómo funciona sin recarga</h3>
<p>El secreto de una SPA es la <strong>History API</strong> de HTML5. Con ella se puede cambiar la URL sin que el navegador haga ninguna petición al servidor:</p>

<div class="code-wrap">
  <span class="file-label">navegador — API nativa</span>
<pre><code class="language-js">// Cambia la URL sin recargar ni ir al servidor
window.history.pushState({}, '', '/productos');

// Reemplaza la entrada actual del historial (sin añadir)
window.history.replaceState({}, '', '/login');

// El botón "atrás" navega hacia atrás en el historial
window.history.back();</code></pre>
</div>

<p>React Router envuelve estas llamadas en componentes y hooks, pero internamente es todo History API. El <code>BrowserRouter</code> escucha el evento <code>popstate</code> (botón atrás/adelante del navegador) y actualiza qué componente renderizar.</p>

<h3>BrowserRouter vs HashRouter: diferencia crítica en producción</h3>

<table>
  <tr><th></th><th>BrowserRouter</th><th>HashRouter</th></tr>
  <tr><td><strong>URL ejemplo</strong></td><td><code>/productos/42</code></td><td><code>/#/productos/42</code></td></tr>
  <tr><td><strong>Mecanismo</strong></td><td>History API (<code>pushState</code>)</td><td>Hash de URL (<code>#</code>)</td></tr>
  <tr><td><strong>Recarga en producción</strong></td><td>El servidor debe servir <code>index.html</code> para cualquier ruta</td><td>El servidor solo sirve <code>/</code>; el hash es solo del cliente</td></tr>
  <tr><td><strong>SEO</strong></td><td>URLs indexables por buscadores</td><td>Los buscadores suelen ignorar el hash</td></tr>
  <tr><td><strong>DaWeb usa</strong></td><td>✓ BrowserRouter</td><td></td></tr>
</table>

<h3>La trampa del refresh en producción</h3>
<p>En desarrollo, Vite sirve <code>index.html</code> para cualquier URL que no sea un archivo. Pero en producción, si el servidor no está configurado, ocurre esto:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario está en <code>/productos/42</code> y pulsa F5 (recarga).</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> El navegador hace una petición HTTP real a <code>https://miweb.com/productos/42</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> El servidor busca el archivo <code>/productos/42</code> o el directorio <code>/productos/42/index.html</code>. No existe.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> El servidor devuelve 404.</div>
</div>

<p>La solución: configurar el servidor para que siempre sirva <code>index.html</code> y deje que React Router decida. En Nginx:</p>
<div class="code-wrap">
  <span class="file-label">nginx.conf</span>
<pre><code class="language-nginx">location / {
  try_files $uri $uri/ /index.html;
}</code></pre>
</div>

<h3>Rutas anidadas: cómo Perfil comparte layout con sus subpáginas</h3>
<p>El <code>&lt;Outlet /&gt;</code> es el "hueco" donde React Router inserta la ruta hija que coincide. Sin él, la subruta no aparecería en pantalla aunque matcheara en App.jsx.</p>

<div class="code-wrap">
  <span class="file-label">src/pages/Perfil.jsx — estructura</span>
<pre><code class="language-jsx">function Perfil() {
  return (
    &lt;Container&gt;
      &lt;Row&gt;
        &lt;Col md={4}&gt;
          {/* Panel izquierdo: siempre visible */}
          &lt;FormularioPerfil /&gt;
        &lt;/Col&gt;
        &lt;Col md={8}&gt;
          {/* Pestañas */}
          &lt;div className="perfil-tabs"&gt;
            &lt;NavLink to="/perfil/productos"&gt;Mis productos&lt;/NavLink&gt;
            &lt;NavLink to="/perfil/ventas"&gt;Mis ventas&lt;/NavLink&gt;
          &lt;/div&gt;
          {/* Aquí se renderiza PerfilProductos, PerfilVentas o PerfilCompras */}
          &lt;Outlet /&gt;
        &lt;/Col&gt;
      &lt;/Row&gt;
    &lt;/Container&gt;
  );
}</code></pre>
</div>

<p>Cuando la URL es <code>/perfil/ventas</code>, React Router monta <code>Perfil</code> y dentro del <code>&lt;Outlet /&gt;</code> monta <code>PerfilVentas</code>. El panel izquierdo y las pestañas de <code>Perfil</code> permanecen sin desmontar — no se vuelven a crear, solo cambia el contenido del Outlet.</p>

<h3>La ruta <code>index</code> y el redirect por defecto</h3>
<div class="code-wrap">
<pre><code class="language-jsx">&lt;Route path="/perfil" element={&lt;RutaProtegida&gt;&lt;Perfil /&gt;&lt;/RutaProtegida&gt;}&gt;
  &lt;Route index element={&lt;Navigate to="productos" replace /&gt;} /&gt;
  &lt;Route path="productos" element={&lt;PerfilProductos /&gt;} /&gt;
&lt;/Route&gt;</code></pre>
</div>
<p><code>index</code> no es un path; es la coincidencia exacta del padre. Si el usuario va a <code>/perfil</code> (sin subruta), la ruta <code>index</code> actúa como fallback y redirige a <code>productos</code>. Sin ella, el <code>&lt;Outlet /&gt;</code> estaría vacío.</p>

<h3>Diagrama de interacción: navegación entre subrutas con Outlet</h3>
<p>Qué se monta, qué se desmonta y qué se preserva cuando saltas de <code>/perfil/ventas</code> a <code>/perfil/compras</code>:</p>

<div class="code-wrap">
  <span class="file-label">cambio de pestaña dentro de /perfil</span>
<pre><code class="language-text">Estado inicial: /perfil/ventas
─────────────────────────────────────────────────────────────────
<App>
  <AuthProvider>          ← montado, estado: usuario={id:7, ...}
    <BrowserRouter>        ← monitoriza URL
      <Layout>             ← header + main + footer
        <Routes>
          <RutaProtegida>  ← evalúa cada render: usuario OK
            <Perfil>       ← monta UNA VEZ:
              ├── form de datos (estado: nombre, correo...)
              ├── tabs NavLink (recalcula isActive en cada render)
              └── <Outlet />
                  └── <PerfilVentas>  ← monta y carga ventas vía API
                        useEffect → compraventasApi.ventas(7,0,10)
                        estado: [10 ventas]

Usuario hace click en NavLink "Mis compras"
─────────────────────────────────────────────────────────────────
1. Link intercepta el click → history.pushState('/perfil/compras')
2. BrowserRouter detecta cambio → Routes re-matchea
3. <RutaProtegida> sigue montada (no cambia)
4. <Perfil> sigue montada (no cambia)
   ├── form: estado se PRESERVA (los campos siguen rellenos)
   ├── tabs: re-renderizan con nuevo isActive
   └── <Outlet />:
       └── <PerfilVentas>   ← DESMONTA (cleanup useEffect, pierde estado)
           ↓ replace
       └── <PerfilCompras>  ← MONTA nuevo
                  useEffect → compraventasApi.compras(7,0,10)
                  estado nuevo: [N compras]

Estado final: /perfil/compras
─────────────────────────────────────────────────────────────────
<Perfil> sigue montada — solo el contenido del Outlet cambió.
Re-renders necesarios: <Perfil> (tabs), <Outlet/> (contenido nuevo)
Re-renders NO necesarios: <App>, <AuthProvider>, <BrowserRouter>, <Layout>
                          (su árbol no cambió)</code></pre>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Por qué importa esto</div>
  <p>Si <code>Perfil</code> se desmontara al cambiar de pestaña, perderías el estado del formulario de datos personales. Las rutas anidadas con <code>Outlet</code> evitan precisamente eso: el "shell" persiste, solo el contenido del hueco cambia.</p>
</div>



<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué diferencia hay entre <code>navegar('/')</code> y <code>navegar('/', { replace: true })</code>?"</strong> — Sin <code>replace</code>: añade una nueva entrada al historial; el usuario puede pulsar "atrás" para volver. Con <code>replace</code>: sustituye la entrada actual. Si un usuario sin login va a <code>/perfil</code>, RutaProtegida lo manda a <code>/login</code> con <code>replace</code>. Al pulsar "atrás", vuelve a la página anterior a <code>/perfil</code>, no a <code>/perfil</code> (que le volvería a redirigir en bucle).</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"Si recargas la página en <code>/perfil/ventas</code> en producción, ¿qué pasa?"</strong> — El servidor busca el fichero <code>/perfil/ventas</code> y no existe. Devuelve 404. Para evitarlo, el servidor (Nginx, Apache, etc.) debe estar configurado para devolver siempre <code>index.html</code> para cualquier ruta que no sea un archivo real. Vite lo hace automáticamente en desarrollo.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué <code>AuthProvider</code> envuelve <code>BrowserRouter</code> y no al revés?"</strong> — Si fuera al revés, <code>AuthProvider</code> no podría usar hooks de React Router (<code>useNavigate</code>) si los necesitara. Al poner <code>AuthProvider</code> fuera, el contexto de autenticación está disponible en toda la app incluyendo los componentes de routing. Además, <code>RutaProtegida</code> necesita acceder tanto a <code>useAuth()</code> como a <code>useNavigate()</code> simultáneamente.</p>
</div>

<h2>11. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Por qué usar <code>&lt;Link&gt;</code> en lugar de <code>&lt;a&gt;</code> dentro de la app?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Porque <code>&lt;a&gt;</code> no funciona en React.</button>
    <button class="quiz-opcion" data-correcta="1">Para evitar recargar la página completa y mantener el estado de la SPA.</button>
    <button class="quiz-opcion" data-correcta="0">Por SEO únicamente.</button>
    <button class="quiz-opcion" data-correcta="0">Porque <code>&lt;a&gt;</code> no acepta atributos dinámicos.</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. &lt;a&gt; recargaría la web, perdiendo todo el estado en memoria." data-ko="Si usaras un &lt;a href&gt; normal, el navegador haría una petición HTTP completa al servidor."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué hace <code>&lt;Route index element={&lt;Navigate to="productos" replace /&gt;} /&gt;</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Define la página principal de la aplicación.</button>
    <button class="quiz-opcion" data-correcta="1">Si entras a la ruta padre exacta (sin hijo), redirige a la subruta <code>productos</code>.</button>
    <button class="quiz-opcion" data-correcta="0">Marca la ruta como ruta de inicio de sesión.</button>
    <button class="quiz-opcion" data-correcta="0">Hace que <code>productos</code> sea indexable por buscadores.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. &lt;Route index&gt; representa la coincidencia exacta del padre." data-ko="index = hijo por defecto. Sin él, /perfil mostraría sólo el padre sin pestaña activa."></p>
</div>

<h2>12. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Añadir una ruta pública nueva</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <ol>
    <li>Crea <code>src/pages/AcercaDe.jsx</code> con un componente sencillo (un h1 y un párrafo).</li>
    <li>En <code>App.jsx</code> impórtalo y añade <code>&lt;Route path="/acerca" element={&lt;AcercaDe /&gt;} /&gt;</code>.</li>
    <li>En el <code>Header.jsx</code> añade un <code>NavLink</code> a <code>/acerca</code>.</li>
    <li>Navega y observa que aparece sin recargar.</li>
  </ol>
  <details>
    <summary>Esqueleto</summary>
<pre><code class="language-jsx">// src/pages/AcercaDe.jsx
function AcercaDe() {
  return (
    &lt;div className="container py-4"&gt;
      &lt;h1&gt;Sobre DaWeb&lt;/h1&gt;
      &lt;p&gt;Plataforma de compraventa de segunda mano.&lt;/p&gt;
    &lt;/div&gt;
  );
}
export default AcercaDe;</code></pre>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Crear una ruta con parámetro</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Añade una ruta <code>/saludo/:nombre</code> que muestre "Hola, {nombre}!". Prueba <code>/saludo/Jiahui</code>.</p>
  <details>
    <summary>Solución</summary>
<pre><code class="language-jsx">// src/pages/Saludo.jsx
import { useParams } from 'react-router-dom';
function Saludo() {
  const { nombre } = useParams();
  return &lt;h1&gt;Hola, {nombre}!&lt;/h1&gt;;
}
export default Saludo;

// App.jsx: añade dentro de Routes
&lt;Route path="/saludo/:nombre" element={&lt;Saludo /&gt;} /&gt;</code></pre>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Modificar la ruta por defecto del perfil</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Ahora <code>/perfil</code> redirige a <code>/perfil/productos</code>. Modifícalo para que redirija a <code>/perfil/ventas</code>. Comprueba en el navegador.</p>
  <details>
    <summary>Solución</summary>
    <p>En App.jsx, cambia:</p>
<pre><code class="language-jsx">&lt;Route index element={&lt;Navigate to="ventas" replace /&gt;} /&gt;</code></pre>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Navegación imperativa tras una acción</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>En <code>Login.jsx</code> ya existe <code>navegar('/')</code> cuando el login es OK. Modifícalo para que redirija a <code>/productos</code> en su lugar.</p>
  <details>
    <summary>Solución</summary>
<pre><code class="language-jsx">if (res.ok) navegar('/productos');</code></pre>
    <p>O incluso podrías leer el querystring <code>?from=...</code> que en una app más grande indicaría "vuelve a la página de donde venías".</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 5</span>
    <span>Añadir una pestaña nueva en /perfil</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Crea <code>/perfil/favoritos</code> con un componente nuevo. Añádelo como ruta anidada y como tab.</p>
  <details>
    <summary>Pasos</summary>
    <ol>
      <li>Crear <code>src/pages/PerfilFavoritos.jsx</code> con un mensaje placeholder.</li>
      <li>Importar y añadir <code>&lt;Route path="favoritos" element={&lt;PerfilFavoritos /&gt;} /&gt;</code> dentro de la ruta <code>/perfil</code> en App.jsx.</li>
      <li>En <code>Perfil.jsx</code>, añadir un <code>NavLink</code>: <code>&lt;NavLink to="/perfil/favoritos" className={claseTab}&gt;Favoritos&lt;/NavLink&gt;</code>.</li>
    </ol>
  </details>
</div>
`;
