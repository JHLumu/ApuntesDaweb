window.__SECC = window.__SECC || {};
window.__SECC["protegidas"] = `<h1>Rutas protegidas y roles</h1>
<p class="subtitulo">Cómo se evita que un anónimo entre a <code>/perfil</code> y que un usuario normal entre a <code>/admin</code>.</p>

<p class="lead">DaWeb tiene tres niveles de acceso: <strong>público</strong> (cualquiera), <strong>autenticado</strong> (requiere login) y <strong>administrador</strong> (rol ADMINISTRADOR). Todo el control vive en un único componente envoltorio: <code>RutaProtegida.jsx</code>. Catorce líneas que se ven en acción en muchas rutas de <code>App.jsx</code>.</p>

<h2>1. La idea: un componente "guardián"</h2>
<p>En React, un envoltorio inspecciona el estado y decide si renderiza sus hijos o redirige a otra ruta. Es declarativo y elegante.</p>

<h2>2. El componente <code>RutaProtegida</code></h2>

<div class="code-wrap">
  <span class="file-label">src/components/RutaProtegida.jsx</span>
<pre><code class="language-jsx">import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, esAdmin } = useAuth();

  if (!usuario) return &lt;Navigate to="/login" replace /&gt;;
  if (soloAdmin &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;

  return children;
}

export default RutaProtegida;</code></pre>
</div>

<h3>Lectura línea a línea</h3>
<ol>
  <li>Recibe dos props: <code>children</code> (la página a proteger) y <code>soloAdmin</code> (booleano, por defecto <code>false</code>).</li>
  <li>Lee del contexto el usuario actual y si es admin.</li>
  <li>Si NO hay usuario → renderiza <code>&lt;Navigate to="/login" replace /&gt;</code>. React Router detecta esto y cambia la URL a <code>/login</code>.</li>
  <li>Si la ruta exige admin y el usuario no lo es → redirige a la home.</li>
  <li>Si supera ambas comprobaciones, renderiza los hijos (la página real).</li>
</ol>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Sobre <code>replace</code></div>
  <p><code>&lt;Navigate replace&gt;</code> sustituye la entrada actual del historial. Sin <code>replace</code>, si el usuario pulsa "atrás" volvería a la ruta protegida y se generaría un bucle. Con <code>replace</code>, "atrás" lleva a la página anterior real.</p>
</div>

<h2>3. Cómo se usa en <code>App.jsx</code></h2>

<h3>Caso 1: requiere login</h3>
<div class="code-wrap">
  <span class="file-label">src/App.jsx — fragmento</span>
<pre><code class="language-jsx">&lt;Route
  path="/vender"
  element={
    &lt;RutaProtegida&gt;
      &lt;NuevoProducto /&gt;
    &lt;/RutaProtegida&gt;
  }
/&gt;</code></pre>
</div>

<h3>Caso 2: requiere admin</h3>
<div class="code-wrap">
  <span class="file-label">src/App.jsx — fragmento</span>
<pre><code class="language-jsx">&lt;Route
  path="/admin/usuarios"
  element={
    &lt;RutaProtegida soloAdmin&gt;
      &lt;AdminUsuarios /&gt;
    &lt;/RutaProtegida&gt;
  }
/&gt;</code></pre>
</div>

<p>Recuerda que <code>soloAdmin</code> sin valor explícito equivale a <code>soloAdmin={true}</code>.</p>

<h2>4. Catálogo completo de rutas en DaWeb</h2>

<table>
  <tr><th>Ruta</th><th>Acceso</th><th>Componente</th></tr>
  <tr><td><code>/</code></td><td>Público</td><td>Home</td></tr>
  <tr><td><code>/login</code></td><td>Público</td><td>Login</td></tr>
  <tr><td><code>/registro</code></td><td>Público</td><td>Registro</td></tr>
  <tr><td><code>/productos</code></td><td>Público</td><td>Productos</td></tr>
  <tr><td><code>/productos/:id</code></td><td>Público</td><td>DetalleProducto</td></tr>
  <tr><td><code>/vender</code></td><td>Autenticado</td><td>NuevoProducto</td></tr>
  <tr><td><code>/productos/:id/editar</code></td><td>Autenticado</td><td>EditarProducto</td></tr>
  <tr><td><code>/perfil</code></td><td>Autenticado</td><td>Perfil (con Outlet)</td></tr>
  <tr><td><code>/perfil/productos</code></td><td>Autenticado (hereda)</td><td>PerfilProductos</td></tr>
  <tr><td><code>/perfil/ventas</code></td><td>Autenticado (hereda)</td><td>PerfilVentas</td></tr>
  <tr><td><code>/perfil/compras</code></td><td>Autenticado (hereda)</td><td>PerfilCompras</td></tr>
  <tr><td><code>/usuarios/:id</code></td><td>Autenticado</td><td>PerfilUsuario</td></tr>
  <tr><td><code>/admin/usuarios</code></td><td>Admin</td><td>AdminUsuarios</td></tr>
  <tr><td><code>/admin/transacciones</code></td><td>Admin</td><td>AdminTransacciones</td></tr>
  <tr><td><code>*</code></td><td>Público</td><td>Error404</td></tr>
</table>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Esto NO es seguridad</div>
  <p>La protección de rutas en el frontend es <strong>cómoda</strong>, no <strong>segura</strong>. Cualquier usuario malintencionado puede saltarse la comprobación editando el JavaScript en su navegador. La SEGURIDAD real es del backend: rechaza con 401/403 cualquier petición sin token válido o sin rol adecuado. Lo del frontend es sólo para mejor experiencia (que no veas pantallas a las que no tienes acceso).</p>
</div>

<h2>5. El permiso de la barra superior</h2>
<p>El menú de admin sólo aparece si <code>esAdmin</code>:</p>

<div class="code-wrap">
  <span class="file-label">src/components/Header.jsx — fragmento</span>
<pre><code class="language-jsx">{esAdmin &amp;&amp; (
  &lt;&gt;
    &lt;li className="nav-item"&gt;
      &lt;NavLink className="header-link" to="/admin/usuarios"&gt;Usuarios&lt;/NavLink&gt;
    &lt;/li&gt;
    &lt;li className="nav-item"&gt;
      &lt;NavLink className="header-link" to="/admin/transacciones"&gt;Compraventas&lt;/NavLink&gt;
    &lt;/li&gt;
  &lt;/&gt;
)}</code></pre>
</div>

<h2>6. Flujo de redirección</h2>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario anónimo escribe en la barra del navegador: <code>http://localhost:5173/perfil</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> React Router matchea <code>/perfil</code> y monta <code>RutaProtegida</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> Dentro, <code>useAuth()</code> dice <code>usuario === null</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> <code>RutaProtegida</code> devuelve <code>&lt;Navigate to="/login" replace /&gt;</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> React Router cambia la URL a <code>/login</code> y monta el formulario.</div>
</div>

<h2>7. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">Un usuario normal (no admin) escribe <code>/admin/usuarios</code> en el navegador. ¿Qué pasa?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Ve la página igual.</button>
    <button class="quiz-opcion" data-correcta="1">Es redirigido a la home <code>/</code>.</button>
    <button class="quiz-opcion" data-correcta="0">Va al login.</button>
    <button class="quiz-opcion" data-correcta="0">Aparece error 403 a pantalla completa.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. Mira RutaProtegida: si esAdmin es false, &lt;Navigate to='/' /&gt;." data-ko="Pista: hay dos comprobaciones — login y rol. Cada una redirige a un sitio distinto."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Cómo se determina si un usuario es admin?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">El backend devuelve un campo <code>esAdmin: true</code>.</button>
    <button class="quiz-opcion" data-correcta="1">Por su array de roles en el JWT decodificado: <code>roles.includes('ADMINISTRADOR')</code>.</button>
    <button class="quiz-opcion" data-correcta="0">Por el email (los que terminan en @admin.com).</button>
    <button class="quiz-opcion" data-correcta="0">Por su id (los menores que 10).</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. Ve AuthContext.jsx: const esAdmin = usuario?.roles.includes('ADMINISTRADOR')." data-ko="El cálculo está en AuthContext.jsx, derivado del array roles del payload del JWT."></p>
</div>

<h2>8. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Comprobar el flujo de redirección manualmente</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <ol>
    <li>Asegúrate de no tener sesión iniciada (en consola: <code>localStorage.removeItem('arso_token')</code>; recarga).</li>
    <li>Escribe <code>/perfil</code> en la barra del navegador.</li>
    <li>Comprueba que automáticamente apareces en <code>/login</code>.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Proteger una ruta nueva</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Recuerdas la ruta <code>/acerca</code> del ejercicio de la sección 05. Protégela para que sólo accedan usuarios autenticados:</p>
<pre><code class="language-jsx">&lt;Route path="/acerca" element={
  &lt;RutaProtegida&gt;
    &lt;AcercaDe /&gt;
  &lt;/RutaProtegida&gt;
} /&gt;</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Añadir un nuevo rol "MODERADOR"</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Imagina que el backend ahora devuelve un rol nuevo <code>MODERADOR</code>. Adapta el frontend:</p>
  <ol>
    <li>En <code>AuthContext.jsx</code>, añade:
<pre><code class="language-jsx">const esModerador = (usuario?.roles ?? []).includes('MODERADOR');</code></pre>
    Y exponlo en el value del Provider.</li>
    <li>Modifica <code>RutaProtegida</code> para aceptar una prop <code>soloModerador</code>:
<pre><code class="language-jsx">function RutaProtegida({ children, soloAdmin = false, soloModerador = false }) {
  const { usuario, esAdmin, esModerador } = useAuth();
  if (!usuario) return &lt;Navigate to="/login" replace /&gt;;
  if (soloAdmin &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;
  if (soloModerador &amp;&amp; !esModerador &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;
  return children;
}</code></pre>
    Nota cómo damos permiso al admin aunque pidamos sólo moderador: jerarquía.</li>
    <li>Usa en alguna ruta nueva: <code>&lt;RutaProtegida soloModerador&gt;...&lt;/RutaProtegida&gt;</code>.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Recordar la URL de origen tras el login</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Mejora: si un usuario intenta entrar a <code>/vender</code> sin login, redirige a <code>/login?desde=/vender</code> y, tras login OK, devuélvelo a <code>/vender</code>.</p>
  <ol>
    <li>En <code>RutaProtegida</code>, usa <code>useLocation</code> para conseguir la ruta actual:
<pre><code class="language-jsx">import { Navigate, useLocation } from 'react-router-dom';
// ...
const location = useLocation();
if (!usuario) {
  return &lt;Navigate to={\`/login?desde=\${encodeURIComponent(location.pathname)}\`} replace /&gt;;
}</code></pre>
    </li>
    <li>En <code>Login.jsx</code>, lee el parámetro y navega allí tras login:
<pre><code class="language-jsx">import { useSearchParams } from 'react-router-dom';
// ...
const [sp] = useSearchParams();
const desde = sp.get('desde') || '/';
// Al final del login:
if (res.ok) navegar(desde);</code></pre>
    </li>
  </ol>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Para la entrevista</div>
  <p>Si te preguntan "¿cómo se protege una ruta?", responde con esta estructura: (1) Hay un componente envoltorio <code>RutaProtegida</code> que lee el contexto de autenticación. (2) Si no hay usuario, devuelve <code>&lt;Navigate to="/login"&gt;</code>. (3) Si requiere admin y no lo es, devuelve <code>&lt;Navigate to="/"&gt;</code>. (4) En <code>App.jsx</code> se envuelve la página dentro del componente. (5) Importante: <strong>esto es UX, no seguridad real</strong> — la seguridad está en el backend.</p>
</div>
`;
