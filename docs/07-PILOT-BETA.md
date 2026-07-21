# Tapote Pilot — activation de la bêta

Pilot est l’espace client privé disponible sur `/pilot`. Il affiche les produits rattachés à une organisation, agrège les interactions NFC/QR sur 7, 30 ou 90 jours, exporte un CSV et permet de modifier une destination avec journal d’audit.

## Règle commerciale à rendre parfaitement explicite

L’achat d’un support Tapote comprend, sans abonnement et sans limite de durée :

- l’encodage initial NFC + QR vers le lien choisi ;
- le changement de destination à distance, autant de fois que nécessaire ;
- la gestion des supports du compte ;
- les statistiques essentielles de tapotements.

Le changement de lien n’est donc jamais réservé à l’abonnement. Un client peut passer d’une page d’avis à un menu, une réservation, un site, un Wi-Fi ou toute autre URL compatible sans racheter ni réencoder physiquement son support.

Le tarif prévu pour l’option **Pilot** est de **9 € par mois** ou **89 € par an**. Pendant la bêta, son activation reste accompagnée et son encaissement n’est pas automatisé. Les fonctions effectivement disponibles sont :

- les statistiques avancées par support et par lieu ;
- les comparaisons sur 7, 30 ou 90 jours ;
- la répartition NFC / QR et la dernière interaction ;
- la gestion de plusieurs établissements ;
- l’export CSV et l’historique.

Si le client arrête Pilot, ses supports continuent de fonctionner : la dernière destination publiée reste active et les fonctions gratuites restent disponibles. Le discours commercial doit présenter Pilot comme un gain de pilotage et d’analyse, jamais comme un péage nécessaire au fonctionnement du produit.

## État Supabase vérifié le 16 juillet 2026

- Le projet Tapote est actif et les neuf migrations locales correspondent à l’historique distant.
- La base Pilot, ses politiques RLS et ses droits minimaux sont appliqués ; l’audit ne remonte aucune alerte liée au schéma ou aux politiques.
- Le navigateur peut uniquement lire les tables Pilot autorisées et modifier les colonnes `target_url` et `active` d’un lien, sous contrôle RLS.
- Le flux boutique → Gestion → Pilot est actif et idempotent. Un tenant de démonstration isolé contient sept supports et des interactions de test.
- Pilot accepte le mot de passe ou un lien sécurisé, toujours sans inscription publique dans l’interface.
- L’inscription publique Supabase est encore activée dans Auth. Elle doit être désactivée dans le tableau de bord avant toute invitation client.
- La `Site URL` et les URL de redirection doivent être vérifiées dans Auth avant déploiement. Autoriser au minimum `https://tapote.fr/pilot`, `https://tapote.fr/gestion`, `http://localhost:5173/pilot` et `http://localhost:5173/gestion`.
- Le SMTP personnalisé est désactivé. Il faut le configurer, puis vérifier la réception réelle des e-mails avant l’ouverture.
- La protection contre les mots de passe compromis doit être activée dans Auth > Password Security.

Pilot est donc connecté à sa vraie base et prêt à être provisionné, mais il ne faut pas encore inviter un client tant que les trois réglages Auth ci-dessus ne sont pas validés.

## Démonstration locale

```bash
npm run dev
```

Ouvrir `http://localhost:5173/pilot`. En développement, Pilot utilise automatiquement les données illustratives lorsque les variables Supabase publiques sont absentes. Pour forcer ce mode, définir `VITE_PILOT_DEMO=true`.

Lorsque Supabase est configuré localement, l’écran de connexion propose aussi « Explorer la démonstration ». Ce bouton est limité au développement et n’apparaît jamais dans le build de production.

## Activer Supabase

1. Créer ou sélectionner le projet Supabase Tapote.
2. Copier `.env.example` vers `.env` et renseigner :
   - `DATABASE_URL` et `DATABASE_SSL` pour l’API et le script de provisionnement ;
   - `SUPABASE_URL` et `SUPABASE_SECRET_KEY` uniquement côté serveur ;
   - `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` pour le navigateur ;
   - `VITE_REDIRECT_BASE_URL=https://t.tapote.fr`.
3. Appliquer les migrations avec `npm run supabase:migrate`.
4. Dans Supabase Auth, désactiver les inscriptions publiques et conserver l’authentification e-mail.
5. Autoriser les redirections `https://tapote.fr/pilot` et `http://localhost:5173/pilot`.
6. Personnaliser l’e-mail d’invitation aux couleurs de Tapote.

La clé secrète Supabase ne doit jamais être préfixée par `VITE_`. Le navigateur utilise uniquement la clé publiable ; les règles RLS isolent ensuite les organisations.

## Inviter un premier commerce

