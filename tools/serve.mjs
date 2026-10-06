import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const explicitPort = process.env.PORT !== undefined;
let port = Number(process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
const lastPort = explicitPort ? port : port + 20;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Serve only website files now that the project itself lives at the root.
    const publicPath = pathname === '/' ? '/index.html' : pathname;
    const isPublic = /^\/(?:index\.html|styles\.css|app\.js|search\.js|cards\.json)$/.test(publicPath)
      || /^\/locales\/(?:fa|en|de|fr|es|sv|fi)\.json$/.test(publicPath)
      || /^\/assets\/cards\/[a-z0-9-]+\.png$/.test(publicPath);
    if (!isPublic && publicPath !== '/assets/magical-athlete-logo.gif') throw new Error('Not found');
    const file = path.resolve(root, '.' + publicPath);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port < lastPort) {
    console.log(`Port ${port} is in use; trying ${port + 1}.`);
    port += 1;
    server.listen(port, '127.0.0.1');
    return;
  }
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Choose another port with PORT, or stop the existing server.`);
  } else {
    console.error(`Cannot start the local server: ${error.message}`);
  }
  process.exitCode = 1;
});
server.on('listening', () => console.log(`Local: http://localhost:${port}`));
server.listen(port, '127.0.0.1');
