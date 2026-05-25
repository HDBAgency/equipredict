import React from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart3, Zap, Shield, Target, Users, Star } from 'lucide-react'
import ScrollRevealTitle from '@/components/ui/ScrollRevealTitle'
import HeroTitle from '@/components/ui/HeroTitle'
import ScrollRevealHeading from '@/components/ui/ScrollRevealHeading'
import VideoCarousel from '@/components/ui/VideoCarousel'

const STATS = [
  { value: '87.4%', label: 'Précision moyenne', icon: Target },
  { value: '5 000+', label: 'Prédictions générées', icon: BarChart3 },
  { value: '3 sec', label: "Temps d'analyse", icon: Zap },
  { value: '12 000+', label: 'Utilisateurs actifs', icon: Users },
]

const HOW_STEPS = [
  {
    step: '01',
    title: 'Collecte des données',
    desc: 'Notre moteur agrège en temps réel les données de forme, cotes, météo, terrain, jockeys et entraîneurs pour chaque course.',
    icon: BarChart3,
  },
  {
    step: '02',
    title: 'Analyse IA multicritères',
    desc: "Sept facteurs pondérés analysent chaque partant : forme récente, distance, terrain, jockey, entraîneur, évolution des cotes et régularité.",
    icon: TrendingUp,
  },
  {
    step: '03',
    title: 'Prédictions claires',
    desc: 'Un top 3 recommandé avec probabilités, niveau de confiance (Faible / Moyen / Fort) et justification détaillée.',
    icon: Target,
  },
]

const VIDEOS = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4',
  '/videos/video6.mp4',
]

