window.__SECC = window.__SECC || {};
window.__SECC["protegidas"] = `<h1>Rutas protegidas y roles</h1>
<p class="subtitulo">Cómo se evita que un anónimo entre a <code>/perfil</code> y que un usuario normal entre a <code>/admin</code>.</p>

<p class="lead">DaWeb tiene tres niveles de acceso: <strong>público</strong> (cualquiera), <strong>autenticado</strong> (requiere login) y <strong>administrador</strong> (rol ADMINISTRADOR). Todo el control vive en un único componente envoltorio: <code>RutaProtegida.jsx</code>. Catorce líneas que se reutilizan en muchas rutas de <code>App.jsx</code>.</p>

<h2>1. La idea: un componente "guardián"</h2>

<p>En React, un envoltorio lee el estado y decide si renderiza sus hijos o redirige. Es declarativo y elegante. La pieza completa:</p>

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

<div class="tabla-wrap">
<table class="anotada">
  <tr><td class="code">{ children, soloAdmin = false }</td><td class="nota">Props: <code>children</code> es la página a proteger; <code>soloAdmin</code> es booleano con default.</td></tr>
  <tr><td class="code">useAuth()</td><td class="nota">Lee del contexto el usuario actual y si es admin.</td></tr>
  <tr><td class="code">if (!usuario) → Navigate /login</td><td class="nota">No hay sesión → te mando al login.</td></tr>
  <tr><td class="code">if (soloAdmin && !esAdmin) → Navigate /</td><td class="nota">Hay sesión pero faltan permisos → te mando a la home.</td></tr>
  <tr><td class="code">return children</td><td class="nota">Si superas ambas pruebas, renderiza la página real.</td></tr>
</table>
</div>

<h2>2. Diagrama de decisión</h2>

<figure class="diagrama">
  <figcaption>Árbol de decisión de RutaProtegida</figcaption>
  <pre class="mermaid">
flowchart TB
  Start([Llega petición]) --> A{¿usuario != null?}
  A -- No --> Login["Navigate /login (replace)"]
  A -- Sí --> B{¿soloAdmin?}
  B -- No --> Render["return children"]
  B -- Sí --> C{¿esAdmin?}
  C -- Sí --> Render
  C -- No --> Home["Navigate / (replace)"]
  </pre>
</figure>

<div class="tip-regla">
  <strong><code>&lt;Navigate replace&gt;</code> SIEMPRE en flujos de auth.</strong> Sin <code>replace</code>, "atrás" vuelve a la ruta protegida y te re-redirige → bucle infinito. Con <code>replace</code>, "atrás" salta a la página anterior real.
</div>

<h2>3. Cómo se usa en <code>App.jsx</code></h2>

<h3>Requiere login</h3>
<div class="code-wrap">
<pre><code class="language-jsx">&lt;Route path="/vender" element={
  &lt;RutaProtegida&gt;
    &lt;NuevoProducto /&gt;
  &lt;/RutaProtegida&gt;
} /&gt;</code></pre>
</div>

<h3>Requiere admin</h3>
<div class="code-wrap">
<pre><code class="language-jsx">&lt;Route path="/admin/usuarios" element={
  &lt;RutaProtegida soloAdmin&gt;
    &lt;AdminUsuarios /&gt;
  &lt;/RutaProtegida&gt;
} /&gt;</code></pre>
</div>

<p><code>soloAdmin</code> sin valor explícito ≡ <code>soloAdmin={true}</code>.</p>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-bounding-box"></i> SOLID · SRP (Single Responsibility)</span>
  <p><code>RutaProtegida</code> decide acceso, nada más. NO carga datos, NO muestra spinners, NO depende de la página que envuelve. Por eso lo puedes meter delante de cualquier ruta sin preocuparte de qué hace dentro.</p>
</div>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-arrow-up-circle"></i> SOLID · OCP (Open/Closed)</span>
  <p>Añadir un nuevo nivel de acceso (p.ej. <code>soloModerador</code>) se hace con una nueva prop y una nueva línea, sin tocar el comportamiento existente. La función no se reescribe; se extiende.</p>
<div class="code-wrap">
<pre><code class="language-jsx">function RutaProtegida({ children, soloAdmin = false, soloModerador = false }) {
  const { usuario, esAdmin, esModerador } = useAuth();
  if (!usuario) return &lt;Navigate to="/login" replace /&gt;;
  if (soloAdmin &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;
  if (soloModerador &amp;&amp; !esModerador &amp;&amp; !esAdmin) return &lt;Navigate to="/" replace /&gt;;
  return children;
}</code></pre>
</div>
</div>

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
  <tr><td><code>/perfil</code> y subrutas</td><td>Autenticado</td><td>Perfil + Outlet</td></tr>
  <tr><td><code>/usuarios/:id</code></td><td>Autenticado</td><td>PerfilUsuario</td></tr>
  <tr><td><code>/admin/usuarios</code></td><td>Admin</td><td>AdminUsuarios</td></tr>
  <tr><td><code>/admin/transacciones</code></td><td>Admin</td><td>AdminTransacciones</td></tr>
  <tr><td><code>*</code></td><td>Público</td><td>Error404</td></tr>
</table>

<h2>5. La protección también va en la UI: menú admin oculto</h2>

<div class="code-wrap">
  <span class="file-label">src/components/Header.jsx</span>
<pre><code class="language-jsx">{esAdmin &amp;&amp; (
  &lt;&gt;
    &lt;NavLink to="/admin/usuarios"&gt;Usuarios&lt;/NavLink&gt;
    &lt;NavLink to="/admin/transacciones"&gt;Compraventas&lt;/NavLink&gt;
  &lt;/&gt;
)}</code></pre>
</div>

<h2>6. Autenticación vs Autorización</h2>

<table>
  <tr><th></th><th>Autenticación</th><th>Autorización</th></tr>
  <tr><td>Pregunta</td><td>"¿Eres quien dices ser?"</td><td>"¿Tienes permiso para esto?"</td></tr>
  <tr><td>En DaWeb</td><td>Firma criptográfica del JWT.</td><td>Array <code>roles</code> en el payload.</td></tr>
  <tr><td>Ejemplo</td><td>Usuario con token válido = autenticado.</td><td>Sólo si <code>roles.includes('ADMINISTRADOR')</code> = autorizado a /admin/*.</td></tr>
</table>

<p>Caso donde ambas son insuficientes: usuario A intenta editar producto de B. A está autenticado y autorizado (rol USUARIO), pero no tiene permiso sobre ESE producto. El backend debe comprobar <code>idVendedor === idUsuarioToken</code>.</p>

<h2>7. La gran advertencia: el frontend NO es seguridad</h2>

<div class="callout danger">
  <div class="callout-titulo"><i class="bi bi-shield-exclamation"></i> El bundle JavaScript es código público</div>
  <p>Cualquiera puede: (1) abrir DevTools y leer <code>RutaProtegida</code>; (2) inyectar un token falso en localStorage; (3) saltarse la UI y llamar directamente a <code>/api/admin/usuarios</code> con curl o Postman. <strong>La seguridad real está en el backend</strong>, que verifica firma + expiración + rol en CADA petición.</p>
</div>

<div class="tip-regla">
  <strong>Frontend protege la UX; backend protege la seguridad.</strong> Memorízalo. Si un entrevistador te pregunta "¿cómo está protegida la ruta?", tu respuesta debe mencionar ambas capas.
</div>

<h2>8. Comparación de las cuatro capas de defensa</h2>

<figure class="diagrama">
  <figcaption>Qué bloquea qué (intento de acceso a /admin/usuarios por usuario normal)</figcaption>
  <pre class="mermaid">
flowchart TB
  A["Caso A: navegación normal por la UI"] --> A1["Header: {esAdmin && ...} → link oculto"]
  A1 --> A2["Bloqueo de UX"]
  B["Caso B: escribe /admin/usuarios en la barra"] --> B1["RutaProtegida → Navigate /"]
  B1 --> B2["Bloqueo de UX"]
  C["Caso C: fetch directo con su JWT (no admin)"] --> C1["Backend valida firma + rol"]
  C1 --> C2["HTTP 403 Forbidden ⇐ ÚNICO bloqueo real"]
  D["Caso D: inyecta JWT forjado en localStorage"] --> D1["Frontend lo cree, deja pasar"]
  D1 --> D2["Backend recalcula firma → no coincide"]
  D2 --> D3["HTTP 401 Unauthorized ⇐ bloqueo real"]
  </pre>
</figure>

<h2>9. Flujo de redirección detallado</h2>

<figure class="diagrama">
  <figcaption>Anónimo entra a /perfil</figcaption>
  <pre class="mermaid">
sequenceDiagram
  participant U as Usuario
  participant N as Navegador
  participant R as React Router
  participant RP as RutaProtegida
  participant A as AuthContext
  U->>N: teclea /perfil
  N->>R: History push
  R->>RP: monta &lt;RutaProtegida&gt;
  RP->>A: useAuth()
  A-->>RP: { usuario: null, esAdmin: false }
  RP-->>R: &lt;Navigate to="/login" replace /&gt;
  R->>R: replaceState → URL = /login
  R->>U: monta &lt;Login /&gt;
  </pre>
</figure>

<h2>10. <code>replace</code> en Navigate: el bucle del botón "Atrás"</h2>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>❌ Sin replace</h4>
<pre><code class="language-text">Historial: [/, /perfil, /login]
"Atrás" → /perfil
RutaProtegida → Navigate /login (push)
Historial: [/, /perfil, /login, /login]
Bucle infinito</code></pre>
  </div>
  <div class="tarjeta">
    <h4>✅ Con replace</h4>
<pre><code class="language-text">Historial: [/, /perfil]
/perfil → Navigate /login (replace)
Historial: [/, /login]
"Atrás" → / (home)
Sin bucle</code></pre>
  </div>
</div>

<h2>11. Preguntas trampa frecuentes</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "Si degradan a un admin en el servidor pero su JWT no ha expirado, ¿sigue siendo admin?"</div>
  <p>Sí, hasta que expire. El JWT lleva el rol en el payload. Es la limitación del JWT stateless. Solución completa: tokens cortos (15-30 min) + refresh tokens.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué dos comprobaciones separadas en RutaProtegida?"</div>
  <p>Porque redirigen a destinos distintos. Sin login → <code>/login</code> (necesita autenticarse). Con login pero sin rol → <code>/</code> (ya está autenticado, mandarlo otra vez al login confunde).</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Podría un usuario normal llamar a /api/admin/usuarios?"</div>
  <p>Desde la UI no llega. Pero con curl/Postman con su JWT, el backend debería responder 403 (su JWT no incluye ADMINISTRADOR). Si NO lo hace, sería un fallo de autorización en el backend.</p>
</div>

<h2>12. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">Un usuario normal escribe <code>/admin/usuarios</code>. ¿Qué pasa?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Ve la página igual.</button>
    <button class="quiz-opcion" data-correcta="1">Es redirigido a la home <code>/</code>.</button>
    <button class="quiz-opcion" data-correcta="0">Va al login.</button>
    <button class="quiz-opcion" data-correcta="0">Aparece 403 a pantalla completa.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. esAdmin=false → Navigate to='/'." data-ko="Dos comprobaciones: login y rol; cada una a sitio distinto."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Cómo se determina si un usuario es admin?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">El backend devuelve <code>esAdmin: true</code>.</button>
    <button class="quiz-opcion" data-correcta="1"><code>roles.includes('ADMINISTRADOR')</code> en el JWT decodificado.</button>
    <button class="quiz-opcion" data-correcta="0">Por el email.</button>
    <button class="quiz-opcion" data-correcta="0">Por el id.</button>
  </div>
  <p class="quiz-feedback" data-ok="En AuthContext: const esAdmin = usuario?.roles.includes('ADMINISTRADOR')." data-ko="Cálculo derivado del array roles del payload."></p>
</div>

<h2>13. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Probar la redirección</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <ol>
    <li><code>localStorage.removeItem('arso_token')</code>; recarga.</li>
    <li>Escribe <code>/perfil</code> en la barra.</li>
    <li>Acabas en <code>/login</code> automáticamente.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Proteger una ruta nueva</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
<pre><code class="language-jsx">&lt;Route path="/acerca" element={
  &lt;RutaProtegida&gt;&lt;AcercaDe /&gt;&lt;/RutaProtegida&gt;
} /&gt;</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Añadir rol MODERADOR</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <ol>
    <li>En <code>AuthContext.jsx</code>: <code>const esModerador = usuario?.roles?.includes('MODERADOR');</code></li>
    <li>Añade prop <code>soloModerador</code> a <code>RutaProtegida</code> con la jerarquía: admin también pasa.</li>
    <li>Úsalo: <code>&lt;RutaProtegida soloModerador&gt;...&lt;/RutaProtegida&gt;</code>.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Recordar la URL de origen tras login</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
<pre><code class="language-jsx">// En RutaProtegida
import { Navigate, useLocation } from 'react-router-dom';
const location = useLocation();
if (!usuario) {
  return &lt;Navigate to={\`/login?desde=\${encodeURIComponent(location.pathname)}\`} replace /&gt;;
}

// En Login.jsx
const [sp] = useSearchParams();
const desde = sp.get('desde') || '/';
if (res.ok) navegar(desde);</code></pre>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Para la entrevista</div>
  <p>"¿Cómo se protege una ruta?" → (1) Envoltorio <code>RutaProtegida</code> que lee el contexto. (2) Sin usuario → <code>&lt;Navigate /login&gt;</code>. (3) Sin rol → <code>&lt;Navigate /&gt;</code>. (4) Se envuelve en <code>App.jsx</code>. (5) <strong>UX no seguridad</strong>; el backend valida en cada petición.</p>
</div>
`;
