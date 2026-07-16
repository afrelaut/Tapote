# Sécurité de production — Tapote

État au 16 juillet 2026. Ce document décrit les protections intégrées au code et les contrôles qui restent à réaliser avec les comptes externes.

## Protections intégrées

- **Vente fermée par défaut** : le checkout de production exige HTTPS, Stripe, webhook signé, PostgreSQL durable, stockage privé, e-mail opérationnel et contenu légal complet.
- **Prix de confiance côté serveur** : le navigateur ne transmet que les identifiants et quantités ; le catalogue serveur fixe les prix.
- **Validation stricte** : Zod limite champs, formats, URLs HTTPS, quantités, produits et actions. Les objets inconnus sont refusés.
- **Paiement idempotent** : un UUID de tentative identifie la commande ; la même clé est utilisée pour Stripe.
- **Webhooks sûrs** : signature Stripe vérifiée sur le corps brut, événements persistés avec unicité, traitements rejouables, statuts remboursement/litige conservés.
- **Fichiers privés** : limite 2 Mo, allowlist PNG/JPEG/WebP, vérification de la signature binaire, nom normalisé, identifiant aléatoire, bucket Supabase non public.
- **Base cloisonnée** : aucune donnée commerce n’est accordée à `anon` ou `authenticated`. Les futures tables Pilot ont une RLS par organisation et des rôles explicites.
- **API durcie** : Helmet/CSP sans script inline, CORS allowlist, limites JSON, rate limiting, erreurs génériques, IDs de requête et journaux structurés avec secrets masqués.
- **Notifications fiables** : outbox PostgreSQL, déduplication, verrouillage concurrent et reprises avec backoff.
- **Supply chain** : versions exactes, lockfile, audit npm en CI, Dependabot, conteneur multi-stage exécuté sans root.
- **Vie privée** : aucun IP brut n’est prévu dans les événements Pilot ; Sentry est configuré sans envoi de données personnelles par défaut.

## Contrôles obligatoires avant ouverture

- Activer la MFA sur GitHub, Supabase, Stripe, Resend, Sentry, le registrar et l’hébergeur.
- Conserver toutes les clés uniquement dans le gestionnaire de secrets de l’hébergeur. Ne jamais créer de variable `VITE_` pour une clé privée.
- Restreindre les accès équipe au besoin réel et conserver au moins deux administrateurs de secours.
- Activer les sauvegardes PostgreSQL et pratiquer une restauration sur un projet de test.
- Configurer les alertes Stripe (litige/remboursement), Sentry (nouvelle erreur) et hébergeur (readiness/5xx).
- Tester les politiques RLS avec deux organisations différentes avant toute ouverture de Pilot.
- Faire valider les CGV, mentions, confidentialité, médiation, retours et traitement des personnalisations par un professionnel compétent.

## Risques résiduels

1. **Intégrations non configurées** : sans les vraies clés, `/api/ready` renvoie 503. C’est une protection, pas un défaut.
2. **Pilot non activé** : la bêta, l’authentification et le redirecteur sont livrés, mais aucun projet Supabase ni DNS distant n’est configuré dans ce dépôt. Pilot doit rester privé jusqu’à l’application des migrations et au test d’isolation avec deux organisations.
3. **Consentement analytics** : aucun outil marketing n’est installé. Si Meta Pixel, GA ou Hotjar sont ajoutés, une gestion de consentement doit précéder leur chargement.
4. **Juridique** : les textes affichés structurent l’information mais ne remplacent pas une validation juridique.
5. **Opérations physiques** : le code ne remplace pas une procédure BAT, fabrication, expédition, SAV et remboursement testée humainement.

## Réponse à incident minimale

1. Mettre `LEGAL_READY=false` ou retirer `STRIPE_SECRET_KEY` pour fermer immédiatement le checkout.
2. Révoquer et recréer la clé concernée dans le fournisseur.
3. Examiner Stripe, Sentry et les journaux par `X-Request-Id`, sans copier de secrets dans un ticket.
4. Identifier les commandes touchées dans Supabase et conserver les preuves.
5. Informer les personnes concernées selon la nature de l’incident et les obligations applicables.
6. Corriger, ajouter un test de non-régression, redéployer puis rouvrir seulement après vérification de `/api/ready`.
