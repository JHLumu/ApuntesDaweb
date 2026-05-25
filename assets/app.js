/* Tutorial DaWeb — App shell */

const SECCIONES = [
  { id: 'intro',         titulo: 'Introducción y setup',        archivo: 'secciones/00-intro.html' },
  { id: 'html',          titulo: 'HTML y punto de entrada',     archivo: 'secciones/01-html.html' },
  { id: 'javascript',    titulo: 'JavaScript moderno',          archivo: 'secciones/02-javascript.html' },
  { id: 'react',         titulo: 'React: componentes y JSX',    archivo: 'secciones/03-react.html' },
  { id: 'estado',        titulo: 'Estado y efectos (hooks)',    archivo: 'secciones/04-estado.html' },
  { id: 'router',        titulo: 'React Router (navegación)',   archivo: 'secciones/05-router.html' },
  { id: 'css',           titulo: 'CSS y diseño responsive',     archivo: 'secciones/06-css.html' },
  { id: 'contexto',      titulo: 'Context y autenticación',     archivo: 'secciones/07-contexto.html' },
  { id: 'api',           titulo: 'Capa API y fetch',            archivo: 'secciones/08-api.html' },
  { id: 'protegidas',    titulo: 'Rutas protegidas y roles',    archivo: 'secciones/09-protegidas.html' },
  { id: 'funcionalidades', titulo: 'Funcionalidades por página', archivo: 'secciones/10-funcionalidades.html' },
  { id: 'vite',          titulo: 'Vite, proxy y build',         archivo: 'secciones/11-vite.html' },
];

const LS_PROGRESO = 'daweb.tutorial.progreso';
const LS_TEMA = 'daweb.tutorial.tema';
const cacheSecciones = new Map();

// ───── Inicialización ─────
document.addEventListener('DOMContentLoaded', () => {
  pintarNav();
  aplicarTemaGuardado();
  conectarEventos();
  cargarRutaActual();
  actualizarProgreso();
});

function pintarNav() {
  const ol = document.getElementById('navSecciones');
  ol.innerHTML = '';
  SECCIONES.forEach(sec => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#/${sec.id}`;
    a.textContent = sec.titulo;
    a.dataset.id = sec.id;
    li.appendChild(a);
    ol.appendChild(li);
  });
}

function conectarEventos() {
  window.addEventListener('hashchange', cargarRutaActual);

  document.getElementById('btnTema').addEventListener('click', alternarTema);
  document.getElementById('btnReset').addEventListener('click', () => {
    if (confirm('¿Reiniciar el progreso del tutorial?')) {
      localStorage.removeItem(LS_PROGRESO);
      actualizarProgreso();
      pintarEstadoCompletada();
    }
  });

  document.getElementById('btnMarcar').addEventListener('click', alternarCompletada);

  // Sidebar móvil
  const sidebar = document.getElementById('sidebar');
  const btnMenu = document.getElementById('btnMenu');
  btnMenu.addEventListener('click', () => {
    sidebar.classList.toggle('abierta');
    overlay.classList.toggle('activa');
  });
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('abierta');
    overlay.classList.remove('activa');
  });

  // Búsqueda
  const buscador = document.getElementById('buscador');
  buscador.addEventListener('input', e => buscar(e.target.value));
  buscador.addEventListener('blur', () => setTimeout(ocultarResultados, 150));

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      buscador.focus();
      buscador.select();
    }
  });
}

// ───── Tema ─────
function aplicarTemaGuardado() {
  const tema = localStorage.getItem(LS_TEMA) || 'claro';
  document.documentElement.dataset.tema = tema;
  actualizarIconoTema();
}
function alternarTema() {
  const actual = document.documentElement.dataset.tema || 'claro';
  const nuevo = actual === 'claro' ? 'oscuro' : 'claro';
  document.documentElement.dataset.tema = nuevo;
  localStorage.setItem(LS_TEMA, nuevo);
  actualizarIconoTema();
}
function actualizarIconoTema() {
  const tema = document.documentElement.dataset.tema || 'claro';
  const i = document.querySelector('#btnTema i');
  i.className = tema === 'claro' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
}

