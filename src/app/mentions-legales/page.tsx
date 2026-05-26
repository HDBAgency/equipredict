export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-black mb-10">Mentions Légales</h1>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">1. Éditeur du site</h2>
        <p className="text-white/80 leading-relaxed">
          Le site EquiPredict est édité par un particulier.<br />
          Email de contact : <a href="mailto:hmbt.hugo@gmail.com" className="text-eq-green hover:underline">hmbt.hugo@gmail.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">2. Hébergement</h2>
        <p className="text-white/80 leading-relaxed">
          Le site est hébergé par <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.<br />
          Site : <span className="text-white">vercel.com</span>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">3. Propriété intellectuelle</h2>
        <p className="text-white/80 leading-relaxed">
          L'ensemble du contenu du site EquiPredict (textes, images, logos, algorithmes de prédiction)
          est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans
          autorisation préalable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">4. Données personnelles</h2>
        <p className="text-white/80 leading-relaxed">
          Les données collectées (adresse email, prénom) sont utilisées uniquement dans le cadre
          de la fourniture du service EquiPredict. Elles ne sont ni vendues, ni transmises à des tiers.
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression
          de vos données en contactant : <a href="mailto:hmbt.hugo@gmail.com" className="text-eq-green hover:underline">hmbt.hugo@gmail.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">5. Cookies</h2>
        <p className="text-white/80 leading-relaxed">
          Le site utilise des cookies de session nécessaires au fonctionnement de l'authentification.
          Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">6. Responsabilité</h2>
        <p className="text-white/80 leading-relaxed">
          Les prédictions fournies par EquiPredict sont à titre <strong>informatif uniquement</strong>.
          Elles ne constituent pas des conseils de paris. EquiPredict ne saurait être tenu responsable
          des décisions prises sur la base de ces informations. Les jeux d'argent sont réservés aux
          personnes majeures (18+). Jouez de manière responsable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-eq-green mb-3">7. Droit applicable</h2>
        <p className="text-white/80 leading-relaxed">
          Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera
          soumis à la compétence exclusive des tribunaux français.
        </p>
      </section>

      <p className="text-white/40 text-xs mt-12">Dernière mise à jour : mai 2026</p>
    </div>
  )
}