Le script crée l’organisation, l’établissement, le lien court et le premier produit dans une transaction, puis envoie l’invitation Supabase :

```bash
npm run pilot:invite -- \
  --email client@commerce.fr \
  --organization "Café Mistral" \
  --location "République" \
  --product comptoir \
  --action avis \
  --label "Avis · Comptoir" \
  --target "https://g.page/r/exemple/review"
```

Options facultatives : `--serial TAP-CAFE-0001`, `--product`, `--action`, `--label`, `--location` et `--password`. Le produit reçoit sinon un numéro de série unique. Un mot de passe fourni doit contenir au moins 12 caractères.

Pour une commande réellement payée sur tapote.fr, utiliser le chemin intégré afin de conserver toutes les relations :

```powershell
npm run pilot:activate-order -- --order WEB-XXXXXXXXXX --operator-email aymeric@tapote.fr --operator-password "..." --location "Établissement principal"
```

Le script invite le client (ou fixe le mot de passe avec `--password`), vérifie l’opérateur Gestion, puis crée le tenant, l’établissement, les liens et chaque support physique du pack.

## Redirecteur

Le même service Node répond à `/a/<code>?s=nfc` pour la puce et `/a/<code>?s=qr` pour le QR. Configurer `t.tapote.fr` vers ce service.

Le redirecteur répond sans cache, n’enregistre aucune IP brute et classe seulement la source et la famille d’appareil. Une panne d’écriture statistique ne bloque pas la redirection.

Après provisionnement, `curl -I "https://t.tapote.fr/a/<code>?s=nfc"` doit répondre `302` avec la destination courante dans l’en-tête `Location`.

## Contrôle avant les premiers clients

- Lancer `npm run ci`.
- Vérifier qu’un client ne voit jamais les produits d’une autre organisation.
- Modifier une destination puis tester NFC et QR.
- Vérifier le journal d’audit et l’export CSV.
- Configurer la surveillance de `t.tapote.fr` et les sauvegardes PostgreSQL.
- Garder `VITE_PILOT_DEMO=false` en production.

L’inscription publique, l’encaissement automatisé de Pilot, le suivi logistique et la gestion des membres restent hors de cette bêta. Les campagnes programmées, pages Tapote multi-actions, alertes et rapports automatiques ne doivent pas être vendus tant qu’ils ne sont pas implémentés et testés.

## Plan de mise en service sur 48 heures

### Priorité absolue — aujourd’hui

- Créer ou connecter le projet Supabase de production, puis appliquer toutes les migrations.
- Configurer les variables de production sans exposer `SUPABASE_SECRET_KEY` au navigateur.
- Dans Auth, renseigner l’URL du site et la liste exacte des redirections, désactiver les inscriptions publiques et brancher un SMTP personnalisé.
- Personnaliser les e-mails d’invitation et de connexion, puis vérifier leur réception sur Gmail, Outlook et mobile.
- Pointer `t.tapote.fr` vers le redirecteur avec HTTPS et vérifier les réponses NFC et QR de bout en bout.
- Créer deux organisations de test et confirmer qu’aucun utilisateur ne peut lire ou modifier les produits de l’autre organisation.

### Demain

- Inviter le premier compte interne, puis le compte du commerce pilote avec ses vraies destinations.
- Tester sur un iPhone et un Android : connexion depuis l’e-mail, NFC, QR, modification d’une destination, déconnexion et reconnexion.
- Vérifier le rendu mobile à 320, 390 et 430 px, ainsi que sur un ordinateur sans zoom navigateur.
- Activer la surveillance du site, du redirecteur et des erreurs serveur ; vérifier les sauvegardes PostgreSQL.
- Préparer une procédure de retour arrière : ancienne destination de chaque produit, personne de contact et accès Supabase disponible.

### Jour d’ouverture

- Commencer avec un seul commerce et un nombre limité de supports.
- Faire un test réel juste avant l’ouverture du commerce et contrôler les premières interactions dans Pilot.
- Garder un contact Tapote disponible pendant la première journée et noter chaque incompréhension rencontrée par le client.

## Améliorations ergonomiques intégrées

- textes opérationnels entre 13 et 16 px, sans micro-libellés illisibles ;
- largeur de contenu plafonnée sur les grands écrans ;
- filtres nommés et utilisables au clavier ;
- tendance, moyenne, fraîcheur et périmètre expliqués autour des indicateurs ;
- recherche par produit, série ou établissement avec filtres de statut ;
- fiche produit structurée comme une boîte de dialogue, avec confirmation explicite avant redirection ;
- statuts actifs/en pause, destinations et interactions lisibles dans chaque ligne ;
- export CSV encodé pour Excel ;
- navigation et fiche produit adaptées au téléphone, avec réduction des animations si le système le demande.
