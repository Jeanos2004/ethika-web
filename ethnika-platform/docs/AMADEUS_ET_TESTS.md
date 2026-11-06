# Amadeus, consolidateurs et API de test — explication concrète

## 1. Comment se vend un billet d'avion (la chaîne réelle)

```
Compagnie aérienne ── publie vols, tarifs, places ──▶ GDS (Amadeus, Sabre, Travelport)
                                                        │
Agence (ETHNIKA) ── terminal ou API ──────────────────▶ │ 1. RECHERCHE  disponibilités + tarifs
                                                        │ 2. RÉSERVATION  crée un PNR (dossier passager)
                                                        │ 3. ÉMISSION  numéro de billet électronique (13 chiffres)
                                                        ▼
                              Règlement financier : BSP de l'IATA (si agence accréditée)
                              ou consolidateur (qui émet et encaisse pour l'agence)
```

- **Rechercher et réserver** ne demande « que » l'accès au GDS. Un PNR réservé mais non émis est annulé
  automatiquement à l'échéance (time limit).
- **Émettre**, c'est vendre réellement le billet. Il faut une **autorité d'émission** :
  - soit **l'accréditation IATA** de l'agence : elle rejoint le BSP, verse une garantie financière et règle les compagnies chaque période ;
  - soit **un consolidateur** : une agence ou un grossiste accrédité qui émet pour vous, contre commission ou frais.
    C'est la voie normale d'une agence qui démarre.

## 2. Amadeus : ce qui est possible aujourd'hui (novembre 2026)

| Accès | Statut | Pour qui |
|---|---|---|
| **Amadeus Selling Platform** (terminal agence) | Contrat avec le bureau Amadeus local (Afrique de l'Ouest et du Centre) | Les agents de l'agence, au quotidien |
| **API Self-Service** (inscription gratuite, sandbox gratuite) | **Fermée** : inscriptions suspendues, portail et clés désactivés le **17 juillet 2026** | Plus personne |
| **API Enterprise** | Sur contrat commercial : identifiant d'agence (Office ID), certification, frais par transaction | Agences et OTA avec volume |

**Il n'existe donc plus d'inscription gratuite pour tester Amadeus.** Pour avoir accès :
1. ETHNIKA (pas le développeur) contacte le bureau Amadeus local et signe un contrat d'agence.
   Elle obtient son terminal et son identifiant d'agence.
2. Elle demande en plus l'accès aux **API Enterprise**. Amadeus fournit un environnement de test et une documentation,
   puis une certification avant la production.
3. Comptez plusieurs semaines. Les conditions (frais, volumes) se négocient : **à confirmer avec Amadeus**.

## 3. Tester MAINTENANT, gratuitement : Duffel (recommandé pour le développement)

- Inscription gratuite sur duffel.com. Le tableau de bord bascule en **« Developer test mode »** et l'on crée un jeton `duffel_test_…`.
- Le mode test ne coûte rien et ne réserve rien de réel.
- **Duffel Airways** (code `ZZ`) est une compagnie fictive. Elle permet de tester tout le parcours :
  - recherche ;
  - choix de tarif ;
  - plan de cabine ;
  - **création de commande**, modification, annulation et remboursement ;
  - avec les cartes de test.
- C'est une API REST/JSON moderne. Idéale pour construire et valider l'adaptateur `FlightProvider` et toute l'interface de réservation.
- **Limite pour la production en Guinée** : sans accréditation IATA, la vente passe par le « Managed Content » de Duffel.
  Il ne couvre que 5 pays de vente (Australie, France, Irlande, Royaume-Uni, États-Unis). Depuis la Guinée, il faudra :
  - soit l'accréditation IATA d'ETHNIKA ;
  - soit un autre fournisseur ou consolidateur.

**Conclusion pratique** : on développe et on teste avec Duffel. Le jour où le contrat Amadeus ou consolidateur est signé,
on écrit un second adaptateur. Le front ne change pas.

## 4. Consolidateurs et agrégateurs avec API

Ce sont des fournisseurs B2B : ils donnent un accès test **après** un accord commercial, sans inscription libre.
Ce sont des pistes à démarcher, sans recommandation ferme. Vérifiez couverture, conditions et dépôt de garantie.

| Fournisseur | Type | Accès test | Remarques |
|---|---|---|---|
| **Mystifly** | Consolidateur international (API OnePoint) | Sandbox après accord commercial | Plus de 80 pays de vente annoncés. Vérifier la Guinée. |
| **TBO** (TBO Tek) | Grossiste B2B (vols + hôtels) | Identifiants test après inscription agence | Présence en Afrique et au Moyen-Orient |
| **Travelfusion** | Agrégateur (low cost + NDC) | Sur contrat | Surtout du contenu low cost et NDC |
| **Consolidateurs locaux et régionaux** (Conakry, Dakar, Abidjan) | Émission pour l'agence | Rarement une API, souvent un portail B2B | Souvent la voie la plus rapide pour émettre réellement |
| **Sabre / Travelport** | GDS concurrents | Sur contrat agence | Même logique qu'Amadeus |

> Question à poser à chaque fournisseur :
> 1. Point de vente Guinée accepté ?
> 2. Compagnies couvertes au départ de CKY (Air France, Brussels Airlines, Royal Air Maroc, Turkish, ASKY, Air Côte d'Ivoire…) ?
> 3. Dépôt ou garantie exigé ?
> 4. Environnement de test et délai de certification ?
> 5. Frais par billet ?

## 5. Ce qu'ETHNIKA doit décider (non technique)
1. Émettre via **son accréditation IATA** (indépendance, mais garantie et délai) ou via **un consolidateur** (rapide).
2. Signer avec **Amadeus** (terminal ± API Enterprise) ou avec le GDS ou portail déjà utilisé par le consolidateur.
3. Paiement en ligne ou non. Mobile money (Orange Money, MTN MoMo) et cartes : choisir un prestataire agréé.

Tant que ces décisions ne sont pas prises, le site fonctionne **sur demande** :
formulaire → base → back-office → agent qui réserve dans son outil.
C'est ce qui est développé en phase 1.
