# NEON GRID - Design System Components

Bibliothèque de composants réutilisables pour le design system Arrow.

## Structure

```
css/
  components/
    buttons.css      # Boutons (Primary, Secondary, Ghost, Icon, Small)
    inputs.css        # Inputs, Textarea, Select, Checkbox, Radio
    cards.css         # Cards
    badges.css        # Badges & Tags
    alerts.css        # Alerts
    modal.css         # Modal
    progress.css      # Progress Bar
    loader.css        # Loader
    divider.css       # Divider
    tooltip.css       # Tooltip
    footer.css        # Footer
    responsive.css    # Media queries transverses (boutons, cards, modal…)
  components.css      # Import de tous les composants
```

> Tokens, palette, typographie et effets : voir [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) et [css/tokens.css](css/tokens.css).

## Utilisation

### Import global
```html
<link rel="stylesheet" href="css/components.css">
```

### Import individuel
```html
<link rel="stylesheet" href="css/components/buttons.css">
<link rel="stylesheet" href="css/components/inputs.css">
```

## Composants disponibles

### Boutons

#### Primary Button
```html
<button class="btn-primary">Action principale</button>
<a href="#" class="btn-primary">Lien bouton</a>
```

#### Secondary Button
```html
<button class="btn-secondary">Action secondaire</button>
```

#### Ghost Button
```html
<button class="btn-ghost">Action discrète</button>
```

#### Small Button
```html
<button class="btn-small">Petit bouton</button>
```

#### Icon Button
```html
<button class="btn-icon">↗</button>
```

### Inputs & Forms

#### Input Field
```html
<div class="input-group">
    <label class="input-label">Label</label>
    <input type="text" class="input-field" placeholder="Placeholder">
</div>
```

#### Textarea
```html
<div class="input-group">
    <label class="input-label">Message</label>
    <textarea class="input-field" placeholder="Votre message"></textarea>
</div>
```

#### Select
```html
<div class="input-group">
    <label class="input-label">Choix</label>
    <select class="input-field">
        <option>Option 1</option>
        <option>Option 2</option>
    </select>
</div>
```

#### Checkbox
```html
<label class="checkbox-container">
    <input type="checkbox" class="checkbox-input">
    <span class="checkbox-label">Label checkbox</span>
</label>
```

#### Radio
```html
<label class="radio-container">
    <input type="radio" name="group" class="radio-input">
    <span class="radio-label">Label radio</span>
</label>
```

### Cards
```html
<div class="card">
    <h3 class="card-title">Titre</h3>
    <p class="card-content">Contenu de la carte</p>
</div>
```

### Badges
```html
<span class="badge">Par défaut</span>
<span class="badge badge-success">Succès</span>
<span class="badge badge-warning">Attention</span>
<span class="badge badge-error">Erreur</span>
```

### Alerts
```html
<div class="alert">
    <div class="alert-title">Information</div>
    Message d'information
</div>

<div class="alert alert-success">
    <div class="alert-title">Succès</div>
    Message de succès
</div>

<div class="alert alert-warning">
    <div class="alert-title">Attention</div>
    Message d'avertissement
</div>

<div class="alert alert-error">
    <div class="alert-title">Erreur</div>
    Message d'erreur
</div>
```

### Modal
```html
<!-- Bouton pour ouvrir -->
<button class="btn-primary" onclick="openModal('myModal')">Ouvrir</button>

<!-- Modal -->
<div id="myModal" class="modal-overlay" style="display: none;">
    <div class="modal">
        <button class="modal-close" onclick="closeModal('myModal')">×</button>
        <h3 class="modal-title">Titre</h3>
        <div class="modal-content">
            Contenu du modal
        </div>
    </div>
</div>

<script src="js/components/modal.js"></script>
```

### Progress Bar
```html
<div class="progress-container">
    <div class="progress-bar" style="width: 75%;"></div>
</div>
```

### Loader
```html
<div class="loader"></div>
```

### Divider
```html
<div class="divider"></div>
```

### Tooltip
```html
<div class="tooltip-container">
    <button class="btn-secondary">Survolez-moi</button>
    <div class="tooltip">Texte du tooltip</div>
</div>
```

### Footer
```html
<footer class="footer">
    <div class="footer-content">
        <div>
            <h3 class="footer-section-title">Section</h3>
            <ul class="footer-links">
                <li><a href="#" class="footer-link">Lien</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        © 2025 Arrow
    </div>
</footer>
```

## Page de démonstration

Consultez `components-demo.html` pour voir tous les composants en action.



