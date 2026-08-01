import { ArrowRight } from "lucide-react";
import { LEGAL_DETAILS, taxLabel } from "../data/content.js";

export function LegalPage({ type }) {
  const content = {
    "mentions-legales": {
      title: "Mentions légales",
      intro: "Informations relatives à l’éditeur et au fonctionnement du site tapote.fr.",
      sections: [
        ["Éditeur", [LEGAL_DETAILS.company, LEGAL_DETAILS.capital, LEGAL_DETAILS.address, LEGAL_DETAILS.registration, LEGAL_DETAILS.vat].filter(Boolean).join("\n")],
        ["Publication et contact", `Direction de la publication : ${LEGAL_DETAILS.director}\nContact : ${LEGAL_DETAILS.contact}`],
        ["Hébergement", LEGAL_DETAILS.host],
        ["Propriété intellectuelle", "La marque Tapote, les textes, interfaces, visuels de produits et éléments graphiques du site sont protégés. Toute reproduction ou exploitation non autorisée est interdite."],
      ],
    },
    cgv: {
      title: "Conditions générales de vente",
      intro: `Version ${LEGAL_DETAILS.version} · Boutique réservée aux clients professionnels.`,
      sections: [
        ["1. Offre et commande", "Les caractéristiques essentielles, la finition, la quantité, la personnalisation et le prix sont affichés avant paiement. La commande devient ferme après confirmation du paiement. Aucun abonnement n’est présélectionné."],
        ["2. Prix, réductions et paiement", `Les montants unitaires et les réductions de packs sont affichés en euros ${taxLabel} avant validation. Le paiement est comptant, par carte via Stripe ; aucun escompte pour paiement anticipé n’est appliqué. Les coordonnées bancaires ne sont jamais stockées par Tapote. En cas de somme exceptionnellement exigible et impayée à son échéance, les pénalités courent dès le lendemain, sans rappel, au taux de refinancement de la BCE majoré de 10 points et au minimum à trois fois le taux d’intérêt légal. Une indemnité forfaitaire de 40 € pour frais de recouvrement est due, sans préjudice des frais supplémentaires justifiés.`],
        ["3. Personnalisation et BAT", "Pour la gamme à votre image, Tapote envoie après la commande des instructions sécurisées permettant de transmettre le logo, les couleurs, les textes et la destination. Le fichier de production n’est lancé qu’après validation du BAT ; le client reste responsable des textes, liens, logos et droits d’utilisation des éléments transmis."],
        ["4. Préparation et livraison", "Les conditions, le prix et la zone de livraison applicables sont présentés avant paiement une fois la politique logistique validée. Le délai de préparation est confirmé lors de la prise en charge."],
        ["5. Conformité et réclamations", `Chaque NFC et chaque QR code sont contrôlés avant expédition. Une non-conformité ou une avarie doit être signalée avec les éléments utiles afin d’organiser la prise en charge selon les conditions validées. Contact : ${LEGAL_DETAILS.contact}`],
        ["6. Annulation et responsabilité", "Une demande d’annulation peut être étudiée avant le lancement de la préparation. Tapote ne répond pas de la disponibilité ni du contenu des destinations externes choisies par le client. Les responsabilités qui ne peuvent légalement être exclues restent applicables."],
        ["7. Droit applicable", `Les présentes conditions sont soumises au droit français. Les parties rechercheront d’abord une solution amiable. Contact contractuel : ${LEGAL_DETAILS.contact}.`],
      ],
    },
    confidentialite: {
      title: "Politique de confidentialité",
      intro: "Tapote limite les données collectées à ce qui est utile pour répondre, fabriquer, livrer et sécuriser le service.",
      sections: [
        ["Données et finalités", "Coordonnées professionnelles, commande, fichiers de personnalisation, destinations et données techniques sont utilisés pour exécuter la commande, assurer le support, prévenir les abus et respecter les obligations comptables."],
        ["Bases légales", "Les traitements reposent selon le cas sur l’exécution du contrat, une obligation légale ou l’intérêt légitime de sécuriser et améliorer le service. Les données ne sont pas vendues."],
        ["Prestataires", "Stripe traite le paiement ; Supabase héberge les données et fichiers nécessaires ; Resend peut acheminer les e-mails transactionnels ; l’hébergeur technique sert le site. Seules les données nécessaires leur sont transmises."],
        ["Durées", `Les pièces et données de facturation sont archivées pendant 10 ans lorsqu’une obligation comptable l’impose. Pour les autres données, Tapote applique la politique suivante : ${LEGAL_DETAILS.dataRetention}`],
        ["Vos droits", `Vous pouvez demander l’accès, la rectification, l’effacement ou la limitation lorsque ces droits s’appliquent, ainsi que vous opposer à certains traitements. Contact : ${LEGAL_DETAILS.privacyContact}. Vous pouvez également saisir la CNIL.`],
      ],
    },
  }[type];
  return <main id="main-content" className="v3-legal"><nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>{content.title}</b></nav><span className="v3-eyebrow">INFORMATIONS CONTRACTUELLES</span><h1>{content.title}</h1><p className="v3-legal-intro">{content.intro}</p><div className="v3-legal-sections">{content.sections.map(([title, body]) => <section key={title}><h2>{title}</h2>{body.split("\n").map((line) => <p key={line}>{line}</p>)}</section>)}</div><p className="v3-legal-updated">Document contractuel : {LEGAL_DETAILS.version}</p></main>;
}

export function NotFound() {
  return <main id="main-content" className="v3-not-found"><span>404</span><h1>Cette page n’existe pas.</h1><a href="/">Retour à la boutique <ArrowRight /></a></main>;
}
