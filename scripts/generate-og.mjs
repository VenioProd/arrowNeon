// scripts/generate-og.mjs
//
// Génère les images OpenGraph PNG (1200×630) par page à partir d'un template
// SVG aux couleurs Arrow. Les réseaux sociaux (LinkedIn/Facebook) ne rendent
// pas les SVG en image OG — d'où la rasterisation en PNG via sharp.
//
// Lancer : node scripts/generate-og.mjs
// Sortie  : public/og/<slug>.png

import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../public/og')

/** @type {{slug:string, eyebrow:string, lines:string[]}[]} */
const PAGES = [
  { slug: 'default', eyebrow: 'BÊTA POUR ÉCOLES SUPÉRIEURES PRIVÉES', lines: ['Le suivi étudiant,', 'enfin réuni dans', 'un espace clair.'] },
  { slug: 'fonctionnalites', eyebrow: 'FONCTIONNALITÉS', lines: ['Planning, pédagogie,', 'suivi — au même', 'endroit.'] },
  { slug: 'demo', eyebrow: 'DÉMO INTERACTIVE', lines: ['Arrow en conditions', 'réelles, en quelques', 'minutes.'] },
  { slug: 'blog', eyebrow: 'BLOG ARROW', lines: ['Ressources pour les', 'équipes pédagogiques', 'et scolarité.'] },
  { slug: 'tarifs', eyebrow: 'BÊTA & TARIFS', lines: ['1 mois offert,', 'puis une grille', 'claire.'] },
  { slug: 'pour-qui', eyebrow: 'POUR QUI ?', lines: ['Écoles supérieures,', 'CFA et organismes', 'de formation.'] },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svgFor({ eyebrow, lines }) {
  const titleY = 362
  const step = 82
  const titles = lines
    .map((line, i) => `<text x="160" y="${titleY + i * step}" fill="#F8FAFC" font-family="Arial, sans-serif" font-size="80" font-weight="800">${esc(line)}</text>`)
    .join('\n  ')

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#05060f"/>
  <rect x="56" y="56" width="1088" height="518" rx="28" fill="url(#panel)" stroke="rgba(61,155,255,0.24)"/>
  <g filter="url(#glow)">
    <path d="M651 156 L823 515 L742 515 L638 307 L589 307 Z" fill="#3d9bff"/>
    <path d="M579 286 L675 515 L614 515 L578 438 L541 515 L482 515 Z" fill="#3d9bff"/>
  </g>
  <text x="160" y="252" fill="#3d9bff" font-family="Arial, sans-serif" font-size="34" letter-spacing="6">${esc(eyebrow)}</text>
  ${titles}
  <defs>
    <linearGradient id="panel" x1="600" y1="56" x2="600" y2="574" gradientUnits="userSpaceOnUse">
      <stop stop-color="#11182d"/>
      <stop offset="1" stop-color="#0b1020"/>
    </linearGradient>
    <filter id="glow" x="442" y="116" width="421" height="439" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur_0_1"/>
    </filter>
  </defs>
</svg>`
}

await mkdir(OUT_DIR, { recursive: true })

for (const page of PAGES) {
  const svg = svgFor(page)
  const out = resolve(OUT_DIR, `${page.slug}.png`)
  await sharp(Buffer.from(svg)).png().toFile(out)
  console.log(`✓ ${page.slug}.png`)
}

console.log(`\n${PAGES.length} images OG générées dans public/og/`)
