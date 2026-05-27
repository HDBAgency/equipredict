import React from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart3, Zap, Shield, Target, Users } from 'lucide-react'
import ScrollRevealTitle from '@/components/ui/ScrollRevealTitle'
import HeroTitle from '@/components/ui/HeroTitle'
import ScrollRevealHeading from '@/components/ui/ScrollRevealHeading'
import ScrollRevealInline from '@/components/ui/ScrollRevealInline'
import VideoCarousel from '@/components/ui/VideoCarousel'
import SmartCTAButton from '@/components/ui/SmartCTAButton'
import LogoutButton from '@/components/ui/LogoutButton'
import FloatingTestimonials from '@/components/ui/FloatingTestimonials'

const STATS = [
  { value: '87.4%', label: 'Précision moyenne', icon: Target },
  { value: '5 000+', label: 'Prédictions générées', icon: BarChart3 },
  { value: '3 sec', label: "Temps d'analyse", icon: Zap },
  { value: '12 000+', label: 'Utilisateurs actifs', icon: Users },
]

const BASE = 'https://mkzkkwqxarnnoamxnzyu.supabase.co/storage/v1/object/public/videos'
const VIDEOS = [
  `${BASE}/ssstik.io_@francegalop_1779699846455.mp4`,
  `${BASE}/ssstik.io_@francegalop_1779699889192.mp4`,
  `${BASE}/ssstik.io_@francegalop_1779699915277.mp4`,
  `${BASE}/ssstik.io_@elliotfcx_1779699998794.mp4`,
  `${BASE}/ssstik.io_@equidia_off_1779700044750.mp4`,
  `${BASE}/ssstik.io_@equidia_off_1779788461478.mp4`,
]

