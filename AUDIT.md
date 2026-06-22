# Audit ArrowNeon - Rapport complet

**Date :** 2026-03-19
**Projet :** ArrowNeon — Site vitrine cyberpunk/neon pour une plateforme de gestion éducative
**Stack :** HTML / CSS / JS vanilla (pas de framework, pas de bundler)
**Taille :** 8 pages HTML, ~4 100 lignes CSS, ~230 lignes JS

---

## Score global

| Catégorie | Note | Commentaire |
|-----------|------|-------------|
| HTML / Validité | B+ | Markup correct, mais hiérarchie H1 cassée sur index.html |
| Accessibilité (a11y) | D | Problèmes critiques : modal sans clavier, slider sans ARIA, pas de `<main>` |
| SEO | D | Aucune meta description, pas d'Open Graph, titre index non optimisé |
| CSS / Organisation | B+ | Bonne structure composants, mais main.css trop gros (2 369 lignes) |
| CSS / Modernité | A | Flexbox/Grid partout, 0 float, 0 `!important` |
| CSS / Maintenabilité | C | Aucune variable CSS, couleurs/ombres dupliquées 100+ fois |
| JavaScript / Sécurité | C | innerHTML, inputs non sanitisés, onclick inline |
| JavaScript / Perf | C | mousemove non throttlé, clearing DOM excessif |
| JavaScript / a11y | D | Modal sans Escape/focus-trap, slider clavier inaccessible |
| Responsive | B | Breakpoints cohérents, mais approche desktop-first |

---

## 1. HTML — Problèmes identifiés

### Critique
- **index.html** : **2 balises `<h1>`** (ligne ~40 et ~75) — casse la hiérarchie de titres et le SEO
- **Aucune page** ne possède de `<meta name="description">` — impact SEO majeur
- **Aucune page** ne possède de balises Open Graph / Twitter Card
- **onclick inline** dans index.html (lignes ~851, ~975) et components-demo.html (lignes ~257, ~263) — anti-pattern sécurité (bloque CSP)

### Important
- `<div class="main-container">` utilisé partout au lieu de `<main>` — mauvais pour la sémantique/a11y
- SVGs sans `aria-label` ni `title` (index.html lignes ~862-967)
- Navigation : `aria-expanded` et `aria-controls` manquants sur le bouton toggle
- Blog : les dates utilisent `<p>` au lieu de `<time datetime="...">`

### Mineur
- Titre de index.html ("Arrow - Landing Page Cyberpunk Custom") non optimisé SEO
- Pas de données structurées (JSON-LD / schema.org)
- Pas de `robots.txt` ni `sitemap.xml`

### Duplication
- Le bloc `<nav>` (~20 lignes) est copié-collé identique dans les 8 fichiers HTML
- Les blocs `<script>` sont dupliqués dans chaque page

---

## 2. CSS — Problèmes identifiés

### Critique
- **Aucune variable CSS (`--custom-property`)** dans tout le projet
  → `#0080FF` apparaît 100+ fois, `rgba(0, 128, 255, ...)` 50+ fois
  → Impossible de changer la couleur primaire sans find-replace global
  → Aucun support possible de thème sombre/clair

### Important
- **main.css = 2 369 lignes** (~46 Ko) — représente 57% de tout le CSS
  → Contient styles globaux + page-specific + responsive → à découper
- **clip-path identique** copié 15+ fois sans variable
- **text-shadow neon** identique copié dans `.stat-value`, `.cyber-logo`, `.pricing-title`, `.brutal-hero-title`
- **Desktop-first** : les media queries réduisent au lieu d'ajouter (pas mobile-first)
- **Prefixes webkit** (`-webkit-background-clip`, `-webkit-text-fill-color`) sans fallback couleur

### Bon
- 0 `!important` dans tout le projet
- 0 `float` — utilisation exclusive de Flexbox et CSS Grid
- Structure composants bien organisée (`css/components/`)
- Breakpoints cohérents : 1400px, 1024px, 768px, 480px
- Animations et effets neon bien implémentés