const TESTIMONIALS = [
  { name: 'Thomas R.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Abonné Premium', text: "Je suis les prédictions depuis 3 mois. Le niveau de confiance FORT est vraiment fiable — 73% de succès de mon côté. Je ne mise plus sans consulter EquiPredict avant chaque course.", stars: 5 },
  { name: 'Marie-Claire D.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Abonnée Pro', text: "Les analyses de terrain sont bluffantes. Surtout sur l'obstacle sous la pluie — EquiPredict identifie les spécialistes parfaitement. Un outil indispensable pour les passionnés.", stars: 5 },
  { name: 'Julien B.', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', role: 'Abonné Premium', text: "Interface propre, prédictions pertinentes, justification claire. Enfin une vraie IA pour le PMU ! J'ai gagné en régularité depuis que j'utilise l'application chaque semaine.", stars: 4 },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden -mt-16" style={{ minHeight: '1080px', width: '100%' }}>
        {/* Photo de fond */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/photo/4.jpg"
            alt=""
            style={{ width: '1920px', height: '1080px', maxWidth: 'none', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative flex items-center justify-center" style={{ minHeight: '1080px', paddingBottom: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <HeroTitle />

          <p className="text-sm sm:text-base text-white max-w-2xl mx-auto mb-10 animate-fade-up font-bold" style={{ animationDelay: '0.2s' }}>
            Analysez les données, anticipez les performances et obtenez des prédictions claires
            avec niveau de confiance pour chaque course du jour.
          </p>

          <div className="flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 text-base"
              style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}
            >
              VOIR LES PRONOSTICS DU JOUR
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-xs text-white mt-6 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Prédictions informatives · 18+ · Jouez responsable
          </p>

          <div className="flex justify-center mt-6">
            <Link
              href="/login"
              className="btn-connexion text-white font-black text-lg tracking-tight px-6 py-2 border border-white/20 rounded-xl"
            >
              <span className="btn-connexion-text">CONNEXION</span>
            </Link>
          </div>

        </div>
        </div>
      </section>

      {/* PMU App */}
      <section className="relative bg-black" style={{ height: '1080px' }}>
        <ScrollRevealTitle />
        <img
          src="/photo/pmu.png"
          alt="PMU"
          style={{ height: '700px', width: 'auto', position: 'absolute', top: 'calc(50% + 100px)', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm absolute animate-float-left" style={{ width: '380px', bottom: '0px', left: '250px' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Prix du Jockey Club · Chantilly</span>
          </div>
          {[
            { medal: '🥇', name: 'Mystère Bleu', prob: '32.4%', score: 91, level: 'FORT', badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
            { medal: '🥈', name: 'Roi Soleil II', prob: '22.1%', score: 83, level: 'FORT', badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
            { medal: '🥉', name: 'Tempête du Soir', prob: '17.5%', score: 77, level: 'MOYEN', badge: 'bg-eq-amber/15 text-eq-amber border-eq-amber/30' },
          ].map((h, i) => (
            <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-white/10' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{h.medal}</span>
                <div>
                  <div className="font-semibold text-sm text-white">{h.name}</div>
                  <div className="text-[11px] text-white/50">Score IA: {h.score}/100</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg text-white">{h.prob}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${h.badge}`}>{h.level}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm absolute animate-float-right" style={{ width: '380px', bottom: '0px', right: '250px' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Grand Prix de Paris · Longchamp</span>
          </div>
          {[
            { medal: '🥇', name: 'Éclat de Lune', prob: '28.7%', score: 88, level: 'FORT', badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
            { medal: '🥈', name: 'Vent du Nord', prob: '19.3%', score: 81, level: 'FORT', badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
            { medal: '🥉', name: 'Cap Ferret', prob: '14.8%', score: 72, level: 'MOYEN', badge: 'bg-eq-amber/15 text-eq-amber border-eq-amber/30' },
          ].map((h, i) => (
            <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-white/10' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{h.medal}</span>
                <div>
                  <div className="font-semibold text-sm text-white">{h.name}</div>
                  <div className="text-[11px] text-white/50">Score IA: {h.score}/100</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg text-white">{h.prob}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${h.badge}`}>{h.level}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partenaires */}
      <section className="bg-black pt-40 pb-10 overflow-hidden border-t border-white/5">
<div className="overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            {[
              { src: '/photo/partenaires/PMU.svg.png', alt: 'PMU' },
              { src: '/photo/partenaires/Equidia_logo_2018.svg.png', alt: 'Equidia' },
              { src: '/photo/partenaires/Logo_Canal+_1995.svg.png', alt: 'Canal+' },
              { src: '/photo/partenaires/Logo_LeTROT.svg.png', alt: 'Le Trot' },
              { src: '/photo/partenaires/RMC_2025.svg.png', alt: 'RMC' },
              { src: '/photo/partenaires/23fglogo820blanc.png', alt: 'Partenaire' },
              { src: '/photo/partenaires/PMU.svg.png', alt: 'PMU' },
              { src: '/photo/partenaires/Equidia_logo_2018.svg.png', alt: 'Equidia' },
              { src: '/photo/partenaires/Logo_Canal+_1995.svg.png', alt: 'Canal+' },
              { src: '/photo/partenaires/Logo_LeTROT.svg.png', alt: 'Le Trot' },
              { src: '/photo/partenaires/RMC_2025.svg.png', alt: 'RMC' },
              { src: '/photo/partenaires/23fglogo820blanc.png', alt: 'Partenaire' },
            ].map((logo, i) => (
              <img key={i} src={logo.src} alt={logo.alt} style={{ height: '48px', width: 'auto', display: 'inline-block', marginRight: '100px', opacity: 0.7 }} />
            ))}
          </div>
        </div>
      </section>

      {/* Vidéos TikTok — carousel 3D */}
      <section className="bg-black pt-60 pb-20">
        <div className="text-center mb-16">
          <ScrollRevealHeading line1="LES COURSES" line2="EN VIDÉO" />
        </div>
        <VideoCarousel videos={VIDEOS} />
      </section>

      {/* Stats sources de données */}
      <section className="relative overflow-hidden pt-40 pb-24 border-t border-white/5">
        <img
          src="/photo/1.jpg"
          alt=""
          style={{ width: '1920px', height: '100%', minHeight: '400px', maxWidth: 'none', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', objectFit: 'cover' }}
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <ScrollRevealHeading line1="NOUS ANALYSONS" line2="+150 SOURCES" className="mb-6" />
          <p className="text-white font-bold text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Des millions de données hippiques analysées à partir de plus de 150 sources pour prédire chaque course.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-black pt-60 pb-24 border-t border-white/5">
        <div className="px-8">
          <ScrollRevealHeading line1={"Ce qu'en disent"} line2="nos utilisateurs" />
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto mt-20" style={{ gap: '25px' }}>
            {TESTIMONIALS.map(({ name, avatar, role, text, stars }) => (
              <div key={name} className="bg-black/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-eq-amber fill-eq-amber" />
                  ))}
                </div>
                <p className="text-white text-base leading-relaxed mb-6" style={{ minHeight: '72px' }}>&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-sm text-white">{name}</div>
                    <div className="text-xs text-eq-green">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo 2 */}
      <section className="relative overflow-hidden" style={{ height: '1080px' }}>
        <img
          src="/photo/2.jpg"
          alt=""
          style={{ width: '1920px', height: '1080px', maxWidth: 'none', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </section>

      {/* Photo 3 */}
      <section className="relative overflow-hidden" style={{ height: '400px' }}>
        <img
          src="/photo/3.jpg"
          alt=""
          style={{ width: '1920px', height: '1080px', maxWidth: 'none', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <p className="absolute bottom-3 left-0 right-0 text-center text-[16px] text-white font-bold">
          © 2026 EquiPrédict. Tous droits réservés.
        </p>
      </section>
    </div>
  )
}
