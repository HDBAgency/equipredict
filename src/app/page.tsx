import React from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart3, Zap, Shield, Target, Users, Star } from 'lucide-react'
import ScrollRevealTitle from '@/components/ui/ScrollRevealTitle'
import HeroTitle from '@/components/ui/HeroTitle'
import ScrollRevealHeading from '@/components/ui/ScrollRevealHeading'
import ScrollRevealInline from '@/components/ui/ScrollRevealInline'
import VideoCarousel from '@/components/ui/VideoCarousel'
import SmartCTAButton from '@/components/ui/SmartCTAButton'
import LogoutButton from '@/components/ui/LogoutButton'

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

const BASE = 'https://mkzkkwqxarnnoamxnzyu.supabase.co/storage/v1/object/public/videos'
const VIDEOS = [
  `${BASE}/ssstik.io_@francegalop_1779699846455.mp4`,
  `${BASE}/ssstik.io_@francegalop_1779699889192.mp4`,
  `${BASE}/ssstik.io_@francegalop_1779699915277.mp4`,
  `${BASE}/ssstik.io_@elliotfcx_1779699998794.mp4`,
  `${BASE}/ssstik.io_@equidia_off_1779700044750.mp4`,
  `${BASE}/ssstik.io_@equidia_off_1779788461478.mp4`,
]

const TESTIMONIALS = [
  { name: 'Thomas R.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Abonné Premium', text: "Je suis les prédictions depuis 3 mois. Le niveau de confiance FORT est vraiment fiable — 73% de succès de mon côté. Je ne mise plus sans consulter EquiPredict avant chaque course.", stars: 5 },
  { name: 'Marie-Claire D.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Abonnée Pro', text: "Les analyses de terrain sont bluffantes. Surtout sur l'obstacle sous la pluie — EquiPredict identifie les spécialistes parfaitement. Un outil indispensable pour les passionnés.", stars: 5 },
  { name: 'Julien B.', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', role: 'Abonné Premium', text: "Interface propre, prédictions pertinentes, justification claire. Enfin une vraie IA pour le PMU ! J'ai gagné en régularité depuis que j'utilise l'application chaque semaine.", stars: 4 },
]

export default function HomePage() {
  return (
    <>
    <div className="fixed top-0 right-0 z-50 p-4">
      <LogoutButton />
    </div>
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden -mt-16" style={{ minHeight: '1080px', width: '100%' }}>
        <div className="relative flex items-start justify-center" style={{ minHeight: '1080px', paddingTop: '170px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 text-center">
          <HeroTitle />

          <p className="text-sm sm:text-base text-white max-w-2xl mx-auto mb-10 animate-fade-up font-bold" style={{ animationDelay: '0.2s' }}>
            Analysez les données, anticipez les performances et obtenez des prédictions claires
            avec niveau de confiance pour chaque course du jour.
          </p>

          <div className="flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <SmartCTAButton />
          </div>

          <p className="text-xs text-white mt-6 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Prédictions informatives · 18+ · Jouez responsable
          </p>

        </div>
        </div>
      </section>


      {/* PMU App */}
      <section className="relative" style={{ height: '1080px' }}>
        <ScrollRevealTitle />
        <img
          src="/photo/pmu_nobg.png"
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
      <section className="pt-60 pb-10 overflow-hidden">
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
              <img key={i} src={logo.src} alt={logo.alt} style={{ height: '48px', width: 'auto', display: 'inline-block', marginRight: '100px', filter: 'brightness(0) invert(1)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* Vidéos TikTok — carousel 3D */}
      <section className="pt-60 pb-20">
        <div className="text-center mb-16">
          <ScrollRevealHeading line1="LES COURSES" line2="EN VIDÉO" />
        </div>
        <VideoCarousel videos={VIDEOS} />
      </section>


      {/* Testimonials */}
      <section className="pt-40 pb-24 relative z-10">
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

      {/* FAQ + CTA */}
      <div className="relative">

        {/* FAQ */}
        <section className="pt-48 pb-48 relative" style={{ zIndex: 2 }}>
          <div className="mx-auto px-8" style={{ maxWidth: '1000px' }}>
            <div className="text-center mb-16">
              <ScrollRevealInline text1="QUESTIONS" text2="FRÉQUENTES" />
              <p className="text-white font-bold mt-6">Une réponse claire à toutes vos questions sur EquiPredict.</p>
            </div>
            <div className="space-y-4">
              {[
                { q: "Comment fonctionnent les prédictions EquiPredict ?", a: "Notre IA analyse 7 facteurs clés pour chaque cheval : forme récente, distance, terrain, jockey, entraîneur, évolution des cotes et régularité. Elle génère un top 3 avec probabilités et niveau de confiance (Faible / Moyen / Fort)." },
                { q: "Les prédictions sont-elles fiables ?", a: "Nos prédictions affichent une précision moyenne de 87,4% sur le top 3. Le niveau de confiance FORT est le plus fiable. EquiPredict est un outil d'aide à la décision — il ne garantit aucun gain." },
                { q: "Combien de courses sont couvertes par jour ?", a: "EquiPredict couvre plus de 50 courses hippiques par jour, issues des hippodromes français (PMU) et internationaux, en plat, trot, obstacle et steeple-chase." },
                { q: "À quelle heure sont disponibles les prédictions ?", a: "Les prédictions sont disponibles dès l'ouverture des cotes, généralement 2 à 3 heures avant chaque départ. Elles sont mises à jour en temps réel jusqu'au départ." },
                { q: "Est-ce que EquiPredict est gratuit ?", a: "Une version gratuite est disponible avec 3 courses analysées par jour. Les abonnements Premium et Pro donnent accès à toutes les courses, l'historique complet et les statistiques avancées." },
                { q: "EquiPredict encourage-t-il les paris ?", a: "Non. EquiPredict est un outil de prédiction informatif. Nous encourageons le jeu responsable — réservé aux personnes de 18 ans et plus. Ne misez que ce que vous pouvez vous permettre de perdre." },
              ].map(({ q, a }, i) => (
                <details key={i} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-bold text-white text-base select-none">
                    {q}
                    <span className="ml-4 shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white text-lg transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-6 pb-5 text-white/70 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-24 text-center relative" style={{ zIndex: 2 }}>
          <div className="max-w-7xl mx-auto px-8">
            <ScrollRevealHeading line1="PRÊT À ANALYSER VOS COURSES" line2="AUTREMENT ?" style={{ fontSize: '120px', lineHeight: '1' }} />
            <p className="text-white font-bold text-base sm:text-lg mb-10">
              Accédez aux analyses IA, statistiques avancées et prédictions de course dès maintenant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}
              >
                COMMENCER MAINTENANT <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-xs font-bold text-white py-6">
        ©2026 - EquiPrédict, Tout droit réservé.{' '}
        <Link href="/mentions-legales" className="underline hover:text-eq-green transition-colors">Mentions Légales</Link>
      </p>

    </div>
    </>
  )
}
