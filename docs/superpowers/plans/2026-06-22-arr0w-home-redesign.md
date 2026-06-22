# Refonte home arr0w.app — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la home de arr0w.app pour rendre le produit clair dès le hero, en direction « néon dark raffiné », sur l'archi Astro + CSS modulaire existante, en dual-thème (dark d'abord, light ensuite).

**Architecture:** On évolue le design system par tokens (`src/styles/css/tokens.css`, déjà dark `:root` + light `:root[data-theme="light"]`). On introduit des composants Astro de mockup produit réutilisables (`src/components/mock/*`). On réécrit le markup de `src/pages/index.astro` en 8 sections et leur CSS dans `src/styles/css/pages/index.css`. Vérification = `astro check` + `astro build` (Node 22) + captures Playwright (dark/light/mobile).

**Tech Stack:** Astro 6.4, @astrojs/node (SSR), CSS modulaire (pas de framework UI), Sanity (contenu, inchangé). Node 22.14 obligatoire (`astro` refuse Node 20).

---

## Pré-requis & conventions de vérification

Worktree : `/Users/raphaelbentvelzen/Dev/Neon/.claude/worktrees/arrow-site` — branche `claude/redesign-arr0w`.

**Toujours préfixer les commandes node par :**
```bash
export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"
```

**Serveur de dev (itération live)** — laisser tourner dans un terminal :
```bash
npm run dev    # astro dev, http://localhost:4321
```

**Vérification de build (avant chaque commit de section)** :
```bash
npm run check && npm run build
# attendu : "0 errors" puis "[build] Complete!"
```

**Capture d'écran (dark + light + mobile)** — via Playwright. Helper conceptuel (à exécuter par l'agent) :
1. `browser_navigate` → `http://localhost:4321/`
2. dark (défaut) : `page.evaluate(() => localStorage.removeItem('arrow-theme'))` puis reload ; screenshot.
3. light : `page.evaluate(() => { document.documentElement.dataset.theme='light'; })` ; screenshot.
4. mobile : `page.setViewportSize({width:390,height:844})` ; screenshot.
Chaque task « section » n'est validée que si la capture **dark** correspond à l'intention de la spec (§ correspondant).

**Critère a11y minimal par section** : contraste texte lisible, `aria-label` sur boutons icône, ordre de focus cohérent, images/mocks décoratifs `aria-hidden` ou décrits.

**Référence design** : `docs/superpowers/specs/2026-06-22-arr0w-home-redesign-design.md`.

---

## Structure de fichiers

| Fichier | Responsabilité | Action |
|---|---|---|
| `src/styles/css/tokens.css` | Palette, accent unique, glow dosé, typo (dark `:root` + light override) | Modifier |
| `src/styles/css/components/buttons.css` | Boutons au nouveau langage | Modifier |
| `src/styles/css/components/cards.css` | Surfaces calmes | Modifier |
| `src/styles/css/pages/index.css` | CSS des 8 sections de la home | Réécrire |
| `src/pages/index.astro` | Markup des 8 sections | Réécrire |
| `src/components/mock/FicheEtudiant.astro` | Carte fiche étudiant (hero + piliers) | Créer |
| `src/components/mock/AlertsList.astro` | Peek liste d'alertes (étape « repérer ») | Créer |
| `src/components/mock/StepPeek.astro` | Petit visuel produit générique d'une étape | Créer |
| `src/styles/css/components/mock.css` | Styles des composants mockup | Créer |
| `src/styles/css/brutal-modal.css` | Alignement « diagnostic terrain » | Modifier |

> Le dossier `src/components/` n'existe pas encore (markup inline aujourd'hui) — on l'introduit pour les blocs réutilisables uniquement.

---

## PHASE 1 — Design system dark (fondations)

### Task 1 : Raffiner les tokens dark

**Files:**
- Modify: `src/styles/css/tokens.css` (bloc `:root`, lignes ~2-50)

- [ ] **Step 1 : Resserrer l'accent et discipliner le glow**

Dans `:root`, garder `--primary` comme **unique accent décoratif** et reclasser les autres en rôles sémantiques. Valeurs cibles (ajuster au build) :

```css
:root {
  --primary: #2f6df6;              /* accent unique, un peu moins saturé que #0080ff */
  --primary-rgb: 47, 109, 246;
  /* accents → strictement sémantiques (plus de déco multi-néon) */
  --danger:  #ff5d73;             /* alertes */
  --success: #2fcf8e;             /* validé */
  --warning: #e6b450;             /* attention */
  /* fond plus neutre/profond */
  --background:       #070b16;
  --foreground:       #e7ecf5;
  --card:             #0e1424;
  --card-foreground:  #f4f7fc;
  --muted:            #161d30;
  --muted-foreground: #9aa6bd;
  --border:           rgba(255,255,255,0.08);
  /* glow dosé : réservé highlight titre / CTA / carte active */
  --text-glow:        0 0 24px rgba(var(--primary-rgb), 0.45);
  --glow-cta:         0 0 26px rgba(var(--primary-rgb), 0.50);
}
```

