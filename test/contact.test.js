'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { Readable } = require('node:stream');

const contact = require('../api/contact');
const { validate, buildMessage } = contact;
const handler = contact;

// Isolation : réinitialise le rate-limiter (état module) avant chaque test.
test.beforeEach(() => {
  if (contact.__resetRateLimit) contact.__resetRateLimit();
});

// --------------------------------------------------------------------------
// Logique pure : validate()
// --------------------------------------------------------------------------

test('validate — contact valide', () => {
  const r = validate({
    formType: 'contact',
    nom: 'Jean Dupont',
    email: 'jean@exemple.fr',
    etablissement: 'CFA Lyon',
    type: 'cfa',
    message: 'Bonjour',
  });
  assert.equal(r.valid, true);
  assert.equal(r.spam, false);
  assert.deepEqual(r.errors, {});
});

test('validate — champs requis manquants', () => {
  const r = validate({ formType: 'contact', email: 'jean@exemple.fr' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.nom);
  assert.ok(r.errors.etablissement);
  assert.ok(r.errors.type);
  assert.ok(r.errors.message);
});

test('validate — email invalide', () => {
  const r = validate({
    formType: 'contact',
    nom: 'X',
    email: 'pas-un-email',
    etablissement: 'Y',
    type: 'autre',
    message: 'Z',
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.email);
});

test('validate — honeypot rempli => spam', () => {
  const r = validate({
    formType: 'contact',
    nom: 'Bot',
    email: 'bot@spam.io',
    etablissement: 'X',
    type: 'autre',
    message: 'spam',
    website: 'http://spam.example',
  });
  assert.equal(r.spam, true);
  assert.equal(r.valid, false);
});

test('validate — inscription ne requiert que email', () => {
  const r = validate({ formType: 'inscription', email: 'lead@exemple.fr' });
  assert.equal(r.valid, true);
});

test('validate — formType inconnu retombe sur contact', () => {
  const r = validate({ formType: 'n_importe_quoi', email: 'a@b.fr' });
  assert.equal(r.formType, 'contact');
});

test('validate — message trop long rejeté', () => {
  const r = validate({
    formType: 'inscription',
    email: 'a@b.fr',
    message: 'x'.repeat(6000),
  });
  assert.ok(r.errors.message);
});

// --------------------------------------------------------------------------
// Logique pure : buildMessage()
// --------------------------------------------------------------------------

test('buildMessage — sujet, destinataire et replyTo', () => {
  const msg = buildMessage(
    { formType: 'contact', nom: 'Jean', email: 'jean@exemple.fr', message: 'Salut' },
    { CONTACT_TO: 'dest@arrow.fr', CONTACT_FROM: 'noreply@arrow.fr' }
  );
  assert.equal(msg.to, 'dest@arrow.fr');
  assert.equal(msg.from, 'noreply@arrow.fr');
  assert.equal(msg.replyTo, 'jean@exemple.fr');
  assert.match(msg.subject, /contact/);
  assert.match(msg.text, /Jean/);
});

test('buildMessage — échappe le HTML (anti-injection)', () => {
  const msg = buildMessage(
    { formType: 'contact', nom: '<script>alert(1)</script>', email: 'a@b.fr', message: 'hi' },
    {}
  );
  assert.ok(!msg.html.includes('<script>'));
  assert.ok(msg.html.includes('&lt;script&gt;'));
});

// --------------------------------------------------------------------------
// Handler HTTP (mode dry-run : pas d'envoi réel)
// --------------------------------------------------------------------------

function mockReq(method, body) {
  return {
    method,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    body: body, // déjà parsé => readBody court-circuité
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    headersSent: false,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(chunk) {
      if (chunk !== undefined) this.body += chunk;
      this.ended = true;
    },
  };
}

const DRY_ENV = { CONTACT_DRY_RUN: '1', CONTACT_TO: 'dest@arrow.fr' };

test('handler — POST contact valide (dry-run) => 200 ok', async () => {
  const req = mockReq('POST', {
    formType: 'contact',
    nom: 'Jean',
    email: 'jean@exemple.fr',
    etablissement: 'CFA',
    type: 'cfa',
    message: 'Bonjour',
  });
  const res = mockRes();
  await handler(req, res, DRY_ENV);
  assert.equal(res.statusCode, 200);
  const json = JSON.parse(res.body);
  assert.equal(json.ok, true);
  assert.equal(json.dryRun, true);
});

test('handler — GET => 405', async () => {
  const req = mockReq('GET');
  const res = mockRes();
  await handler(req, res, DRY_ENV);
  assert.equal(res.statusCode, 405);
});

test('handler — OPTIONS (preflight) => 204', async () => {
  const req = mockReq('OPTIONS');
  const res = mockRes();
  await handler(req, res, DRY_ENV);
  assert.equal(res.statusCode, 204);
});

test('handler — honeypot => 200 ok (silencieux)', async () => {
  const req = mockReq('POST', {
    formType: 'contact',
    nom: 'Bot',
    email: 'bot@spam.io',
    etablissement: 'X',
    type: 'autre',
    message: 'spam',
    _hp: 'rempli-par-bot',
  });
  const res = mockRes();
  await handler(req, res, DRY_ENV);
  assert.equal(res.statusCode, 200);
  const json = JSON.parse(res.body);
  assert.equal(json.ok, true);
  assert.equal(json.spam, true);
});

test('handler — champs manquants => 422 avec détail', async () => {
  const req = mockReq('POST', { formType: 'contact', email: 'a@b.fr' });
  const res = mockRes();
  await handler(req, res, DRY_ENV);
  assert.equal(res.statusCode, 422);
  const json = JSON.parse(res.body);
  assert.equal(json.ok, false);
  assert.ok(json.fields.nom);
});

test('handler — envoi non configuré (ni SMTP ni dry-run) => 503', async () => {
  const req = mockReq('POST', {
    formType: 'inscription',
    email: 'lead@exemple.fr',
  });
  const res = mockRes();
  await handler(req, res, { CONTACT_TO: 'dest@arrow.fr' }); // pas de dry-run, pas de SMTP
  assert.equal(res.statusCode, 503);
});

// --------------------------------------------------------------------------
// Régressions issues de la revue adversariale
// --------------------------------------------------------------------------

test('validate — champ tableau ignoré (pas de coercition "a,b")', () => {
  const r = validate({ formType: 'inscription', email: ['a@b.fr', 'c@d.fr'] });
  assert.equal(r.valid, false); // email array => '' => requis manquant
  assert.ok(r.errors.email);
});

test('validate — CRLF retiré des champs mono-ligne (anti header injection), \\n conservé dans message', () => {
  const r = validate({
    formType: 'contact',
    nom: 'Jean\r\nBcc: evil@x.io',
    email: 'jean@exemple.fr',
    etablissement: 'X',
    type: 'autre',
    message: 'Ligne1\nLigne2',
  });
  assert.ok(!/[\r\n]/.test(r.data.nom));
  assert.ok(r.data.message.includes('\n'));
});

test('readBody — décode un caractère multi-octets coupé entre deux chunks (UTF-8)', async () => {
  const { readBody } = contact;
  const full = JSON.stringify({ message: 'Prix 10€ à Noël' });
  const buf = Buffer.from(full, 'utf8');
  const cut = buf.indexOf(Buffer.from('€', 'utf8')) + 1; // coupe au milieu du €
  const req = new Readable({ read() {} });
  req.headers = {};
  req.socket = {};
  const p = readBody(req);
  req.push(buf.subarray(0, cut));
  req.push(buf.subarray(cut));
  req.push(null);
  const raw = await p;
  assert.deepEqual(JSON.parse(raw), { message: 'Prix 10€ à Noël' });
});

test('handler — corps non-objet (tableau JSON) => 400', async () => {
  const res = mockRes();
  await handler(mockReq('POST', [1, 2, 3]), res, DRY_ENV);
  assert.equal(res.statusCode, 400);
});

test('handler — rate-limit dépassé => 429', async () => {
  const body = { formType: 'inscription', email: 'a@b.fr' };
  let last;
  for (let i = 0; i < 10; i++) {
    last = mockRes();
    await handler(mockReq('POST', body), last, DRY_ENV);
  }
  assert.equal(last.statusCode, 429);
});
