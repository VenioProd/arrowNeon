// Configuration runtime du frontend NEON GRID / Arrow.
// Modifiable sans toucher au code applicatif (js/form.js).
//
// contactEndpoint : URL du backend de traitement des formulaires.
//   - même domaine (serveur Node ou déploiement Vercel) : '/api/contact'
//   - backend sur un autre hôte : URL absolue, ex 'https://api.arrow.example/contact'
window.ARROW_CONFIG = window.ARROW_CONFIG || {
  contactEndpoint: '/api/contact',
};
