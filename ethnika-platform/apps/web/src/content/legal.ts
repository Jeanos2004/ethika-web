/**
 * Documents légaux (maquette Legal.dc.html : onglets → 4 routes).
 * Structure de maquette : textes définitifs à rédiger et valider par un juriste. [À VALIDER PAR UN JURISTE]
 * Version anglaise (legalDocsEn) : traduction à titre informatif, la version française fait foi.
 * Toute modification d'un texte français se reporte dans sa traduction.
 */

type LegalDoc = { path: string; tab: string; title: string; sections: { title: string; text: string }[] };

export type LegalKey = "mentions" | "cgv" | "confidentialite" | "cookies";

export const legalDocs: Record<LegalKey, LegalDoc> = {
  mentions: {
    path: "/mentions-legales",
    tab: "Mentions légales",
    title: "Mentions légales",
    sections: [
      { title: "Éditeur du site", text: "ETHNIKA, [forme juridique] au capital de [MONTANT] GNF, siège : [ADRESSE], Conakry. RCCM : [N°]. NIF : [N°]. Licence d'agence de voyage n° [N°] délivrée par [AUTORITÉ]." },
      { title: "Directeur de la publication", text: "[NOM, FONCTION]." },
      { title: "Contact", text: "contact@ethnikatour.com · +224 [NUMÉRO]." },
      { title: "Hébergement", text: "[HÉBERGEUR], [ADRESSE], [PAYS]." },
      { title: "Propriété intellectuelle", text: "Le logo, les textes et la charte graphique ETHNIKA sont protégés. Toute reproduction sans autorisation est interdite. Photos d'illustration : Unsplash (licence Unsplash, libre de droits)." },
    ],
  },
  cgv: {
    path: "/cgv",
    tab: "CGV",
    title: "Conditions générales de vente",
    sections: [
      { title: "Objet", text: "Les présentes conditions encadrent la vente de billets d'avion, circuits et services de voyage par ETHNIKA." },
      { title: "Devis et réservation", text: "Toute demande donne lieu à un devis. La réservation est ferme après acceptation du devis et versement de l'acompte de [X] %." },
      { title: "Prix et paiement", text: "Prix en francs guinéens (GNF), sauf mention contraire. Solde exigible [X] jours avant le départ. Moyens de paiement : [À PRÉCISER]." },
      { title: "Billetterie aérienne", text: "Les billets sont soumis aux conditions tarifaires des compagnies (modification, annulation, bagages). Les frais de service de l'agence sont indiqués sur le devis." },
      { title: "Annulation par le client", text: "Barème d'annulation : [À DÉFINIR selon le délai avant départ]." },
      { title: "Responsabilité et assurance", text: "ETHNIKA est assurée en responsabilité civile professionnelle auprès de [ASSUREUR]. Une assurance voyage est recommandée." },
      { title: "Litiges", text: "Droit guinéen applicable. Réclamations à adresser à contact@ethnikatour.com. [À VALIDER]" },
    ],
  },
  confidentialite: {
    path: "/confidentialite",
    tab: "Confidentialité",
    title: "Politique de confidentialité",
    sections: [
      { title: "Données collectées", text: "Nom, coordonnées, détails de voyage et, pour la billetterie, informations de passeport nécessaires à l'émission des billets." },
      { title: "Finalités", text: "Traiter vos demandes, émettre les réservations, vous informer de nos offres si vous l'avez accepté." },
      { title: "Destinataires", text: "Personnel de l'agence, compagnies aériennes, prestataires de voyage concernés, systèmes de réservation (GDS)." },
      { title: "Durée de conservation", text: "[DURÉE] après la dernière relation commerciale, sauf obligation légale." },
      { title: "Vos droits", text: "Accès, rectification, suppression, opposition : écrivez à contact@ethnikatour.com." },
      { title: "Sécurité", text: "Connexion chiffrée (HTTPS), accès restreint au back-office, sauvegardes régulières." },
    ],
  },
  cookies: {
    path: "/cookies",
    tab: "Cookies",
    title: "Politique de cookies",
    sections: [
      { title: "Qu'est-ce qu'un cookie ?", text: "Un petit fichier déposé sur votre appareil pour faire fonctionner le site ou mesurer son audience." },
      { title: "Cookies nécessaires", text: "Langue, sécurité des formulaires et mémorisation de votre choix de cookies. Ils ne peuvent pas être désactivés." },
      { title: "Mesure d'audience", text: "[OUTIL, ex. statistiques respectueuses de la vie privée], déposés uniquement avec votre accord." },
      { title: "Réseaux sociaux", text: "Les boutons de partage et vidéos intégrées peuvent déposer des cookies tiers, avec votre accord." },
    ],
  },
};

