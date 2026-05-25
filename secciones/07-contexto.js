window.__SECC = window.__SECC || {};
window.__SECC["contexto"] = `<h1>Context y autenticación</h1>
<p class="subtitulo">Cómo se comparte el estado del usuario logueado entre TODAS las páginas.</p>

<p class="lead">Cuando hay 15 páginas y todas necesitan saber "¿hay usuario logueado? ¿es admin?", pasar esa info como props sería un infierno. Para eso existe el <strong>Context API</strong> de React: un "almacén" global accesible desde cualquier componente. En DaWeb el contexto guarda el usuario actual y todas las acciones de login/logout/registro. En esta sección lo desmenuzas completo.</p>

<h2>1. El problema que resuelve Context</h2>
<p>Imagina esta jerarquía:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> <code>App</code> sabe quién es el usuario.</div>
  <div class="flujo-paso"><span class="num">2</span> <code>App</code> renderiza <code>Layout</code>.</div>
  <div class="flujo-paso"><span class="num">3</span> <code>Layout</code> renderiza <code>Header</code>.</div>
  <div class="flujo-paso"><span class="num">4</span> <code>Header</code> necesita el usuario para mostrar el nombre.</div>
</div>

<p>Pasarlo como prop por toda la cadena se llama <strong>prop drilling</strong> y es tedioso. Context permite a cualquier nivel de la cadena leer datos sin que los intermedios sepan nada.</p>

<h2>2. Las tres piezas de un Context</h2>

<table>
  <tr><th>Pieza</th><th>Qué hace</th><th>En DaWeb</th></tr>
  <tr><td><code>createContext(...)</code></td><td>Crea el "canal" para distribuir datos.</td><td><code>AuthContext</code> en <code>context/useAuth.js</code></td></tr>
  <tr><td><code>&lt;Context.Provider value={...}&gt;</code></td><td>Componente que <em>provee</em> los datos a sus hijos.</td><td><code>AuthProvider</code> en <code>context/AuthContext.jsx</code></td></tr>
  <tr><td><code>useContext(Context)</code></td><td>Hook que lee los datos.</td><td><code>useAuth()</code> en <code>context/useAuth.js</code></td></tr>
</table>

<h2>3. <code>context/useAuth.js</code> — la definición</h2>

<div class="code-wrap">
  <span class="file-label">src/context/useAuth.js</span>
<pre><code class="language-jsx">import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () =&gt; useContext(AuthContext);</code></pre>
</div>

<p>Sólo 3 líneas:</p>
<ul>
  <li>Crea un contexto con valor inicial <code>null</code>.</li>
  <li>Define un hook personalizado <code>useAuth</code> que es atajo para <code>useContext(AuthContext)</code>.</li>
</ul>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Hook personalizado</div>
  <p>Cualquier función que empieza por <code>use</code> y llama a otros hooks es un "custom hook". Es la forma idiomática de reutilizar lógica entre componentes.</p>
</div>

<h2>4. <code>context/AuthContext.jsx</code> — el proveedor</h2>

<div class="code-wrap">
  <span class="file-label">src/context/AuthContext.jsx</span>
<pre><code class="language-jsx">import { useState } from 'react';
import * as authApi from '../api/auth';
import * as usuariosApi from '../api/usuarios';
import { getToken, setToken, clearToken, decodeJwt } from '../api/client';
import { AuthContext } from './useAuth';

const usuarioDesdeToken = () =&gt; {
  const token = getToken();
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims || (claims.exp &amp;&amp; claims.exp * 1000 &lt; Date.now())) {
    clearToken();
    return null;
  }
  return {
    id: claims.sub,
    nombre: claims.nombre,
    apellidos: claims.apellidos,
    roles: claims.roles ?? [],
  };
};

export const AuthProvider = ({ children }) =&gt; {
  const [usuario, setUsuario] = useState(usuarioDesdeToken);

  const login = async (correo, clave) =&gt; {
    try {
      await authApi.login(correo, clave);
      const u = usuarioDesdeToken();
      setUsuario(u);
      return { ok: true, usuario: u };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const aceptarToken = (token) =&gt; {
    setToken(token);
    const u = usuarioDesdeToken();
    setUsuario(u);
    return u;
  };

  const logout = () =&gt; {
    authApi.logout();
    setUsuario(null);
  };

  const registrar = async (datos) =&gt; {
    try {
      await usuariosApi.crearUsuario(datos);
      return await login(datos.correo, datos.clave);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const actualizarPerfil = async (cambios) =&gt; {
    if (!usuario) return { ok: false, error: 'No hay sesión' };
    try {
      await usuariosApi.actualizarUsuario(usuario.id, cambios);
      setUsuario({ ...usuario, ...cambios });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const esAdmin = (usuario?.roles ?? []).includes('ADMINISTRADOR');

  return (
    &lt;AuthContext.Provider
      value={{
        usuario, esAdmin,
        login, logout, registrar,
        actualizarPerfil, aceptarToken,
      }}
    &gt;
      {children}
    &lt;/AuthContext.Provider&gt;
  );
};</code></pre>
</div>

<h3>Lectura paso a paso</h3>
<ol>
  <li><strong><code>usuarioDesdeToken()</code></strong>: función pura. Lee el token de localStorage, lo decodifica y devuelve un objeto usuario (o <code>null</code> si caducó o no existe).</li>
  <li><strong><code>useState(usuarioDesdeToken)</code></strong>: arranca el estado con el resultado de esa función. Pasamos la <em>referencia</em>, no su llamada, para que React la ejecute una sola vez (initialización perezosa).</li>
  <li><strong><code>login(correo, clave)</code></strong>: llama a la API, si OK actualiza el estado con el usuario decodificado del nuevo token, y devuelve <code>{ ok: true }</code>. Si falla, devuelve <code>{ ok: false, error: ... }</code>.</li>
  <li><strong><code>aceptarToken(token)</code></strong>: alternativa para login con OAuth (GitHub): el token llega ya hecho, sólo lo guardamos y actualizamos estado.</li>
  <li><strong><code>logout()</code></strong>: borra el token de localStorage y pone <code>usuario = null</code>.</li>
  <li><strong><code>registrar(datos)</code></strong>: crea el usuario y, si va bien, hace login automático.</li>
  <li><strong><code>actualizarPerfil(cambios)</code></strong>: PATCH al backend y refresca el estado local.</li>
  <li><strong><code>esAdmin</code></strong>: derivado del array de roles.</li>
  <li><strong><code>&lt;AuthContext.Provider value={{ ... }}&gt;</code></strong>: expone todo en el contexto.</li>
</ol>

<h2>5. Cómo se cuelga el provider en la app</h2>

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

<p>Al envolver toda la app, cualquier componente descendiente puede usar <code>useAuth()</code> y leer/modificar el estado de sesión.</p>

<h2>6. Uso desde una página</h2>

<div class="code-wrap">
  <span class="file-label">src/components/Header.jsx</span>
<pre><code class="language-jsx">import { useAuth } from '../context/useAuth';

function Header() {
  const { usuario, esAdmin, logout } = useAuth();
  const navegar = useNavigate();

  const salir = () =&gt; {
    logout();
    navegar('/');
  };
  // ...
  return (
    &lt;nav&gt;
      {esAdmin &amp;&amp; &lt;NavLink to="/admin/usuarios"&gt;Usuarios&lt;/NavLink&gt;}
      {usuario
        ? &lt;button onClick={salir}&gt;Salir&lt;/button&gt;
        : &lt;Link to="/login"&gt;Iniciar sesión&lt;/Link&gt;}
    &lt;/nav&gt;
  );
}</code></pre>
</div>

<h2>7. JWT: qué es y cómo se decodifica</h2>
<p>Un <strong>JWT (JSON Web Token)</strong> es un string formado por tres partes separadas por puntos:</p>

<div class="code-wrap">
  <span class="file-label">estructura de un JWT</span>
<pre><code class="language-text">eyJhbGciOi...   .   eyJzdWIiOiI...   .   3Rk2...
   header             payload              firma</code></pre>
</div>

<ul>
  <li><strong>Header</strong>: algoritmo de firma.</li>
  <li><strong>Payload</strong>: los datos (id, nombre, roles, exp = fecha de caducidad).</li>
  <li><strong>Firma</strong>: garantiza que el backend lo creó (sólo el backend puede generar uno válido).</li>
</ul>

<p>El proyecto decodifica el payload sin validar la firma (no necesita; sólo lee datos). El cliente confía en que si el backend lo aceptó, está bien:</p>

<div class="code-wrap">
  <span class="file-label">src/api/client.js</span>
<pre><code class="language-jsx">export const decodeJwt = (token) =&gt; {
  try {
    const payload = token.split('.')[1];                          // segundo trozo
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};</code></pre>
</div>

<ul>
  <li><code>token.split('.')[1]</code>: coge el payload.</li>
  <li><code>atob(...)</code>: decodifica de Base64.</li>
  <li>El reemplazo <code>-/_</code> a <code>+/</code> es porque JWT usa Base64URL, una variante.</li>
  <li><code>JSON.parse</code>: lo convierte en objeto JS.</li>
</ul>

<h3>Campos del payload (claims) que usa DaWeb</h3>
<table>
  <tr><th>Claim</th><th>Significado</th></tr>
  <tr><td><code>sub</code></td><td>"subject": id del usuario</td></tr>
  <tr><td><code>nombre</code></td><td>nombre del usuario</td></tr>
  <tr><td><code>apellidos</code></td><td>apellidos del usuario</td></tr>
  <tr><td><code>roles</code></td><td>array de roles (p. ej. <code>["USUARIO"]</code> o <code>["USUARIO", "ADMINISTRADOR"]</code>)</td></tr>
  <tr><td><code>exp</code></td><td>fecha de caducidad en SEGUNDOS desde el epoch</td></tr>
</table>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> exp en segundos, JS en ms</div>
  <p><code>exp * 1000 &lt; Date.now()</code>: multiplicamos por 1000 porque JS trabaja en milisegundos. Si caducó, borramos el token.</p>
</div>

<h2>8. Login tradicional (correo + clave)</h2>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Usuario rellena el formulario y pulsa "Iniciar sesión".</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> <code>Login.jsx</code> llama a <code>login(correo, clave)</code> del contexto.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> El contexto llama a <code>authApi.login(...)</code> que hace <code>POST /api/auth/login</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> El backend valida y devuelve <code>{ token: "eyJ..." }</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> <code>auth.js</code> guarda el token con <code>setToken(token)</code> (en localStorage).</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">6</span> El contexto decodifica el token y actualiza <code>usuario</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">7</span> Toda la app re-renderiza: aparece el nombre en el header, etc.</div>
</div>

<h2>9. Login con GitHub (OAuth2)</h2>
<p>El proyecto soporta también login con GitHub. Aquí el flujo es más complejo porque GitHub está fuera del dominio.</p>

<div class="code-wrap">
  <span class="file-label">src/pages/Login.jsx — fragmento de loginConGithub</span>
<pre><code class="language-jsx">const loginConGithub = () =&gt; {
  const popup = window.open(
    '/oauth2/authorization/github',
    'github-oauth',
    \`width=\${ancho},height=\${alto},left=\${x},top=\${y}\`
  );

  intervaloRef.current = setInterval(() =&gt; {
    if (popup.closed) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
      return;
    }
    let ruta;
    try { ruta = popup.location.pathname; } catch { return; }
    if (!ruta || !ruta.startsWith('/login/oauth2/code/')) return;

    clearInterval(intervaloRef.current);
    const texto = popup.document.body.innerText || '';
    popup.close();
    const datos = JSON.parse(texto);
    if (datos.token) {
      aceptarToken(datos.token);
      navegar('/');
    }
  }, 400);
};</code></pre>
</div>

<h3>Por qué un popup y un setInterval</h3>
<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Se abre un popup que va al backend a <code>/oauth2/authorization/github</code>.</div>
  <div class="flujo-paso"><span class="num">2</span> El backend redirige al popup a GitHub para autenticar.</div>
  <div class="flujo-paso"><span class="num">3</span> El usuario autoriza en GitHub y GitHub redirige de vuelta al backend.</div>
  <div class="flujo-paso"><span class="num">4</span> El backend, en la URL <code>/login/oauth2/code/github</code>, escribe un JSON con el token.</div>
  <div class="flujo-paso"><span class="num">5</span> El intervalo (cada 400ms) detecta que el popup ya está en esa URL.</div>
  <div class="flujo-paso"><span class="num">6</span> Lee el JSON del popup, llama a <code>aceptarToken</code> y cierra el popup.</div>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> El try/catch al leer popup.location</div>
  <p>Mientras el popup está en github.com, el navegador BLOQUEA el acceso (política de mismo origen). El try/catch atrapa esa excepción silenciosamente; el intervalo vuelve a intentar al cabo de 400ms. Cuando el popup vuelve a tu dominio (tras la redirección del backend), el acceso desbloquea y leemos la ruta.</p>
</div>

<h2>10. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>Context y el problema de re-renders en cascada</h3>
<p>Cada vez que el <code>value</code> del Provider cambia, <strong>todos</strong> los componentes que llaman a <code>useContext(AuthContext)</code> se re-renderizan, sin importar si la parte del valor que usan cambió.</p>

<div class="code-wrap">
<pre><code class="language-jsx">// Cuando actualizarPerfil hace setUsuario({...usuario, nombre: 'Ana'}):
// → Crea un NUEVO objeto → el value del Provider cambia
// → TODOS los consumidores de useAuth() re-renderizan:
//   Header (usa usuario, esAdmin, logout)
//   RutaProtegida (usa usuario, esAdmin)
//   Cualquier página con useAuth()</code></pre>
</div>

<p>En DaWeb esto es aceptable: los re-renders son baratos (componentes pequeños) y ocurren poco (solo en login/logout/update). En apps grandes con contextos muy cambiantes se usarían técnicas como <code>useMemo</code> para el <code>value</code> o dividir el contexto en múltiples providers más específicos.</p>

<h3>localStorage vs sessionStorage vs cookies: la guerra de seguridad</h3>

<table>
  <tr><th></th><th>localStorage</th><th>sessionStorage</th><th>Cookie HttpOnly</th></tr>
  <tr><td><strong>Persistencia</strong></td><td>Hasta que se borre</td><td>Hasta cerrar la pestaña</td><td>Según <code>expires</code></td></tr>
  <tr><td><strong>Accesible desde JS</strong></td><td>Sí</td><td>Sí</td><td><strong>No</strong> (HttpOnly)</td></tr>
  <tr><td><strong>Se envía al servidor</strong></td><td>No (hay que añadirlo al header)</td><td>No</td><td>Automáticamente en cada petición</td></tr>
  <tr><td><strong>Vulnerable a XSS</strong></td><td><strong>Sí</strong></td><td><strong>Sí</strong></td><td><strong>No</strong></td></tr>
  <tr><td><strong>DaWeb usa</strong></td><td>✓ (clave: <code>arso_token</code>)</td><td></td><td></td></tr>
</table>

<p>DaWeb guarda el token en <code>localStorage</code>. Si hubiera un ataque XSS (script malicioso inyectado en la página), podría ejecutar <code>localStorage.getItem('arso_token')</code> y robar el token. La alternativa más segura serían cookies <code>HttpOnly</code>, que son inaccesibles para JavaScript. Sin embargo, eso requeriría:</p>
<ul>
  <li>El backend establece la cookie: <code>Set-Cookie: token=...; HttpOnly; SameSite=Strict</code>.</li>
  <li>El navegador la incluye automáticamente en cada petición.</li>
  <li>CORS necesita <code>credentials: 'include'</code> en el fetch y <code>Access-Control-Allow-Credentials: true</code> en el backend (con origen explícito, no <code>*</code>).</li>
</ul>
<p>DaWeb optó por localStorage por simplicidad — decisión aceptable para un proyecto académico pero con riesgo XSS conocido.</p>

<h3>OAuth2 Authorization Code Flow: el protocolo completo</h3>
<p>OAuth2 es un protocolo de <strong>autorización</strong>. GitHub actúa como proveedor de identidad. El flujo completo:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> El frontend abre un popup a <code>/oauth2/authorization/github</code> (proxied al backend ArSo).</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> ArSo genera un parámetro <code>state</code> aleatorio (protección CSRF) y redirige el popup a <code>github.com/login/oauth/authorize?client_id=X&amp;state=Z&amp;redirect_uri=Y</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> GitHub muestra la pantalla de autorización. El usuario acepta.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> GitHub redirige el popup a la <code>redirect_uri</code> del backend con <code>?code=TEMPORAL&amp;state=Z</code>. El code dura ~10 minutos y es de <strong>un solo uso</strong>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> ArSo verifica que <code>state</code> coincide (protección CSRF) y hace un POST server-to-server a <code>github.com/login/oauth/access_token</code> con el code. El code nunca sale del servidor.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">6</span> GitHub devuelve un <code>access_token</code>. ArSo lo usa para obtener los datos del usuario de la API de GitHub.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">7</span> ArSo crea un usuario en su base de datos (si no existía) y genera su propio JWT. Lo escribe en el body del popup.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">8</span> El <code>setInterval</code> del frontend detecta que el popup está de vuelta en el dominio propio, lee el JWT del body, llama a <code>aceptarToken</code> y cierra el popup.</div>
</div>

<p>El <code>code</code> de GitHub es de un solo uso y de corta vida por diseño: si alguien intercepta la URL de redirección, el código ya está consumido por ArSo y es inútil.</p>

<h3>JWT: por qué es imposible revocar un token antes de que expire</h3>
<p>El JWT es <strong>stateless</strong>: el servidor no guarda nada. Solo verifica la firma en cada petición. Esta es su gran ventaja y su gran limitación:</p>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Ventaja: escalabilidad</h4>
    <p>Cualquier instancia del servidor puede verificar cualquier token sin consultar una base de datos. Perfecto para sistemas distribuidos con varios servidores.</p>
  </div>
  <div class="tarjeta">
    <h4>Limitación: no se puede revocar</h4>
    <p>Si el usuario hace logout, el frontend borra el token del localStorage. Pero si alguien robó ese token antes, sigue siendo válido hasta que caduque (<code>exp</code>). Solo cambiar la clave secreta del servidor invalida todos los tokens existentes.</p>
  </div>
</div>

<div class="code-wrap">
  <span class="file-label">escenario de problema real</span>
<pre><code class="language-text">1. Usuario admin se logea. Obtiene JWT con exp = ahora + 24h.
2. Admin abusa de sus privilegios. El gestor quiere revocarle acceso.
3. El gestor cambia el rol en la BD → 'USUARIO'.
4. Pero el JWT sigue diciendo "ADMINISTRADOR" en su payload.
5. El admin puede seguir haciendo peticiones hasta las 24h.

Solución real (no en DaWeb):
- Tokens de corta vida (15 min) + refresh tokens
- O lista negra de tokens revocados en Redis</code></pre>
</div>

<h3><code>usuarioDesdeToken</code> como lazy initializer: detalles técnicos</h3>

<div class="dos-cols">
  <div class="tarjeta">
    <h4>Con paréntesis (incorrecto)</h4>
<pre><code class="language-jsx">// usuarioDesdeToken() se llama en CADA render
// El resultado se descarta (solo se usa en el primer render)
// Lee localStorage y parsea JWT innecesariamente en cada re-render
const [usuario, setUsuario] =
  useState(usuarioDesdeToken());</code></pre>
  </div>
  <div class="tarjeta">
    <h4>Sin paréntesis (correcto)</h4>
<pre><code class="language-jsx">// Se pasa la REFERENCIA a la función
// React la llama UNA SOLA VEZ (primer render)
// En renders siguientes, React usa el estado guardado
const [usuario, setUsuario] =
  useState(usuarioDesdeToken);</code></pre>
  </div>
</div>

<p>Esto se llama <strong>lazy initialization</strong> de <code>useState</code>. Es importante porque <code>usuarioDesdeToken</code> lee de <code>localStorage</code> y parsea un JWT — operaciones rápidas pero que no tienen sentido repetir en cada re-render del AuthProvider.</p>

<h3>Diagrama de secuencia: login tradicional</h3>
<p>Quién llama a quién cuando el usuario pulsa "Iniciar sesión" con correo y clave:</p>

<div class="code-wrap">
  <span class="file-label">login tradicional — interacción entre módulos</span>
<pre><code class="language-text">Usuario   Login.jsx   AuthProvider   auth.js    client.js  localStorage  Vite proxy   Backend
  │          │             │            │           │             │            │           │
  │ submit ─▶│ e.preventDefault()       │           │             │            │           │
  │          │ login(c,k) ─▶            │           │             │            │           │
  │          │             │ authApi.   │           │             │            │           │
  │          │             │  login()──▶│           │             │            │           │
  │          │             │            │ request──▶│             │            │           │
  │          │             │            │           │ fetch ──────────────────▶│           │
  │          │             │            │           │             │            │ POST /auth│
  │          │             │            │           │             │            │           │ validar
  │          │             │            │           │             │            │           │ firmar JWT
  │          │             │            │           │             │            │ ◀── 200 ──│
  │          │             │            │           │ ◀── {token} │            │           │
  │          │             │            │ setToken(token) ────────▶ guardado   │            │
  │          │             │            │ ◀── datos │             │            │           │
  │          │             │ usuarioDesdeToken()                  │            │           │
  │          │             │   ├── getToken() ◀──────────── lee   │            │           │
  │          │             │   └── decodeJwt(t) → claims          │            │           │
  │          │             │ setUsuario(u) ─── DISPARA re-render  │            │           │
  │          │             │   de TODOS los consumidores useAuth()│            │           │
  │          │ ◀── {ok}    │   (Header, RutaProtegida...)         │            │           │
  │          │ navegar('/')│                                      │            │           │
  │ home con◀│             │                                      │            │           │
  │ nombre    │            │                                      │            │           │</code></pre>
</div>

<h3>Diagrama de secuencia: OAuth2 con GitHub</h3>
<p>El popup, el <code>setInterval</code>, las redirecciones cross-origin y cómo el frontend "ve" el JWT al final:</p>

<div class="code-wrap">
  <span class="file-label">login OAuth2 — popup + backend + GitHub</span>
<pre><code class="language-text">Login.jsx      popup (window)     Vite proxy     Backend ArSo     GitHub
   │                │                  │              │              │
   │ window.open(   │                  │              │              │
   │ /oauth2/auth.. │ abre URL ───────▶│              │              │
   │ ──────────────▶│                  │ ────────────▶│              │
   │                │                  │              │ genera state │
   │                │                  │              │ + redirect   │
   │                │ ◀── 302 a github.com/login/oauth/authorize    │
   │                │ ───────────────────────────────────────────── ▶│
   │                │                  │              │              │ usuario
   │                │                  │              │              │ autoriza
   │                │ ◀── 302 a backend/login/oauth2/code/github?code=X
   │                │ ────────────────▶│              │              │
   │                │                  │ ────────────▶│              │
   │                │                  │              │ verifica state
   │                │                  │              │ POST con code│
   │                │                  │              │ ───────────▶ │
   │                │                  │              │ ◀── access_tok
   │                │                  │              │ GET user data│
   │                │                  │              │ ───────────▶ │
   │                │                  │              │ ◀── usuario  │
   │                │                  │              │ crea/actualiza
   │                │                  │              │ usuario en DB│
   │                │                  │              │ genera JWT   │
   │                │ ◀── HTML con {token:"eyJ..."} en body         │
   │                │                  │              │              │
 setInterval(400ms):│                  │              │              │
   ├── try {popup.location.pathname} catch {} ── (mientras está en github.com falla)
   ├── try { ... } catch {} ── (mientras carga backend, sigue fallando)
   ├── ruta === '/login/oauth2/code/github' → ¡llegó!                │
   ├── texto = popup.document.body.innerText                         │
   ├── datos = JSON.parse(texto)                                     │
   ├── aceptarToken(datos.token) ──▶ AuthContext.setUsuario          │
   └── popup.close()                                                  │</code></pre>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Por qué no se puede simplificar</div>
  <p>El popup es necesario porque la autenticación de GitHub <em>no se puede</em> hacer en un iframe (GitHub envía <code>X-Frame-Options: DENY</code>). El <code>setInterval</code> es necesario porque el navegador NO emite ningún evento cuando un popup cambia de URL en otro origen — la única forma de saberlo es preguntar periódicamente.</p>
</div>



<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué pasa si el usuario borra el token de localStorage mientras la app está abierta?"</strong> — La app no se entera en tiempo real. El estado de React sigue mostrando al usuario como logueado. La próxima petición a la API devolverá 401 (porque el token ya no se incluye en el header). Ese error se muestra en la página pero no hay logout automático. Para detectarlo habría que usar <code>window.addEventListener('storage', ...)</code> que se dispara cuando otra pestaña modifica el localStorage.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Puede un atacante modificar el payload del JWT para darse más permisos?"</strong> — No. Puede decodificar el payload (Base64URL es codificación, no cifrado) y leerlo, pero si modifica cualquier bit, la firma criptográfica deja de coincidir. El backend recalculará la firma y la comparará — si no coinciden, rechaza con 401. Solo quien tenga la clave secreta del servidor puede generar una firma válida.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué hay un <code>try/catch</code> al leer <code>popup.location</code> durante el OAuth?"</strong> — Mientras el popup está en <code>github.com</code> (otro origen), el navegador aplica la Same-Origin Policy: leer <code>popup.location.pathname</code> lanza una excepción de seguridad. El <code>try/catch</code> la captura silenciosamente. El <code>setInterval</code> sigue intentando cada 400ms. Cuando el popup vuelve al dominio propio (tras la redirección del backend), el acceso se desbloquea y la lectura funciona.</p>
</div>

<h2>11. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Por qué <code>AuthProvider</code> está ENCIMA de <code>BrowserRouter</code> en App.jsx?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Por orden alfabético.</button>
    <button class="quiz-opcion" data-correcta="1">Para que el contexto esté disponible también en rutas, redirecciones y guards.</button>
    <button class="quiz-opcion" data-correcta="0">Porque BrowserRouter no acepta hijos sin contexto.</button>
    <button class="quiz-opcion" data-correcta="0">Para que el provider pueda navegar al iniciar.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. Si lo invirtieras, las rutas no podrían usar useAuth." data-ko="Cualquier componente que use useAuth debe estar DENTRO del Provider."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">Si cierro la pestaña y la vuelvo a abrir, ¿el usuario sigue logueado?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="1">Sí, porque <code>localStorage</code> persiste entre pestañas y cierres.</button>
    <button class="quiz-opcion" data-correcta="0">No, el estado se borra siempre al cerrar.</button>
    <button class="quiz-opcion" data-correcta="0">Sólo si la pestaña era privada.</button>
    <button class="quiz-opcion" data-correcta="0">Sólo si pulsé "recordarme".</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. Hasta que el token caduque (exp) o llames a logout()." data-ko="El token está en localStorage; sobrevive a cierres. Sólo se borra si pasa el exp o llamas logout."></p>
</div>

<h2>12. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Ver el token desde la consola</span>
    <span class="nivel">★ Muy fácil</span>
  </div>
  <ol>
    <li>Inicia sesión en la web.</li>
    <li>Abre DevTools → Console.</li>
    <li>Ejecuta: <code>localStorage.getItem('arso_token')</code>.</li>
    <li>Copia el token y pégalo en <a href="https://jwt.io" target="_blank" rel="noopener">jwt.io</a> para ver el payload decodificado.</li>
  </ol>
  <details>
    <summary>Qué deberías ver</summary>
    <p>Campos como <code>sub</code> (id), <code>nombre</code>, <code>apellidos</code>, <code>roles</code> y <code>exp</code>.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Forzar logout desde consola</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <ol>
    <li>Con sesión iniciada, en la consola: <code>localStorage.removeItem('arso_token')</code>.</li>
    <li>Recarga la página.</li>
    <li>Verás que sales automáticamente.</li>
  </ol>
  <details>
    <summary>Por qué</summary>
    <p>Al cargar, <code>AuthProvider</code> llama a <code>usuarioDesdeToken()</code> que devuelve <code>null</code> si no hay token. El header detecta <code>usuario === null</code> y muestra el botón de "Iniciar sesión".</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Añadir un campo nuevo al contexto</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Imagina que quieres exponer "el usuario tiene email verificado". Modifica <code>AuthContext.jsx</code>:</p>
  <ol>
    <li>En el cálculo de <code>usuarioDesdeToken</code>, añade <code>emailVerificado: claims.emailVerificado ?? false</code>.</li>
    <li>Añade un <code>const emailVerificado = usuario?.emailVerificado ?? false;</code>.</li>
    <li>Añade <code>emailVerificado</code> al value del Provider.</li>
    <li>Úsalo en cualquier página: <code>const { emailVerificado } = useAuth();</code> y muestra un aviso si es false.</li>
  </ol>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Simular un token caducado</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>En consola, manipula el token para que parezca caducado:</p>
<pre><code class="language-js">// 1) lee el token actual
const t = localStorage.getItem('arso_token');
// 2) parte y modifica el payload (cambia exp a 1)
const [h, p, s] = t.split('.');
const payload = JSON.parse(atob(p));
payload.exp = 1;  // 1970
const nuevoPayload = btoa(JSON.stringify(payload)).replace(/=+$/,'').replace(/\\+/g, '-').replace(/\\//g, '_');
localStorage.setItem('arso_token', \`\${h}.\${nuevoPayload}.\${s}\`);
// 3) recarga la página</code></pre>
  <details>
    <summary>Resultado esperado</summary>
    <p>Al recargar, <code>usuarioDesdeToken</code> detecta que <code>exp * 1000 &lt; Date.now()</code> y borra el token. Quedas deslogueado.</p>
    <p>Aviso: el backend no aceptará este token modificado (la firma no coincide). Por eso es sólo una demo de la verificación en cliente.</p>
  </details>
</div>

<div class="try-it">
  <div class="try-it-cabecera"><i class="bi bi-play-circle"></i> Simular decodeJwt aquí mismo</div>
  <textarea spellcheck="false">// Función igual a la del proyecto
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Un JWT de ejemplo (header.payload.signature — la firma es falsa, sólo decodificamos)
const t = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsIm5vbWJyZSI6IkFuYSIsInJvbGVzIjpbIlVTVUFSSU8iXSwiZXhwIjoxOTAwMDAwMDAwfQ.x';
console.log(decodeJwt(t));</textarea>
  <div class="try-it-acciones">
    <button class="btn-ejecutar"><i class="bi bi-play-fill"></i> Ejecutar</button>
    <button class="btn-limpiar secundario">Reiniciar</button>
  </div>
  <div class="try-it-salida"></div>
</div>
`;
