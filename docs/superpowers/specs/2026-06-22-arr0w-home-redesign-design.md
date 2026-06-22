# Refonte de la home arr0w.app — Design

> Spec validée en brainstorming le 2026-06-22. Cible : `VenioProd/arrowNeon` @ `origin/main` (site Astro `arrow-marketing`, https://arr0w.app). Branche de travail : `claude/redesign-arr0w`.

## 1. Contexte & objectif

Le site marketing Arrow (Astro + Sanity) a une home dont le hero est **abstrait** (graphe orbital, cartes Absences/Notes/Docs/Suivis flottantes) : le produit n'est **jamais montré concrètement**.

**Objectif n°1 : clarté produit.** Un visiteur doit comprendre en ~5 s ce que fait Arrow et à quoi ça ressemble.

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Périmètre | Toute la home (hero + sections), refonte de fond en comble |
| Direction visuelle | **B — Néon raffiné (dark)** : on garde l'ADN sombre, on le nettoie, le produit passe au premier plan |
| Visuels produit | **Mockups d'UI conçus** en HTML/CSS (pas de dépendance aux vrais screenshots) |
| Thèmes | **Dual-thème** : dark livré d'abord, light raffiné ensuite — dans tous les cas les deux |
| Archi | On reste sur Astro + CSS modulaire existant (`src/styles/css/`), pas de framework UI ajouté, contenu Sanity inchangé |

## 3. Langage visuel (dark raffiné)

Évolution de `src/styles/css/tokens.css` (qui définit déjà `:root` dark + `:root[data-theme="light"]`).

- **Palette resserrée** : fond sombre plus neutre/profond ; **un seul accent** bleu électrique (`--primary`). Les accents cyan/violet/magenta/orange actuels (« carnaval de néons ») sont **rangés en rôles sémantiques** : alerte = rose/rouge, succès = vert, warning = ambre. Plus de néons décoratifs multiples dans le hero.
- **Glow maîtrisé** : lueur réservée aux éléments clés (highlight du titre, CTA primaire, carte produit active). Suppression des glows systématiques qui brouillent la lecture. Tokens `--text-glow` / `--theme-box-shadow` conservés mais appliqués avec parcimonie.
- **Typographie nettoyée** : titres serrés (letter-spacing négatif), corps plus lisible, réduction de l'uppercase. Display (Orbitron) réservé à des accents ponctuels ; corps en sans lisible.
- **Surfaces** : cartes calmes (bordure fine `--border` + fond légèrement clair) ; `clip-path` anguleux **conservé comme signature mais dosé**, pas systématique.

Le light (`:root[data-theme="light"]`) sera retravaillé en miroir une fois le dark figé.

## 4. Narratif de la home (orienté clarté)

Remplace l'actuel Hero abstrait → Comparatif → Positionnement → Preuve.

1. **Hero produit** — H1 « Chaque étudiant, une seule vue claire » + sous-titre (absences, notes, bulletins, documents, commentaires réunis par étudiant) + 2 CTAs (Demander une démo / Voir une fiche étudiant) + signaux de confiance (RGPD & hébergement FR, mise en route rapide). Visuel = **fiche étudiant** (mockup), pas l'orbital.
2. **Le problème en 1 ligne** — « Vos infos étudiants sont éclatées dans 5 outils » → Arrow les réunit. Mini avant/après (réutilise/raffine le comparatif existant `#difference`).
3. **Comment ça marche — 3 étapes** : **Centraliser → Repérer (alertes) → Décider / Prouver**, chaque étape avec un *peek* produit. ⭐ Ajout clé pour la clarté.
4. **4 piliers produit** illustrés : Absences/Alertes · Notes/Bulletins · Documents/Preuves · Suivis/Commentaires (cartes avec vrai produit, pas d'icônes abstraites).
5. **Pour qui** — écoles sup · CFA · équipes scolarité (segmentation rapide).
6. **Preuve sociale** — témoignages + logos (conservés, raffinés).
7. **Diagnostic terrain** — l'actuel « Mode Brutal » conservé en deep-dive optionnel (modal ou section), nettoyé au nouveau langage.
8. **CTA final** — démo.

## 5. Système de mockups produit (composants)

Composants HTML/CSS réutilisables, fidèles au produit, sans vrais screenshots :

- **`fiche-etudiant`** — carte : en-tête (avatar initiales, nom, classe/groupe, badge « N alertes »), 4 stats (Absences / Moyenne / Bulletins / Documents), liste d'événements colorés (alerte, baisse de moyenne, document signé). Utilisée hero (§1) + piliers (§4).
- ***peeks* dérivés** — liste d'alertes, mini-dashboard, vue sessions — pour les 3 étapes (§3) et les piliers (§4).

Implémentés comme partials Astro réutilisables (ex. `src/components/mock/…`) — introduit un dossier `components/` (aujourd'hui absent, markup inline dans les pages) pour ces blocs réutilisables.

## 6. Périmètre fichiers (indicatif)

- `src/styles/css/tokens.css` — raffinage palette/glow/typo (dark `:root`, puis light override).
- `src/styles/css/pages/index.css` — refonte des sections de la home.
- `src/styles/css/components/*` — ajustements boutons / cartes / nav au nouveau langage.
- `src/pages/index.astro` — nouveau markup des 8 sections.
- `src/components/mock/*` (nouveau) — composants mockups produit.
- `src/styles/css/brutal-modal.css` — alignement du « diagnostic terrain ».

## 7. Hors périmètre

- Les autres pages (Fonctionnalités, Pour qui, Démo, Tarifs, Blog, À propos…) — la refonte démarre par la home ; les pages suivront éventuellement (chantier séparé).
- Le contenu Sanity, les routes API (`demo-request`, `newsletter-*`), le back-office.
- Le prototype cyberpunk (`arrowNeon` branches `claude/*`) et le produit SaaS (`VenioProd/arrow`) — projets distincts.

## 8. Phasage

1. **Dark** — design system raffiné + 8 sections + composants mockups, thème sombre figé et validé visuellement (build + screenshots).
2. **Light** — override `:root[data-theme="light"]` retravaillé en miroir, parité visuelle sur toutes les sections, toggle vérifié.

## 9. Critères de succès

- Le produit est visible **dès le hero** (fiche étudiant) et réapparaît dans « comment ça marche » + piliers.
- Un visiteur identifie en ~5 s : *quoi* (vue étudiant centralisée), *pour qui* (écoles sup/CFA/scolarité), *bénéfice* (repérer/justifier/décider).
- `astro check` 0 erreur + `astro build` OK (Node 22).
- Dark **et** light rendent correctement (toggle), sans glow parasite ni illisibilité.
- Lisibilité/scannabilité supérieure à l'actuel (hiérarchie nette, accent unique).

## 10. Choix par défaut (confirmables)

Pour rester décisif, defaults retenus — à infirmer si besoin :

- **Diagnostic terrain** : conservé **en modal** (déjà fonctionnel), nettoyé au nouveau langage — pas de réécriture en section inline.
- **Tarifs/FAQ sur la home** : **non** ajoutés (YAGNI) — on garde les pages dédiées. Un simple lien depuis le CTA final suffit.
- **Display** : **Orbitron conservé**, mais dosé (accents ponctuels), corps en sans lisible.
