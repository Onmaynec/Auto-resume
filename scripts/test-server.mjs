import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profileFixture } from '../tests/e2e/support.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const portArgument = process.argv.find((argument) => argument.startsWith('--port='));
const port = Number(portArgument?.slice('--port='.length) || process.env.PORT || 4173);
const qualityStubs = process.argv.includes('--quality-stubs');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

const qualityScripts = {
  '/__quality__/chart.js': `window.Chart = class Chart { constructor() {} destroy() {} };`,
  '/__quality__/html2canvas.js': `window.html2canvas = async () => ({ width: 1000, height: 1400, toDataURL: () => 'data:image/png;base64,iVBORw0KGgo=' });`,
  '/__quality__/jspdf.js': `window.jspdf = { jsPDF: class jsPDF { addImage() {} addPage() {} save(name) { window.__autoResumePdfSaved = name; } } };`,
};

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function handleApi(request, response, url) {
  if (url.pathname === '/api/auth/session') {
    if (request.method === 'DELETE') {
      json(response, 200, { ok: true, revoked: false });
      return true;
    }
    json(response, 200, {
      configured: false,
      authenticated: false,
      user: null,
      scopes: [],
      capabilities: {},
    });
    return true;
  }

  if (url.pathname === '/api/auth/start') {
    response.writeHead(302, { Location: '/?auth=unconfigured' });
    response.end();
    return true;
  }

  if (url.pathname === '/api/github') {
    if (qualityStubs) {
      json(response, 200, profileFixture(url.searchParams.get('username') || 'octocat'));
    } else {
      json(response, 501, { code: 'PROXY_NOT_CONFIGURED' });
    }
    return true;
  }

  return false;
}

function rewriteIndexForQuality(html) {
  if (!qualityStubs) return html;
  return html
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/g, '')
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/g, '')
    .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^"]+" rel="stylesheet">/g, '')
    .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js[^"]+"><\/script>/, '<script src="/__quality__/chart.js"></script>')
    .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/html2canvas[^"]+"><\/script>/, '<script src="/__quality__/html2canvas.js"></script>')
    .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf[^"]+"><\/script>/, '<script src="/__quality__/jspdf.js"></script>');
}

async function serveStatic(request, response, url) {
  let relativePath = decodeURIComponent(url.pathname);
  if (relativePath === '/') relativePath = '/index.html';

  const absolutePath = resolve(root, `.${relativePath}`);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  let filePath = absolutePath;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html');
    let content = await readFile(filePath);
    if (filePath.endsWith('index.html')) content = Buffer.from(rewriteIndexForQuality(content.toString('utf8')));
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes.get(extname(filePath)) || 'application/octet-stream',
      ...(filePath.endsWith('sw.js') ? { 'Service-Worker-Allowed': '/' } : {}),
    });
    if (request.method === 'HEAD') response.end();
    else response.end(content);
  } catch (error) {
    if (error?.code !== 'ENOENT') console.error(error);
    response.writeHead(error?.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error?.code === 'ENOENT' ? 'Not found' : 'Internal server error');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `127.0.0.1:${port}`}`);
  if (url.pathname === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }
  if (qualityStubs && qualityScripts[url.pathname]) {
    response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(qualityScripts[url.pathname]);
    return;
  }
  if (url.pathname.startsWith('/api/') && handleApi(request, response, url)) return;
  await serveStatic(request, response, url);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Auto Resume test server listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
