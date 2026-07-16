# TAPOTE — rapport plateforme SaaS

État vérifié le 16 juillet 2026 sur le projet Supabase `Tapote` et le dépôt `afrelaut/Tapote`.

## Architecture livrée

Une seule base Supabase sert de source de vérité. Ce choix évite les doubles écritures fragiles entre trois bases et garantit des transactions atomiques.

```text
tapote.fr / Stripe
        │ commande payée
        ▼
orders + order_items
        │ trigger idempotent
        ▼
TAPOTE Gestion ── production / statut / audit
        │ activation serveur contrôlée
        ▼
organisation client Pilot ── produits ── liens ── interactions
```

- Chaque commande web possède au maximum une commande Gestion et un dossier de provisionnement.
- Le client Gestion est rapproché par e-mail dans l’organisation interne TAPOTE.
- Un pack est développé en supports physiques réels : le Pack Restaurant de test crée sept produits et sept liens.
- Le statut Gestion met à jour la commande boutique (`assembly` → `in_production`, par exemple).
- Une activation crée une organisation client distincte, son établissement et ses produits Pilot.
- Gestion voit l’état Pilot dans la commande sans pouvoir lire le tenant client.
- Pilot ne voit jamais les clients, commandes, stocks ou audits internes.

## Sécurité vérifiée

- RLS actif sur toutes les tables exposées.
- Rôles déterminés par `organization_members`, jamais par des métadonnées utilisateur modifiables.
- Pilot peut uniquement lire son tenant et modifier `target_url`/`active` sur un lien existant.
- Provisionnement et données Stripe inaccessibles aux navigateurs.
- Aucun droit `TRUNCATE`, `REFERENCES` ou `TRIGGER` pour `authenticated` sur les tables Gestion.
- Activation inter-tenant réservée à une clé serveur et à un opérateur Gestion vérifié.
- Journal d’audit des changements de destination.
- Deux comptes de test confirmés, révocables et séparés ; aucun secret d’infrastructure n’est enregistré dans Git.

Le contrôle automatisé `npm run platform:verify` valide actuellement : 1 client Gestion, 1 commande liée, 7 produits Pilot, 84 interactions de test, isolation croisée et permissions de colonnes.

## Réglages externes obligatoires avant production

Ces réglages ne sont pas pilotables par le connecteur Supabase actuel et doivent être faits dans le Dashboard :

1. **Auth > Providers > Email** : désactiver « Allow new users to sign up » ; les créations passent par les scripts serveur.
2. **Auth > URL Configuration** : Site URL `https://tapote.fr`; ajouter les redirections `/pilot` et `/gestion`, plus leurs équivalents locaux.
3. **Auth > Password Security** : activer la protection contre les mots de passe compromis. C’est le seul avertissement restant du conseiller Supabase.
4. **Auth > SMTP Settings** : connecter le SMTP transactionnel et tester invitation, lien magique et mot de passe oublié.
5. **Edge Functions** : supprimer `codex-bootstrap-test-users`. Sa version active répond déjà uniquement `410 Gone` et ne contient plus aucun secret, mais le supprimer garde le projet propre.

## Exploitation

```powershell
# Créer l’espace interne et son propriétaire
npm run management:invite -- --email aymeric@tapote.fr --name "Aymeric" --role owner

# Activer une commande web dans Pilot
npm run pilot:activate-order -- --order WEB-XXXXXXXXXX --operator-email aymeric@tapote.fr --operator-password "..."

# Vérifier la plateforme complète avec des comptes techniques révocables
npm run platform:verify
```

Ne jamais partager un compte interne, mettre une clé `SUPABASE_SECRET_KEY` dans une variable `VITE_*`, ni commiter `.env`.

## Définition de « prêt à vendre »

La couche applicative et la base partagée sont opérationnelles. La mise en vente réelle reste fermée par `LEGAL_READY=false` tant que Stripe live, le webhook public, les mentions/CGV, Resend/SMTP, le déploiement Hostinger, les DNS et la supervision n’ont pas été validés de bout en bout. Cette barrière est volontaire : elle empêche une commande réelle sur une infrastructure incomplète.
