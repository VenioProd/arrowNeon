/**
 * Serveur Node autonome pour le prototype NEON GRID / Arrow.
 *
 *   - sert les fichiers statiques du dépôt (HTML/CSS/JS)
 *   - route POST /api/contact vers le handler backend (api/contact.js)
 *
 * Usage :
 *   node server.js              (production : nécessite une config SMTP)
 *   npm run dev                 (CONTACT_DRY_RUN=1 : envoi simulé, sans SMTP)
 *
 * Aucune dépendance hors nodemailer (chargé par api/contact.js à l'envoi).
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// --- Mini-chargeur .env (évite la dépendance dotenv) ---------------------
function loadEnv(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

loadEnv(path.join(__dirname, '.env'));

const contactHandler = require('./api/contact');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serveStatic(req, res) {
  // Empêche le path traversal : on résout sous ROOT et on vérifie.
  const urlPath = decodeURIComponent((req.url.split('?')[0] || '/'));
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(ROOT, rel));

  // Empêche l'évasion vers un répertoire frère (ex: ROOT + '-evil') : on exige
  // soit ROOT exactement, soit un chemin sous ROOT + séparateur.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<h1>404 — Page introuvable</h1>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];

  if (pathname === '/api/contact') {
    Promise.resolve(contactHandler(req, res)).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Erreur interne.' }));
      }
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  const mode =
    process.env.CONTACT_SMTP_HOST
      ? 'SMTP réel'
      : process.env.CONTACT_DRY_RUN === '1' || process.env.CONTACT_DRY_RUN === 'true'
      ? 'dry-run (envoi simulé)'
      : 'envoi NON configuré (503 sur /api/contact)';
  // eslint-disable-next-line no-console
  console.log(`NEON GRID — serveur démarré : http://localhost:${PORT}  [mode envoi : ${mode}]`);
});

module.exports = server;
