# Mise en production de tapote.fr — tutoriel opérateur

> Architecture retenue : pour le déploiement Hostinger, Stripe et les trois surfaces (site, Pilot, Gestion), suivre en priorité [08-STRIPE-HOSTINGER.md](08-STRIPE-HOSTINGER.md). Le présent document reste la check-list générale des intégrations.

Objectif : ouvrir la vente des objets Tapote avec un paiement réel, des données durables, des logos privés et des alertes exploitables. Compter environ deux à quatre heures si les comptes et les informations légales sont prêts.

## 1. Préparer les comptes

Crée ou ouvre ces services avec MFA :

- GitHub pour le dépôt et la CI ;
- Supabase pour PostgreSQL et Storage ;
- Stripe pour les paiements ;
- Resend pour les e-mails `@tapote.fr` ;
- Sentry pour les erreurs serveur ;
- un hébergeur de conteneur Node avec disque éphémère accepté, par exemple Railway, Render ou Fly.io ;
- le registrar où `tapote.fr` est géré.

N’envoie aucune clé dans un chat, un commit, une capture ou une variable commençant par `VITE_`.

## 2. Mettre le code sur GitHub

Dans le dossier du projet :

```bash
npm ci
npm run ci
git add .
git commit -m "Prepare Tapote production foundation"
git push
```

Vérifie ensuite que le workflow **CI** est vert dans l’onglet Actions.

## 3. Configurer Supabase

1. Crée un projet Supabase dans une région européenne proche des clients.
2. Dans **Project Settings → Database**, copie la chaîne de connexion pooler compatible avec ton hébergeur. Utilise-la pour `DATABASE_URL` ; garde `DATABASE_SSL=true`.
3. Dans **Project Settings → API Keys**, crée ou copie une **secret key** serveur. Elle va dans `SUPABASE_SECRET_KEY`, jamais dans le frontend.
4. Copie l’URL du projet dans `SUPABASE_URL`.
5. Connecte la CLI puis applique les migrations :

```bash
npx supabase login
npx supabase link --project-ref TON_PROJECT_REF
npm run supabase:migrate
```

6. Avec `SUPABASE_URL` et `SUPABASE_SECRET_KEY` définis localement pour cette commande, crée le bucket privé :

```bash
npm run supabase:provision-storage
```

7. Dans le dashboard, vérifie que `tapote-order-assets` est **Private**, limité à 2 Mo et aux formats PNG/JPEG/WebP.
8. Lance **Database → Advisors → Security** et **Performance**. Corrige toute alerte nouvelle avant ouverture.

La migration crée les commandes, lignes, uploads, événements Stripe, leads, outbox et les fondations RLS de Pilot. Les tables commerce ne sont jamais accessibles directement depuis un navigateur.

