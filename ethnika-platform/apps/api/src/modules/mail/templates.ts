import { esc } from "../pdf/templates/html";

/*
 * Gabarits d'e-mails (EmailAccuse.dc.html) : tableaux + styles en ligne, largeur 600 px, polices de repli,
 * pour un rendu fiable dans Gmail, Outlook et les clients mobiles. Toujours une version texte.
 */

export type AckPayload = {
  reference: string;
  firstName: string;
  locale: "fr" | "en";
  /** Résumé d'une ligne (« CKY → CDG · Aller-retour · 2 adultes »). */
  summary: string;
  route?: { from: string; to: string };
  siteUrl: string;
  whatsappUrl?: string;
};

/** `heading` : nature de l'alerte (« Paiement reçu », « Option à payer sous 24 h ») ; « Nouvelle demande » par défaut. */
export type AgencyPayload = { reference: string; type: string; summary: string; backOfficeUrl: string; heading?: string };

export type RenderedEmail = { subject: string; html: string; text: string };

const copy = {
  fr: {
    subject: (ref: string) => `Nous avons bien reçu votre demande ${ref}`,
    hello: (n: string) => `Bonjour ${n},`,
    title: "Votre demande est bien reçue",
    intro: "Merci de votre confiance. Un conseiller ETHNIKA étudie votre demande et vous recontacte sous 24 h ouvrées avec les meilleures options.",
    reference: "RÉFÉRENCE",
    next: "Prochaines étapes",
    steps: ["Nous vérifions les disponibilités et les tarifs.", "Vous recevez une proposition détaillée par e-mail ou WhatsApp.", "Vous validez, et nous émettons vos documents de voyage."],
    whatsapp: "Écrire sur WhatsApp",
    circuits: "Voir nos circuits",
    footer: "Vous recevez cet e-mail suite à votre demande sur notre site.",
  },
  en: {
    subject: (ref: string) => `We have received your request ${ref}`,
    hello: (n: string) => `Hello ${n},`,
    title: "Your request has been received",
    intro: "Thank you for your trust. An ETHNIKA adviser is reviewing your request and will get back to you within 24 working hours with the best options.",
    reference: "REFERENCE",
    next: "Next steps",
    steps: ["We check availability and fares.", "You receive a detailed proposal by email or WhatsApp.", "You approve, and we issue your travel documents."],
    whatsapp: "Message us on WhatsApp",
    circuits: "See our tours",
    footer: "You are receiving this email following your request on our website.",
  },
} as const;

const font = "font-family:'Bricolage Grotesque',Arial,Helvetica,sans-serif";
const mono = "font-family:'DM Mono',Consolas,'Courier New',monospace";