- [ ] **Step 2 : Neutraliser les glows décoratifs résiduels**

Repérer les usages de `--glow-cyan/magenta/violet/orange` et `--accent-*` hors sémantique dans `components/*` et `pages/index.css` ; les laisser définis (compat) mais ne plus les appliquer dans le hero/sections refondus (traité aux tasks de section).

- [ ] **Step 3 : Vérifier**

```bash
export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"
npm run check && npm run build
```
Attendu : 0 errors, build Complete. Capturer la home actuelle (dark) : la palette doit être plus sobre, sans régression de mise en page.

- [ ] **Step 4 : Commit**

```bash
git add src/styles/css/tokens.css
git commit -m "refactor(tokens): accent unique + glow dosé + fond neutre (dark)"
```

### Task 2 : Boutons & cartes au nouveau langage

**Files:**
- Modify: `src/styles/css/components/buttons.css`
- Modify: `src/styles/css/components/cards.css`

- [ ] **Step 1 : Boutons**

Bouton primaire : fond `--primary`, texte clair, `box-shadow: var(--glow-cta)` au repos léger / renforcé au hover, `clip-path` anguleux **léger** (biseau ~8px) ou rayon doux — choisir une seule signature et l'appliquer. Bouton secondaire : bordure `--border` + fond transparent, hover `--muted`.

- [ ] **Step 2 : Cartes**

`.card` / surfaces : fond `--card`, bordure `0.5px var(--border)`, rayon `--border-radius-lg` (ou clip-path dosé), **pas** de glow par défaut ; classe utilitaire `.is-active` pour la lueur d'accent ponctuelle.

- [ ] **Step 3 : Vérifier + Commit**

```bash
npm run check && npm run build
git add src/styles/css/components/buttons.css src/styles/css/components/cards.css
git commit -m "refactor(ui): boutons + cartes dark raffinés"
```

---

## PHASE 2 — Composants mockup produit

### Task 3 : Composant `FicheEtudiant`

**Files:**
- Create: `src/components/mock/FicheEtudiant.astro`
- Create: `src/styles/css/components/mock.css`
- Modify: `src/styles/css/components.css` (importer `mock.css`)

- [ ] **Step 1 : Markup du composant**

`FicheEtudiant.astro` — props avec valeurs par défaut (démo), markup sémantique :

```astro
---
const { nom = 'Léa Martin', classe = 'BTS SIO · 2ᵉ année · Groupe B', alertes = 3 } = Astro.props;
const stats = [
  { label: 'Absences', value: '14 h', tone: 'info' },
  { label: 'Moyenne', value: '13,2', tone: 'success' },
  { label: 'Bulletins', value: '2', tone: 'warning' },
  { label: 'Documents', value: '9', tone: 'violet' },
];
const events = [
  { dot: 'danger', text: 'Absence non justifiée — 12 mars', val: 'À traiter' },
  { dot: 'warning', text: 'Moyenne en baisse — Maths', val: '−2,1' },
  { dot: 'success', text: 'Convention de stage', val: 'Signée' },
];
---
<article class="mock-fiche" aria-label={`Fiche étudiant ${nom} (aperçu produit)`}>
  <header class="mock-fiche__head">
    <span class="mock-fiche__ava" aria-hidden="true">{nom.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>
    <span class="mock-fiche__who"><b>{nom}</b><small>{classe}</small></span>
    <span class="mock-fiche__pill">{alertes} alertes</span>
  </header>
  <div class="mock-fiche__stats">
    {stats.map(s => (
      <div class={`mock-stat mock-stat--${s.tone}`}><small>{s.label}</small><b>{s.value}</b></div>
    ))}
  </div>
  <ul class="mock-fiche__events">
    {events.map(e => (
      <li><i class={`dot dot--${e.dot}`} aria-hidden="true"></i><span>{e.text}</span><b>{e.val}</b></li>
    ))}
  </ul>
</article>
```

- [ ] **Step 2 : CSS du composant**

