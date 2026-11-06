import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge, StatusBadge, leadStatuses, type LeadStatus } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Checkbox, Input, RadioGroup, Select, Textarea } from "@/components/ui/Field";
import { Counter } from "@/components/ui/Counter";
import { Tabs } from "@/components/ui/Tabs";
import { Accordion } from "@/components/ui/Accordion";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CircuitCard } from "@/components/cards/CircuitCard";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { PostCard } from "@/components/cards/PostCard";
import { OfferCard } from "@/components/cards/OfferCard";
import { BoardingPass } from "@/components/cards/BoardingPass";
import { ModalDemo, ToastDemo } from "./KitDemos";

/*
 * Vitrine interne du kit UI — référence : design/maquettes/Composants.dc.html
 * Disponible uniquement en développement : 404 en production, jamais indexée, absente du sitemap.
 * (Un dossier « _kit » serait privé dans l'App Router et ne créerait pas de route.)
 */
export const metadata: Metadata = {
  title: "Kit UI (interne)",
  robots: { index: false, follow: false },
};

const cabins = [
  { value: "eco", label: "Économique" },
  { value: "premium", label: "Premium économique" },
  { value: "business", label: "Affaires" },
] as const;

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[18px]">
      <h2 className="text-[clamp(28px,3vw,36px)] font-bold tracking-tight text-night">
        <span className="mr-3 font-mono text-brand-red">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius-md)] border border-line bg-white p-5 sm:p-7 ${className}`}>{children}</div>;
}

/** Grilles fluides de la maquette. Classes écrites en entier pour que Tailwind les détecte. */
const grids = {
  240: "grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]",
  260: "grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))]",
  280: "grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))]",
  320: "grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]",
  420: "grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))]",
} as const;
const grid = (min: keyof typeof grids) => grids[min];

export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="container-site flex flex-col gap-[72px] py-20">
      <header className="flex flex-col gap-2.5 border-b-2 border-night pb-7">
        <span className="eyebrow text-brand-red">Design system · v1.0 · interne</span>
        <h1 className="h-display text-night">Kit de composants</h1>
      </header>

      <Section n="04" title="Boutons">
        <div className={grid(320)}>
          <Panel className="flex flex-wrap items-center gap-3">
            <Button>Réserver</Button>
            <Button variant="secondary">Détails</Button>
            <Button variant="outline">Sur mesure</Button>
            <Button disabled>Désactivé</Button>
          </Panel>
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-night p-5 sm:p-7">
            <ButtonLink href="/circuits" variant="gold">
              Voir les circuits
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-light">
              Voyage sur mesure
            </ButtonLink>
            <Button variant="whatsapp">WhatsApp</Button>
            <Button size="sm">S · 40</Button>
            <Button size="lg">L · 56</Button>
            <button type="button" aria-label="Suivant" className="flex size-12 items-center justify-center rounded-full bg-night-2 text-white">
              <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </Section>

      <Section n="05" title="Champs de formulaire">
        <Panel className={grid(240)}>
          <Input label="Défaut" placeholder="Votre nom" hint="Texte d'aide" />
          <Input label="Erreur" defaultValue="aminata@" error="Adresse e-mail incomplète" />
          <Input label="Valide" defaultValue="+224 6XX XX XX XX" valid hint="Format accepté" />
          <Input label="Désactivé" defaultValue="Conakry (CKY)" disabled />
          <Select label="Classe" options={cabins} defaultValue="eco" />
          <Counter label="Adultes" hint="12 ans et plus" min={1} defaultValue={2} />
          <div className="flex flex-col gap-4">
            <Checkbox label="J'accepte d'être recontacté" defaultChecked />
            <RadioGroup legend="Type de trajet" name="kit-trip" defaultValue="rt" options={[{ value: "rt", label: "Aller-retour" }, { value: "ow", label: "Aller simple" }]} />
          </div>
          <Textarea label="Message" placeholder="Votre projet de voyage" rows={3} />
        </Panel>
      </Section>

      <div className={grid(420)}>
        <Section n="06" title="Chips, badges, statuts">
          <Panel className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap gap-2">
              <Chip active>Actif</Chip>
              <Chip>Inactif</Chip>
              <Chip count={12}>Filtre</Chip>
              <Chip href="/kit?theme=nature" count={4}>
                Lien filtre
              </Chip>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">Dernière minute</Badge>
              <Badge tone="green">Nature</Badge>
              <Badge tone="red">Promo</Badge>
              <Badge tone="night">Bientôt</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(leadStatuses) as LeadStatus[]).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </Panel>
        </Section>

        <Section n="07" title="Onglets & pagination">
          <Panel className="flex flex-col gap-6">
            <Tabs
              variant="pill"
              label="Type de trajet"
              items={[
                { value: "rt", label: "Aller-retour", content: <p className="text-muted">Panneau aller-retour.</p> },
                { value: "ow", label: "Aller simple", content: <p className="text-muted">Panneau aller simple.</p> },
                { value: "multi", label: "Multi", content: <p className="text-muted">Panneau multi-destinations.</p> },
              ]}
            />
            <Tabs
              label="Détail du circuit"
              items={[
                { value: "programme", label: "Programme", content: <p className="text-muted">Jour 1 : Conakry → Mamou.</p> },
                { value: "inclus", label: "Inclus", content: <p className="text-muted">4x4, guide, hébergement.</p> },
                { value: "departs", label: "Départs", content: <p className="text-muted">Dates : [DATE].</p> },
              ]}
            />
            <Pagination page={1} totalPages={3} hrefFor={(p) => `/kit?page=${p}`} />
          </Panel>
        </Section>
      </div>

      <Section n="08" title="Cartes">
        <div className={`${grid(260)} items-start`}>
          <CircuitCard
            circuit={{ href: "/circuits/fouta-djallon-cascades-sommets", title: "Fouta Djallon, cascades & sommets", image: "/images/fouta-sommets.jpg", imageAlt: "Sommets rocheux du Fouta Djallon", meta: "4 jours · Fouta", theme: { label: "Nature", tone: "green" } }}
          />
          <DestinationCard destination={{ href: "/decouvrir-la-guinee/basse-cote", title: "Bel-Air & Basse Côte", region: "Basse Guinée", image: "/images/bel-air-cocotiers.jpg", imageAlt: "Plage bordée de cocotiers" }} />
          <PostCard
            post={{ href: "/blog", title: "Les chutes de Nguilo, mode d'emploi", category: "Destinations", readingMinutes: 5, excerpt: "Quand partir, comment s'y rendre et que prévoir pour une journée autour des chutes.", image: "/images/chutes-nguilo.jpg", imageAlt: "Chutes de Nguilo" }}
          />
          <OfferCard
            offer={{ type: "last", href: "/decouvrir-la-guinee/iles-de-loos", title: "Week-end à Loos ce samedi", kicker: "Îles de Loos · 2 j", description: "Quelques places restantes au départ de Boulbinet.", image: "/images/loos-pirogue-couchant.jpg", imageAlt: "Pirogue au couchant" }}
          />
        </div>
        <BoardingPass className="max-w-[430px]" tripLabel="ALLER-RETOUR" from={{ code: "CKY", city: "Conakry" }} to={{ code: "CDG", city: "Paris" }} passengers="2 adultes" cabin="Économique" />
      </Section>

      <Section n="10" title="Retours, chargement, états vides">
        <div className={`${grid(280)} items-start`}>
          <div className="flex flex-col gap-3">
            <Toast tone="success" title="Demande envoyée">
              Réf. ETH-0421
            </Toast>
            <Toast tone="error" title="Envoi impossible">
              Vérifiez votre connexion et réessayez.
            </Toast>
            <Toast tone="info" title="Information">
              Prix indicatifs, sous réserve.
            </Toast>
            <ToastDemo />
          </div>
          <CardSkeleton />
          <EmptyState
            action={
              <ButtonLink href="/kit" variant="outline" size="sm">
                Réinitialiser
              </ButtonLink>
            }
          />
        </div>
      </Section>

      <div className={grid(420)}>
        <Section n="11" title="Accordéon">
          <Accordion
            defaultOpen={["q1"]}
            items={[
              { value: "q1", title: "Question ouverte", content: "Réponse affichée. aria-expanded=\"true\" sur le bouton." },
              { value: "q2", title: "Question fermée", content: "Réponse masquée tant que la question est fermée." },
            ]}
          />
        </Section>
        <Section n="12" title="Modale">
          <Panel className="flex flex-col items-start gap-3">
            <p className="text-muted">Échap, clic sur le fond ou bouton Fermer. Le focus revient sur le bouton d&apos;ouverture.</p>
            <ModalDemo />
          </Panel>
        </Section>
      </div>
    </div>
  );
}
