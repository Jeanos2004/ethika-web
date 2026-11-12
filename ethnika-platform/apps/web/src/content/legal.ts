/**
 * Documents légaux (maquette Legal.dc.html : onglets → 4 routes).
 * Structure de maquette : textes définitifs à rédiger et valider par un juriste. [À VALIDER PAR UN JURISTE]
 */

export type LegalKey = "mentions" | "cgv" | "confidentialite" | "cookies";

export const legalDocs: Record<LegalKey, { path: string; tab: string; title: string; sections: { title: string; text: string }[] }> = {
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

export const legalOrder: LegalKey[] = ["mentions", "cgv", "confidentialite", "cookies"];