// ───── Routing ─────
function rutaActual() {
  const m = location.hash.match(/^#\/(.+)$/);
  return m ? m[1] : SECCIONES[0].id;
}

async function cargarRutaActual() {
  const id = rutaActual();
  const sec = SECCIONES.find(s => s.id === id) || SECCIONES[0];
  await cargarSeccion(sec);
  document.getElementById('sidebar').classList.remove('abierta');
  document.querySelector('.overlay')?.classList.remove('activa');
  window.scrollTo({ top: 0 });
  pintarActiva(sec.id);
  pintarEstadoCompletada();
  actualizarBotonMarcar();
}

function pintarActiva(id) {
  document.querySelectorAll('#navSecciones a').forEach(a => {
    a.classList.toggle('activa', a.dataset.id === id);
  });
}

async function cargarSeccion(sec) {
  const cont = document.getElementById('contenido');
  cont.innerHTML = '<div class="loader"><i class="bi bi-hourglass-split"></i> Cargando…</div>';
  try {
    let html = cacheSecciones.get(sec.id);
    if (!html) {
      // Primero intenta leer del bundle precargado (funciona con file://)
      html = window.__SECC?.[sec.id];
      // Si no está (servidor HTTP con módulos separados), hace fetch del .html
      if (!html) {
        const res = await fetch(sec.archivo);
        if (!res.ok) throw new Error(`No se pudo cargar ${sec.archivo}`);
        html = await res.text();
      }
      if (!html) throw new Error(`Sección vacía: ${sec.id}`);
      cacheSecciones.set(sec.id, html);
    }
    cont.innerHTML = html;
    procesarContenido(cont, sec);
  } catch (err) {
    cont.innerHTML = `<div class="callout danger"><div class="callout-titulo"><i class="bi bi-x-circle"></i> Error</div><p>${err.message}</p></div>`;
  }
}

function procesarContenido(root, sec) {
  resaltarCodigo(root);
  conectarCopiar(root);
  conectarQuizzes(root);
  conectarTabs(root);
  conectarTryIt(root);
  pintarNavAntSig(root, sec);
}

function pintarNavAntSig(root, sec) {
  const idx = SECCIONES.findIndex(s => s.id === sec.id);
  const ant = SECCIONES[idx - 1];
  const sig = SECCIONES[idx + 1];
  const nav = document.createElement('div');
  nav.className = 'nav-anterior-siguiente';
  nav.innerHTML = `
    <a href="#/${ant?.id || ''}" class="anterior ${ant ? '' : 'vacio'}">
      <span class="dir"><i class="bi bi-arrow-left"></i> Anterior</span>
      <span class="nombre">${ant?.titulo || ''}</span>
    </a>
    <a href="#/${sig?.id || ''}" class="siguiente ${sig ? '' : 'vacio'}">
      <span class="dir">Siguiente <i class="bi bi-arrow-right"></i></span>
      <span class="nombre">${sig?.titulo || ''}</span>
    </a>
  `;
  root.appendChild(nav);
}

// ───── Prism syntax highlight ─────
function resaltarCodigo(root) {
  if (window.Prism) {
    root.querySelectorAll('pre code').forEach(c => window.Prism.highlightElement(c));
  }
}

// ───── Copiar código ─────
function conectarCopiar(root) {
  root.querySelectorAll('.code-wrap').forEach(w => {
    if (w.querySelector('.btn-copiar')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-copiar';
    btn.innerHTML = '<i class="bi bi-clipboard"></i> Copiar';
    btn.addEventListener('click', async () => {
      const code = w.querySelector('code')?.innerText || '';
      try {
        await navigator.clipboard.writeText(code);
        btn.innerHTML = '<i class="bi bi-check2"></i> Copiado';
        btn.classList.add('ok');
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-clipboard"></i> Copiar';
          btn.classList.remove('ok');
        }, 1500);
      } catch {}
    });
    w.appendChild(btn);
  });
}

// ───── Quizzes ─────
function conectarQuizzes(root) {
  root.querySelectorAll('.quiz').forEach(q => {
    const opciones = q.querySelectorAll('.quiz-opcion');
    const feedback = q.querySelector('.quiz-feedback');
    opciones.forEach(op => {
      op.addEventListener('click', () => {
        if (q.dataset.respondido === '1') return;
        q.dataset.respondido = '1';
        const esCorrecta = op.dataset.correcta === '1';
        op.classList.add(esCorrecta ? 'correcta' : 'incorrecta');
        if (!esCorrecta) {
          q.querySelector('.quiz-opcion[data-correcta="1"]')?.classList.add('correcta');
        }
        opciones.forEach(o => o.classList.add('bloqueada'));
        if (feedback) {
          feedback.hidden = false;
          feedback.classList.toggle('correcta', esCorrecta);
          feedback.classList.toggle('incorrecta', !esCorrecta);
          if (esCorrecta) feedback.innerHTML = '<strong>¡Correcto!</strong> ' + (feedback.dataset.ok || '');
          else feedback.innerHTML = '<strong>No exactamente.</strong> ' + (feedback.dataset.ko || '');
        }
      });
    });
  });
}

// ───── Tabs ─────
function conectarTabs(root) {
  root.querySelectorAll('.tabs').forEach(tabs => {
    const botones = tabs.querySelectorAll('.tabs-cabecera button');
    const paneles = tabs.querySelectorAll('.tabs-panel');
    botones.forEach((b, i) => {
      b.addEventListener('click', () => {
        botones.forEach(x => x.classList.remove('activa'));
        paneles.forEach(x => x.classList.remove('activa'));
        b.classList.add('activa');
        paneles[i].classList.add('activa');
      });
    });
    if (botones[0] && !tabs.querySelector('.activa')) {
      botones[0].classList.add('activa');
      paneles[0]?.classList.add('activa');
    }
  });
}