Dans `mock.css`, styler `.mock-fiche` (fond `--card`, bordure `--border`, rayon `--border-radius-lg`, lueur d'accent ponctuelle), `.mock-stat--{info,success,warning,violet}` avec fonds dérivés des couleurs sémantiques, `.dot--{danger,warning,success}`. Importer dans `components.css` : `@import url('components/mock.css');`.

- [ ] **Step 3 : Vérifier en isolation**

Insérer temporairement `<FicheEtudiant />` en haut de `index.astro`, `npm run dev`, capturer. La carte doit être lisible, calme, une seule lueur. Retirer l'insertion temporaire.

- [ ] **Step 4 : Commit**

```bash
git add src/components/mock/FicheEtudiant.astro src/styles/css/components/mock.css src/styles/css/components.css
git commit -m "feat(mock): composant fiche étudiant + styles"
```

### Task 4 : Peeks dérivés (`AlertsList`, `StepPeek`)

**Files:**
- Create: `src/components/mock/AlertsList.astro`
- Create: `src/components/mock/StepPeek.astro`
- Modify: `src/styles/css/components/mock.css`

- [ ] **Step 1** : `AlertsList.astro` — petite liste d'alertes (3-4 lignes : étudiant, motif, sévérité) pour l'étape « Repérer ».
- [ ] **Step 2** : `StepPeek.astro` — wrapper générique recevant un `slot` (un mini-visuel produit) + `title`, pour les 3 étapes et les piliers.
- [ ] **Step 3** : Styles dans `mock.css`. Vérifier via insertion temporaire + capture.
- [ ] **Step 4 : Commit**

```bash
git add src/components/mock/AlertsList.astro src/components/mock/StepPeek.astro src/styles/css/components/mock.css
git commit -m "feat(mock): peeks alerts + step générique"
```

---

## PHASE 3 — Sections de la home (dark), une par task

> Pour chaque task : réécrire la section dans `index.astro` + son CSS dans `index.css`, `npm run check && npm run build`, capturer **dark**, valider contre la spec §4, commit. Conserver les ancres existantes (`#difference`) et le contenu Sanity/données déjà câblé.

### Task 5 : Hero produit (section 1)

**Files:** Modify `src/pages/index.astro` (bloc `<section class="hero-orbit">`), `src/styles/css/pages/index.css`, import de `FicheEtudiant`.

- [ ] **Step 1** : Remplacer le hero orbital par : colonne gauche (eyebrow segment, H1 « Chaque étudiant, une seule vue claire » avec highlight `--primary` glow, sous-titre, 2 CTAs, signaux de confiance RGPD/FR + mise en route) ; colonne droite `<FicheEtudiant />`. Grille 2 colonnes desktop, empilée mobile.
- [ ] **Step 2** : CSS `.hero` (grid, espacements, glow titre dosé). Supprimer le CSS orbital devenu mort.
- [ ] **Step 3** : `npm run check && npm run build` (0 err / Complete). Capturer dark desktop + mobile. Valider : produit visible immédiatement, hiérarchie nette.
- [ ] **Step 4 : Commit** `git commit -m "feat(home): hero produit (dark)"`

### Task 6 : Problème en 1 ligne / avant-après (section 2)

**Files:** Modify `index.astro` (bloc `#difference`), `index.css`.

- [ ] **Step 1** : Condenser le comparatif « vue dispersée vs Arrow » en un bloc court : titre « Vos infos étudiants sont éclatées dans 5 outils », mini avant (icônes/outils dispersés) → après (fiche unique). Réutiliser le slider existant si pertinent, sinon statique.
- [ ] **Step 2** : CSS. **Step 3** : build + capture dark. **Step 4 : Commit** `feat(home): section problème (dark)`

### Task 7 : Comment ça marche — 3 étapes (section 3)

**Files:** Modify `index.astro`, `index.css`, import `StepPeek` + `AlertsList`.

- [ ] **Step 1** : 3 étapes **Centraliser → Repérer → Décider/Prouver**, chacune : numéro, titre, 1 phrase, `<StepPeek>` avec un mini-visuel produit (étape 2 = `<AlertsList />`).
- [ ] **Step 2** : CSS (3 colonnes desktop, empilées mobile, liaison visuelle entre étapes). **Step 3** : build + capture. **Step 4 : Commit** `feat(home): comment ça marche 3 étapes (dark)`

### Task 8 : 4 piliers produit (section 4)

**Files:** Modify `index.astro`, `index.css`.

- [ ] **Step 1** : 4 cartes (Absences/Alertes · Notes/Bulletins · Documents/Preuves · Suivis/Commentaires), chacune avec un mini-visuel produit (peek) + 1 phrase de bénéfice. Pas d'icônes abstraites seules.
- [ ] **Step 2** : CSS grille 2×2 / 4×1 responsive. **Step 3** : build + capture. **Step 4 : Commit** `feat(home): 4 piliers produit (dark)`

### Task 9 : Pour qui (section 5)

**Files:** Modify `index.astro` (réutiliser le bloc « Positionnement » existant), `index.css`.

- [ ] **Step 1** : 3 segments (écoles sup · CFA · équipes scolarité) en cartes courtes (pour qui + bénéfice clé). **Step 2** : CSS. **Step 3** : build + capture. **Step 4 : Commit** `feat(home): pour qui (dark)`

### Task 10 : Preuve sociale (section 6)

**Files:** Modify `index.astro` (bloc `.social-proof` existant), `index.css`.

- [ ] **Step 1** : Raffiner témoignages (`src/data/testimonials.ts`, inchangé en données) + logos au nouveau langage (cartes calmes, pas de glow). **Step 2** : CSS. **Step 3** : build + capture. **Step 4 : Commit** `refactor(home): preuve sociale raffinée (dark)`

### Task 11 : Diagnostic terrain (modal) + CTA final (sections 7-8)

**Files:** Modify `src/styles/css/brutal-modal.css`, `index.astro` (CTA final + déclencheur modal).

- [ ] **Step 1** : Aligner le modal « Mode Brutal » sur le nouveau langage (accent unique, glow dosé, surfaces calmes) sans réécrire son contenu. **Step 2** : CTA final clair (« Prêt à voir une fiche en vrai ? » + bouton démo + lien tarifs). **Step 3** : build + capture (home + modal ouvert). **Step 4 : Commit** `refactor(home): diagnostic terrain + CTA final (dark)`

---

## PHASE 4 — Polish dark & vérification globale

### Task 12 : Passe responsive dark

**Files:** Modify `src/styles/css/pages/index.css`, `src/styles/css/components/responsive.css`.

- [ ] **Step 1** : Vérifier chaque section en mobile (390px) et tablette (768px) ; corriger débordements, tailles de titre, empilements. **Step 2** : build. **Step 3** : captures mobile de toutes les sections. **Step 4 : Commit** `fix(home): responsive dark`

### Task 13 : Vérification dark complète

- [ ] **Step 1** : `npm run check && npm run build` (0 err / Complete).
- [ ] **Step 2** : Captures dark desktop + mobile de la home entière (full page). Revue contre la spec §4 et §9 (critères de succès) : produit visible dès le hero, message « quoi/pour qui/bénéfice » lisible en ~5 s, accent unique, glows dosés.
- [ ] **Step 3** : Check a11y rapide (focus, contrastes, aria-labels boutons). Corriger inline.
- [ ] **Step 4 : Commit** (si correctifs) `fix(home): polish + a11y dark`. **Point de validation utilisateur du rendu dark avant la phase light.**

---

## PHASE 5 — Thème light

### Task 14 : Override light des tokens

**Files:** Modify `src/styles/css/tokens.css` (bloc `:root[data-theme="light"]`, ~ligne 92).

- [ ] **Step 1** : Redéfinir en miroir clair : `--background` (#f7f8fb), `--foreground` (#10131c), `--card` (#fff), `--muted`, `--border`, `--muted-foreground`, garder `--primary` (#2f6df6) ; glow **fortement réduit** en light (lueurs peu visibles sur fond clair → préférer ombres douces). Sémantiques (danger/success/warning) ajustées pour contraste sur clair.
- [ ] **Step 2** : build + bascule `data-theme="light"` + capture home. **Step 3 : Commit** `feat(tokens): thème light raffiné`

### Task 15 : Parité light par section

**Files:** Modify `src/styles/css/pages/index.css`, `components/mock.css`, `brutal-modal.css` (overrides `:root[data-theme="light"]` ciblés).

- [ ] **Step 1** : Pour chaque section, vérifier en light et ajouter les overrides nécessaires (fonds de stats du mock, dots, surfaces, glows→ombres). **Step 2** : build. **Step 3** : captures **light** desktop + mobile de toutes les sections ; parité avec dark. **Step 4 : Commit** `feat(home): parité light toutes sections`

### Task 16 : Vérification dual-thème finale

- [ ] **Step 1** : `npm run check && npm run build`. **Step 2** : Tester le toggle (persistance `localStorage` `arrow-theme`), captures dark+light côte à côte de la home. **Step 3** : a11y light (contrastes). **Step 4 : Commit** `chore(home): vérification dual-thème finale`. **Point de validation utilisateur final.**

---

## Note d'intégration

- La branche `claude/redesign-arr0w` part d'`origin/main`. À la fin, ouvrir une PR vers `main` (site Astro), CI verte (quality.yml) + captures avant/après dans la description.
- Ne PAS toucher au prototype (`arrowNeon` branches `claude/*`) ni au produit SaaS (`VenioProd/arrow`).
