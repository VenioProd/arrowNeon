# NEON GRID — Design System

Spécification du design system **cyberpunk « NEON GRID »** du prototype Arrow/Neon,
destinée à la **réutilisation par l'équipe Arrow**.

Toutes les valeurs de ce document sont **extraites du code réel** (CSS + HTML),
puis vérifiées par audit adverse + `grep`. Les jetons sont centralisés dans
[`css/tokens.css`](css/tokens.css) ; le catalogue de composants détaillé est dans
[`COMPONENTS.md`](COMPONENTS.md).

> **TL;DR pour Arrow** : importez [`css/tokens.css`](css/tokens.css) en premier,
> réutilisez le système **bleu `#0080FF`** + ses échelles d'opacité, les feedbacks
> sémantiques, la typo et les effets signatures (biseaux `clip-path`, glows néon).
> Ignorez les palettes « Mode Brutal » (campagne isolée) et « HyperPlanning »
> (faux-négatif du comparateur). Voir [§ Réutilisation](#9-réutilisation-dans-arrow).

---

## 1. Philosophie

Esthétique **cyberpunk / HUD** sur fond noir : surfaces translucides en
*glassmorphism* (`backdrop-filter: blur`), bordures et textes bleu néon, **lueurs
(glows)** systématiques, et découpes angulaires `clip-path` qui remplacent les
coins arrondis. Le mouvement est marqué (formes géométriques flottantes, pulsations
néon, tilt 3D des cartes au survol).

## 2. Trois systèmes chromatiques (ne pas confondre)

Le prototype contient **trois palettes distinctes**. Une seule est le design system.

| Système | Couleurs clés | Statut |
|---|---|---|
| **Arrow / NEON GRID** | `#0080FF` (+ ~22 opacités), fonds noirs/`#0a0e1a`, feedbacks | ✅ **Le design system** — réutilisable |
| **Mode Brutal** | cyan `#00D9FF`, magenta `#FF007F`, fonds `#050510`/`#0a0a15` | ⚠️ Campagne marketing isolée — réutiliser seulement si on reprend ce ton |
| **HyperPlanning** (comparateur) | gris/bruns `#E8E8E8`, `#5a4a4a`, Arial | ❌ Faux-négatif volontaire (UI « ancienne plateforme ») — **ne pas réutiliser** |

## 3. Couleurs

Valeurs exhaustives + contextes d'usage dans [`css/tokens.css`](css/tokens.css).
Synthèse :

**Marque & accents**
- `--neon-color-primary` **`#0080FF`** (167 occurrences) — couleur de marque, texte body par défaut, titres, bordures, glows.
- `--neon-color-primary-dark` `#0066FF` — fin des dégradés (logo, progress bar).
- Accents Mode Brutal : `--neon-color-accent-cyan` `#00D9FF`, `--neon-color-accent-magenta` `#FF007F`.
- ⚠️ `--neon-color-icon-gold` `#FFD700` — or des 8 icônes SVG de l'accueil : **seule rupture chromatique**, à normaliser vers le bleu (voir [§ 10](#10-points-à-corriger-avant-réutilisation)).

**Échelle d'opacité du bleu** (le cœur du système) — `--neon-primary-a02` … `--neon-primary-a100`, soit les alphas réels :
`0.02, 0.05, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20, 0.22, 0.25, 0.30, 0.40, 0.45, 0.50, 0.60, 0.70, 0.80, 0.85, 0.90, 0.95, 1`.
La montée en alpha encode la hiérarchie : fonds (`0.02–0.18`) → bordures (`0.25–0.50`) → glows & texte (`0.50–1`).

> **Pattern recommandé** : plutôt que d'importer chaque variante, dérivez via
> `rgba(var(--neon-color-primary-rgb), <alpha>)` (le triplet `0, 128, 255` est exposé
> comme `--neon-color-primary-rgb`).

**Fonds** : `#000` (global), surfaces noires `rgba(0,0,0,0.3→0.95)` (`--neon-bg-black-*`), fonds de scène `#0a0e1a` (Arrow), `#050510`/`#0a0a15` (Brutal).

**Textes** : bleu + opacités (`a70` labels → `a95` corps), plus `#87ceeb` (sky), `#a0aec0` (muted), `#fff`.

**Feedback sémantique** (réutilisable tel quel) :

| Rôle | Teinte | Tokens |
|---|---|---|
| Succès | `#00FF64` (vert) | `--neon-success-a05…a95`, badge `#10b981` |
| Erreur | `#FF0064` (rose) | `--neon-error-a05…a80`, badge `#ef4444` |
| Warning | `#FFC800` (jaune) | `--neon-warning-a10/a20`, badge `#fbbf24` |

## 4. Typographie

3 familles, chargées par **un seul `@import` Google Fonts** ([`css/main.css:1`](css/main.css)) — voir la dépendance en [§ 10](#10-points-à-corriger-avant-réutilisation).

| Token | Famille | Usage | Graisses importées |
|---|---|---|---|
| `--neon-font-display` | **Orbitron** | Titres / display | 400, 700, 900 |
| `--neon-font-body` | **Rajdhani** | Corps & labels (défaut body) | 300–700 |
| `--neon-font-arrow` | **League Spartan** | Interface Arrow (`.arrow-*`) | 600/700/900 utilisées |
| `--neon-font-legacy` | Arial | UI « HyperPlanning » | ❌ hors DS |

**Échelle de tailles** : `--neon-font-size-xs` 11px → `…-display` 150px (logo hero).
Paliers UI courants : `sm` 12px (labels uppercase), `md` 16px (base UI), `lg` 18px,
`xl` 20px (titres carte). **Letter-spacing** marqué (`--neon-tracking-*`, jusqu'à 8px)
et `text-transform: uppercase` sur titres/labels/boutons = signature forte.

## 5. Espacement & layout

- **Espacement** (`--neon-space-*`) : `8 · 10 · 15 · 20 · 25 · 30 · 35 · 40 · 60 · 80 px`. Gap de grille dominant : **30px**, gouttière de page : **40px** (15px en mobile).
- **Conteneurs** (`--neon-container-*`) : `600` (modal) · `700` (form) · `900` (contact) · `1200` (éditorial) · **`1400` (dominant)** · `1600` (grille hero/nav) · `1800` (immersif).
- **Z-index** (`--neon-z-*`) : `0` fond géométrique → `100` scanlines → `1000` tooltip/HUD → `2000` nav/modal → `3000` modal Brutal.
- **Breakpoints** (`--neon-bp-*`) : `1400 · 1024 · 768` (bascule menu burger) `· 480`.

## 6. Effets signatures

| Effet | Détail | Tokens |
|---|---|---|
| **Découpe angulaire** | `clip-path: polygon(...)` 6 points, biseau coin haut-droit + bas-gauche. Biseaux réels : 10/12/15/20/25/30px. | `--neon-clip-10…30` |
| **Glow texte** | `text-shadow` **double couche** `0 0 20px a80, 0 0 40px a40`. | `--neon-glow-text` |
| **Glow icône** | `filter: drop-shadow(0 0 20px a80)` ; hover 30px + scale. | `--neon-glow-icon` |
| **Carte 3D** | `box-shadow` triple (élévation + inset highlight + halo 100px) + tilt JS `rotateX/Y` au survol. | `--neon-glow-card-hover` |
| **Glassmorphism** | `backdrop-filter: blur` — 10px défaut, 15px HUD, 20px nav, 5px overlay. | `--neon-backdrop-blur*` |
| **Scanlines** | overlay plein écran `repeating-linear-gradient` (`.scanlines`, z 100, opacity .5). | `--neon-primary-a02` |
| **Fond géométrique** | 20 formes (triangles/carrés/cercles) générées en JS, flottantes + parallaxe souris ([`js/main.js`](js/main.js)). | `--neon-z-base` |

**Animations** (`@keyframes`) : `float-shape` 20s, `neon-pulse` 3s (logo), `neon-shimmer`
3s (carte métrique), `handle-pulse` 2s (slider), `pulse` 2s, `spin` 1s (loader),
`brutal-pulse-bg` 5s.

## 7. Mouvement

- **Durées** (`--neon-duration-*`) : `0.3s` (défaut) · `0.4s` (cartes/inputs) · `0.5s`/`0.6s` (balayages/shine).
- **Easing signature** : `--neon-easing-signature` = `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — effet « pop » à rebond, **réservé à `.cyber-card`**.

## 8. Composants

11 composants + 1 utilitaire transverse, documentés en détail dans
[`COMPONENTS.md`](COMPONENTS.md) (markup + variantes). Démo vivante :
[`components-demo.html`](components-demo.html).

| Composant | Variantes / notes |
|---|---|
| **Buttons** | `btn-primary · secondary · ghost · icon · small` (Orbitron uppercase, clip-path) |
| **Inputs & Forms** | `input-field`, label Orbitron, checkbox/radio custom |
| **Cards** | clip-path translucide + blur, tilt 3D au survol |
| **Badges & Tags** | `default · success · warning · error` |
| **Alerts** | bordure gauche colorée + titre (mêmes 4 couleurs sémantiques) |
| **Modal** | overlay z-2000 + boîte clip-path, piloté JS (`openModal/closeModal`) |
| **Progress Bar** | piste translucide + remplissage dégradé glow |
| **Loader** | spinner 50px (`spin`) |
| **Divider** | ligne 2px dégradée transparent→bleu→transparent |
| **Tooltip** | au survol du conteneur (`opacity`/`pointer-events`) |
| **Footer** | grille auto-fit, liens animés |
| **Responsive** | utilitaire `@media` transverse (⚠️ non listé dans `COMPONENTS.md`) |

## 9. Réutilisation dans Arrow

1. **Stratégie d'import** — centraliser [`css/tokens.css`](css/tokens.css) chargé **avant** tout autre CSS (ou fusionner dans le `:root` du thème). Ne pas dupliquer les valeurs en dur.
2. **Dériver les opacités** — utiliser `rgba(var(--neon-color-primary-rgb), <alpha>)` plutôt que d'importer les ~22 variantes une à une.
3. **Nommage** — préfixe `--neon-*` pour éviter toute collision avec les tokens Arrow existants.
4. **Sûr à réutiliser tel quel** — le système bleu `#0080FF` + opacités, `#87ceeb`/`#a0aec0`, fonds noirs/`#0a0e1a`, les feedbacks sémantiques, la typo (Orbitron/Rajdhani), les biseaux `clip-path` et glows.
5. **À adapter / ne pas réutiliser** — palette « HyperPlanning » (gris/bruns, Arial) = faux-négatif du comparateur ; palette « Mode Brutal » (cyan/magenta) = campagne isolée, à n'importer que si l'on reprend ce ton.
6. **Effets coûteux** — glow double couche, `box-shadow` triples et `backdrop-filter: blur` sont gourmands : les réserver aux éléments clés, prévoir un repli pour les listes denses / mobiles.
7. **Dépendance polices** — voir [§ 10](#10-points-à-corriger-avant-réutilisation).

## 10. Points à corriger avant réutilisation

- **Icônes SVG en or `#FFD700`** (accueil) : seule rupture chromatique du système → normaliser vers le bleu primaire dans Arrow.
- **Chargement des polices** : les 3 familles ne sont chargées **que** par un `@import` Google Fonts en ligne 1 de [`css/main.css`](css/main.css) — sans `preconnect`, sans `@font-face` self-hosté. Pour Arrow (perf/offline/RGPD), prévoir `preconnect` + éventuel self-host. Attention : des graisses Orbitron non importées (ex. 500/600) retombent silencieusement sur 400.
- **`responsive.css`** existe et est importé mais **absent de `COMPONENTS.md`** (à documenter).
- **Footer** présent en CSS mais non démontré dans `components-demo.html`.
- **Tokens écartés par l'audit** (valeurs inexistantes dans le code, ne pas réintroduire) : `--neon-primary-a03` (le seul `0.03` du repo est cyan), `--neon-radius-pill: 50px` (aucun `border-radius:50px` ; rayons réels : `50%`, `8px`, `10px`).

## 11. Carte des fichiers

```
DESIGN-SYSTEM.md      ← ce document (vue d'ensemble + tokens)
css/tokens.css        ← 194 design tokens :root (valeurs exactes + usages)
COMPONENTS.md         ← API détaillée des composants (markup, variantes)
components-demo.html  ← démo vivante des composants
css/
  main.css            ← base, effets, layout, @import polices (ligne 1)
  nav.css, form.css, brutal-modal.css
  components/*.css     ← buttons, inputs, cards, badges, alerts, modal,
                          progress, loader, divider, tooltip, footer, responsive
js/main.js            ← fond géométrique, tilt 3D, parallaxe, slider, matrix
```