// ───── Try-it (JS playground sandbox) ─────
function conectarTryIt(root) {
  root.querySelectorAll('.try-it').forEach(box => {
    const ta = box.querySelector('textarea');
    const salida = box.querySelector('.try-it-salida');
    const btnEjecutar = box.querySelector('.btn-ejecutar');
    const btnLimpiar = box.querySelector('.btn-limpiar');
    const inicial = ta.value;

    btnEjecutar?.addEventListener('click', () => ejecutarJs(ta.value, salida));
    btnLimpiar?.addEventListener('click', () => { ta.value = inicial; salida.textContent = ''; });

    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        ejecutarJs(ta.value, salida);
      }
    });
  });
}

function ejecutarJs(codigo, salidaEl) {
  salidaEl.innerHTML = '';
  const log = (...args) => {
    const linea = document.createElement('div');
    linea.textContent = args.map(formatear).join(' ');
    salidaEl.appendChild(linea);
  };
  const err = msg => {
    const linea = document.createElement('div');
    linea.className = 'err';
    linea.textContent = '✗ ' + msg;
    salidaEl.appendChild(linea);
  };
  try {
    // Sandbox simple: nuevo scope, console redirigido
    const fn = new Function('console', `"use strict";\n${codigo}`);
    fn({ log, error: err, warn: log, info: log });
    if (!salidaEl.children.length) {
      const ok = document.createElement('div');
      ok.className = 'ok';
      ok.textContent = '✓ Ejecutado sin salida.';
      salidaEl.appendChild(ok);
    }
  } catch (e) {
    err(e.message);
  }
}

function formatear(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }
  return String(v);
}

// ───── Progreso ─────
function leerProgreso() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESO)) || {}; }
  catch { return {}; }
}
function guardarProgreso(p) {
  localStorage.setItem(LS_PROGRESO, JSON.stringify(p));
}
function alternarCompletada() {
  const id = rutaActual();
  const p = leerProgreso();
  if (p[id]) delete p[id]; else p[id] = true;
  guardarProgreso(p);
  actualizarProgreso();
  pintarEstadoCompletada();
  actualizarBotonMarcar();
}
function actualizarProgreso() {
  const p = leerProgreso();
  const total = SECCIONES.length;
  const hechas = Object.keys(p).length;
  document.getElementById('progresoTexto').textContent = `${hechas} / ${total} completadas`;
  document.getElementById('progressFill').style.width = `${(hechas / total) * 100}%`;
}
function pintarEstadoCompletada() {
  const p = leerProgreso();
  document.querySelectorAll('#navSecciones a').forEach(a => {
    a.classList.toggle('completada', !!p[a.dataset.id]);
  });
}
function actualizarBotonMarcar() {
  const p = leerProgreso();
  const id = rutaActual();
  const btn = document.getElementById('btnMarcar');
  const esta = !!p[id];
  btn.classList.toggle('completada', esta);
  btn.querySelector('span').textContent = esta ? 'Completada ✓' : 'Marcar completada';
}

// ───── Búsqueda ─────
let timeoutBusqueda;
async function buscar(texto) {
  clearTimeout(timeoutBusqueda);
  const ul = document.getElementById('resultadosBusqueda');
  if (!texto || texto.length < 2) { ul.hidden = true; return; }
  timeoutBusqueda = setTimeout(async () => {
    // Poblar la caché desde window.__SECC (file://) o fetch (HTTP)
    for (const sec of SECCIONES) {
      if (!cacheSecciones.has(sec.id)) {
        const preloaded = window.__SECC?.[sec.id];
        if (preloaded) {
          cacheSecciones.set(sec.id, preloaded);
        } else {
          try {
            const res = await fetch(sec.archivo);
            if (res.ok) cacheSecciones.set(sec.id, await res.text());
          } catch {}
        }
      }
    }
    const t = texto.toLowerCase();
    const resultados = [];
    SECCIONES.forEach(sec => {
      const html = cacheSecciones.get(sec.id) || '';
      const cuerpo = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const idx = cuerpo.toLowerCase().indexOf(t);
      if (idx >= 0) {
        const desde = Math.max(0, idx - 40);
        const hasta = Math.min(cuerpo.length, idx + 80);
        const snippet = cuerpo.slice(desde, hasta);
        resultados.push({ sec, snippet, idx });
      }
    });
    if (!resultados.length) {
      ul.innerHTML = '<li>Sin resultados</li>';
      ul.hidden = false;
      return;
    }
    ul.innerHTML = resultados.map(r => {
      const re = new RegExp(`(${escapeRe(texto)})`, 'gi');
      const snippetMarcado = r.snippet.replace(re, '<mark>$1</mark>');
      return `<li data-id="${r.sec.id}"><div class="res-titulo">${r.sec.titulo}</div><div class="res-snippet">…${snippetMarcado}…</div></li>`;
    }).join('');
    ul.hidden = false;
    ul.querySelectorAll('li[data-id]').forEach(li => {
      li.addEventListener('mousedown', () => {
        location.hash = `#/${li.dataset.id}`;
        ocultarResultados();
        document.getElementById('buscador').value = '';
      });
    });
  }, 200);
}
function ocultarResultados() {
  document.getElementById('resultadosBusqueda').hidden = true;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
