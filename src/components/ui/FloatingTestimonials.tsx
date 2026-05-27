import { Star } from 'lucide-react'

const TESTIMONIALS = [
  // Rangée du haut (4 cartes)
  { name: 'Thomas R.',      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',   role: 'Abonné Premium',  text: "Je suis les prédictions depuis 3 mois. Le niveau de confiance FORT est vraiment fiable — 73% de succès de mon côté. Je ne mise plus sans consulter EquiPredict avant chaque course.", stars: 5 },
  { name: 'Marie-Claire D.',avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Abonnée Pro',     text: "Les analyses de terrain sont bluffantes. Surtout sur l'obstacle sous la pluie — EquiPredict identifie les spécialistes parfaitement. Un outil indispensable pour les passionnés.", stars: 5 },
  { name: 'Julien B.',      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',   role: 'Abonné Premium',  text: "Interface propre, prédictions pertinentes, justification claire. Enfin une vraie IA pour le PMU ! J'ai gagné en régularité depuis que j'utilise l'application chaque semaine.", stars: 4 },
  { name: 'Antoine L.',     avatar: 'https://randomuser.me/api/portraits/men/54.jpg',   role: 'Abonné Pro',      text: "Le suivi des cotes en temps réel change tout. Quand EquiPredict détecte une chute de cote sur un favori IA, c'est presque toujours bon signe. Résultats bluffants sur le quinté.", stars: 5 },
  // Rangée du bas (4 cartes)
  { name: 'Sophie M.',      avatar: 'https://randomuser.me/api/portraits/women/68.jpg', role: 'Abonnée Pro',     text: "Les statistiques avancées du plan Pro sont une mine d'or. Je compare les entraîneurs, les hippodromes, les conditions de terrain — tout y est. Mon taux de réussite a bondi de 20% en 6 semaines.", stars: 5 },
  { name: 'Rémi V.',        avatar: 'https://randomuser.me/api/portraits/men/12.jpg',   role: 'Abonné Premium',  text: "J'étais sceptique au départ mais les résultats parlent d'eux-mêmes. Sur les courses de trot à Vincennes, EquiPredict m'a sorti des gagnants que je n'aurais jamais joués seul.", stars: 5 },
  { name: 'Isabelle F.',    avatar: 'https://randomuser.me/api/portraits/women/21.jpg', role: 'Abonnée Premium', text: "Simple, rapide, efficace. En 2 minutes j'ai mon top 3 pour la journée avec les explications. Je recommande à tous mes amis passionnés de courses.", stars: 4 },
  { name: 'Nathalie B.',    avatar: 'https://randomuser.me/api/portraits/women/33.jpg', role: 'Abonnée Premium', text: "Je n'y connaissais rien aux courses hippiques au départ. EquiPredict m'a permis de comprendre les critères clés et de miser intelligemment. Maintenant je suis accro !", stars: 4 },
]

type Cfg = {
  top: number
  left?: string
  right?: string
  width: number
  rotate: number
  dur: number
  delay: number
  z: number
}

// 4 cartes par rangée — positions horizontales ~0%, 24%, 48%, right 0%
const LAYOUT: Cfg[] = [
  // Rangée haute
  { top: 0,   left: '0%',   width: 308, rotate: -4,  dur: 5.6, delay: 0,   z: 1 },
  { top: 50,  left: '24%',  width: 292, rotate:  3,  dur: 6.4, delay: 0.9, z: 2 },
  { top: 12,  left: '48%',  width: 302, rotate: -2,  dur: 4.9, delay: 1.6, z: 1 },
  { top: 58,  right: '0%',  width: 286, rotate:  4,  dur: 5.8, delay: 0.5, z: 2 },
  // Rangée basse
  { top: 400, left: '0%',   width: 295, rotate:  2,  dur: 7.1, delay: 0.3, z: 2 },
  { top: 430, left: '24%',  width: 308, rotate: -5,  dur: 5.3, delay: 1.3, z: 3 },
  { top: 415, left: '48%',  width: 292, rotate:  3,  dur: 6.2, delay: 2.0, z: 1 },
  { top: 440, right: '0%',  width: 304, rotate: -3,  dur: 4.7, delay: 1.7, z: 2 },
]

function Card({ name, avatar, role, text, stars }: typeof TESTIMONIALS[0]) {
  return (
    <div className="bg-black/55 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-eq-amber fill-eq-amber" />
        ))}
      </div>
      <p className="text-white text-sm leading-relaxed mb-5">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0" />
        <div>
          <div className="font-semibold text-sm text-white">{name}</div>
          <div className="text-xs text-eq-green">{role}</div>
        </div>
      </div>
    </div>
  )
}

export default function FloatingTestimonials() {
  return (
    <>
      {/* Desktop: scattered floating layout */}
      <div className="hidden lg:block relative mx-auto" style={{ height: '760px', maxWidth: '1280px' }}>
        {TESTIMONIALS.map((t, i) => {
          const cfg = LAYOUT[i]
          const pos: React.CSSProperties = {
            position: 'absolute',
            top: cfg.top,
            width: cfg.width,
            zIndex: cfg.z,
            animation: `float-card ${cfg.dur}s ease-in-out ${cfg.delay}s infinite`,
            ...(cfg.left  !== undefined ? { left:  cfg.left  } : {}),
            ...(cfg.right !== undefined ? { right: cfg.right } : {}),
          }
          return (
            <div key={t.name} style={pos}>
              <div style={{
                position: 'absolute', inset: '-24px',
                background: 'radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)',
                filter: 'blur(24px)', borderRadius: '50%', zIndex: -1, pointerEvents: 'none',
              }} />
              <div style={{ transform: `rotate(${cfg.rotate}deg)` }}>
                <Card {...t} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile / tablet: simple grid */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-4">
        {TESTIMONIALS.map(t => <Card key={t.name} {...t} />)}
      </div>
    </>
  )
}