Documentation officielle : [migrations Supabase](https://supabase.com/docs/guides/deployment/database-migrations), [connexions PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [contrôle d’accès Storage](https://supabase.com/docs/guides/storage/security/access-control).

## 4. Configurer Stripe

1. Commence en **mode test**.
2. Copie la clé secrète dans `STRIPE_SECRET_KEY`.
3. Dans **Developers → Webhooks**, ajoute : `https://tapote.fr/api/stripe/webhook`.
4. Abonne ce endpoint à :
   - `checkout.session.completed` ;
   - `checkout.session.async_payment_succeeded` ;
   - `checkout.session.async_payment_failed` ;
   - `checkout.session.expired` ;
   - `charge.refunded` ;
   - `charge.dispute.created`.
5. Copie le signing secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
6. Laisse `STRIPE_AUTOMATIC_TAX_ENABLED=false` tant que la configuration fiscale Stripe n’a pas été validée.
7. Active les moyens de paiement réellement supportés et les alertes de litige/remboursement dans Stripe.

Test obligatoire : commande complète avec une carte de test, retour sur le site, webhook en succès, commande `paid` dans Supabase et e-mail reçu. Rejoue ensuite le même webhook depuis Stripe : il doit être accepté sans doubler la commande ni l’e-mail.

Documentation officielle : [webhooks Stripe](https://docs.stripe.com/webhooks), [Stripe Checkout](https://docs.stripe.com/payments/checkout).

## 5. Configurer Resend et le domaine e-mail

1. Dans Resend, ajoute `tapote.fr` et recopie chez le registrar les enregistrements DNS proposés (SPF/DKIM).
2. Attends le statut **Verified**.
3. Crée une API key limitée à l’envoi et place-la dans `RESEND_API_KEY`.
4. Configure par exemple :

```dotenv
FROM_EMAIL=Tapote <commandes@tapote.fr>
ORDER_NOTIFICATION_EMAIL=commandes@tapote.fr
```

5. Envoie une demande de devis et une commande test. Vérifie réception, expéditeur, SPF/DKIM et absence de doublon.

Documentation officielle : [domaines Resend](https://resend.com/docs/dashboard/domains/introduction), [envoi d’e-mail](https://resend.com/docs/send-with-nodejs).

## 6. Renseigner et valider le juridique

Complète toutes les variables suivantes avec des informations validées : société/nom, capital, adresse, immatriculation, TVA, directeur de publication, contact, hébergeur, médiateur, contact vie privée, adresse de retour et version des textes.

```dotenv
LEGAL_READY=false
LEGAL_VERSION=2026-07-16
VITE_LEGAL_COMPANY=...
VITE_LEGAL_CAPITAL=...
VITE_LEGAL_ADDRESS=...
VITE_LEGAL_REGISTRATION=...
VITE_LEGAL_VAT=...
VITE_LEGAL_DIRECTOR=...
VITE_LEGAL_CONTACT=...
VITE_LEGAL_HOST=...
VITE_LEGAL_MEDIATOR=...
VITE_LEGAL_PRIVACY_CONTACT=...
VITE_LEGAL_RETURNS_ADDRESS=...
VITE_LEGAL_VERSION=2026-07-16
```

Les variables `VITE_*` sont publiques et doivent exister pendant le **build** et au **runtime**. Ne mets `LEGAL_READY=true` qu’après validation. Le serveur exige que les deux versions soient identiques.

Points à faire vérifier : délais/BAT, personnalisation et rétractation, garanties, retours, médiateur, politique de confidentialité, sous-traitants, conservation, TVA et éventuels IDU REP. Sources utiles : [obligations e-commerce DGCCRF](https://www.economie.gouv.fr/entreprises/site-internet-mentions-obligatoires), [médiation de la consommation](https://www.economie.gouv.fr/mediation-conso).

## 7. Ajouter Sentry

1. Crée un projet **Node.js / Express** dans Sentry, région UE si disponible.
2. Copie uniquement le DSN serveur dans `SENTRY_DSN`.
3. Commence avec `SENTRY_TRACES_SAMPLE_RATE=0.05`.
4. Crée une alerte sur toute nouvelle erreur et sur une hausse des erreurs 5xx.
5. Provoque une erreur uniquement sur un environnement de test pour vérifier la remontée.

Le code n’active pas l’envoi automatique de données personnelles. Documentation officielle : [Sentry pour Express](https://docs.sentry.io/platforms/javascript/guides/express/).

## 8. Déployer l’application

Configure le service pour construire puis lancer :

```bash
npm ci
npm run build
npm start
```

Ou utilise le `Dockerfile`. Variables minimales de production :

```dotenv
NODE_ENV=production
PUBLIC_URL=https://tapote.fr
API_PORT=3001
TRUST_PROXY_HOPS=1
ALLOW_DEMO_CHECKOUT=false
DATABASE_URL=...
DATABASE_SSL=true
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
SUPABASE_STORAGE_BUCKET=tapote-order-assets
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
ORDER_NOTIFICATION_EMAIL=...
FROM_EMAIL=Tapote <commandes@tapote.fr>
SENTRY_DSN=...
LEGAL_READY=true
```

Ajoute aussi toutes les variables `VITE_LEGAL_*` avant le build. Si le frontend et l’API sont servis par le même domaine, laisse `ALLOWED_ORIGINS` vide. Renseigne `TRUST_PROXY_HOPS` avec le nombre exact de proxies annoncé par l’hébergeur.

Le service doit utiliser `/api/health` pour vérifier que le processus vit et `/api/ready` pour décider s’il peut recevoir du trafic. `ready:false` signifie qu’une intégration critique manque ou ne répond pas.

## 9. Connecter tapote.fr

1. Ajoute `tapote.fr` et `www.tapote.fr` dans l’hébergeur.
2. Recopie chez le registrar exactement les DNS demandés par l’hébergeur.
3. Choisis `https://tapote.fr` comme domaine canonique et redirige `www` vers celui-ci.
4. Attends le certificat TLS valide.
5. Ne change Stripe vers `tapote.fr` qu’une fois le certificat actif et `/api/ready` à 200.

## 10. Recette avant le bouton “live”

- [ ] `npm run ci` est vert ;
- [ ] `https://tapote.fr/api/health` renvoie `{"ok":true}` ;
- [ ] `https://tapote.fr/api/ready` renvoie `{"ready":true}` ;
- [ ] aucune erreur console sur desktop et mobile ;
- [ ] clavier seul : menu, configurateur, panier, CGV et checkout utilisables ;
- [ ] logo invalide et fichier > 2 Mo refusés ;
- [ ] prix Stripe identique au catalogue, livraison et TVA cohérentes ;
- [ ] paiement test confirmé uniquement après vérification serveur ;
- [ ] webhook rejoué sans doublon ;
- [ ] remboursement/litige change le statut et déclenche une alerte ;
- [ ] commande et demande de devis produisent un seul e-mail ;
- [ ] restauration Supabase documentée et testée ;
- [ ] CGV/mentions/confidentialité relues sur le site publié ;
- [ ] Pilot reste en bêta privée.

Après ce passage, active le mode live Stripe, remplace les clés de test par les clés live, recrée le webhook live et effectue une vraie transaction de faible montant suivie d’un remboursement.