/** Accusé de réception envoyé au client. */
export function ackEmail(p: AckPayload): RenderedEmail {
  const c = copy[p.locale];
  const circuitsUrl = `${p.siteUrl}${p.locale === "en" ? "/en" : ""}/circuits`;
  const routeBlock = p.route
    ? `<tr><td style="padding:6px 22px;${mono};font-size:36px;color:#ffffff">${esc(p.route.from)}</td><td style="text-align:center;color:#e3a935;font-size:20px">&#9992;</td><td style="padding:6px 22px;text-align:right;${mono};font-size:36px;color:#e3a935">${esc(p.route.to)}</td></tr>`
    : "";
  const html = `<!doctype html><html lang="${p.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject(p.reference))}</title></head>
<body style="margin:0;padding:0;background:#efe6d2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe6d2"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffbf5;border-radius:18px;overflow:hidden;${font};color:#121815">
  <tr><td style="background:#16211c;padding:24px 32px;${font};font-size:24px;letter-spacing:4px;color:#ffffff;font-weight:700">ETHNIKA</td></tr>
  <tr><td style="height:6px;line-height:6px;font-size:0;background:#b0121b">&nbsp;</td></tr>
  <tr><td style="padding:34px 32px 6px">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#b0121b">${esc(c.hello(p.firstName))}</div>
    <h1 style="margin:8px 0 12px;font-size:28px;line-height:1.15;color:#16211c">${esc(c.title)}</h1>
    <p style="margin:0;font-size:16px;line-height:1.65;color:#4e463f">${esc(c.intro)}</p>
  </td></tr>
  <tr><td style="padding:22px 32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#16211c;border-radius:14px">
      <tr><td colspan="3" style="padding:16px 22px 6px;${mono};font-size:11px;letter-spacing:2px;color:#a2aaa4">${esc(c.reference)} · <span style="color:#e3a935">${esc(p.reference)}</span></td></tr>
      ${routeBlock}
      <tr><td colspan="3" style="padding:12px 22px 16px;border-top:1px dashed #34413a;font-size:14px;color:#e2e5e0">${esc(p.summary)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:6px 32px 20px">
    <div style="font-size:17px;font-weight:700;color:#16211c;margin-bottom:8px">${esc(c.next)}</div>
    ${c.steps.map((s, i) => `<div style="padding:6px 0;font-size:15px;color:#4e463f"><span style="${mono};color:${["#0e5232", "#8f6514", "#b0121b"][i]};padding-right:10px">0${i + 1}</span>${esc(s)}</div>`).join("")}
  </td></tr>
  <tr><td style="padding:0 32px 32px">
    ${p.whatsappUrl ? `<a href="${esc(p.whatsappUrl)}" style="display:inline-block;margin:0 8px 8px 0;padding:14px 24px;border-radius:999px;background:#0e5232;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${esc(c.whatsapp)}</a>` : ""}
    <a href="${esc(circuitsUrl)}" style="display:inline-block;padding:12px 22px;border-radius:999px;border:1.5px solid #16211c;color:#16211c;font-weight:600;font-size:15px;text-decoration:none">${esc(c.circuits)}</a>
  </td></tr>
  <tr><td style="padding:20px 32px;background:#f5eee3;font-size:12px;line-height:1.7;color:#6b6259"><strong style="color:#16211c">ETHNIKA · Tourisme &amp; Voyages</strong><br>Conakry · ${esc(new URL(p.siteUrl).host)}<br>${esc(c.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [c.hello(p.firstName), "", c.title, c.intro, "", `${c.reference} : ${p.reference}`, p.summary, "", `${c.next} :`, ...c.steps.map((s, i) => `${i + 1}. ${s}`), "", circuitsUrl, "", "ETHNIKA · Tourisme & Voyages"].join("\n");
  return { subject: c.subject(p.reference), html, text };
}

/** Notification interne à l'agence : aucune coordonnée client dans l'e-mail, uniquement le lien vers le back-office. */
export function agencyEmail(p: AgencyPayload): RenderedEmail {
  const heading = p.heading ?? "Nouvelle demande";
  const subject = `${heading} · ${p.reference}${p.heading ? "" : ` · ${p.type}`}`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(subject)}</title></head><body style="margin:0;padding:24px;background:#f5eee3;${font}">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #efe6d2">
<tr><td style="padding:22px 26px"><div style="${mono};font-size:12px;color:#6b6259">${esc(heading.toUpperCase())}</div>
<div style="${mono};font-size:24px;color:#16211c;margin:6px 0">${esc(p.reference)}</div>
<div style="font-size:15px;color:#4e463f">${esc(p.type)} · ${esc(p.summary)}</div>
<a href="${esc(p.backOfficeUrl)}" style="display:inline-block;margin-top:16px;padding:12px 20px;border-radius:999px;background:#16211c;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none">Ouvrir dans le back-office</a>
</td></tr></table></body></html>`;
  return { subject, html, text: `${subject}\n${p.summary}\n${p.backOfficeUrl}` };
}

export type NewsletterConfirmPayload = { locale: "fr" | "en"; confirmUrl: string; unsubscribeUrl: string };

/** Double opt-in : lien de confirmation (valable jusqu'à usage) et lien de désinscription. */
export function newsletterConfirmEmail(p: NewsletterConfirmPayload): RenderedEmail {
  const en = p.locale === "en";
  const subject = en ? "Confirm your subscription to ETHNIKA deals" : "Confirmez votre inscription aux offres ETHNIKA";
  const title = en ? "One last step" : "Une dernière étape";
  const text = en
    ? "Please confirm that you want to receive our deals and departures. If you did not ask for this, simply ignore this email."
    : "Merci de confirmer que vous souhaitez recevoir nos offres et nos départs. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.";
  const button = en ? "Confirm my subscription" : "Confirmer mon inscription";
  const unsubscribe = en ? "Unsubscribe" : "Se désinscrire";
  const html = `<!doctype html><html lang="${p.locale}"><head><meta charset="utf-8"><title>${esc(subject)}</title></head><body style="margin:0;padding:24px 12px;background:#efe6d2;${font}">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" align="center" style="max-width:560px;width:100%;background:#fffbf5;border-radius:16px;overflow:hidden">
<tr><td style="background:#16211c;padding:20px 28px;font-size:22px;letter-spacing:4px;color:#ffffff;font-weight:700">ETHNIKA</td></tr>
<tr><td style="padding:30px 28px">
<h1 style="margin:0 0 10px;font-size:26px;color:#16211c">${esc(title)}</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#4e463f">${esc(text)}</p>
<a href="${esc(p.confirmUrl)}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#b0121b;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${esc(button)}</a>
</td></tr>
<tr><td style="padding:16px 28px;background:#f5eee3;font-size:12px;color:#6b6259"><a href="${esc(p.unsubscribeUrl)}" style="color:#6b6259">${esc(unsubscribe)}</a></td></tr>
</table></body></html>`;
  return { subject, html, text: [title, "", text, "", `${button} : ${p.confirmUrl}`, "", `${unsubscribe} : ${p.unsubscribeUrl}`].join("\n") };
}

export type ReceiptPayload = {
  locale: "fr" | "en";
  firstName: string;
  paymentReference: string;
  leadReference: string;
  /** Montant déjà formaté (« 300,00 € », « 1 500 000 GNF »). */
  amount: string;
  label: string;
  paidAt: string;
  agency: { phone: string; email: string; address: string };
  siteUrl: string;
};

/** Reçu de paiement envoyé au client dès la confirmation du prestataire. */
export function receiptEmail(p: ReceiptPayload): RenderedEmail {
  const en = p.locale === "en";
  const date = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Conakry" }).format(new Date(p.paidAt));
  const c = en
    ? { subject: `Payment receipt ${p.paymentReference}`, hello: `Hello ${p.firstName},`, title: "Payment received, thank you", intro: "We confirm receipt of your payment. Keep this email as your receipt; your adviser will contact you about the next steps of your trip.", amount: "AMOUNT PAID", rows: [["Receipt no.", p.paymentReference], ["Request", p.leadReference], ["For", p.label], ["Date", date]], help: "A question? Reply to this email or contact us:" }
    : { subject: `Reçu de paiement ${p.paymentReference}`, hello: `Bonjour ${p.firstName},`, title: "Paiement reçu, merci", intro: "Nous confirmons la bonne réception de votre paiement. Conservez cet e-mail comme reçu ; votre conseiller vous contacte pour la suite de votre voyage.", amount: "MONTANT PAYÉ", rows: [["N° de reçu", p.paymentReference], ["Demande", p.leadReference], ["Objet", p.label], ["Date", date]], help: "Une question ? Répondez à cet e-mail ou contactez-nous :" };
  const html = `<!doctype html><html lang="${p.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#efe6d2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe6d2"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffbf5;border-radius:18px;overflow:hidden;${font};color:#121815">
  <tr><td style="background:#16211c;padding:24px 32px;font-size:24px;letter-spacing:4px;color:#ffffff;font-weight:700">ETHNIKA</td></tr>
  <tr><td style="height:6px;line-height:6px;font-size:0;background:#0e5232">&nbsp;</td></tr>
  <tr><td style="padding:34px 32px 6px">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#0e5232">${esc(c.hello)}</div>
    <h1 style="margin:8px 0 12px;font-size:28px;line-height:1.15;color:#16211c">${esc(c.title)}</h1>
    <p style="margin:0;font-size:16px;line-height:1.65;color:#4e463f">${esc(c.intro)}</p>
  </td></tr>
  <tr><td style="padding:22px 32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#16211c;border-radius:14px">
      <tr><td style="padding:18px 22px 4px;${mono};font-size:11px;letter-spacing:2px;color:#a2aaa4">${esc(c.amount)}</td></tr>
      <tr><td style="padding:0 22px 18px;font-size:34px;font-weight:700;color:#e3a935">${esc(p.amount)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 22px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
      ${c.rows.map(([k, v]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #efe6d2;color:#6b6259;width:38%">${esc(k!)}</td><td style="padding:9px 0;border-bottom:1px solid #efe6d2;color:#16211c;font-weight:600">${esc(v!)}</td></tr>`).join("")}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 30px;font-size:14px;line-height:1.7;color:#4e463f">${esc(c.help)}<br><strong style="color:#16211c">${esc(p.agency.phone)}</strong> · ${esc(p.agency.email)}</td></tr>
  <tr><td style="padding:20px 32px;background:#f5eee3;font-size:12px;line-height:1.7;color:#6b6259"><strong style="color:#16211c">ETHNIKA · Tourisme &amp; Voyages</strong><br>${esc(p.agency.address)} · ${esc(new URL(p.siteUrl).host)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [c.hello, "", c.title, c.intro, "", `${c.amount} : ${p.amount}`, ...c.rows.map(([k, v]) => `${k} : ${v}`), "", c.help, `${p.agency.phone} · ${p.agency.email}`, "", "ETHNIKA · Tourisme & Voyages"].join("\n");
  return { subject: c.subject, html, text };
}

export const templates = { ack: ackEmail, agency: agencyEmail, newsletter_confirm: newsletterConfirmEmail, receipt: receiptEmail } as const;
export type TemplateName = keyof typeof templates;
