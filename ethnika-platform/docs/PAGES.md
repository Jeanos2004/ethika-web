# Pages — route ↔ maquette ↔ état

Toutes les routes existent en français (sans préfixe) et en anglais (`/en/…`). Textes : `apps/web/messages/{fr,en}.json` (un espace de noms par page) et `src/content/*.ts` (+ `*.en.ts` ou fonctions `getX(locale)`). Registre : `src/content/pages.ts`, toutes les entrées en `status: "done"`.

| Route | Maquette (`design/maquettes/`) | État | Interactions reproduites |
|---|---|---|---|
| `/` | `Home2.dc.html`, `HomeMobile.dc.html` | **Fait** | Slider 3 diapos (pause, réduction des animations), onglets de recherche (circuit, vol, pro), carrousel de circuits, vidéo |
| `/decouvrir-la-guinee` | `Guinee.dc.html` | **Fait** | Images en arches, bandeau d'appel |
| `/decouvrir-la-guinee/mali-fouta-djallon` | `Destination.dc.html` | **Fait** | Sommaire de section, itinéraire, mosaïque photo, devis destination |
| `/decouvrir-la-guinee/iles-de-loos` | `Loos.dc.html` | **Fait** | Photos des îles, modale de devis |
| `/decouvrir-la-guinee/basse-cote` | `BasseCote.dc.html` | **Fait** | Sommaire ancré |
| `/decouvrir-la-guinee/infos-pratiques` | `InfosPratiques.dc.html` | **Fait** | Sommaire collant, tableau des vaccins |
| `/circuits` | `Circuits.dc.html` | **Fait** | Filtres région / durée / thème et tri dans l'URL, pagination ; filtre Budget désactivé tant que les prix sont des placeholders |
| `/circuits/[slug]` | `CircuitDetail.dc.html` | **Fait** | Programme en accordéon (tout ouvrir), compteur de voyageurs, modale de devis, JSON-LD TouristTrip |
| `/billetterie` | `Billetterie.dc.html` | **Fait** | Aller simple / retour / multi-destinations, passagers bornés, classe, récapitulatif en direct, préremplissage par URL, FAQ |
| `/services` | `Services.dc.html` | **Fait** | Formulaire pro (groupe, pèlerinage, entreprise) → `/merci` |
| `/offres` | `Offres.dc.html` | **Fait** | Filtre par type (URL), alertes promo (newsletter) |
| `/blog` | `Blog.dc.html` | **Fait** | Catégories, recherche, pagination (URL) |
| `/blog/[slug]` | `Article.dc.html` | **Fait** (1 article rédigé, 8 brouillons `noindex`) | Sommaire relié aux intertitres, partage ; corps MDX en français, version anglaise signalée et `noindex` |
| `/galerie` | `Galerie.dc.html` | **Fait** | Filtres, visionneuse (flèches, Échap, retour du focus) |
| `/a-propos` | `APropos.dc.html` | **Fait** | — |
| `/contact` | `Contact.dc.html` | **Fait** | Formulaire → `/merci?ref=…` |
| `/faq` | `FAQ.dc.html` | **Fait** | Recherche instantanée, catégories, accordéon, JSON-LD FAQPage |
| `/mentions-legales`, `/cgv`, `/confidentialite`, `/cookies` | `Legal.dc.html` | **Fait** (textes à valider par un juriste) | 4 routes ; textes juridiques en français uniquement, signalé en anglais ; gestion du consentement sur `/cookies` |
| `/merci` | `Merci.dc.html` | **Fait** | Référence `?ref=` et type validés, `noindex` |
| 404 | `Page404.dc.html` | **Fait** | — |
| Images OG | — | **Fait** | `opengraph-image.tsx` par route et par langue (`src/lib/og.tsx`), ≈ 60 Ko |
| `/admin/demandes` (phase 2) | `AdminDemandes.dc.html` | Phase 2 | Filtres, détail, statut, export CSV |
| E-mail accusé | `EmailAccuse.dc.html` | Phase 2 (React Email) | — |
| Kit UI (`/kit`, dev uniquement) | `Composants.dc.html` | **Fait** | Onglets, accordéon, modale, compteur, en-tête fixe au scroll |
| Charte | `Main.dc.html` | Référence marque | — |

## Écarts assumés par rapport aux maquettes
- Contrastes renforcés (`subtle`, `gold-700`, `gold-50`) là où la maquette passait sous 4,5:1.
- Barre d'actions mobile (appel, WhatsApp, devis) sur tout le site.
- Champ e-mail facultatif ajouté au devis pro ; Contact et devis pro redirigent vers `/merci`.
- Témoignages : un seul placeholder tant que l'agence n'a pas fourni de vrais avis.
- Accueil : bouton « En savoir plus » → « Découvrir l'agence » (texte de lien explicite, audit SEO).
