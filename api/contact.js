/**
 * Backend minimal de traitement des formulaires NEON GRID / Arrow.
 *
 * Handler portable, compatible :
 *   - fonction serverless Vercel / Netlify  (export par défaut `(req, res)`)
 *   - serveur Node autonome `server.js`      (route POST /api/contact)
 *
 * La logique pure (`validate`, `buildMessage`) est exportée séparément et
 * testable sans dépendance réseau. Nodemailer est chargé paresseusement
 * uniquement au moment de l'envoi.
 *
 * Variables d'environnement : voir .env.example
 */

'use strict';

// --------------------------------------------------------------------------
// Configuration des champs par type de formulaire
// --------------------------------------------------------------------------

const FORM_TYPES = {
  contact: {
    required: ['nom', 'email', 'etablissement', 'type', 'message'],
    optional: ['telephone'],
  },
  inscription: {
    required: ['email'],
    optional: ['nom', 'telephone', 'etablissement', 'type', 'message'],
  },
};

// Noms de champs « pot de miel » (honeypot anti-spam). Remplis = bot.
const HONEYPOT_FIELDS = ['_hp', 'website', '_gotcha'];

// Limites de longueur (anti-abus).
const MAX_LENGTHS = {
  nom: 120,
  email: 200,
  telephone: 40,
  etablissement: 160,
  type: 60,
  message: 5000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --------------------------------------------------------------------------
// Logique pure — validation & construction du message (sans I/O réseau)
// --------------------------------------------------------------------------

function asString(value) {
  if (value === undefined || value === null) return '';
  // N'accepte que des scalaires : tableau/objet => '' (évite "a,b" ou "[object Object]").
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return '';
  }
  return String(value).trim();
}

// Neutralise les caractères de contrôle (dont CR/LF) — anti-injection d'en-têtes
// e-mail sur les champs mono-ligne. `message` conserve ses retours à la ligne.
function sanitizeField(field, value) {
  if (field === 'message') {
    // Retire les caracteres de controle SAUF \n (0x0A) et \t (0x09).
    return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ');
  }
  // Champs mono-ligne : retire tout caractere de controle (dont CR/LF) puis compacte.
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Valide et normalise les données d'un formulaire.
 * @returns {{ valid:boolean, spam:boolean, errors:Object, data:Object, formType:string }}
 */
function validate(payload) {
  const input = payload && typeof payload === 'object' ? payload : {};

  // Détection honeypot : si un champ piège est rempli, on signale spam.
  const spam = HONEYPOT_FIELDS.some((f) => asString(input[f]).length > 0);

  const formType = FORM_TYPES[input.formType] ? input.formType : 'contact';
  const schema = FORM_TYPES[formType];
  const knownFields = [...schema.required, ...schema.optional];

  const data = { formType };
  const errors = {};

  for (const field of knownFields) {
    const value = asString(input[field]);
    if (value) data[field] = sanitizeField(field, value);
  }

  if (spam) {
    // On ne perd pas de temps à valider le reste : le caller répondra OK.
    return { valid: false, spam: true, errors, data, formType };
  }

  // Champs requis manquants
  for (const field of schema.required) {
    if (!data[field]) errors[field] = 'Champ requis';
  }

  // Format e-mail
  if (data.email && !EMAIL_RE.test(data.email)) {
    errors.email = 'Adresse e-mail invalide';
  }

  // Longueurs
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (data[field] && data[field].length > max) {
      errors[field] = `Trop long (max ${max} caractères)`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    spam: false,
    errors,
    data,
    formType,
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FIELD_LABELS = {
  nom: 'Nom complet',
  email: 'Email',
  telephone: 'Téléphone',
  etablissement: 'Établissement',
  type: "Type d'établissement",
  message: 'Message',
};

/**
 * Construit l'objet message Nodemailer à partir de données déjà validées.
 */
function buildMessage(data, env = process.env) {
  const to = env.CONTACT_TO || 'contact@arrow.example';
  const from = env.CONTACT_FROM || to;

  const label = data.formType === 'inscription' ? 'inscription' : 'contact';
  const who = data.nom || data.email || 'inconnu';
  const subject = `[Arrow] Nouvelle demande ${label} — ${who}`;

  const order = ['nom', 'email', 'telephone', 'etablissement', 'type', 'message'];
  const present = order.filter((f) => data[f]);

  const textLines = present.map((f) => `${FIELD_LABELS[f]}: ${data[f]}`);
  const text = `Nouvelle demande (${label})\n\n${textLines.join('\n')}\n`;

  const htmlRows = present
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${escapeHtml(
          FIELD_LABELS[f]
        )}</td><td style="padding:6px 12px">${escapeHtml(data[f]).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');
  const html = `<h2>Nouvelle demande (${escapeHtml(label)})</h2><table style="border-collapse:collapse">${htmlRows}</table>`;

  const message = { from, to, subject, text, html };
  if (data.email) message.replyTo = data.email;
  return message;
}

// --------------------------------------------------------------------------
// Transport — chargé paresseusement (nodemailer requis seulement à l'envoi)
// --------------------------------------------------------------------------

/**
 * Crée un transport Nodemailer selon l'environnement.
 * @returns {{ transport:Object, dryRun:boolean } | null} null si non configuré.
 */
function createTransport(env = process.env) {
  // require paresseux : la logique pure reste importable sans la dépendance.
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');

  const dryRun = env.CONTACT_DRY_RUN === '1' || env.CONTACT_DRY_RUN === 'true';

  if (env.CONTACT_SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: env.CONTACT_SMTP_HOST,
      port: Number(env.CONTACT_SMTP_PORT) || 587,
      secure: env.CONTACT_SMTP_SECURE === 'true' || Number(env.CONTACT_SMTP_PORT) === 465,
      auth:
        env.CONTACT_SMTP_USER || env.CONTACT_SMTP_PASS
          ? { user: env.CONTACT_SMTP_USER, pass: env.CONTACT_SMTP_PASS }
          : undefined,
    });
    return { transport, dryRun: false };
  }

  if (dryRun) {
    // jsonTransport : ne contacte aucun serveur, retourne le message en JSON.
    return { transport: nodemailer.createTransport({ jsonTransport: true }), dryRun: true };
  }

  return null;
}

// --------------------------------------------------------------------------
// Rate limiting best-effort (par instance / process)
// --------------------------------------------------------------------------

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 8 };
const hits = new Map();

function clientIp(req, env = process.env) {
  // X-Forwarded-For est usurpable : ne s'y fier que derrière un proxy de confiance.
  const trustProxy = env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true';
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (trustProxy && fwd) return String(fwd).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function rateLimited(req, now, env = process.env) {
  const ip = clientIp(req, env);
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  arr.push(now);
  // Purge les entrées vides plutôt que de les conserver indéfiniment.
  if (arr.length) hits.set(ip, arr);
  else hits.delete(ip);
  // Garde-fou : balayage global si la Map enfle (IP qui ne reviennent jamais).
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => now - t < RATE_LIMIT.windowMs);
      if (fresh.length) hits.set(k, fresh);
      else hits.delete(k);
    }
  }
  return arr.length > RATE_LIMIT.max;
}

