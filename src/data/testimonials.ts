// Preuve sociale — témoignages et logos clients.
//
// ⚠️ N'ajouter ICI que des éléments RÉELS (verbatims réellement recueillis,
// logos pour lesquels l'établissement a donné son accord). Tant que les
// tableaux sont vides, aucune section ne s'affiche sur le site — c'est voulu :
// pas de fausse preuve sociale.

export type Testimonial = {
  /** Le verbatim, tel quel. */
  quote: string
  /** Prénom + nom, ou initiale si anonymisé (ex: "Sophie M."). */
  author: string
  /** Rôle + établissement (ex: "Responsable scolarité, ESG"). */
  role: string
}

export type ClientLogo = {
  /** Nom de l'établissement (sert d'alt text). */
  name: string
  /** Chemin du logo dans public/ (ex: "/brand/clients/esg.svg"). */
  src: string
}

export const testimonials: Testimonial[] = [
  // {
  //   quote: "Depuis Arrow, retrouver une absence ou sortir un bulletin nous prend deux fois moins de temps.",
  //   author: "Sophie M.",
  //   role: "Responsable scolarité, École X",
  // },
]

export const clientLogos: ClientLogo[] = [
  // { name: "École X", src: "/brand/clients/ecole-x.svg" },
]
