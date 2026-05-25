window.__SECC = window.__SECC || {};
window.__SECC["api"] = `<h1>Capa API y comunicación con el backend</h1>
<p class="subtitulo">Cómo cada función del proyecto pide y envía datos al servidor.</p>

<p class="lead">El frontend NO accede directamente a la base de datos. Sólo habla con el backend a través de <strong>HTTP</strong>. Todas esas llamadas están centralizadas en la carpeta <code>src/api/</code>. En esta sección verás el cliente HTTP genérico (<code>client.js</code>) y los módulos especializados (<code>auth</code>, <code>usuarios</code>, <code>productos</code>, <code>categorias</code>, <code>compraventas</code>).</p>

<h2>1. ¿Qué es una API REST?</h2>
<p>REST es una manera convencional de organizar los endpoints de un backend usando:</p>
<ul>
  <li><strong>URLs jerárquicas por recurso</strong>: <code>/usuarios</code>, <code>/usuarios/42</code>, <code>/usuarios/42/nombre</code>.</li>
  <li><strong>Verbos HTTP</strong> con semántica fija:
    <table>
      <tr><th>Verbo</th><th>Significa</th><th>Ejemplo</th></tr>
      <tr><td><code>GET</code></td><td>Leer</td><td>GET /productos → lista</td></tr>
      <tr><td><code>POST</code></td><td>Crear</td><td>POST /productos → nuevo</td></tr>
      <tr><td><code>PUT</code></td><td>Reemplazar entero</td><td>(no se usa en DaWeb)</td></tr>
      <tr><td><code>PATCH</code></td><td>Modificar parcial</td><td>PATCH /usuarios/42</td></tr>
      <tr><td><code>DELETE</code></td><td>Borrar</td><td>DELETE /productos/9</td></tr>
    </table>
  </li>
  <li><strong>Respuestas con códigos de estado</strong>: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error…</li>
</ul>

<h2>2. <code>fetch</code>: la herramienta del navegador</h2>
<p>Es la función nativa para hacer peticiones HTTP desde JavaScript. Devuelve una Promesa con la respuesta.</p>

<div class="code-wrap">
  <span class="file-label">fetch básico</span>
<pre><code class="language-js">const respuesta = await fetch('/api/productos');
const datos = await respuesta.json();
console.log(datos);</code></pre>
</div>

<p>Con opciones:</p>
<div class="code-wrap">
  <span class="file-label">fetch con método y body</span>
<pre><code class="language-js">await fetch('/api/usuarios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Ana', correo: 'a@b.com' }),
});</code></pre>
</div>

<h2>3. El cliente HTTP central: <code>src/api/client.js</code></h2>
<p>El proyecto envuelve <code>fetch</code> en una función llamada <code>request</code> que añade automáticamente:</p>
<ul>
  <li>El prefijo <code>/api</code>.</li>
  <li>El token JWT en el header <code>Authorization</code>.</li>
  <li>La serialización del body.</li>
  <li>La construcción del query string.</li>
  <li>El parseo seguro de la respuesta.</li>
  <li>El manejo de errores con código de estado.</li>
</ul>

<div class="code-wrap">
  <span class="file-label">src/api/client.js</span>
<pre><code class="language-js">const API_BASE = '/api';

export const TOKEN_KEY = 'arso_token';
export const getToken   = () =&gt; localStorage.getItem(TOKEN_KEY);
export const setToken   = (token) =&gt; localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () =&gt; localStorage.removeItem(TOKEN_KEY);

export const decodeJwt = (token) =&gt; {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const request = async (
  path,
  { method = 'GET', body, headers = {}, query, returnLocation = false } = {}
) =&gt; {
  const token = getToken();

  let url = \`\${API_BASE}\${path}\`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) =&gt; {
      if (v !== undefined &amp;&amp; v !== null &amp;&amp; v !== '') params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += \`?\${qs}\`;
  }

  const opciones = {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
      ...headers,
    },
  };
  if (body !== undefined) opciones.body = JSON.stringify(body);

  const respuesta = await fetch(url, opciones);
  const texto = respuesta.status === 204 ? '' : await respuesta.text();
  const datos = texto ? safeJson(texto) : null;

  if (!respuesta.ok) {
    const error = new Error(
      (datos &amp;&amp; (datos.message || datos.error)) ||
      \`Error \${respuesta.status} en \${method} \${path}\`
    );
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
  }

  if (returnLocation) {
    const location = respuesta.headers.get('Location');
    const id = location ? location.split('/').filter(Boolean).pop() : null;
    return { datos, location, id };
  }

  return datos;
};

const safeJson = (texto) =&gt; {
  try { return JSON.parse(texto); } catch { return texto; }
};</code></pre>
</div>

<h3>Desglose de la magia</h3>
<table>
  <tr><th>Parte</th><th>Qué consigue</th></tr>
  <tr><td><code>API_BASE = '/api'</code></td><td>Vite intercepta y reenvía al backend (sección 11).</td></tr>
  <tr><td><code>URLSearchParams</code></td><td>Construye <code>?clave=valor&amp;...</code> con escapado correcto.</td></tr>
  <tr><td>Filtro <code>v !== undefined &amp;&amp; v !== null &amp;&amp; v !== ''</code></td><td>No envía parámetros vacíos. Si <code>filtros.precioMaximo === ''</code> no añade nada.</td></tr>
  <tr><td><code>...(token ? { Authorization: \`Bearer \${token}\` } : {})</code></td><td>Inyecta el header del token sólo si existe.</td></tr>
  <tr><td><code>respuesta.status === 204 ? '' : await respuesta.text()</code></td><td>204 No Content significa cuerpo vacío.</td></tr>
  <tr><td><code>safeJson</code></td><td>Si la respuesta no es JSON (p.ej. mensaje plano), devuelve el texto sin romper.</td></tr>
  <tr><td><code>error.status = respuesta.status</code></td><td>Adjunta el código HTTP al objeto Error para que quien lo capture pueda reaccionar (p.ej. 401 = redirige al login).</td></tr>
  <tr><td><code>returnLocation</code></td><td>Para POSTs de creación: el backend devuelve el id en el header <code>Location</code>. Lo extraemos.</td></tr>
</table>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> El truco del Bearer</div>
  <p>El estándar HTTP dice que para enviar un token JWT se usa: <code>Authorization: Bearer &lt;token&gt;</code>. El backend lee esta cabecera, valida la firma y sabe quién es el usuario.</p>
</div>

<h2>4. Módulos por recurso</h2>
<p>Cada módulo es una colección de funciones que llaman a <code>request</code>:</p>

<h3>auth.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/auth.js</span>
<pre><code class="language-js">import { request, setToken, clearToken } from './client';

export const login = async (correo, clave) =&gt; {
  const datos = await request('/auth/login', {
    method: 'POST',
    body: { correo, clave },
  });
  if (datos?.token) setToken(datos.token);
  return datos;
};

export const logout = () =&gt; clearToken();</code></pre>
</div>

<h3>usuarios.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/usuarios.js</span>
<pre><code class="language-js">import { request } from './client';

export const crearUsuario      = (datos)     =&gt; request('/usuarios', { method: 'POST', body: datos });
export const listarUsuarios    = ()          =&gt; request('/usuarios');
export const obtenerUsuario    = (id)        =&gt; request(\`/usuarios/\${id}\`);
export const obtenerNombreUsuario = (id)     =&gt; request(\`/usuarios/\${id}/nombre\`);
export const actualizarUsuario = (id, cambios) =&gt;
  request(\`/usuarios/\${id}\`, { method: 'PATCH', body: cambios });</code></pre>
</div>

<h3>productos.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/productos.js</span>
<pre><code class="language-js">import { request } from './client';

export const ESTADOS_PRODUCTO = [
  { valor: 'NUEVO',       etiqueta: 'Nuevo' },
  { valor: 'COMO_NUEVO',  etiqueta: 'Como nuevo' },
  { valor: 'BUEN_ESTADO', etiqueta: 'Buen estado' },
  { valor: 'ACEPTABLE',   etiqueta: 'Aceptable' },
  { valor: 'PARA_PIEZAS', etiqueta: 'Para piezas' },
  { valor: 'REPARAR',     etiqueta: 'Para reparar' },
];

const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_PRODUCTO.map((e) =&gt; [e.valor, e.etiqueta])
);
export const etiquetaEstado = (valor) =&gt; ETIQUETAS_ESTADO[valor] ?? valor;

export const listarProductos        = (filtros = {}) =&gt; request('/productos', { query: filtros });
export const obtenerProducto        = (id)           =&gt; request(\`/productos/\${id}\`);
export const obtenerCategoriaProducto = (id)         =&gt; request(\`/productos/\${id}/categoria\`);
export const crearProducto          = (datos)        =&gt; request('/productos', { method: 'POST', body: datos, returnLocation: true });
export const modificarProducto      = (id, cambios)  =&gt; request(\`/productos/\${id}\`, { method: 'PATCH', body: cambios });
export const eliminarProducto       = (id)           =&gt; request(\`/productos/\${id}\`, { method: 'DELETE' });
export const asignarRecogida        = (id, ubicacion) =&gt; request(\`/productos/\${id}/recogida\`, { method: 'PATCH', body: ubicacion });
export const sumarVisualizacion     = (id)           =&gt; request(\`/productos/\${id}/visualizaciones\`, { method: 'PATCH' });</code></pre>
</div>

<div class="callout tip">
  <div class="callout-titulo"><i class="bi bi-lightbulb"></i> Truco: el Object.fromEntries</div>
  <p>Convierte el array <code>[{valor, etiqueta}, ...]</code> en un mapa <code>{ NUEVO: 'Nuevo', COMO_NUEVO: 'Como nuevo', ... }</code>. Así <code>etiquetaEstado('NUEVO')</code> devuelve 'Nuevo' en O(1).</p>
</div>

<h3>categorias.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/categorias.js</span>
<pre><code class="language-js">import { request } from './client';

export const listarCategoriasRaiz   = ()    =&gt; request('/categorias');
export const descendientesCategoria = (id)  =&gt; request(\`/categorias/\${id}/descendientes\`);</code></pre>
</div>

<h3>compraventas.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/compraventas.js</span>
<pre><code class="language-js">import { request } from './client';

export const crearCompraventa = (datos) =&gt; request('/compraventas', { method: 'POST', body: datos });
export const obtenerCompraventa = (id)  =&gt; request(\`/compraventas/\${id}\`);

export const compras = (idComprador, page = 0, size = 10) =&gt;
  request(\`/compraventas/comprador/\${idComprador}\`, { query: { page, size } });

export const ventas = (idVendedor, page = 0, size = 10) =&gt;
  request(\`/compraventas/vendedor/\${idVendedor}\`, { query: { page, size } });

export const transacciones = (idComprador, idVendedor, page = 0, size = 10) =&gt;
  request('/compraventas/transacciones', {
    query: { idComprador, idVendedor, page, size },
  });</code></pre>
</div>

<h3>util.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/util.js</span>
<pre><code class="language-js">export const desempaquetar = (res, relacion) =&gt; {
  if (Array.isArray(res)) return res;
  const embedded = res?._embedded;
  if (!embedded) return [];
  if (relacion &amp;&amp; embedded[relacion]) return embedded[relacion];
  const primero = Object.values(embedded)[0];
  return Array.isArray(primero) ? primero : [];
};

export const totalPaginas = (res) =&gt; res?.page?.totalPages ?? 1;</code></pre>
</div>

<h3>¿Qué es eso del <code>_embedded</code> y <code>page</code>?</h3>
<p>El backend usa el formato <strong>HAL/HAL-FORMS</strong>: cuando devuelve una lista paginada, la envuelve así:</p>

<div class="code-wrap">
  <span class="file-label">respuesta paginada del backend</span>
<pre><code class="language-json">{
  "_embedded": {
    "productoList": [
      { "id": 1, "titulo": "Bici", ... },
      { "id": 2, "titulo": "Móvil", ... }
    ]
  },
  "page": {
    "size": 9,
    "totalElements": 23,
    "totalPages": 3,
    "number": 0
  }
}</code></pre>
</div>

<p><code>desempaquetar(res, 'productoList')</code> devuelve el array de productos, y <code>totalPaginas(res)</code> devuelve <code>3</code>.</p>

<h2>5. Flujo completo de una llamada</h2>
<p>Tomemos el listado de productos como ejemplo:</p>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> <code>Productos.jsx</code> llama a <code>productosApi.listarProductos({ descripcion: 'bici', page: 0, size: 9 })</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> Esto llama a <code>request('/productos', { query: { descripcion: 'bici', page: 0, size: 9 } })</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> <code>request</code> construye la URL: <code>/api/productos?descripcion=bici&amp;page=0&amp;size=9</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> Añade el header <code>Authorization: Bearer ...</code> si hay token.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">5</span> <code>fetch</code> envía la petición.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">6</span> Vite ve el prefijo <code>/api</code> y reenvía a <code>http://localhost:8090/productos?...</code></div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">7</span> Backend ArSo procesa, consulta MySQL y devuelve JSON HAL.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">8</span> El cliente recibe la respuesta. <code>request</code> la parsea y la devuelve.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">9</span> En <code>Productos.jsx</code>, <code>desempaquetar(res, 'productoList')</code> saca el array, <code>setProductos(...)</code> dispara re-render.</div>
</div>

<h2>6. Manejo de errores</h2>
<p>El patrón típico en cada página:</p>

<div class="code-wrap">
  <span class="file-label">patrón habitual</span>
<pre><code class="language-jsx">setCargando(true);
setError('');
productosApi.listarProductos(filtros)
  .then(res =&gt; { ... })
  .catch(err =&gt; setError(err.message))      // ⬅ el message lo construyó request()
  .finally(() =&gt; setCargando(false));</code></pre>
</div>

<p>Si el backend devuelve HTTP 401, <code>request</code> lanza un Error con <code>.status = 401</code>. Podrías capturarlo y redirigir al login.</p>

<h2>7. Teoría profunda: lo que el entrevistador sabe</h2>

<h3>CORS desde los principios del protocolo</h3>
<p>La <strong>Same-Origin Policy (SOP)</strong> es una política de seguridad del navegador: un script de <code>http://localhost:5173</code> no puede leer la respuesta de <code>http://localhost:8090</code> porque son orígenes distintos (mismo protocolo, mismo host, pero distinto puerto = distinto origen).</p>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Lo que bloquea CORS (y lo que no)</div>
  <p>CORS <strong>NO</strong> bloquea la petición en sí. La petición llega al servidor, el servidor la procesa y devuelve respuesta. Lo que CORS bloquea es que el JavaScript del navegador <em>lea</em> esa respuesta. Para peticiones con headers personalizados como <code>Authorization</code>, el navegador primero envía una petición <strong>preflight</strong> (<code>OPTIONS</code>) preguntando si el servidor lo permite.</p>
</div>

<div class="flujo">
  <div class="flujo-paso"><span class="num">1</span> Tu JS hace <code>fetch('http://localhost:8090/api/productos', { headers: { Authorization: '...' } })</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">2</span> El navegador detecta: origen diferente + header personalizado = necesita preflight.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">3</span> Envía <code>OPTIONS /api/productos</code> con <code>Access-Control-Request-Headers: authorization</code>.</div>
  <div class="flujo-flecha">▼</div>
  <div class="flujo-paso"><span class="num">4</span> Si el servidor responde con <code>Access-Control-Allow-Origin: http://localhost:5173</code> y <code>Access-Control-Allow-Headers: authorization</code>, el navegador permite la petición real.</div>
  <div class="flujo-paso"><span class="num">5</span> Si no responde correctamente, el navegador bloquea la respuesta y el JS ve un error de red genérico (sin ver el body del servidor).</div>
</div>

<p>El proxy de Vite evita todo esto porque la petición del navegador va a <code>localhost:5173</code> (mismo origen) y Vite la reenvía server-to-server a <code>localhost:8090</code>. Las peticiones server-to-server no tienen SOP.</p>

<h3>HTTP en profundidad: cabeceras que DaWeb usa</h3>

<table>
  <tr><th>Header</th><th>Dirección</th><th>Significado</th></tr>
  <tr><td><code>Content-Type: application/json</code></td><td>Request</td><td>El body que envío está en formato JSON. El servidor lo parseará como JSON.</td></tr>
  <tr><td><code>Accept: application/json</code></td><td>Request</td><td>Prefiero recibir JSON. El servidor puede usar esto para elegir el formato de respuesta.</td></tr>
  <tr><td><code>Authorization: Bearer &lt;token&gt;</code></td><td>Request</td><td>RFC 6750: envío mi JWT. El servidor lo extrae, verifica la firma y lee los claims.</td></tr>
  <tr><td><code>Location: /api/productos/42</code></td><td>Response</td><td>Con 201 Created: URL del recurso recién creado. El frontend extrae el id del último segmento.</td></tr>
</table>

<h3>Códigos de estado HTTP y cómo los maneja <code>client.js</code></h3>

<table>
  <tr><th>Código</th><th>Significado</th><th>Cómo DaWeb lo maneja</th></tr>
  <tr><td>200 OK</td><td>Éxito con body</td><td>Parsea el JSON y lo devuelve</td></tr>
  <tr><td>201 Created</td><td>Recurso creado, id en <code>Location</code></td><td>Si <code>returnLocation=true</code>, extrae el id del header</td></tr>
  <tr><td>204 No Content</td><td>Éxito sin body (DELETE, algunos PATCH)</td><td><code>respuesta.status === 204 ? '' : respuesta.text()</code> — evita SyntaxError al parsear cuerpo vacío</td></tr>
  <tr><td>400 Bad Request</td><td>Datos inválidos</td><td>Lanza Error con el mensaje del body</td></tr>
  <tr><td>401 Unauthorized</td><td>No autenticado (token ausente o caducado)</td><td>Lanza Error con <code>error.status = 401</code></td></tr>
  <tr><td>403 Forbidden</td><td>Autenticado pero sin permiso</td><td>Lanza Error con <code>error.status = 403</code></td></tr>
  <tr><td>404 Not Found</td><td>Recurso no existe</td><td>Lanza Error</td></tr>
  <tr><td>500 Server Error</td><td>Error del backend</td><td>Lanza Error (el body puede ser texto plano, por eso <code>safeJson</code>)</td></tr>
</table>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Por qué <code>safeJson</code> existe</div>
  <p>Los errores de servidores Java a veces devuelven texto plano ("Internal Server Error") en lugar de JSON. Si hicieras <code>JSON.parse('Internal Server Error')</code> obtendrías un <code>SyntaxError</code> que oculta el error original. <code>safeJson</code> hace <code>try { JSON.parse } catch { return texto }</code>: si falla el parse, devuelve el texto plano para que el mensaje de error sea legible.</p>
</div>

<h3>HAL/HATEOAS: por qué el backend devuelve <code>_embedded</code></h3>
<p>El backend ArSo usa Spring HATEOAS que implementa el estándar HAL. HATEOAS significa "Hypermedia As The Engine Of Application State" — cada respuesta incluye links de navegación relacionados.</p>

<div class="code-wrap">
  <span class="file-label">respuesta HAL completa de GET /productos</span>
<pre><code class="language-json">{
  "_embedded": {
    "productoList": [
      {
        "id": 1,
        "titulo": "Bici de montaña",
        "precio": 150,
        "_links": {
          "self": { "href": "/api/productos/1" },
          "categoria": { "href": "/api/productos/1/categoria" }
        }
      }
    ]
  },
  "_links": {
    "self": { "href": "/api/productos?page=0&size=9" },
    "next": { "href": "/api/productos?page=1&size=9" }
  },
  "page": {
    "size": 9,
    "totalElements": 23,
    "totalPages": 3,
    "number": 0
  }
}</code></pre>
</div>

<p>Por qué <code>_embedded['productoList']</code> y no <code>.productoList</code>: en HAL, los arrays de recursos siempre van dentro de <code>_embedded</code>. El nombre de la colección (<code>productoList</code>) lo define Spring según el nombre del recurso. <code>desempaquetar(res, 'productoList')</code> navega a <code>res._embedded.productoList</code>. Si no hay <code>_embedded</code> (lista vacía), devuelve <code>[]</code>.</p>

<h3>El patrón <code>returnLocation</code> y la convención REST 201+Location</h3>
<p>Cuando creas un recurso con POST, la convención REST es responder con <code>HTTP 201 Created</code> y un header <code>Location: /api/productos/42</code>. El id del recurso nuevo viene en ese header, no en el body.</p>

<div class="code-wrap">
<pre><code class="language-js">// client.js — cuando returnLocation es true:
const location = respuesta.headers.get('Location');
// location = "http://localhost:8090/productos/42"
const id = location.split('/').filter(Boolean).pop();
// id = "42"
return { datos, location, id };

// En NuevoProducto.jsx:
const { id: idCreado } = await productosApi.crearProducto({...});
// idCreado = "42"
navegar(\`/productos/\${idCreado}\`);</code></pre>
</div>

<h3>Diagrama de secuencia: listado paginado (GET con query y HAL)</h3>
<p>El recorrido completo de un GET de productos: cómo se construye la URL, cómo viaja por la red y cómo se desempaqueta la respuesta HAL.</p>

<div class="code-wrap">
  <span class="file-label">GET /api/productos?descripcion=bici&amp;page=0&amp;size=9</span>
<pre><code class="language-text">Productos.jsx    productos.js    client.js     localStorage   Vite proxy    Backend ArSo    MySQL
     │                │              │                │             │             │            │
useEffect ejecuta:    │              │                │             │             │            │
     │ listarProductos({descripcion:'bici', page:0, size:9})        │             │            │
     │ ──────────────▶│              │                │             │             │            │
     │                │ request('/productos',         │             │             │            │
     │                │   { query:{...} }) ──────────▶│             │             │            │
     │                │              │ getToken() ───▶│             │             │            │
     │                │              │ ◀── "eyJ..."  │             │             │            │
     │                │              │ build URL con URLSearchParams:             │            │
     │                │              │ /api/productos?descripcion=bici&page=0&size=9          │
     │                │              │ build headers: Authorization: Bearer eyJ...            │
     │                │              │ fetch(url, opts) ──────────────▶            │            │
     │                │              │                │             │ /api → strip │            │
     │                │              │                │             │ rewrite: /productos?... │
     │                │              │                │             │ ──────────▶ │            │
     │                │              │                │             │             │ Spring Sec │
     │                │              │                │             │             │ valida JWT │
     │                │              │                │             │             │ Controller │
     │                │              │                │             │             │ ──────────▶│
     │                │              │                │             │             │ SELECT ... │
     │                │              │                │             │             │ ◀── rows   │
     │                │              │                │             │             │ Spring HATEOAS
     │                │              │                │             │             │ formatea a │
     │                │              │                │             │             │ HAL JSON   │
     │                │              │                │             │ ◀── 200 + HAL JSON      │
     │                │              │ ◀── HAL JSON   │             │             │            │
     │                │              │ texto = await respuesta.text()             │            │
     │                │              │ datos = safeJson(texto) → objeto JS        │            │
     │                │              │ respuesta.ok? sí → return datos            │            │
     │                │ ◀── datos     │ (HAL completo: _embedded, _links, page)   │            │
     │ ◀── res        │              │                │             │             │            │
     │ desempaquetar(res,'productoList') → array de productos       │             │            │
     │ totalPaginasRes(res) → res.page.totalPages                   │             │            │
     │ setProductos(...) y setTotalPaginas(...) → React re-renderiza│             │            │</code></pre>
</div>

<h3>Diagrama de secuencia: creación de producto (POST con 201 + Location)</h3>
<p>El flujo cuando se publica un nuevo producto y la peculiaridad del header <code>Location</code>:</p>

<div class="code-wrap">
  <span class="file-label">POST /api/productos — con returnLocation</span>
<pre><code class="language-text">NuevoProducto.jsx   productos.js   client.js    Vite proxy    Backend     MySQL
     │                  │              │             │            │           │
submit del form:        │              │             │            │           │
     │ e.preventDefault()              │             │            │           │
     │ crearProducto({titulo, precio, idVendedor...})              │           │
     │ ────────────────▶│              │             │            │           │
     │                  │ request('/productos', {    │            │           │
     │                  │   method:'POST',           │            │           │
     │                  │   body, returnLocation:true})           │           │
     │                  │ ────────────▶│             │            │           │
     │                  │              │ fetch(POST, body=JSON,    │           │
     │                  │              │  headers: Authorization,  │           │
     │                  │              │  Content-Type: app/json) ▶│           │
     │                  │              │             │ ──────────▶│           │
     │                  │              │             │            │ INSERT   │
     │                  │              │             │            │ ────────▶│
     │                  │              │             │            │ ◀── id=42│
     │                  │              │             │            │ build URL │
     │                  │              │             │            │ Location: │
     │                  │              │             │            │ /productos/42
     │                  │              │             │ ◀── 201 Created + Location header
     │                  │              │ ◀── 201 + headers       │           │
     │                  │              │ status===201, body vacío o pequeño  │
     │                  │              │ returnLocation=true:                │
     │                  │              │   location = headers.get('Location')│
     │                  │              │   id = location.split('/').pop()    │
     │                  │              │   return { datos, location, id }    │
     │                  │ ◀── {datos, location, id} │            │           │
     │ ◀── {id:'42'}    │              │             │            │           │
     │ const { id: idCreado } = ... → idCreado = '42'             │           │
     │ si recogida.descripcion:                      │            │           │
     │   asignarRecogida(idCreado, recogida)  → otra petición PATCH          │
     │ navegar(\`/productos/\${idCreado}\`) → cambio de URL sin recargar        │</code></pre>
</div>

<h3>Mapa de quién llama a qué</h3>

<div class="code-wrap">
  <span class="file-label">acoplamiento entre páginas y módulos api/</span>
<pre><code class="language-text">                                      ┌────────────┐
                                      │ client.js  │  (request, getToken, decodeJwt)
                                      └─────▲──────┘
                                            │ usado por todos
            ┌──────────────┬─────────────┬──┴──────────┬──────────────┬───────────────┐
            │              │             │             │              │               │
       ┌────┴───┐    ┌─────┴────┐  ┌─────┴─────┐ ┌─────┴─────┐  ┌─────┴──────┐  ┌─────┴────┐
       │auth.js │    │usuarios.js│ │productos.js│ │categorias.│  │compraventas│  │ util.js  │
       └────▲───┘    └─────▲────┘  └─────▲─────┘ │   js      │  │   .js      │  │(desempa- │
            │              │             │       └─────▲─────┘  └─────▲──────┘  │ quetar)  │
            │              │             │             │              │         └──────────┘
   ┌────────┴──┐    ┌──────┴──────┐ ┌────┴───────┐ ┌──┴──────┐  ┌────┴──────────┐
   │AuthContext│    │Perfil       │ │Productos   │ │Productos│  │DetalleProducto│
   │ login,    │    │  obtener,   │ │  listar    │ │NuevoProd│  │  comprar      │
   │ registrar │    │  actualizar │ │DetalleProd │ │EditarP. │  │PerfilVentas   │
   │ aceptarT  │    │AdminUsuarios│ │  obtener   │ │         │  │PerfilCompras  │
   │           │    │  listar     │ │NuevoProd   │ │         │  │AdminTransacc. │
   │           │    │PerfilUsuario│ │  crear     │ │         │  │  transacciones│
   │           │    │  obtener    │ │EditarProd  │ │         │  │               │
   │           │    │             │ │  modificar │ │         │  │               │
   │           │    │             │ │  eliminar  │ │         │  │               │
   └───────────┘    └─────────────┘ └────────────┘ └─────────┘  └───────────────┘</code></pre>
</div>

<div class="callout info">
  <div class="callout-titulo"><i class="bi bi-info-circle"></i> Lectura</div>
  <p>Cada módulo de <code>api/</code> depende solo de <code>client.js</code>. Las páginas/contextos dependen de los módulos correspondientes a su dominio. Cambiar la URL del backend, los headers o el manejo de errores afecta a UN solo fichero: <code>client.js</code>.</p>
</div>



<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué <code>API_BASE = '/api'</code> y no la URL completa del backend?"</strong> — Tres razones: (1) En desarrollo, el proxy de Vite intercepta <code>/api</code> y lo reenvía al backend, evitando CORS. (2) Si el backend cambia de puerto o dominio, solo hay que cambiar el proxy, no el código de la app. (3) En producción, el servidor (Nginx) enrutará <code>/api</code> al backend sin tocar nada del frontend.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Qué pasa si el token expira a mitad de una sesión?"</strong> — La próxima petición a la API devolverá 401 (el backend rechaza el token caducado). <code>client.js</code> lanza un Error con <code>status = 401</code>. El componente lo captura con <code>.catch(err =&gt; setError(err.message))</code> y muestra el mensaje. El usuario sigue viendo la interfaz pero las acciones fallan. <strong>No hay renovación automática del token en DaWeb</strong> — es una limitación conocida del diseño.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Pregunta trampa del entrevistador</div>
  <p><strong>"¿Por qué <code>respuesta.status === 204 ? '' : await respuesta.text()</code>?"</strong> — Un 204 No Content significa body vacío (garantizado por el protocolo HTTP). Si llamaras <code>await respuesta.text()</code> en un 204, obtendrías <code>''</code>. Si luego intentaras <code>JSON.parse('')</code>, lanzaría <code>SyntaxError</code>. El check explícito evita ese error sin necesidad de try/catch.</p>
</div>

<h2>8. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Por qué <code>API_BASE = '/api'</code> y no <code>'http://localhost:8090'</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Por simplificar la cadena.</button>
    <button class="quiz-opcion" data-correcta="1">Para que Vite redirija con su proxy y evitar problemas de CORS.</button>
    <button class="quiz-opcion" data-correcta="0">Porque localhost no funciona en algunos navegadores.</button>
    <button class="quiz-opcion" data-correcta="0">Es indiferente.</button>
  </div>
  <p class="quiz-feedback" data-ok="Bien. Además, en producción cambiará a la URL real sin tocar el frontend." data-ko="Si fuera URL completa de otro dominio/puerto, el navegador bloquearía la petición por CORS."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué pasa si llamo <code>listarProductos({ descripcion: '', precioMaximo: 50 })</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Se manda <code>?descripcion=&amp;precioMaximo=50</code>.</button>
    <button class="quiz-opcion" data-correcta="1">Se manda sólo <code>?precioMaximo=50</code> (los vacíos se omiten).</button>
    <button class="quiz-opcion" data-correcta="0">Da error porque <code>descripcion</code> está vacío.</button>
    <button class="quiz-opcion" data-correcta="0">Se manda <code>?descripcion=null&amp;precioMaximo=50</code>.</button>
  </div>
  <p class="quiz-feedback" data-ok="Correcto. El filtro &quot;v !== '' &amp;&amp; v !== null...&quot; evita parámetros vacíos." data-ko="Mira la función request: descarta valores '', null y undefined al construir el query."></p>
</div>

<h2>9. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Petición desde la consola del navegador</span>
    <span class="nivel">★ Fácil</span>
  </div>
  <p>Con la web abierta en <code>http://localhost:5173</code>, abre DevTools → Console y prueba:</p>
<pre><code class="language-js">// Sin token (puede dar 401)
const r = await fetch('/api/productos');
console.log(r.status);
const datos = await r.json();
console.log(datos);</code></pre>
  <details>
    <summary>Variante con token</summary>
<pre><code class="language-js">const t = localStorage.getItem('arso_token');
const r = await fetch('/api/productos', {
  headers: { Authorization: \`Bearer \${t}\` }
});
console.log(await r.json());</code></pre>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Añadir un parámetro de filtro nuevo</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Imagina que el backend acepta <code>?orden=precio_asc</code> para ordenar. Modifica:</p>
  <ol>
    <li>En <code>Productos.jsx</code>, añade al estado <code>filtros</code> el campo <code>orden: ''</code>.</li>
    <li>Añade un <code>&lt;Form.Select name="orden"&gt;</code> con opciones "Más baratos", "Más nuevos".</li>
    <li>No hay que tocar <code>productos.js</code>: <code>listarProductos</code> ya pasa todos los filtros como query.</li>
  </ol>
  <details>
    <summary>Pista</summary>
    <p>Mira cómo se construyen los otros filtros (descripción, categoría, estado, precioMaximo). El patrón es exactamente el mismo.</p>
  </details>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Crear una función nueva de API</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Añade en <code>src/api/usuarios.js</code> una función para marcar un usuario como administrador (suponiendo que el backend tenga <code>PATCH /usuarios/:id/rol</code>):</p>
<pre><code class="language-js">export const promocionarAAdmin = (id) =&gt;
  request(\`/usuarios/\${id}/rol\`, { method: 'PATCH', body: { rol: 'ADMINISTRADOR' } });</code></pre>
  <p>Y úsala desde <code>AdminUsuarios.jsx</code> con un botón que la llame.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Capturar 401 globalmente</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
  <p>Modifica <code>request</code> en <code>client.js</code> para que si la respuesta es 401, borre el token automáticamente:</p>
<pre><code class="language-js">if (respuesta.status === 401) {
  clearToken();
  // Si quieres, también: window.location.href = '/login';
}
if (!respuesta.ok) { ... }</code></pre>
  <details>
    <summary>Por qué es útil</summary>
    <p>Si tu token caduca a mitad de sesión, la próxima petición devuelve 401 y se cierra sesión sin que tengas que detectarlo en cada página.</p>
  </details>
</div>

<div class="try-it">
  <div class="try-it-cabecera"><i class="bi bi-play-circle"></i> Simulación de construcción de URL con query</div>
  <textarea spellcheck="false">// Replicamos la lógica de request() para construir un query
function construirUrl(path, query) {
  let url = '/api' + path;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) =&gt; {
      if (v !== undefined &amp;&amp; v !== null &amp;&amp; v !== '') params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += '?' + qs;
  }
  return url;
}

console.log(construirUrl('/productos', { descripcion: 'bici', precioMaximo: '' }));
console.log(construirUrl('/productos', { page: 0, size: 9, estado: 'NUEVO' }));
console.log(construirUrl('/productos', {}));
console.log(construirUrl('/usuarios/42'));</textarea>
  <div class="try-it-acciones">
    <button class="btn-ejecutar"><i class="bi bi-play-fill"></i> Ejecutar</button>
    <button class="btn-limpiar secundario">Reiniciar</button>
  </div>
  <div class="try-it-salida"></div>
</div>
`;