// --------------------------------------------------------------------------
// HTTP helpers
// --------------------------------------------------------------------------

function setCors(req, res, env = process.env) {
  const allowed = env.CONTACT_ALLOWED_ORIGIN || '*';
  const origin = req.headers && req.headers.origin;
  if (allowed === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Allowlist (origines séparées par des virgules) : on ne renvoie que l'origine
    // reçue si elle correspond, sinon la première autorisée (jamais "*").
    const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
    res.setHeader('Access-Control-Allow-Origin', origin && list.includes(origin) ? origin : list[0] || 'null');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(payload);
}

function tooLarge() {
  const err = new Error('Payload too large');
  err.statusCode = 413;
  return err;
}

function readBody(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    // Vercel/Netlify ont déjà parsé le corps (objet, chaîne ou Buffer brut).
    if (req.body !== undefined) {
      let b = req.body;
      if (Buffer.isBuffer(b)) b = b.toString('utf8');
      const bytes = typeof b === 'string' ? Buffer.byteLength(b) : Buffer.byteLength(JSON.stringify(b || ''));
      if (bytes > limit) return reject(tooLarge());
      return resolve(b);
    }
    // Serveur Node autonome : lecture en streaming. On accumule des Buffers et on
    // décode une SEULE fois (sinon un caractère multi-octets — é, €… — coupé entre
    // deux chunks serait corrompu).
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(tooLarge());
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// --------------------------------------------------------------------------
// Handler principal
// --------------------------------------------------------------------------

async function handler(req, res, env = process.env) {
  setCors(req, res, env);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Méthode non autorisée' });
    return;
  }

  const now = Date.now();
  if (rateLimited(req, now, env)) {
    sendJson(res, 429, { ok: false, error: 'Trop de requêtes, réessayez plus tard.' });
    return;
  }

  let payload;
  try {
    const raw = await readBody(req);
    payload = typeof raw === 'string' ? (raw ? JSON.parse(raw) : {}) : raw || {};
  } catch (err) {
    const status = err.statusCode || 400;
    sendJson(res, status, { ok: false, error: 'Corps de requête invalide.' });
    return;
  }

  // Le corps doit être un objet JSON simple (ni tableau, ni scalaire, ni null).
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    sendJson(res, 400, { ok: false, error: 'Corps de requête invalide.' });
    return;
  }

  const result = validate(payload);

  // Honeypot : on simule un succès pour ne pas informer le bot.
  if (result.spam) {
    sendJson(res, 200, { ok: true, spam: true });
    return;
  }

  if (!result.valid) {
    sendJson(res, 422, {
      ok: false,
      error: 'Certains champs sont invalides ou manquants.',
      fields: result.errors,
    });
    return;
  }

  let transportInfo;
  try {
    transportInfo = createTransport(env);
  } catch (err) {
    sendJson(res, 503, {
      ok: false,
      error: "Service d'envoi indisponible (dépendance manquante).",
    });
    return;
  }

  if (!transportInfo) {
    sendJson(res, 503, {
      ok: false,
      error: "Service d'envoi non configuré. Contactez l'administrateur.",
    });
    return;
  }

  try {
    const message = buildMessage(result.data, env);
    await transportInfo.transport.sendMail(message);
    sendJson(res, 200, { ok: true, dryRun: transportInfo.dryRun });
  } catch (err) {
    sendJson(res, 502, { ok: false, error: "Échec de l'envoi du message." });
  }
}

module.exports = handler;
module.exports.handler = handler;
module.exports.validate = validate;
module.exports.buildMessage = buildMessage;
module.exports.createTransport = createTransport;
module.exports.escapeHtml = escapeHtml;
module.exports.sanitizeField = sanitizeField;
module.exports.readBody = readBody;
module.exports.FORM_TYPES = FORM_TYPES;
module.exports.HONEYPOT_FIELDS = HONEYPOT_FIELDS;
// Réinitialise le rate-limiter (isolation des tests).
module.exports.__resetRateLimit = () => hits.clear();