const RACE_CARDS = [
  {
    title: 'Prix du Jockey Club · Chantilly',
    horses: [
      { medal: '🥇', name: 'Mystère Bleu',    prob: '32.4%', score: 91, level: 'FORT',  badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
      { medal: '🥈', name: 'Roi Soleil II',   prob: '22.1%', score: 83, level: 'FORT',  badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
      { medal: '🥉', name: 'Tempête du Soir', prob: '17.5%', score: 77, level: 'MOYEN', badge: 'bg-eq-amber/15 text-eq-amber border-eq-amber/30' },
    ],
  },
  {
    title: 'Grand Prix de Paris · Longchamp',
    horses: [
      { medal: '🥇', name: 'Éclat de Lune', prob: '28.7%', score: 88, level: 'FORT',  badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
      { medal: '🥈', name: 'Vent du Nord',  prob: '19.3%', score: 81, level: 'FORT',  badge: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
      { medal: '🥉', name: 'Cap Ferret',    prob: '14.8%', score: 72, level: 'MOYEN', badge: 'bg-eq-amber/15 text-eq-amber border-eq-amber/30' },
    ],
  },
]

function RaceCardUI({ title, horses, className = '', style }: typeof RACE_CARDS[0] & { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm ${className}`} style={style}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm text-white truncate">{title}</span>
      </div>
      {horses.map((h, i) => (
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
  )
}

export default function HomePage() {
  return (
    <>
    <div className="fixed top-0 right-0 z-50 p-4">
      <LogoutButton />
    </div>
    <div className="flex flex-col">

      {/* Hero — vidéo en fond */}
      <section className="relative overflow-hidden -mt-16 min-h-[600px] sm:min-h-[800px] lg:min-h-[1080px]">
        {/* Vidéo de fond */}
        <video
          src="https://mkzkkwqxarnnoamxnzyu.supabase.co/storage/v1/object/public/videos/demo.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        {/* Overlay sombre pour lisibilité du texte */}
        <div className="absolute inset-0 bg-black/75" style={{ zIndex: 1 }} />
        <div
          className="relative flex items-start justify-center min-h-[600px] sm:min-h-[800px] lg:min-h-[1080px]"
          style={{ paddingTop: 'clamp(160px, 20vh, 260px)', zIndex: 2 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 text-center w-full">
            <HeroTitle />

            <p className="text-sm sm:text-base text-white max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-up font-bold" style={{ animationDelay: '0.2s' }}>
              Analysez les données, anticipez les performances et obtenez des prédictions claires
              avec niveau de confiance pour chaque course du jour.
            </p>

            <div className="flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <SmartCTAButton />
            </div>

            <p className="text-xs text-white mt-6 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              Prédictions informatives · 18+ · Jouez responsable
            </p>
          </div>
        </div>
      </section>

      {/* PMU App — desktop */}
      <section className="relative hidden lg:block" style={{ height: '1080px' }}>
        <ScrollRevealTitle />
        <img
          src="/photo/pmu_nobg.png"
          alt="PMU"
          style={{ height: '700px', width: 'auto', position: 'absolute', top: 'calc(50% + 100px)', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <RaceCardUI {...RACE_CARDS[0]} className="absolute animate-float-left" style={{ width: '380px', bottom: '0px', left: '250px' } as React.CSSProperties} />
        <RaceCardUI {...RACE_CARDS[1]} className="absolute animate-float-right" style={{ width: '380px', bottom: '0px', right: '250px' } as React.CSSProperties} />
      </section>

      {/* PMU App — mobile */}
      <section className="lg:hidden px-4 pt-16 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-5xl font-black uppercase">
            <span className="block text-white">PLUS DE 50 COURSES</span>
            <span
              className="block"
              style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              COUVERTES PAR JOUR
            </span>
          </h2>
        </div>
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {RACE_CARDS.map(c => <RaceCardUI key={c.title} {...c} />)}
        </div>
      </section>

      {/* Partenaires */}
      <section className="pt-32 sm:pt-24 lg:pt-60 pb-10 overflow-hidden">
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
              <img key={i} src={logo.src} alt={logo.alt} style={{ height: '40px', width: 'auto', display: 'inline-block', marginRight: '60px', filter: 'brightness(0) invert(1)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* Vidéos TikTok — carousel 3D */}
      <section className="pt-32 sm:pt-24 lg:pt-60 pb-20">
        <div className="text-center mb-10 sm:mb-16 px-4">
          <ScrollRevealHeading line1="LES COURSES" line2="EN VIDÉO" />
        </div>
        <VideoCarousel videos={VIDEOS} />
      </section>

      {/* Testimonials */}
      <section className="pt-10 sm:pt-24 lg:pt-40 pb-16 sm:pb-24 relative z-10">
        <div className="px-4 sm:px-8">
          <ScrollRevealHeading line1={"Ce qu'en disent"} line2="nos utilisateurs" />
          <div className="mt-10 sm:mt-20">
            <FloatingTestimonials />
          </div>
        </div>
      </section>

      {/* FAQ + CTA */}
      <div className="relative">

        {/* FAQ */}
        <section className="pb-10 sm:pb-48 relative" style={{ zIndex: 2, paddingTop: '4px' }}>
          <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: '1000px' }}>
            <div className="text-center mb-10 sm:mb-16">
              <ScrollRevealInline text1="QUESTIONS" text2="FRÉQUENTES" />
              <p className="text-white font-bold mt-6 text-sm sm:text-base">Une réponse claire à toutes vos questions sur EquiPredict.</p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[
                { q: "Comment fonctionnent les prédictions EquiPredict ?", a: "Notre IA analyse 7 facteurs clés pour chaque cheval : forme récente, distance, terrain, jockey, entraîneur, évolution des cotes et régularité. Elle génère un top 3 avec probabilités et niveau de confiance (Faible / Moyen / Fort)." },
                { q: "Les prédictions sont-elles fiables ?", a: "Nos prédictions affichent une précision moyenne de 87,4% sur le top 3. Le niveau de confiance FORT est le plus fiable. EquiPredict est un outil d'aide à la décision — il ne garantit aucun gain." },
                { q: "Combien de courses sont couvertes par jour ?", a: "EquiPredict couvre plus de 50 courses hippiques par jour, issues des hippodromes français (PMU) et internationaux, en plat, trot, obstacle et steeple-chase." },
                { q: "À quelle heure sont disponibles les prédictions ?", a: "Les prédictions sont disponibles dès l'ouverture des cotes, généralement 2 à 3 heures avant chaque départ. Elles sont mises à jour en temps réel jusqu'au départ." },
                { q: "Est-ce que EquiPredict est gratuit ?", a: "Une version gratuite est disponible avec 3 courses analysées par jour. Les abonnements Premium et Pro donnent accès à toutes les courses, l'historique complet et les statistiques avancées." },
                { q: "EquiPredict encourage-t-il les paris ?", a: "Non. EquiPredict est un outil de prédiction informatif. Nous encourageons le jeu responsable — réservé aux personnes de 18 ans et plus. Ne misez que ce que vous pouvez vous permettre de perdre." },
              ].map(({ q, a }, i) => (
                <details key={i} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 cursor-pointer list-none font-bold text-white text-sm sm:text-base select-none">
                    {q}
                    <span className="ml-4 shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white text-lg transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-4 sm:px-6 pb-4 sm:pb-5 text-white/70 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 sm:py-24 text-center relative px-4" style={{ zIndex: 2 }}>
          <div className="max-w-7xl mx-auto">
            <ScrollRevealHeading line1="PRÊT À ANALYSER VOS COURSES" line2="AUTREMENT ?" className="lg:text-[120px] lg:leading-none" />
            <p className="text-white font-bold text-base sm:text-lg mb-8 sm:mb-10">
              Accédez aux analyses IA, statistiques avancées et prédictions de course dès maintenant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 hover:shadow-2xl w-full sm:w-auto justify-center"
                style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}
              >
                COMMENCER MAINTENANT <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-xs font-bold text-white py-6 px-4">
        ©2026 - EquiPrédict, Tout droit réservé.{' '}
        <Link href="/mentions-legales" className="underline hover:text-eq-green transition-colors">Mentions Légales</Link>
      </p>

    </div>
    </>
  )
}