### Inconsistances
- 2 bleus primaires : `#0080FF` et `#00D9FF` — à clarifier
- Espacement non systématique (incréments de 5px arbitraires)
- Tailles de police approximatives (14px vs 15px, 17px vs 18px)
- Conventions de nommage mixtes : `cyber-*`, `arrow-*`, `brutal-*`, `hp-*`, `btn-*`

---

## 3. JavaScript — Problèmes identifiés

### Critique (Sécurité)
- **form.js** : `Object.fromEntries(formData)` sans aucune validation/sanitisation des inputs
- **main.js** : `innerHTML` utilisé pour injecter du contenu (lignes ~27, ~108, ~123) — risque XSS si les données changent de source
- **Pas de protection CSRF** sur le formulaire de contact

### Critique (Performance)
- **3 listeners `mousemove`** sur `document` sans throttle ni `requestAnimationFrame` :
  - Parallax des formes géométriques (main.js ~88-100)
  - Tilt des cartes (main.js ~66-77)
  - Slider de comparaison (main.js ~156-159)
- **Clearing DOM complet** (`container.innerHTML = ''`) dans `createGeometricShapes()` et `createMatrixRain()` — provoque du layout thrashing

### Critique (Accessibilité)
- **Modal** : pas de fermeture par Escape, pas de focus trap, pas de `role="dialog"`, pas de `aria-modal="true"`
- **Slider** : uniquement souris/touch — aucun support clavier, pas de `role="slider"`, pas de `aria-valuemin/max/now`
- **Nav toggle** : pas de gestion `aria-expanded`

### Important
- **Pas de modules ES6** — tout est en scope global → risque de collision de noms
- **Pas de gestion d'erreurs** (aucun `try-catch`) — échecs silencieux
- **Pas d'async/await** pour le formulaire — `alert()` utilisé comme feedback utilisateur
- **Event listeners jamais nettoyés** — persistent toute la durée de vie de la page

### Bon
- `const` / `let` utilisés partout (0 `var`)
- Arrow functions et template literals ES6+
- Pas d'`eval()` ni `document.write()`

---

## 4. Recommandations prioritaires

### P0 — Corrections critiques

1. **Implémenter les variables CSS** — créer un `:root {}` avec palette, espacements, ombres, clip-paths
2. **Ajouter `<meta description>` + Open Graph** sur toutes les pages
3. **Remplacer les `onclick` inline** par des `addEventListener`
4. **Ajouter validation/sanitisation** des inputs du formulaire (form.js)
5. **Throttler les événements `mousemove`** avec `requestAnimationFrame`
6. **Rendre le modal accessible** : Escape, focus trap, ARIA attributes

### P1 — Améliorations importantes

7. Remplacer `<div class="main-container">` par `<main>`
8. Fixer la hiérarchie H1 dans index.html (un seul H1 par page)
9. Découper main.css en fichiers page-specific
10. Ajouter `aria-expanded` / `aria-controls` au toggle nav
11. Ajouter support clavier au slider de comparaison
12. Ajouter des fallbacks couleur pour `-webkit-text-fill-color`

### P2 — Bonnes pratiques

13. Migrer vers des modules ES6 (`import`/`export`)
14. Adopter une approche mobile-first pour les media queries
15. Standardiser les conventions de nommage CSS
16. Ajouter des données structurées JSON-LD
17. Créer un système de design tokens (espacements, typographie)
18. Factoriser le HTML dupliqué (nav, scripts) via un système de templates

---

## 5. Fichiers audités

```
index.html           (90 Ko - page principale, la plus lourde)
a-propos.html        (5.4 Ko)
blog.html            (6 Ko)
contact.html         (4.5 Ko)
fonctionnalites.html (9.8 Ko)
pour-qui.html        (5.1 Ko)
tarifs.html          (6 Ko)
components-demo.html (11.7 Ko)
css/main.css         (46 Ko - 57% du CSS total)
css/brutal-modal.css (13 Ko)
css/nav.css          (3.1 Ko)
css/form.css         (3.5 Ko)
css/components.css   (514 o - imports uniquement)
css/components/*.css (12 fichiers composants)
js/main.js           (197 lignes)
js/nav.js            (36 lignes)
js/form.js           (28 lignes)
js/components/modal.js (28 lignes)
```