export const legalDocsEn: Record<LegalKey, LegalDoc> = {
  mentions: {
    path: "/mentions-legales",
    tab: "Legal notice",
    title: "Legal notice",
    sections: [
      { title: "Website publisher", text: "ETHNIKA, [legal form] with a share capital of [AMOUNT] GNF, registered office: [ADDRESS], Conakry. RCCM: [No.]. NIF: [No.]. Travel agency licence No. [No.] issued by [AUTHORITY]." },
      { title: "Publication director", text: "[NAME, POSITION]." },
      { title: "Contact", text: "contact@ethnikatour.com · +224 [NUMBER]." },
      { title: "Hosting", text: "[HOSTING PROVIDER], [ADDRESS], [COUNTRY]." },
      { title: "Intellectual property", text: "The ETHNIKA logo, texts and visual identity are protected. Any reproduction without permission is prohibited. Illustrative photos: Unsplash (Unsplash licence, royalty-free)." },
    ],
  },
  cgv: {
    path: "/cgv",
    tab: "Terms of sale",
    title: "General terms and conditions of sale",
    sections: [
      { title: "Purpose", text: "These terms govern the sale of plane tickets, tours and travel services by ETHNIKA." },
      { title: "Quote and booking", text: "Every request leads to a quote. The booking is confirmed once the quote is accepted and a deposit of [X]% is paid." },
      { title: "Prices and payment", text: "Prices in Guinean francs (GNF), unless stated otherwise. The balance is due [X] days before departure. Payment methods: [TO BE SPECIFIED]." },
      { title: "Air ticketing", text: "Tickets are subject to the airlines' fare conditions (changes, cancellation, baggage). The agency's service fees are shown on the quote." },
      { title: "Cancellation by the customer", text: "Cancellation scale: [TO BE DEFINED according to the time before departure]." },
      { title: "Liability and insurance", text: "ETHNIKA holds professional liability insurance with [INSURER]. Travel insurance is recommended." },
      { title: "Disputes", text: "Guinean law applies. Complaints should be sent to contact@ethnikatour.com. [TO BE VALIDATED]" },
    ],
  },
  confidentialite: {
    path: "/confidentialite",
    tab: "Privacy",
    title: "Privacy policy",
    sections: [
      { title: "Data collected", text: "Name, contact details, travel details and, for ticketing, the passport information needed to issue tickets." },
      { title: "Purposes", text: "Handling your requests, issuing bookings and, if you have agreed, informing you of our offers." },
      { title: "Recipients", text: "Agency staff, airlines, the travel providers concerned and booking systems (GDS)." },
      { title: "Retention period", text: "[PERIOD] after the last business contact, unless the law requires otherwise." },
      { title: "Your rights", text: "Access, rectification, deletion, objection: write to contact@ethnikatour.com." },
      { title: "Security", text: "Encrypted connection (HTTPS), restricted access to the back office, regular backups." },
    ],
  },
  cookies: {
    path: "/cookies",
    tab: "Cookies",
    title: "Cookie policy",
    sections: [
      { title: "What is a cookie?", text: "A small file placed on your device to make the website work or measure its audience." },
      { title: "Necessary cookies", text: "Language, form security and remembering your cookie choice. They cannot be disabled." },
      { title: "Audience measurement", text: "[TOOL, e.g. privacy-friendly analytics], set only with your consent." },
      { title: "Social networks", text: "Share buttons and embedded videos may set third-party cookies, with your consent." },
    ],
  },
};

/** Document dans la langue de la page (traduction anglaise, sinon français). */
export function legalDoc(key: LegalKey, locale: string): LegalDoc {
  return locale === "en" ? legalDocsEn[key] : legalDocs[key];
}

export const legalOrder: LegalKey[] = ["mentions", "cgv", "confidentialite", "cookies"];
