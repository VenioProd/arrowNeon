// Équipe Arrow — affichée sur la page À propos.
//
// ⚠️ Renseigner des personnes RÉELLES. Tant que le tableau est vide,
// la section équipe ne s'affiche pas.

export type TeamMember = {
  /** Prénom + nom. */
  name: string
  /** Rôle (ex: "Cofondateur", "Produit & design"). */
  role: string
  /** Chemin de la photo dans public/ (ex: "/brand/team/raphael.jpg"). Optionnel. */
  photo?: string
  /** Courte phrase de présentation. Optionnel. */
  bio?: string
  /** Profil LinkedIn. Optionnel. */
  linkedin?: string
}

export const team: TeamMember[] = [
  // {
  //   name: "Raphaël Bentvelzen",
  //   role: "Fondateur",
  //   photo: "/brand/team/raphael.jpg",
  //   bio: "Construit Arrow pour rendre le suivi étudiant plus clair.",
  //   linkedin: "https://www.linkedin.com/in/...",
  // },
]
