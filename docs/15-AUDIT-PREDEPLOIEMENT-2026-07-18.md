# Audit pré-déploiement Tapote — 18 juillet 2026

Périmètre : boutique et paiement, Tapote Pilot, Tapote Gestion, API Node/Express, Supabase/Postgres/Auth/Storage, dépôt Git/GitHub, dépendances et architecture de déploiement.

## Verdict exécutif

Le code est **déployable en préproduction** et les contrôles locaux sont verts. L'ouverture immédiate des paiements réels reste un **no-go opérationnel** tant que les variables de production, le juridique, le parcours Stripe live, les sauvegardes Supabase et le nettoyage volontaire des comptes de démonstration ne sont pas traités.

Le chemin recommandé aujourd'hui est le VPS Hostinger existant, en conservant son unique reverse proxy. Vercel demanderait d'adapter le worker d'e-mails persistant et d'utiliser au minimum le plan Pro pour un usage commercial : [Vercel — plans](https://vercel.com/docs/plans/hobby) et [Express sur Vercel](https://vercel.com/docs/frameworks/backend/express).

## État des trois produits

| Surface | État | Authentification | Avant lancement |
| --- | --- | --- | --- |
| Site Tapote | Catalogue, configurateur, panier, devis et Stripe Checkout présents | Commande invitée ; aucun compte Tapote obligatoire | Configurer Stripe/Resend/variables légales, puis tester sandbox et live |
| Tapote Pilot | Connexion mot de passe ou lien magique, produits, destinations, statistiques et export | Compte client Supabase séparé, créé ou invité après la commande | Recetter un vrai client et l'isolation entre deux organisations |
| Tapote Gestion | Auth privée, rôles/RLS, commandes, clients, stock, production, encodage, tests et expédition | Comptes internes individuels uniquement | Nettoyer les démos si souhaité et recetter les deux comptes de production |

### Décision sur le compte client

Le client **n'a pas besoin de créer un compte pour commander et payer**. Stripe crée un objet Customer côté paiement, mais cela ne constitue pas un compte Tapote. Ce choix réduit la friction et évite de stocker un mot de passe sans bénéfice au moment de l'achat.

Un compte Pilot est créé uniquement lorsqu'il faut permettre au client de changer ses destinations et voir ses statistiques. Gestion reste séparé et interdit au client. Un suivi de commande par lien magique pourra être ajouté plus tard si le volume de support le justifie.

## Encodage NFC

Gestion sait désormais écrire l'URL courte `https://t.tapote.fr/a/...` depuis Chrome Android en HTTPS avec Web NFC, puis enregistrer l'étape dans Supabase. Une confirmation manuelle reste disponible pour les navigateurs non compatibles.

Une puce passive doit toujours être physiquement approchée du téléphone pour être écrite. Ce qui est réellement pilotable à distance est la destination derrière l'URL courte : le client la change dans Pilot sans réencoder la puce. Le code se trouve dans `src/ManagementApp.jsx` et le test de non-régression dans `src/ManagementApp.test.jsx`.

## Audit Supabase

- projet `pesgnpchntoxosthgzek`, actif et sain, région `eu-west-1`, PostgreSQL 17.6 ;
- 16 migrations locales et 16 migrations distantes alignées ;
- 31 tables publiques, 31 avec RLS, aucune vue publique ;
- 48 politiques dans les schémas `public` et `storage` ;
- deux buckets privés avec limites de taille et types MIME restreints ;
- aucun membre, produit, événement, unité ou ordre Gestion orphelin détecté ;
- aucune fonction publique/privée détectée utilisant `user_metadata` pour autoriser un rôle ;
- Advisor sécurité : un avertissement, protection des mots de passe compromis désactivée ;
- Advisor performance : 37 informations « unused index » sur une base neuve ; les index sont conservés ;
- logs sur 24 h : une erreur Auth 500 transitoire liée à une indisponibilité interne Postgres le 17 juillet, suivie de connexions 200 normales ; aucun signal persistant ;
- fonction Edge `codex-bootstrap-test-users` encore active sans JWT, mais sa version actuelle répond uniquement `410 Bootstrap closed` et n'effectue aucune opération.

La base n'est pas corrompue, mais elle n'est pas vide :

- `gestion.demo@tapote.fr` possède l'organisation `TAPOTE · Démonstration Gestion` ;
- `pilot.demo@tapote.fr` possède l'organisation `Café Démo Pilot` ;
- ces espaces contiennent une commande Gestion, une commande plateforme, sept produits Pilot et 84 événements de test ;
- `afrelaut@gmail.com` et `marketmenow75@gmail.com` sont owners de `TAPOTE Gestion` ;
- quatre utilisateurs sont confirmés, aucun n'est banni ou anonyme, et cinq sessions non expirées existent.

Les deux comptes et organisations de démonstration ne doivent être supprimés qu'après confirmation explicite : la suppression est irréversible et en cascade. Pour une production nette, les supprimer avant l'ouverture ou les déplacer dans un projet Supabase de staging.

## Audit Git et GitHub

- avant le présent commit, `main` local et `origin/main` pointaient tous deux vers `9a7b5af4b106812d4a1d496d19b0b78b7c9e9736` ;
- le dépôt distant répond et accepte la lecture Git ;
- le workflow CI utilise des actions épinglées par SHA et Dependabot surveille npm et GitHub Actions ;
- aucun secret `.env` n'est suivi par Git ;
- le connecteur GitHub n'a actuellement aucun compte installé et le jeton de la CLI `gh` est invalide ; les PR, issues, règles de branche et résultats Actions hébergés ne peuvent donc pas être revérifiés depuis cet audit ;
- l'équivalent local de la CI est vert : ESLint, 6 fichiers/39 tests, build Vite et audit npm avec 0 vulnérabilité.

## Rapport sécurité priorisé

### TAP-SEC-001 — Haute — configuration live absente

`.env.production` n'existe pas localement et le modèle garde `LEGAL_READY=false`, `ALLOW_DEMO_CHECKOUT=false`, ainsi que Stripe, Resend, la connexion Postgres et les secrets Supabase vides. Le serveur bloque donc correctement le checkout/ready en production, mais un paiement live ne peut pas être ouvert aujourd'hui sans cette configuration.

Emplacements : `.env.production.example:12`, `.env.production.example:25`, `.env.production.example:51`, `server/config.js:47`, `server/config.js:51`, `server/app.js:251`.

Correction : remplir `.env.production` uniquement sur le VPS/coffre de secrets, rester d'abord en Stripe sandbox, obtenir `/api/ready` à 200, puis effectuer une petite transaction live et son remboursement.

### TAP-SEC-002 — Moyenne — sauvegardes et disponibilité Supabase Free

L'organisation Supabase est sur le plan Free. Ce plan n'offre pas les garanties de sauvegarde d'un lancement commercial et peut suspendre un projet inactif : [Supabase — tarifs et sauvegardes](https://supabase.com/pricing).

Correction : passer en Pro avant trafic payant, documenter un export/restauration et tester cette restauration. Ne pas promettre 99,9 % sans supervision et procédure de reprise.

### TAP-SEC-003 — Moyenne — protection des mots de passe compromis désactivée

L'Advisor Supabase remonte `auth_leaked_password_protection`. La fonctionnalité est disponible sur les offres Supabase payantes.

Correction : après passage en Pro, activer **Authentication > Password Security > Leaked password protection**, imposer au moins 12 caractères pour les comptes internes et activer le MFA des comptes administrateurs.

Référence : [Supabase — Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

### TAP-SEC-004 — Moyenne — données et sessions de démonstration dans le projet de production

Deux comptes de démonstration, leurs organisations, leurs données et plusieurs sessions vivent dans le même projet que les comptes internes. La RLS les isole, mais cela augmente le risque opérationnel et brouille les métriques.

Correction : confirmer puis supprimer les deux tenants de démonstration et leurs utilisateurs, révoquer les anciennes sessions, ou réserver ce projet au staging et créer un projet de production séparé.

### TAP-SEC-005 — Moyenne — état GitHub hébergé non vérifiable

Le dépôt Git est joignable, mais le connecteur GitHub et la CLI ne sont pas authentifiés. Les protections de branche, alertes, Actions et PR ne peuvent pas être certifiées aujourd'hui.

Correction : reconnecter le plugin GitHub ou exécuter `gh auth login`, vérifier l'Action du nouveau commit, puis activer au minimum Dependabot alerts, secret scanning si disponible et une règle exigeant la CI avant fusion.

### TAP-SEC-006 — Faible — fonction Edge de bootstrap conservée

`codex-bootstrap-test-users` est publique sans JWT mais répond seulement 410. Elle ne permet plus de créer ou modifier des utilisateurs, toutefois son maintien crée une surface inutile et un nom révélateur.

Correction : la supprimer du projet après avoir confirmé qu'aucun script ne l'utilise. Ne jamais redéployer sa version de bootstrap initiale.

### TAP-SEC-007 — Information — erreur Auth transitoire

Une requête de refresh token a reçu un 500 pendant une indisponibilité interne Postgres le 17 juillet. Les requêtes suivantes ont réussi. Aucun correctif applicatif immédiat n'est indiqué ; créer une alerte si le phénomène se répète.

## Contrôles sécurisés déjà présents

- Helmet/CSP, limitation de débit, CORS explicite, limites de corps et erreurs génériques dans `server/app.js` ;
- webhook Stripe en corps brut avec signature obligatoire et traitement idempotent dans `server/app.js:225` ;
- prix recalculés côté serveur et `customer_creation` Stripe dans `server/app.js:426` ;
- vérification du contenu réel des uploads dans `server/app.js:302` ;
- RLS et révocation des accès navigateur backend dans `supabase/migrations/20260716015914_production_foundation.sql:92` et `supabase/migrations/20260716020224_advisor_hardening.sql:4` ;
- conteneur Node non-root, secrets hors image et healthcheck dans `Dockerfile` ;
- Gestion masqué sur le domaine public et protégé sur son sous-domaine dans `deploy/Caddyfile:11` et `deploy/Caddyfile:30` ;
- mode VPS partagé lié à `127.0.0.1` dans `deploy/docker-compose.shared-vps.yml`.

## Validation technique du 18 juillet

| Contrôle | Résultat |
| --- | --- |
| ESLint | Réussi, 0 avertissement |
| Vitest | 6 fichiers, 39 tests réussis |
| Build Vite production | Réussi |
| Audit npm production | 0 vulnérabilité connue |
| Git diff whitespace | Réussi |
| Migration locale/distante | 16/16 alignées |
| Docker Compose local | Non exécuté : Docker absent du poste ; `config --quiet` obligatoire sur le VPS avant démarrage |

## Ordre de lancement recommandé

1. Commit et push du dépôt vérifié.
2. Snapshot du VPS, puis inventaire des ports, conteneurs et réseaux existants.
3. Déploiement partagé avec checkout fermé (`LEGAL_READY=false`) et Stripe sandbox.
4. DNS/TLS, `/api/health`, `/api/ready`, Pilot et Gestion.
5. Paiement sandbox complet : webhook, commande, fichiers, e-mail et absence de doublon.
6. Décision explicite sur les deux tenants de démonstration.
7. Supabase Pro, protection des mots de passe compromis, sauvegarde et restauration testée.
8. Validation juridique, clés Stripe live, achat réel faible puis remboursement.
9. `LEGAL_READY=true` et ouverture surveillée à cinq clients pilotes avant trafic public.

Le tutoriel pas à pas est dans [08-STRIPE-HOSTINGER.md](08-STRIPE-HOSTINGER.md).
