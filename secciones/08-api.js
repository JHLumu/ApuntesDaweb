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

<h2>7. Quiz</h2>

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

<h2>8. Ejercicios</h2>

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
