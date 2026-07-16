# Tapote

Documentation de l’espace interne : [TAPOTE Gestion — Supabase privé](docs/09-GESTION-SUPABASE.md).

Boutique React/Express prête à être reliée à Stripe, Supabase, Resend et Sentry. La vente réelle est **fermée par défaut** : en production, le checkout ne s’ouvre que lorsque les paiements, le webhook, PostgreSQL, le stockage privé, les notifications et les informations légales sont tous opérationnels.

## Démarrage local

Prérequis : Node.js 22.12 à 24.

```bash
npm ci
Copy-Item .env.example .env
npm run dev
```

- Site Vite : `http://localhost:5173`
- API : `http://localhost:3001`
- En local uniquement, le checkout peut simuler une commande sans débit. Les données de développement restent en mémoire et les logos sont placés dans `data/dev-uploads/`.

## Contrôles qualité

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
npm run ci
```

La CI GitHub exécute ces contrôles à chaque push et pull request. Dependabot surveille les dépendances npm et les actions GitHub.

## Architecture de production

```text
src/                 boutique React, configurateur et espace client Pilot
src/pilot/           interface Pilot, authentification et données agrégées
server/app.js        API Express, Stripe et redirecteur public /a/:code
server/repository.js persistance PostgreSQL et outbox durable
server/storage.js    stockage privé des logos dans Supabase Storage
server/notifications.js notifications Resend avec reprises idempotentes
shared/catalog.js    catalogue et prix de référence côté serveur
supabase/migrations/ schéma SQL, RLS et orchestration boutique/Gestion/Pilot
scripts/             provisionnement, invitations, activation et vérifications
public/assets/       visuels WebP responsifs
docs/                marque, marché, exploitation, sécurité et mise en ligne
```

Le serveur recalcule chaque prix depuis `shared/catalog.js`, valide strictement les requêtes et n’accepte jamais un prix envoyé par le navigateur. Les webhooks Stripe sont vérifiés, enregistrés une seule fois et peuvent être rejoués sans doubler les commandes ou les e-mails.

## Mise en production

Le guide opérateur général est dans [docs/06-MISE-EN-PRODUCTION.md](docs/06-MISE-EN-PRODUCTION.md). Le déploiement retenu pour Tapote — Stripe + VPS Hostinger + Docker/Caddy — est détaillé dans [docs/08-STRIPE-HOSTINGER.md](docs/08-STRIPE-HOSTINGER.md). En résumé :

1. créer Supabase puis appliquer la migration ;
2. provisionner le bucket privé ;
3. configurer Stripe Checkout et son webhook ;
4. vérifier `tapote.fr` dans Resend ;
5. renseigner les mentions et CGV validées ;
6. ajouter Sentry et les variables d’environnement ;
7. déployer le conteneur, connecter le domaine et vérifier `/api/ready` ;
8. effectuer une commande Stripe de bout en bout en mode test, puis une transaction réelle de faible montant.

Ne passe `LEGAL_READY=true` qu’après validation humaine du contenu juridique. Les variables `VITE_LEGAL_*` doivent être présentes **pendant le build et au runtime**, avec la même version que `LEGAL_VERSION`.

## Tapote Pilot

La bêta client est disponible sur `/pilot`. Sans clés Supabase, le développement affiche un workspace de démonstration. L’activation des invitations, des données réelles, du redirecteur et du DNS est détaillée dans le [guide Pilot](docs/07-PILOT-BETA.md). L’offre reste volontairement absente du paiement.

## Plateforme unifiée

Les trois surfaces partagent un seul projet Supabase multi-tenant. Stripe alimente `orders`; une commande payée est synchronisée dans TAPOTE Gestion; l’activation crée ensuite un tenant Pilot client isolé et un lien permanent par support physique. Le statut remonte dans les deux sens et toutes les opérations sensibles restent côté serveur. Le [rapport SaaS](docs/10-PLATEFORME-SAAS.md) décrit l’état vérifié et les actions externes restantes.

## Documents

- [Charte de marque](docs/01-CHARTE-DE-MARQUE.md)
- [Étude de marché](docs/02-ETUDE-DE-MARCHE.md)
- [Guide d’exploitation](docs/03-GUIDE-AYMERIC-A-Z.md)
- [Sécurité et risques résiduels](docs/05-SECURITE-PRODUCTION.md)
- [Tutoriel de mise en production](docs/06-MISE-EN-PRODUCTION.md)
- [Activation de la bêta Pilot](docs/07-PILOT-BETA.md)
- [Stripe et déploiement Hostinger](docs/08-STRIPE-HOSTINGER.md)
- [Rapport plateforme SaaS](docs/10-PLATEFORME-SAAS.md)
