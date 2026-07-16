# Stripe + Hostinger — déployer Tapote, Pilot et Gestion

Ce guide correspond au dépôt actuel. Il ne propose pas trois hébergements : un seul VPS Hostinger exécute l’application Node/React et Caddy, tandis que Supabase, Stripe, Resend et Sentry restent des services externes.

## Architecture retenue

| Adresse | Rôle | Protection |
| --- | --- | --- |
| `https://tapote.fr` | Site public et boutique | Public |
| `https://tapote.fr/pilot` | Application client Pilot | Supabase Auth + RLS |
| `https://pilot.tapote.fr` | Adresse facile à communiquer | Redirection vers `/pilot` |
| `https://gestion.tapote.fr` | Outil interne Jules/Aymeric | Basic Auth Caddy au lancement, puis Supabase Auth interne |
| `https://t.tapote.fr/a/...` | Liens courts NFC et QR | Public, routes limitées |
| `https://tapote.fr/api/stripe/webhook` | Réception Stripe | Signature Stripe obligatoire |

Le port Node `3001` reste uniquement dans le réseau Docker. Seuls `80` et `443` sont ouverts sur Internet. Caddy obtient et renouvelle automatiquement les certificats TLS lorsque les DNS pointent vers le VPS et que ces ports sont ouverts ([documentation Caddy](https://caddyserver.com/docs/automatic-https)).

> Important — l’interface Gestion actuelle est encore une maquette locale sans authentification applicative ni base métier. La configuration fournie la cache derrière deux accès HTTP individuels et bloque `/gestion` sur `tapote.fr`. Elle peut être montrée à Jules et Aymeric, mais il ne faut pas encore y saisir de vraies données clients. Le chantier suivant est Supabase Auth + table de collaborateurs + rôles/RLS.

## Ce qui est déjà prêt dans le code

- Stripe Checkout est créé côté serveur à partir du catalogue serveur ; le navigateur ne décide pas des prix.
- Le webhook reçoit le corps brut avant `express.json`, vérifie `Stripe-Signature` et journalise les identifiants d’événements pour éviter les doublons.
- Les événements utiles sont pris en charge : paiement terminé, paiement asynchrone réussi/échoué, session expirée, remboursement et litige.
- Les commandes, lignes, événements Stripe, fichiers privés et e-mails sortants sont durables via Supabase.
- Pilot utilise la clé Supabase publiable dans le navigateur ; la clé secrète reste exclusivement côté serveur.
- `/api/health` contrôle le processus ; `/api/ready` contrôle Stripe, webhook, base, Storage, e-mail et juridique.
- `Dockerfile`, `deploy/docker-compose.production.yml`, `deploy/Caddyfile` et `.env.production.example` sont prêts pour le VPS.

## 1. Préparer Stripe en sandbox

### 1.1 Compte et clés

Dans Stripe :

1. termine l’identité de l’entreprise, le compte bancaire, le support client et le branding ;
2. reste d’abord dans une **sandbox** ;
3. dans **Developers / API keys**, crée de préférence une clé restreinte pour l’intégration Tapote ;
4. conserve la clé uniquement dans `.env` en local et `.env.production` sur le VPS.

Stripe distingue les clés sandbox (`rk_test_`/`sk_test_`) des clés live (`rk_live_`/`sk_live_`). Seules les clés publiables peuvent être exposées au navigateur ; Tapote n’en a pas besoin pour Checkout hébergé. Les secrets de webhook sont encore d’autres secrets, propres à chaque endpoint ([clés Stripe](https://docs.stripe.com/keys)).

Variables locales :

```dotenv
STRIPE_SECRET_KEY=rk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_AUTOMATIC_TAX_ENABLED=false
```

Ne mets jamais ces valeurs dans une variable `VITE_`, GitHub, un e-mail ou une capture.

### 1.2 Tester le webhook local

Installe la [Stripe CLI](https://docs.stripe.com/stripe-cli), puis dans un premier terminal :

```bash
stripe login
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,charge.dispute.created \
  --forward-to localhost:3001/api/stripe/webhook
```

Sous PowerShell, la même commande tient sur une ligne :

```powershell
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,charge.dispute.created --forward-to localhost:3001/api/stripe/webhook
```

La CLI affiche un `whsec_...` temporaire : copie-le dans `STRIPE_WEBHOOK_SECRET`, puis redémarre l’API. Stripe demande de préserver le corps brut pour vérifier la signature ; c’est déjà le cas dans Tapote ([webhooks Stripe](https://docs.stripe.com/webhooks?lang=node)).

Dans un second terminal :

```bash
npm ci
npm run dev
```

Ouvre `http://localhost:5173`, ajoute un objet et réalise un vrai parcours Checkout sandbox. Utilise une [carte de test Stripe](https://docs.stripe.com/testing#cards). Un simple `stripe trigger checkout.session.completed` valide la réception technique, mais pas le rattachement à une commande Tapote : l’essai principal doit partir du panier.

À contrôler :

- retour `commande=confirmee` ;
- commande `paid` dans Supabase ;
- un seul e-mail de commande ;
- événement livré en `2xx` dans Stripe ;
- renvoi du même événement sans duplication.

Stripe peut livrer un événement plusieurs fois et ne garantit pas l’ordre ; l’idempotence actuelle est donc indispensable ([bonnes pratiques webhook](https://docs.stripe.com/webhooks#handle-duplicate-events)).

## 2. Préparer Supabase pour le domaine final

Le projet Tapote est déjà connecté et les migrations sont appliquées. Il reste à renseigner les valeurs de production :

1. dans **Connect**, copie la chaîne **Session pooler** adaptée à une application Node persistante dans `DATABASE_URL` ;
2. place l’URL du projet dans `SUPABASE_URL` et une **secret key** dans `SUPABASE_SECRET_KEY` ;
3. place cette même URL et la **publishable key** dans `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ;
4. vérifie que `tapote-order-assets` est privé ;
5. dans **Authentication / URL Configuration**, définis le site sur `https://tapote.fr` et ajoute exactement `https://tapote.fr/pilot` aux Redirect URLs ;
6. invite les premiers utilisateurs Pilot avec `npm run pilot:invite -- adresse@client.fr` depuis un environnement disposant de la secret key.

La clé publique est compilée dans le frontend ; la secret key contourne les contrôles utilisateur et ne doit jamais être incluse dans le build. Voir les [types de connexions Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) et les [Redirect URLs Auth](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. Préparer le VPS Hostinger

### 3.1 Installer le système

Dans hPanel, choisis le template **Ubuntu 24.04 avec Docker**. Hostinger indique que ce template installe Docker Engine et Docker Compose ; réinstaller un OS efface le contenu du VPS, donc fais-le avant d’y déposer des données ([template Docker Hostinger](https://support.hostinger.com/en/articles/8306612-how-to-use-the-docker-vps-template)).

Connecte-toi en SSH, mets le système à jour et crée un utilisateur de déploiement :

```bash
apt update && apt full-upgrade -y
adduser deploy
usermod -aG sudo,docker deploy
```

Ajoute ta clé SSH à `/home/deploy/.ssh/authorized_keys`, ouvre une **deuxième** session avec `deploy`, et seulement après ce test désactive l’accès root et les mots de passe SSH. Cette vérification évite de se verrouiller hors du serveur.

### 3.2 Pare-feu

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw enable
ufw status
```

N’ouvre ni `3001`, ni PostgreSQL. Le port UDP 443 permet HTTP/3 ; le site fonctionne aussi sans lui.

### 3.3 Déposer le code

La voie recommandée est un dépôt GitHub privé avec une deploy key SSH en lecture seule :

```bash
sudo mkdir -p /opt/tapote
sudo chown deploy:deploy /opt/tapote
git clone git@github.com:ORGANISATION/DEPOT.git /opt/tapote
cd /opt/tapote
```

Si le dépôt n’est pas encore sur GitHub, publie-le d’abord depuis le PC ; évite de transférer `node_modules`, `.env`, `.env.local` ou des secrets.

## 4. Configurer les secrets et Gestion

Sur le VPS :

```bash
cd /opt/tapote
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Complète toutes les valeurs. Les variables `VITE_*` sont publiques et intégrées au JavaScript au moment du build. Les autres restent dans le conteneur serveur.

Génère deux mots de passe longs et distincts sans les placer dans l’historique du shell :

```bash
docker run --rm -it caddy:2.11.4-alpine caddy hash-password
```

Lance la commande une fois pour Aymeric et une fois pour Jules. Colle chaque résultat bcrypt dans `.env.production` entre apostrophes :

```dotenv
GESTION_AYMERIC_PASSWORD_HASH='$2a$14$...'
GESTION_JULES_PASSWORD_HASH='$2a$14$...'
```

Caddy refuse volontairement les mots de passe en clair ([directive `basic_auth`](https://caddyserver.com/docs/caddyfile/directives/basic_auth)). Active un gestionnaire de mots de passe et le MFA sur Hostinger, GitHub, Supabase, Stripe, Resend et Sentry.

Garde ces valeurs tant que la recette n’est pas terminée :

```dotenv
ALLOW_DEMO_CHECKOUT=false
LEGAL_READY=false
STRIPE_AUTOMATIC_TAX_ENABLED=false
TRUST_PROXY_HOPS=1
VITE_PILOT_DEMO=false
```

`LEGAL_READY=true` ne vient qu’après validation des mentions, CGV, confidentialité, médiateur, TVA et droit de rétractation/personnalisation. Stripe Tax reste désactivé tant que vos obligations et inscriptions fiscales ne sont pas configurées.

## 5. Pointer tapote.fr vers le VPS

Dans la zone DNS de `tapote.fr`, crée ces enregistrements `A` vers l’IPv4 du VPS :

| Nom | Valeur |
| --- | --- |
| `@` | IP du VPS |
| `www` | IP du VPS |
| `pilot` | IP du VPS |
| `gestion` | IP du VPS |
| `t` | IP du VPS |

Supprime les anciens `A` conflictuels et un éventuel `AAAA` si le VPS n’est pas réellement configuré en IPv6. Hostinger documente le pointage du domaine par enregistrements A ; la propagation peut prendre du temps ([domaine vers VPS](https://support.hostinger.com/en/articles/1583227-how-to-point-a-domain-to-your-vps), [gestion des A](https://support.hostinger.com/en/articles/4468886-how-to-manage-a-records)).

Contrôle depuis le PC :

```powershell
Resolve-DnsName tapote.fr
Resolve-DnsName gestion.tapote.fr
Resolve-DnsName t.tapote.fr
```

## 6. Premier déploiement

Depuis `/opt/tapote` :

```bash
docker compose --env-file .env.production -f deploy/docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f deploy/docker-compose.production.yml up -d --build --remove-orphans
docker compose --env-file .env.production -f deploy/docker-compose.production.yml ps
```

Utilise `config --quiet` : la variante sans `--quiet` affiche la configuration résolue, donc potentiellement les secrets dans le terminal.

Surveille le démarrage :

```bash
docker compose --env-file .env.production -f deploy/docker-compose.production.yml logs --tail=100 app caddy
curl -sS -i https://tapote.fr/api/health
curl -sS -i https://tapote.fr/api/ready
```

Résultat attendu :

- `/api/health` retourne `200` et `{"ok":true}` ;
- `/api/ready` peut rester `503` tant qu’une intégration ou le juridique manque ;
- `https://gestion.tapote.fr` demande un identifiant, puis ouvre `/gestion` ;
- `https://tapote.fr/gestion` retourne `404` ;
- `https://pilot.tapote.fr` redirige vers `https://tapote.fr/pilot` ;
- `https://t.tapote.fr/` retourne `404`, ce qui est volontaire.

## 7. Créer le webhook Stripe public

Une fois le certificat HTTPS actif :

1. ouvre Stripe en **sandbox** ;
2. va dans **Workbench / Webhooks / Create event destination** ;
3. choisis les événements du compte Tapote ;
4. URL : `https://tapote.fr/api/stripe/webhook` ;
5. sélectionne uniquement :
   - `checkout.session.completed` ;
   - `checkout.session.async_payment_succeeded` ;
   - `checkout.session.async_payment_failed` ;
   - `checkout.session.expired` ;
   - `charge.refunded` ;
   - `charge.dispute.created` ;
6. révèle le signing secret et copie-le dans `STRIPE_WEBHOOK_SECRET` ;
7. redémarre l’app :

```bash
docker compose --env-file .env.production -f deploy/docker-compose.production.yml up -d --build
```

Un endpoint live doit être HTTPS, vérifier sa signature et écouter seulement les événements nécessaires ([configuration des webhooks](https://docs.stripe.com/webhooks#register-your-endpoint)). Le proxy Caddy ne modifie pas le corps reçu.

## 8. Passage en paiement réel

Ne bascule en live qu’après une recette sandbox complète.

1. active le mode live du compte Stripe ;
2. crée/copie la clé live dans `STRIPE_SECRET_KEY` ;
3. recrée le webhook en mode live avec la même URL et les mêmes six événements ;
4. copie le **nouveau** `whsec_...` live — il est différent du secret sandbox ;
5. mets `LEGAL_READY=true` seulement après validation juridique ;
6. reconstruis et redémarre les conteneurs ;
7. vérifie que `/api/ready` retourne `200` ;
8. passe une vraie commande d’un faible montant, vérifie Supabase et l’e-mail, puis rembourse-la depuis Stripe ;
9. vérifie le statut `refunded` et l’alerte correspondante.

Stripe recommande explicitement de recréer les objets/webhooks live, de gérer retards, doublons et désordre des événements, et de retirer toute clé du code avant l’ouverture ([check-list go-live Stripe](https://docs.stripe.com/get-started/checklist/go-live)).

## 9. Mettre à jour sans tout casser

Avant chaque livraison, depuis le PC :

```bash
npm ci
npm run ci
git push
```

Puis sur le VPS :

```bash
cd /opt/tapote
git pull --ff-only
docker compose --env-file .env.production -f deploy/docker-compose.production.yml build --pull
docker compose --env-file .env.production -f deploy/docker-compose.production.yml up -d --remove-orphans
docker compose --env-file .env.production -f deploy/docker-compose.production.yml ps
curl -sS -i https://tapote.fr/api/ready
```

Ne modifie jamais la base manuellement pour “aller vite” : ajoute une migration Supabase versionnée, vérifie les Advisors puis applique-la. Le déploiement du conteneur et les migrations doivent rester deux opérations visibles.

## 10. Sauvegardes et exploitation

- active les sauvegardes/snapshots Hostinger avant une mise à jour système ;
- conserve `.env.production` dans un coffre de secrets ou gestionnaire de mots de passe, jamais seulement sur le VPS ;
- active les sauvegardes Supabase adaptées au plan choisi et documente une restauration ;
- branche Sentry avant le trafic payant et crée des alertes sur les erreurs 5xx ;
- surveille `docker stats`, le disque (`df -h`) et les logs ;
- active les alertes Stripe de litiges et remboursements ;
- garde un accès individuel pour Jules et Aymeric, jamais un compte partagé.

Le KVM 2 est adapté pour démarrer cette architecture légère parce que PostgreSQL et les fichiers métier restent chez Supabase. Surveille quand même RAM, CPU et disque ; on séparera les conteneurs/applications uniquement lorsque le trafic ou les cycles de livraison le justifieront.

## 11. Dépannage rapide

| Symptôme | Contrôle |
| --- | --- |
| HTTPS ne démarre pas | DNS vers la bonne IP, ports 80/443 ouverts, aucun ancien `AAAA`, logs Caddy |
| `502 Bad Gateway` | `docker compose ... ps`, puis logs du service `app` |
| `/api/ready` renvoie `503` | lire les checks retournés ; vérifier base, Storage, Stripe, webhook, Resend et juridique |
| Webhook `400` | mauvais `whsec_`, mélange sandbox/live ou secret de la CLI utilisé en production |
| Paiement créé mais commande non payée | livraison du webhook, métadonnée `orderToken`, accès PostgreSQL et idempotence |
| Magic link Pilot refusé | Redirect URL Supabase exacte `https://tapote.fr/pilot` |
| Gestion boucle ou refuse le mot de passe | hash bcrypt entre apostrophes, identifiant en minuscules, logs Caddy |
| Changement `VITE_*` invisible | reconstruire l’image ; ces variables sont figées pendant `vite build` |

## Critères de feu vert

- [ ] CI locale et GitHub verte ;
- [ ] DNS et TLS valides pour les cinq noms ;
- [ ] port 3001 inaccessible depuis Internet ;
- [ ] `/api/health` et `/api/ready` à `200` ;
- [ ] achat sandbox complet et webhook rejoué sans doublon ;
- [ ] achat live réel puis remboursement validé ;
- [ ] tarifs, TVA, livraison et e-mails cohérents ;
- [ ] Pilot testé avec un utilisateur invité et RLS ;
- [ ] Gestion inaccessible sans les identifiants individuels ;
- [ ] aucune donnée réelle encore dans Gestion avant l’auth applicative ;
- [ ] textes juridiques validés et `LEGAL_READY=true` ;
- [ ] sauvegardes, alertes et procédure de mise à jour testées.
