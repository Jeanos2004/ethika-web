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
  kpis: { toTreat: number; overdue: number; inProgress: number; confirmationRate: number | null; last7: number; prev7: number };
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

/** Statut de l'API → statut de l'interface (pastilles et libellés communs avec la démo). */
export const uiStatus = { new: "new", in_progress: "progress", confirmed: "confirmed", cancelled: "cancelled" } as const;
