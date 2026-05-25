window.__SECC = window.__SECC || {};
window.__SECC["api"] = `<h1>Capa API y comunicación con el backend</h1>
<p class="subtitulo">La trayectoria completa de una petición: del componente al backend y vuelta.</p>

<p class="lead">El frontend NO toca la base de datos. Solo habla con el backend por HTTP. Toda esa comunicación vive en <code>src/api/</code>, organizada en capas que tienen una sola razón para cambiar. Vamos a recorrerla siguiendo a una petición del principio al fin.</p>

<h2>1. Modelo mental: la trayectoria de una petición</h2>

<figure class="diagrama">
  <figcaption>De click a render</figcaption>
  <pre class="mermaid">
sequenceDiagram
  autonumber
  participant P as Página (Productos.jsx)
  participant D as api/productos.js (dominio)
  participant C as api/client.js (transporte)
  participant LS as localStorage
  participant V as Vite proxy
  participant B as Backend ArSo
  participant DB as MySQL
  P->>D: listarProductos({ filtros, page })
  D->>C: request('/productos', { query })
  C->>LS: getToken()
  LS-->>C: token JWT
  C->>C: URLSearchParams + Authorization header
  C->>V: fetch('/api/productos?descripcion=bici&page=0')
  V->>B: GET /productos?... (sin CORS, mismo origen)
  B->>DB: SELECT
  DB-->>B: filas
  B-->>V: 200 + JSON HAL
  V-->>C: 200 + JSON HAL
  C->>C: parseo + check status
  C-->>D: datos
  D-->>P: HAL completo
  P->>P: desempaquetar(res,'productoList') → array
  P->>P: setProductos(...) → re-render
  </pre>
</figure>

<p>Cada caja tiene UNA responsabilidad. Si la URL cambia, sólo se toca el proxy. Si el formato HAL cambia, sólo <code>util.desempaquetar</code>. Si añadimos un módulo nuevo, no hay que modificar <code>client.js</code>.</p>

<h2>2. ¿Qué es una API REST?</h2>

<p>REST organiza el backend en torno a <strong>recursos</strong> con URLs jerárquicas y verbos HTTP de semántica fija. Si entiendes la tabla CRUD↔HTTP, predices al 90% cómo se llamará un endpoint.</p>

<table>
  <tr><th>Letra CRUD</th><th>Verbo HTTP</th><th>Función en api/productos.js</th><th>Status éxito</th></tr>
  <tr><td><strong>C</strong>reate</td><td>POST</td><td><code>crearProducto</code></td><td>201 Created + Location</td></tr>
  <tr><td><strong>R</strong>ead</td><td>GET</td><td><code>listarProductos</code>, <code>obtenerProducto</code></td><td>200 OK</td></tr>
  <tr><td><strong>U</strong>pdate</td><td>PATCH / PUT</td><td><code>modificarProducto</code>, <code>asignarRecogida</code></td><td>200 OK / 204 No Content</td></tr>
  <tr><td><strong>D</strong>elete</td><td>DELETE</td><td><code>eliminarProducto</code></td><td>204 No Content</td></tr>
</table>

<div class="tip-regla">
  <strong>CRUD ↔ HTTP es 1 a 1 en proyectos REST puros.</strong> Si ves <code>POST /productos</code>, es crear; <code>PATCH /productos/42</code>, modificar parcial. Te ahorra mil minutos de documentación.
</div>

<h2>3. <code>fetch</code>: la herramienta nativa del navegador</h2>

<div class="code-wrap">
<pre><code class="language-js">const respuesta = await fetch('/api/productos');
const datos = await respuesta.json();</code></pre>
</div>

<p>Con método y body:</p>

<div class="code-wrap">
<pre><code class="language-js">await fetch('/api/usuarios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Ana', correo: 'a@b.com' }),
});</code></pre>
</div>

<p>El problema de usar <code>fetch</code> directo en cada componente: tendrías que repetir headers, parsing, errores y construcción de URL. Por eso lo envolvemos.</p>

<h2>4. La capa de transporte: <code>src/api/client.js</code></h2>

<p>El proyecto envuelve <code>fetch</code> en una función <code>request</code> que añade automáticamente:</p>
<ul>
  <li>Prefijo <code>/api</code>.</li>
  <li>Header <code>Authorization: Bearer &lt;token&gt;</code> si hay token.</li>
  <li>Serialización del body (JSON.stringify).</li>
  <li>Construcción del query string ignorando vacíos.</li>
  <li>Parseo seguro de la respuesta.</li>
  <li>Errores con código HTTP adjunto.</li>
</ul>

<div class="code-wrap">
  <span class="file-label">src/api/client.js</span>
<pre><code class="language-js">const API_BASE = '/api';

export const TOKEN_KEY = 'arso_token';
export const getToken   = () =&gt; localStorage.getItem(TOKEN_KEY);
export const setToken   = (token) =&gt; localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () =&gt; localStorage.removeItem(TOKEN_KEY);

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

<h3>Línea a línea, con comentarios humanos</h3>

<div class="tabla-wrap">
<table class="anotada">
  <tr><td class="code">API_BASE = '/api'</td><td class="nota">URL relativa. Vite la intercepta y reenvía al backend. En prod cambias el proxy, no el código.</td></tr>
  <tr><td class="code">URLSearchParams + filter</td><td class="nota">Construye <code>?clave=valor</code> con escape correcto. El filtro evita mandar <code>?descripcion=</code> cuando está vacío.</td></tr>
  <tr><td class="code">...(token ? { Authorization } : {})</td><td class="nota">Inyecta el header SÓLO si hay token. Spread condicional.</td></tr>
  <tr><td class="code">status === 204 ? '' : text()</td><td class="nota">204 garantiza body vacío. Llamar a <code>.text()</code> da string vacío; intentar <code>JSON.parse('')</code> da SyntaxError.</td></tr>
  <tr><td class="code">safeJson</td><td class="nota">Si la respuesta no es JSON (p.ej. error en texto plano de Java), devuelve el texto sin romper.</td></tr>
  <tr><td class="code">error.status = respuesta.status</td><td class="nota">El llamador puede mirar <code>err.status</code> para reaccionar específicamente al 401 sin parsear el mensaje.</td></tr>
  <tr><td class="code">returnLocation</td><td class="nota">Para POSTs de creación: el backend devuelve el id en el header <code>Location</code>. Lo extraemos del último segmento.</td></tr>
</table>
</div>

<div class="tip-regla">
  <strong>3 tips de bolsillo:</strong> (1) 204 ⇒ nunca <code>.json()</code>. (2) <code>URLSearchParams</code> ⇒ percent-encoding gratis; nunca concatenes manualmente. (3) Crear en REST devuelve la URL del recurso en el header <code>Location</code>, no en el cuerpo.
</div>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-bounding-box"></i> SOLID · SRP (Single Responsibility)</span>
  <p>Hoy <code>client.js</code> hace tres cosas: <strong>fetch</strong>, <strong>auth header</strong>, <strong>parseo de errores</strong>. Las tres giran en torno al transporte HTTP, así que es aceptable. Pero una versión más estricta extraería un interceptor de auth:</p>
<div class="code-wrap">
<pre><code class="language-js">// withAuth: añade Authorization si hay token
const withAuth = (init = {}) =&gt; {
  const token = getToken();
  return token
    ? { ...init, headers: { ...init.headers, Authorization: \`Bearer \${token}\` } }
    : init;
};

// request enfocado en su trabajo
const request = (url, init) =&gt; fetch(url, withAuth(init));</code></pre>
</div>
  <p>Con esto puedes testear <code>withAuth</code> y <code>parseRespuesta</code> por separado. En DaWeb no merece el coste, pero es la dirección a la que iría un equipo grande.</p>
</div>

<div class="solid-aplicado">
  <span class="principio"><i class="bi bi-arrow-up-circle"></i> SOLID · OCP (Open/Closed)</span>
  <p>Añadir un módulo nuevo (<code>api/mensajes.js</code>) consume <code>request()</code> sin modificarlo. <code>client.js</code> queda cerrado a cambios; la capa de dominio queda abierta a extensión.</p>
</div>

<h2>5. Los módulos de dominio (uno por recurso)</h2>

<p>Cada módulo es una colección de funciones que llaman a <code>request</code>. Sólo conocen su recurso.</p>

<h3>auth.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/auth.js</span>
<pre><code class="language-js">import { request, setToken, clearToken } from './client';

export const login = async (correo, clave) =&gt; {
  const datos = await request('/auth/login', { method: 'POST', body: { correo, clave } });
  if (datos?.token) setToken(datos.token);
  return datos;
};
export const logout = () =&gt; clearToken();</code></pre>
</div>

<h3>usuarios.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/usuarios.js</span>
<pre><code class="language-js">export const crearUsuario      = (datos)     =&gt; request('/usuarios', { method: 'POST', body: datos });
export const listarUsuarios    = ()          =&gt; request('/usuarios');
export const obtenerUsuario    = (id)        =&gt; request(\`/usuarios/\${id}\`);
export const actualizarUsuario = (id, cambios) =&gt;
  request(\`/usuarios/\${id}\`, { method: 'PATCH', body: cambios });</code></pre>
</div>

<h3>productos.js</h3>
<div class="code-wrap">
  <span class="file-label">src/api/productos.js</span>
<pre><code class="language-js">export const ESTADOS_PRODUCTO = [
  { valor: 'NUEVO',       etiqueta: 'Nuevo' },
  { valor: 'COMO_NUEVO',  etiqueta: 'Como nuevo' },
  // ...
];

const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_PRODUCTO.map((e) =&gt; [e.valor, e.etiqueta])
);
export const etiquetaEstado = (valor) =&gt; ETIQUETAS_ESTADO[valor] ?? valor;

export const listarProductos    = (filtros = {}) =&gt; request('/productos', { query: filtros });
export const obtenerProducto    = (id)           =&gt; request(\`/productos/\${id}\`);
export const crearProducto      = (datos)        =&gt; request('/productos', { method: 'POST', body: datos, returnLocation: true });
export const modificarProducto  = (id, cambios)  =&gt; request(\`/productos/\${id}\`, { method: 'PATCH', body: cambios });
export const eliminarProducto   = (id)           =&gt; request(\`/productos/\${id}\`, { method: 'DELETE' });
export const sumarVisualizacion = (id)           =&gt; request(\`/productos/\${id}/visualizaciones\`, { method: 'PATCH' });</code></pre>
</div>

<h3>util.js: el des-empaquetador HAL</h3>

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

<h2>6. HAL / HATEOAS: por qué el backend responde con <code>_embedded</code></h2>

<p>ArSo usa Spring HATEOAS, que implementa el estándar HAL ("Hypermedia As The Engine Of Application State"): cada respuesta incluye links de navegación además de los datos.</p>

<div class="code-wrap">
  <span class="file-label">respuesta paginada típica</span>
<pre><code class="language-json">{
  "_embedded": {
    "productoList": [
      { "id": 1, "titulo": "Bici", ... },
      { "id": 2, "titulo": "Móvil", ... }
    ]
  },
  "_links": {
    "self": { "href": "/api/productos?page=0&size=9" },
    "next": { "href": "/api/productos?page=1&size=9" }
  },
  "page": { "size": 9, "totalElements": 23, "totalPages": 3, "number": 0 }
}</code></pre>
</div>

<p><code>desempaquetar(res, 'productoList')</code> devuelve el array; <code>totalPaginas(res)</code> devuelve 3.</p>

<h2>7. Códigos de estado y cómo los maneja <code>client.js</code></h2>

<figure class="diagrama">
  <figcaption>Dispatch de status codes</figcaption>
  <pre class="mermaid">
flowchart TB
  R["respuesta.status"] --> D{rango}
  D -- "200" --> OK["parsea JSON y devuelve"]
  D -- "201" --> CR["si returnLocation: extrae id<br/>del header Location"]
  D -- "204" --> NC["no parsea body<br/>devuelve null"]
  D -- "400" --> E1["throw Error<br/>error.status=400"]
  D -- "401" --> E2["throw Error<br/>error.status=401<br/>(token caducado/ausente)"]
  D -- "403" --> E3["throw Error<br/>error.status=403<br/>(sin permiso)"]
  D -- "404" --> E4["throw Error<br/>error.status=404"]
  D -- "5xx" --> E5["throw Error<br/>(body puede ser texto plano)"]
  </pre>
</figure>

<h3>Tabla de referencia</h3>

<table>
  <tr><th>Código</th><th>Significado</th><th>Manejo</th></tr>
  <tr><td>200 OK</td><td>Éxito con body</td><td>Parsea JSON</td></tr>
  <tr><td>201 Created</td><td>Recurso creado, id en Location</td><td>Si <code>returnLocation</code>, extrae id</td></tr>
  <tr><td>204 No Content</td><td>Éxito sin body</td><td>No parsea (evita SyntaxError)</td></tr>
  <tr><td>400 Bad Request</td><td>Datos inválidos</td><td>throw con mensaje del body</td></tr>
  <tr><td>401 Unauthorized</td><td>Sin auth / token caducado</td><td>throw con status 401</td></tr>
  <tr><td>403 Forbidden</td><td>Sin permiso</td><td>throw con status 403</td></tr>
  <tr><td>404 Not Found</td><td>Recurso inexistente</td><td>throw</td></tr>
  <tr><td>5xx</td><td>Error del backend</td><td>throw (safeJson rescata el texto)</td></tr>
</table>

<h2>8. El patrón <code>returnLocation</code> (creación REST canónica)</h2>

<p>Crear con POST devuelve <code>HTTP 201 Created</code> y un header <code>Location: /api/productos/42</code>. El id viene en ese header, no en el body.</p>

<div class="code-wrap">
<pre><code class="language-js">// client.js cuando returnLocation = true
const location = respuesta.headers.get('Location');     // "/api/productos/42"
const id = location.split('/').filter(Boolean).pop();   // "42"
return { datos, location, id };

// En NuevoProducto.jsx
const { id: idCreado } = await productosApi.crearProducto({ ... });
navegar(\`/productos/\${idCreado}\`);</code></pre>
</div>

<h2>9. CORS: por qué el proxy de Vite resuelve la papeleta</h2>

<p>La <strong>Same-Origin Policy (SOP)</strong> bloquea que un script en <code>localhost:5173</code> lea respuestas de <code>localhost:8090</code> (distinto puerto = distinto origen).</p>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> Lo que CORS bloquea (y lo que NO)</div>
  <p>CORS NO bloquea la petición. La petición llega al servidor y se procesa. Lo que CORS bloquea es que el JavaScript del navegador <em>lea</em> la respuesta. Para peticiones con headers custom (como <code>Authorization</code>) hay primero un <strong>preflight</strong> (<code>OPTIONS</code>).</p>
</div>

<p>El proxy de Vite elimina el problema: tu fetch va a <code>localhost:5173</code> (mismo origen), y Vite reenvía server-to-server al <code>:8090</code>. Las peticiones server-to-server no tienen SOP.</p>

<h2>10. Headers HTTP que usa DaWeb</h2>

<table>
  <tr><th>Header</th><th>Dir</th><th>Significado</th></tr>
  <tr><td><code>Content-Type: application/json</code></td><td>req</td><td>El body que envío es JSON.</td></tr>
  <tr><td><code>Accept: application/json</code></td><td>req</td><td>Prefiero respuesta JSON.</td></tr>
  <tr><td><code>Authorization: Bearer &lt;token&gt;</code></td><td>req</td><td>RFC 6750. El servidor verifica firma y lee claims.</td></tr>
  <tr><td><code>Location: /api/productos/42</code></td><td>res</td><td>Con 201: URL del recurso recién creado.</td></tr>
</table>

<h2>11. Mapa de quién llama a qué</h2>

<figure class="diagrama">
  <figcaption>Dependencias entre páginas y módulos api/</figcaption>
  <pre class="mermaid">
flowchart TB
  Client["client.js<br/>request, getToken, decodeJwt"]
  AuthJs["auth.js"] --> Client
  UsrJs["usuarios.js"] --> Client
  ProdJs["productos.js"] --> Client
  CatJs["categorias.js"] --> Client
  CvJs["compraventas.js"] --> Client
  Util["util.js<br/>desempaquetar, totalPaginas"]
  AuthCtx["AuthContext"] --> AuthJs
  AuthCtx --> UsrJs
  Perfil --> UsrJs
  Productos --> ProdJs
  Productos --> CatJs
  Productos --> Util
  Detalle["DetalleProducto"] --> ProdJs
  Detalle --> CvJs
  Admin["AdminTransacciones"] --> CvJs
  Admin --> Util
  </pre>
</figure>

<p>Cada módulo de <code>api/</code> depende solo de <code>client.js</code>. Cambiar la URL del backend, los headers o el manejo de errores afecta a UN solo fichero.</p>

<h2>12. Preguntas trampa frecuentes</h2>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué <code>API_BASE = '/api'</code> y no la URL completa del backend?"</div>
  <p>(1) Dev: el proxy de Vite intercepta <code>/api</code> y evita CORS. (2) Si el backend cambia de puerto/dominio, sólo se cambia el proxy. (3) En prod, nginx enruta <code>/api</code> al backend sin tocar nada del frontend.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Qué pasa si el token expira en mitad de sesión?"</div>
  <p>La siguiente petición da 401. <code>client.js</code> lanza Error con <code>status=401</code>. El componente lo captura con <code>.catch</code> y muestra el mensaje. La UI sigue, las acciones fallan. <strong>No hay renovación automática en DaWeb</strong> — limitación conocida.</p>
</div>

<div class="callout warning">
  <div class="callout-titulo"><i class="bi bi-exclamation-triangle"></i> "¿Por qué <code>status === 204 ? '' : text()</code>?"</div>
  <p>204 garantiza body vacío. Si haces <code>JSON.parse('')</code> da SyntaxError. El check explícito lo evita sin try/catch.</p>
</div>

<h2>13. Quiz</h2>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 1</div>
  <p class="quiz-pregunta">¿Por qué <code>API_BASE = '/api'</code> y no <code>'http://localhost:8090'</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Por simplificar.</button>
    <button class="quiz-opcion" data-correcta="1">Para que Vite redirija con su proxy y evitar CORS.</button>
    <button class="quiz-opcion" data-correcta="0">Porque localhost no funciona en algunos navegadores.</button>
    <button class="quiz-opcion" data-correcta="0">Es indiferente.</button>
  </div>
  <p class="quiz-feedback" data-ok="Y además, en prod cambias el proxy/nginx sin tocar el frontend." data-ko="URL completa de otro origen → CORS bloqueando."></p>
</div>

<div class="quiz" data-respondido="0">
  <div class="quiz-titulo"><i class="bi bi-question-circle"></i> Pregunta 2</div>
  <p class="quiz-pregunta">¿Qué pasa si llamo <code>listarProductos({ descripcion: '', precioMaximo: 50 })</code>?</p>
  <div class="quiz-opciones">
    <button class="quiz-opcion" data-correcta="0">Se manda <code>?descripcion=&amp;precioMaximo=50</code>.</button>
    <button class="quiz-opcion" data-correcta="1">Sólo <code>?precioMaximo=50</code> (los vacíos se omiten).</button>
    <button class="quiz-opcion" data-correcta="0">Error porque <code>descripcion</code> está vacío.</button>
    <button class="quiz-opcion" data-correcta="0">Se manda <code>?descripcion=null...</code>.</button>
  </div>
  <p class="quiz-feedback" data-ok="El filtro v !== '' && v !== null... lo evita." data-ko="Mira la construcción del query en request()."></p>
</div>

<h2>14. Ejercicios</h2>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 1</span>
    <span>Petición desde la consola</span>
    <span class="nivel">★ Fácil</span>
  </div>
<pre><code class="language-js">const r = await fetch('/api/productos');
console.log(r.status, await r.json());

const t = localStorage.getItem('arso_token');
const r2 = await fetch('/api/productos', {
  headers: { Authorization: \`Bearer \${t}\` }
});
console.log(await r2.json());</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 2</span>
    <span>Añadir un filtro nuevo</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
  <p>Añade <code>orden: ''</code> a los filtros de <code>Productos.jsx</code> y un <code>&lt;Form.Select name="orden"&gt;</code>. <code>listarProductos</code> ya lo pasa solo.</p>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 3</span>
    <span>Función nueva en api/usuarios</span>
    <span class="nivel">★★ Intermedio</span>
  </div>
<pre><code class="language-js">export const promocionarAAdmin = (id) =&gt;
  request(\`/usuarios/\${id}/rol\`, { method: 'PATCH', body: { rol: 'ADMINISTRADOR' } });</code></pre>
</div>

<div class="ejercicio">
  <div class="ejercicio-cabecera">
    <span class="badge-ejercicio">Ejercicio 4</span>
    <span>Capturar 401 globalmente</span>
    <span class="nivel">★★★ Avanzado</span>
  </div>
<pre><code class="language-js">if (respuesta.status === 401) {
  clearToken();
  // window.location.href = '/login'; (opcional)
}
if (!respuesta.ok) { ... }</code></pre>
  <p>Así un token caducado limpia sesión sin tener que detectarlo en cada página.</p>
</div>

<div class="try-it">
  <div class="try-it-cabecera"><i class="bi bi-play-circle"></i> Construcción de URL con query</div>
  <textarea spellcheck="false">function construirUrl(path, query) {
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
