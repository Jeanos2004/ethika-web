/**
 * Questions fréquentes : page FAQ (FAQ.dc.html) et section billetterie (Billetterie.dc.html).
 * Les réponses entre crochets restent à compléter par l'agence.
 */

export const faqCategories = {
  billet: "Billetterie",
  circuit: "Circuits",
  paiement: "Paiement",
  sante: "Santé & visa",
  agence: "Agence",
} as const;
export type FaqCategory = keyof typeof faqCategories;

export type FaqItem = { id: string; category: FaqCategory; question: string; answer: string };

export const faq: FaqItem[] = [
  { id: "demander-billet", category: "billet", question: "Comment demander un billet d'avion ?", answer: "Remplissez le formulaire de la page Billetterie (trajet, dates, passagers). Un conseiller vous envoie les meilleures options sous 24 h ouvrées, puis vous confirmez." },
  { id: "modifier-billet", category: "billet", question: "Puis-je modifier ou annuler mon billet ?", answer: "Oui, selon les conditions tarifaires de la compagnie. Nous gérons les changements de date, ré-émissions, annulations et remboursements." },
  { id: "bagages", category: "billet", question: "Quelle franchise bagages ?", answer: "Elle dépend de la compagnie et du tarif. Elle est indiquée dans chaque proposition que nous vous envoyons." },
  { id: "enfants", category: "circuit", question: "Les circuits sont-ils adaptés aux enfants ?", answer: "La plupart oui. Le niveau de chaque circuit est indiqué sur sa fiche ; nous adaptons le programme aux familles." },
  { id: "privatif", category: "circuit", question: "Peut-on faire un circuit privatif ?", answer: "Oui, tous nos circuits peuvent être organisés en privé, aux dates de votre choix, sur devis." },
  { id: "paiement", category: "paiement", question: "Comment se passe le paiement ?", answer: "Après validation du devis, un acompte confirme la réservation, le solde est réglé avant le départ. [Moyens de paiement et pourcentages à préciser]" },
  { id: "paiement-en-ligne", category: "paiement", question: "Le paiement en ligne est-il possible ?", answer: "Pas pour le moment : la réservation est confirmée par un conseiller. [Évolution prévue à préciser]" },
  { id: "vaccins", category: "sante", question: "Quels vaccins pour la Guinée ?", answer: "Fièvre jaune exigée à l'entrée pour les voyageurs venant d'un pays à risque, recommandée pour tous. Voir la page Infos pratiques et un médecin 4 à 6 semaines avant le départ." },
  { id: "visa", category: "sante", question: "Faut-il un visa ?", answer: "Cela dépend de votre nationalité. Nous vous conseillons sur les formalités ; vérifiez auprès de l'ambassade ou du portail officiel." },
  { id: "agence", category: "agence", question: "Où se trouve l'agence ?", answer: "À Conakry, [Quartier]. Horaires : [HORAIRES]. Vous pouvez aussi nous écrire sur WhatsApp." },
];

/** FAQ de la page Billetterie (formulations propres à la maquette Billetterie.dc.html). */
export const flightFaq: { question: string; answer: string }[] = [
  { question: "Puis-je modifier ou annuler mon billet ?", answer: "Oui. Nous gérons les modifications de date, les ré-émissions, les annulations et les remboursements, dans le respect des conditions tarifaires de chaque compagnie." },
  { question: "Comment se passe le paiement ?", answer: "Après votre choix parmi les options proposées, vous confirmez et réglez selon les modalités convenues avec l'agence. [Moyens de paiement à préciser]" },
  { question: "Organisez-vous des voyages de groupe ?", answer: "Oui : groupes, missions, séminaires, délégations officielles et pèlerinages, avec un devis dédié." },
  { question: "Pouvez-vous m'aider pour le visa ?", answer: "Nous vous conseillons sur les visas et les formalités d'entrée, et pouvons ajouter assurance voyage, hôtel et transferts aéroport." },
  { question: "Quels documents de santé pour entrer en Guinée ?", answer: "Un certificat de vaccination contre la fièvre jaune est exigé à l'entrée pour les voyageurs venant d'un pays à risque, et recommandé pour tous. Consultez un médecin 4 à 6 semaines avant le départ." },
];

/** JSON-LD FAQPage (schema.org) à partir d'une liste de questions. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
  };
}

/* ---------------- Version anglaise ---------------- */

const faqCategoriesEn: Record<FaqCategory, string> = { billet: "Flights", circuit: "Tours", paiement: "Payment", sante: "Health & visa", agence: "Agency" };

const faqEn: Record<string, Pick<FaqItem, "question" | "answer">> = {
  "demander-billet": { question: "How do I request a plane ticket?", answer: "Fill in the form on the Flights page (route, dates, passengers). An adviser sends you the best options within 24 working hours, then you confirm." },
  "modifier-billet": { question: "Can I change or cancel my ticket?", answer: "Yes, depending on the airline's fare conditions. We handle date changes, reissues, cancellations and refunds." },
  bagages: { question: "What is the baggage allowance?", answer: "It depends on the airline and the fare. It is stated in every proposal we send you." },
  enfants: { question: "Are the tours suitable for children?", answer: "Most of them, yes. The level of each tour is shown on its page; we adapt the programme for families." },
  privatif: { question: "Can we book a private tour?", answer: "Yes, all our tours can be organised privately, on the dates of your choice, on request." },
  paiement: { question: "How does payment work?", answer: "Once the quote is approved, a deposit confirms the booking and the balance is paid before departure. [Payment methods and percentages to be specified]" },
  "paiement-en-ligne": { question: "Is online payment possible?", answer: "Not at the moment: bookings are confirmed by an adviser. [Planned change to be specified]" },
  vaccins: { question: "Which vaccines for Guinea?", answer: "Yellow fever is required on entry for travellers from at-risk countries and recommended for everyone. See the Practical info page and a doctor 4 to 6 weeks before departure." },
  visa: { question: "Do I need a visa?", answer: "It depends on your nationality. We advise you on the formalities; check with the embassy or the official portal." },
  agence: { question: "Where is the agency?", answer: "In Conakry, [District]. Opening hours: [OPENING HOURS]. You can also message us on WhatsApp." },
};

const flightFaqEn: { question: string; answer: string }[] = [
  { question: "Can I change or cancel my ticket?", answer: "Yes. We handle date changes, reissues, cancellations and refunds, in line with each airline's fare conditions." },
  { question: "How does payment work?", answer: "After choosing among the options we propose, you confirm and pay according to the terms agreed with the agency. [Payment methods to be specified]" },
  { question: "Do you organise group travel?", answer: "Yes: groups, missions, seminars, official delegations and pilgrimages, with a dedicated quote." },
  { question: "Can you help me with my visa?", answer: "We advise you on visas and entry requirements, and can add travel insurance, hotels and airport transfers." },
  { question: "Which health documents are needed to enter Guinea?", answer: "A yellow fever vaccination certificate is required on entry for travellers from at-risk countries and recommended for everyone. See a doctor 4 to 6 weeks before departure." },
];

export function getFaq(locale: string): FaqItem[] {
  return locale === "en" ? faq.map((f) => ({ ...f, ...faqEn[f.id] })) : faq;
}

export function getFaqCategories(locale: string): Record<FaqCategory, string> {
  return locale === "en" ? faqCategoriesEn : faqCategories;
}

export function getFlightFaq(locale: string) {
  return locale === "en" ? flightFaqEn : flightFaq;
}
