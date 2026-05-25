// Convierte cada secciones/XX-id.html a secciones/XX-id.js
// El .js asigna el contenido HTML a window.__SECC[id]
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'secciones');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const match = file.match(/^\d+-([A-Za-z0-9_-]+)\.html$/);
  if (!match) {
    console.warn('Saltado (nombre no reconocido):', file);
    continue;
  }
  const id = match[1];
  const html = fs.readFileSync(path.join(dir, file), 'utf-8');
  const escaped = html
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  const js = `window.__SECC = window.__SECC || {};\nwindow.__SECC[${JSON.stringify(id)}] = \`${escaped}\`;\n`;
  const outName = file.replace(/\.html$/, '.js');
  fs.writeFileSync(path.join(dir, outName), js, 'utf-8');
  console.log('OK:', outName);
}
