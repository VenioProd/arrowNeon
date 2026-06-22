# Backend formulaires — NEON GRID / Arrow

Backend **minimal** qui rend les formulaires du prototype (contact & inscription)
réellement fonctionnels : validation, anti-spam, envoi e-mail.

> Le prototype reste 100 % statique côté visiteur. Le backend est une simple
> fonction Node, déployable comme **fonction serverless** (Vercel/Netlify) ou via
> un **petit serveur Node autonome** (`server.js`) pour le dev ou un VPS.

## Architecture

| Fichier | Rôle |
|---|---|
| `api/contact.js` | Handler `(req, res)` : validation, honeypot, rate-limit, envoi via Nodemailer. Logique pure (`validate`, `buildMessage`) exportée et testée. |
| `server.js` | Serveur Node autonome : sert le site statique + route `POST /api/contact`. |
| `js/config.js` | Config frontend : URL du endpoint (`contactEndpoint`). |
| `js/form.js` | Enhancer générique des formulaires `[data-arrow-form]`. |
| `.env.example` | Modèle de configuration (à copier en `.env`). |
| `test/contact.test.js` | Tests (`node --test`). |

## Démarrage rapide (dev, sans compte SMTP)

```bash
npm install            # installe nodemailer
npm run dev            # serveur sur http://localhost:3000 en mode dry-run
```

En mode **dry-run** (`CONTACT_DRY_RUN=1`), les messages ne sont pas envoyés :
ils sont journalisés et le backend répond `{ ok: true, dryRun: true }`.
Idéal pour tester le parcours complet du formulaire sans configurer d'e-mail.

Ouvrez ensuite <http://localhost:3000/contact.html> et soumettez le formulaire.

## Activer l'envoi réel (SMTP)

1. `cp .env.example .env`
2. Renseignez le bloc SMTP dans `.env` :

   ```dotenv
   CONTACT_TO=contact@votre-domaine.fr
   CONTACT_FROM=noreply@votre-domaine.fr
   CONTACT_SMTP_HOST=smtp.votre-fournisseur.fr
   CONTACT_SMTP_PORT=587
   CONTACT_SMTP_SECURE=false
   CONTACT_SMTP_USER=...
   CONTACT_SMTP_PASS=...
   CONTACT_DRY_RUN=0
   ```

3. `npm start`

Dès que `CONTACT_SMTP_HOST` est défini, l'envoi réel est utilisé. Si ni SMTP ni
dry-run ne sont configurés, `/api/contact` répond `503` (et le frontend affiche
une erreur claire) — jamais de faux « succès » silencieux en production.

## Déploiement serverless (Vercel)

Le dossier `api/` est détecté automatiquement par Vercel : `api/contact.js`
devient l'endpoint `/api/contact`, et les fichiers statiques sont servis à la
racine. Définissez les variables d'environnement (`CONTACT_*`) dans le tableau de
bord Vercel. Aucune autre configuration n'est nécessaire.

## Contrat d'API

`POST /api/contact` — corps JSON :

```json
{
  "formType": "contact",
  "nom": "Jean Dupont",
  "email": "jean@exemple.fr",
  "telephone": "0612345678",
  "etablissement": "CFA Lyon",
  "type": "cfa",
  "message": "Bonjour"
}
```

- `formType` : `"contact"` (tous les champs) ou `"inscription"` (email requis seul).
- Champ honeypot `_hp` : laissé vide par un humain ; rempli = spam (réponse OK silencieuse, aucun envoi).

Réponses :

| Statut | Corps | Cas |
|---|---|---|
| `200` | `{ "ok": true, "dryRun"?: bool, "spam"?: bool }` | Succès (ou honeypot). |
| `422` | `{ "ok": false, "error", "fields": { ... } }` | Validation échouée. |
| `429` | `{ "ok": false, "error" }` | Rate-limit dépassé. |
| `405` | `{ "ok": false, "error" }` | Méthode ≠ POST. |
| `503` | `{ "ok": false, "error" }` | Envoi non configuré / dépendance absente. |
| `502` | `{ "ok": false, "error" }` | Échec d'envoi SMTP. |

## Sécurité

- **Honeypot** anti-spam (`_hp`) côté client + serveur.
- **Échappement HTML** du contenu utilisateur dans le corps de l'e-mail (anti-XSS).
- **Anti-injection d'en-têtes e-mail** : caractères de contrôle (CR/LF) retirés des champs mono-ligne ; `message` conserve ses retours à la ligne.
- **Rate-limit** best-effort par IP (8 requêtes / 10 min) avec purge des entrées expirées. L'IP provient de `X-Forwarded-For` **uniquement** si `TRUST_PROXY=1` (sinon usurpable) — voir `.env.example`.
- **Limites de taille** par champ + corps de requête plafonné à 100 Ko (streaming **et** corps pré-parsé).
- **Lecture UTF-8 sûre** du corps (accumulation Buffer puis décodage unique : pas de corruption des accents sur les longs messages).
- **CORS** via `CONTACT_ALLOWED_ORIGIN` : `*` ou allowlist d'origines séparées par des virgules (l'origine reçue est reflétée si elle correspond, jamais `*` en mode allowlist).
- **Anti path-traversal** dans `server.js` (vérification stricte sous la racine, séparateur inclus).
- Secrets en variables d'environnement uniquement (`.env` ignoré par git).

## Tests

```bash
npm test
```

Couvre la validation, la construction du message (dont l'échappement HTML) et le
handler HTTP en mode dry-run (succès, honeypot, 405/422/503).
