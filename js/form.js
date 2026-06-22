// Gestion des formulaires — NEON GRID / Arrow
//
// Enhancer progressif et générique : tout formulaire portant l'attribut
// `data-arrow-form="contact|inscription"` est rendu fonctionnel
// (validation, honeypot anti-spam, états loading/succès/erreur, envoi JSON
// vers le backend défini dans js/config.js). Compatible avec l'ancien
// `#contactForm` (traité par défaut comme un formulaire de type "contact").

(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[\d\s+\-.()]{6,20}$/;
  var HONEYPOT_NAME = '_hp';
  var NOM_MIN = 2;
  var MESSAGE_MIN = 10;

  function getEndpoint() {
    var cfg = window.ARROW_CONFIG || {};
    return cfg.contactEndpoint || '/api/contact';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('form[data-arrow-form], #contactForm');
    Array.prototype.forEach.call(forms, enhanceForm);
  });

  function enhanceForm(form) {
    if (form.__arrowEnhanced) return;
    form.__arrowEnhanced = true;

    if (!form.getAttribute('data-arrow-form')) {
      form.setAttribute('data-arrow-form', 'contact');
    }

    ensureHoneypot(form);
    form.setAttribute('novalidate', 'novalidate');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(form);
    });
  }

  // Injecte un champ honeypot caché si absent (les bots le remplissent).
  function ensureHoneypot(form) {
    if (form.querySelector('[name="' + HONEYPOT_NAME + '"]')) return;
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
    var input = document.createElement('input');
    input.type = 'text';
    input.name = HONEYPOT_NAME;
    input.tabIndex = -1;
    input.autocomplete = 'off';
    wrap.appendChild(input);
    form.appendChild(wrap);
  }

  function getFeedbackHost(form) {
    var host = form.querySelector('[data-arrow-feedback]');
    if (host) return host;
    // Cherche un conteneur partagé dans le document, sinon en crée un avant le form.
    host = document.querySelector('[data-arrow-feedback]');
    if (host) return host;
    host = document.createElement('div');
    host.setAttribute('data-arrow-feedback', '');
    host.setAttribute('aria-live', 'polite');
    form.parentNode.insertBefore(host, form);
    return host;
  }

  function clearFeedback(form) {
    var host = getFeedbackHost(form);
    host.innerHTML = '';
  }

  function showAlert(form, variant, title, lines) {
    var host = getFeedbackHost(form);
    // Une seule région live : l'urgence est pilotée sur l'hôte (pas de role imbriqué
    // qui ferait doublonner l'annonce des lecteurs d'écran).
    host.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
    var el = document.createElement('div');
    el.className = 'alert alert-' + variant;
    el.setAttribute('tabindex', '-1');
    var html = '<div class="alert-title">' + escapeHtml(title) + '</div>';
    if (lines && lines.length) {
      html += lines.map(function (l) { return '<div>' + escapeHtml(l) + '</div>'; }).join('');
    }
    el.innerHTML = html;
    host.innerHTML = '';
    host.appendChild(el);
    // Focus programmatique : repère fiable indépendant du support aria-live.
    try { el.focus(); } catch (_) { /* noop */ }
    try {
      host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) { /* noop */ }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function collect(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (value, key) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    data.formType = form.getAttribute('data-arrow-form') || 'contact';
    return data;
  }

  // Validation client : symétrique du backend (api/contact.js), enrichie des
  // contrôles de format hérités de l'audit (longueur min, format téléphone).
  function validate(form, data) {
    var errors = [];
    var firstInvalid = null;
    var isContact = data.formType !== 'inscription';

    function flag(name, message) {
      errors.push(message);
      if (!firstInvalid) firstInvalid = (form.elements && form.elements[name]) || null;
    }

    var required = isContact
      ? ['nom', 'email', 'etablissement', 'type', 'message']
      : ['email'];

    required.forEach(function (name) {
      var field = form.elements[name];
      // Seuls les champs présents dans le markup sont vérifiés.
      if (!field) return;
      if (!data[name]) flag(name, labelFor(form, name) + ' : champ requis');
    });

    if (data.email && !EMAIL_RE.test(data.email)) {
      flag('email', 'Adresse e-mail invalide');
    }
    if (isContact && data.nom && data.nom.length < NOM_MIN) {
      flag('nom', 'Nom : au moins ' + NOM_MIN + ' caractères');
    }
    if (isContact && data.message && data.message.length < MESSAGE_MIN) {
      flag('message', 'Message : au moins ' + MESSAGE_MIN + ' caractères');
    }
    if (data.telephone && !PHONE_RE.test(data.telephone)) {
      flag('telephone', 'Numéro de téléphone invalide');
    }

    return { valid: errors.length === 0, errors: errors, firstInvalid: firstInvalid };
  }

  function labelFor(form, name) {
    var field = form.elements[name];
    if (field && field.id) {
      var lbl = form.querySelector('label[for="' + field.id + '"]');
      if (lbl) return lbl.textContent.replace('*', '').trim();
    }
    return name;
  }

  function setLoading(form, loading) {
    var btn = form.querySelector('button[type="submit"], .form-button, button:not([type])');
    if (!btn) return;
    if (loading) {
      btn.__originalText = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = 'ENVOI EN COURS…';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.__originalText !== undefined) btn.innerHTML = btn.__originalText;
    }
  }

  function handleSubmit(form) {
    clearFeedback(form);
    var data = collect(form);

    // Honeypot rempli => bot. On simule le succès sans rien envoyer.
    if (data[HONEYPOT_NAME]) {
      showAlert(form, 'success', 'Merci !', ['Votre demande a bien été prise en compte.']);
      form.reset();
      return;
    }
    delete data[HONEYPOT_NAME];

    var check = validate(form, data);
    if (!check.valid) {
      showAlert(form, 'error', 'Formulaire incomplet', check.errors);
      if (check.firstInvalid && check.firstInvalid.focus) check.firstInvalid.focus();
      return;
    }

    setLoading(form, true);

    // Promise.resolve() pour capturer aussi un throw SYNCHRONE (ex: fetch indisponible)
    // dans le .catch, et garantir que setLoading(false) s'exécute toujours.
    Promise.resolve()
      .then(function () { return sendForm(getEndpoint(), data); })
      .then(function (res) {
        if (res.ok) {
          showAlert(form, 'success', 'Demande envoyée', [
            'Merci ! Notre équipe vous recontactera très vite.',
          ]);
          form.reset();
        } else {
          var lines = [res.error || 'Une erreur est survenue.'];
          if (res.fields) {
            Object.keys(res.fields).forEach(function (f) {
              lines.push(labelFor(form, f) + ' : ' + res.fields[f]);
            });
          }
          showAlert(form, 'error', 'Envoi impossible', lines);
        }
      })
      .catch(function () {
        showAlert(form, 'error', 'Connexion impossible', [
          'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
        ]);
      })
      .then(function () {
        setLoading(form, false);
      });
  }

  function sendForm(endpoint, data) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function (response) {
      return response
        .json()
        .catch(function () { return { ok: response.ok }; })
        .then(function (body) {
          if (body && typeof body.ok === 'boolean') return body;
          return {
            ok: response.ok,
            error: response.ok ? null : 'Erreur serveur (' + response.status + ')',
          };
        });
    });
  }
})();
