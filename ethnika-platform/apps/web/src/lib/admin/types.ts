/** Formes des réponses de l'API utilisées par le back-office (sous-ensemble, voir apps/api). */

export type ApiLeadStatus = "new" | "in_progress" | "confirmed" | "cancelled";
export type ApiLeadType = "contact" | "billet" | "circuit" | "groupe" | "pelerinage" | "pro";

export type ApiLeadRow = {
  reference: string;
  type: ApiLeadType;
  status: ApiLeadStatus;
  source: string;
  fullName: string;
  phone: string;
  email: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

export type ApiLeadList = { total: number; page: number; pageSize: number; byStatus: Partial<Record<ApiLeadStatus, number>>; items: ApiLeadRow[] };

export type ApiLead = ApiLeadRow & {
  locale: string;
  message: string | null;
  events: { id: string; kind: string; status: ApiLeadStatus | null; actor: string; note: string | null; createdAt: string }[];
};

export type ApiStats = {
  kpis: {
    toTreat: number;
    overdue: number;
    inProgress: number;
    confirmationRate: number | null;
    last7: number;
    prev7: number;
    mineOpen: number;
    /** Délai médian (heures) entre la réception et la première prise en charge, demandes des 30 derniers jours. */
    medianHandlingHours: number | null;
    handledShare: number | null;
  };
  byStatus: Record<ApiLeadStatus, number>;
  bySource: Partial<Record<string, number>>;
  flights: { held: number; dueSoon: number };
  quotes30: { currency: string; count: number; total: string }[];
  daily: { date: string; count: number }[];
  byType: Partial<Record<ApiLeadType, number>>;
  priorityQueue: { reference: string; fullName: string; type: ApiLeadType; status: ApiLeadStatus; createdAt: string; assignedTo: { name: string } | null }[];
  activity: { kind: string; status: ApiLeadStatus | null; at: string; reference: string; name: string }[];
};

export type FlightOffer = {
  id: string;
  totalAmount: string;
  currency: string;
  owner: { iata: string; name: string };
  slices: {
    origin: string;
    destination: string;
    departAt: string;
    arriveAt: string;
    durationMinutes: number;
    stops: number;
    segments: { carrier: string; flightNumber: string; from: string; to: string; departAt: string; arriveAt: string }[];
  }[];
  expiresAt: string | null;
  holdable: boolean;
  payBefore: string | null;
};

export type PricedOffer = FlightOffer & { conditions: { refundable: boolean | null; changeable: boolean | null }; baggage: string | null };

export type FlightBooking = {
  id: string;
  provider: string;
  bookingReference: string | null;
  status: "held" | "confirmed" | "cancelled";
  totalAmount: string;
  currency: string;
  payBefore: string | null;
  passengerCount: number;
  itinerary: { airline: string; slices: { origin: string; destination: string; departAt: string }[] };
  createdAt: string;
  lead: { reference: string; fullName: string } | null;
};

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  totpEnabled: boolean;
  disabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
};

export type ApiAuditEntry = { id: string; actorId: string | null; action: string; target: string | null; ip: string | null; createdAt: string };

type OfferTexts = { kicker: string; title: string; description: string; imageAlt: string };
export type ApiOffer = {
  id: string;
  slug: string;
  type: "vol" | "pack" | "last";
  i18n: { fr: OfferTexts; en?: Partial<OfferTexts> };
  imageUrl: string;
  href: string;
  priceAmount: string | null;
  currency: string | null;
  validUntil: string | null;
  published: boolean;
  position: number;
  updatedAt: string;
};

export type CircuitDayInput = { title: string; meta?: string; text: string; night?: string; meals?: string };
type CircuitTexts = {
  title: string;
  headline: string;
  summary: string;
  place: string;
  imageAlt: string;
  durationLabel: string;
  intro?: string;
  days: CircuitDayInput[];
  included: string[];
  excluded: string[];
};
export type ApiCircuit = {
  id: string;
  slug: string;
  theme: "nature" | "plage" | "culture" | "diaspora";
  region: "moyenne-guinee" | "basse-cote" | "conakry" | "guinee";
  durationDays: number;
  imageUrl: string;
  priceFrom: string | null;
  currency: string | null;
  i18n: { fr: CircuitTexts; en?: Partial<CircuitTexts> };
  departures: { dates: string; status: "available" | "last" | "request"; price: string }[];
  published: boolean;
  position: number;
  updatedAt: string;
};

export type ApiProfile = { name: string; email: string; role: "admin" | "agent"; totpEnabled: boolean; lastLoginAt: string | null; createdAt: string; mfaVerified: boolean };

export type ApiSession = { handle: string; current: boolean; createdAt: string; lastSeenAt: string; expiresAt: string; ip: string | null; device: string | null };

export type ApiSystem = {
  version: string;
  environment: string;
  uptimeSeconds: number;
  siteUrl: string;
  flightProvider: "mock" | "duffel" | "amadeus";
  mailProvider: "resend" | "smtp" | "none";
  paymentProvider: "none" | "mock";
  agencyNotifyConfigured: boolean;
  pdfConfigured: boolean;
  sessionIdleMinutes: number;
  sessionMaxMinutes: number;
  leadRetentionDays: number;
  counts: { users: number; leads: number; subscribers: number; holds: number };
  mail: { pending: number; failed: number; sent24h: number };
};

export type ApiAuditPage = { total: number; page: number; pageSize: number; items: ApiAuditEntry[] };
export type ApiAuditSummary = { last24h: { logins: number; failedLogins: number }; last7d: { locked: number; total: number; byCategory: Record<string, number> } };

export type ApiAgency = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  licence: string;
  rccm: string;
  openingHours: string;
  hoursWeekdays: string;
  hoursSaturday: string;
  hoursSunday: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  paymentInstructions: string;
  quoteTerms: string;
  updatedAt: string;
};

export type ApiPayment = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  label: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  provider: string;
  method: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  lead: { reference: string; fullName: string };
};

export type ApiNotification = { id: string; kind: "lead_new" | "lead_assigned" | "payment_received" | "payment_failed" | "hold_due"; at: string; reference: string; name?: string; amount?: string; href: string };
export type ApiNotifications = { unread: number; items: ApiNotification[] };

export type ApiQuote = { number: string; currency: string; totalAmount: string; validUntil: string; notes: string | null; createdAt: string };

/** Statut de l'API → statut de l'interface (pastilles et libellés communs avec la démo). */
export const uiStatus = { new: "new", in_progress: "progress", confirmed: "confirmed", cancelled: "cancelled" } as const;

export type BlogCategoryKey = "destinations" | "conseils" | "culture" | "billetterie" | "actualites";
export type PostTexts = { title: string; lead: string; excerpt: string; tag: string; imageAlt: string; body: string; tags: string[] };

export type ApiPost = {
  id: string;
  slug: string;
  category: BlogCategoryKey;
  imageUrl: string;
  i18n: { fr: PostTexts; en?: Partial<PostTexts> };
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  position: number;
  readingMinutes: number;
  updatedAt: string;
};

export type GalleryCategoryKey = "fouta" | "cote" | "loos" | "vie";

export type ApiPhoto = {
  id: string;
  imageUrl: string;
  category: GalleryCategoryKey;
  tall: boolean;
  i18n: { fr: { alt: string; place: string }; en?: Partial<{ alt: string; place: string }> };
  published: boolean;
  position: number;
  updatedAt: string;
};
