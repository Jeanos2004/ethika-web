/**
 * Mode démonstration (NEXT_PUBLIC_DEMO_MODE=1), pensé pour un déploiement de présentation sans back-end :
 * - bandeau « site de démonstration » et site exclu des moteurs de recherche ;
 * - les demandes envoyées sont gardées dans le navigateur du visiteur et visibles dans le back-office /admin.
 * Rien n'est transmis à un tiers. Hors démo, /admin renvoie 404 tant que l'authentification (phase 2) n'existe pas.
 */
export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
