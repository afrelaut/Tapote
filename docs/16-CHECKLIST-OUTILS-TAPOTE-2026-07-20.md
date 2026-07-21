# Checklist des outils Tapote

État établi le 20 juillet 2026 à partir du dépôt, de la configuration et des domaines publics. Cette liste couvre la création du produit, son hébergement, sa sécurité, les paiements, les e-mails, les opérations physiques, le commercial et le suivi — pas seulement le site vitrine.

## Légende

- [x] présent et vérifié ;
- [ ] à mettre en place ou à valider ;
- `[partiel]` présent dans le code ou les DNS, mais pas encore validé de bout en bout en production ;
- `[plus tard]` utile lorsque le volume le justifiera, sans bloquer le lancement.

## 1. Outils et services déjà présents

### Création et développement

- [x] **Codex / Codex Cloud** — développement, audits, corrections et documentation ; confirmé par Aymeric.
- [x] **Git** — historique et versionnement du projet.
- [x] **GitHub** — dépôt distant et collaboration.
- [x] **GitHub Actions** — CI à chaque push/PR : lint, tests, build et audit npm.
- [x] **Dependabot** — mises à jour hebdomadaires de npm et des GitHub Actions.
- [x] **Node.js + npm** — environnement d'exécution et gestion des dépendances.
- [x] **React + Vite** — interfaces Boutique, Pilot et Gestion.
- [x] **Express** — API serveur, Stripe, e-mails et redirections NFC/QR.
- [x] **ESLint, Vitest, Testing Library, axe-core et Supertest** — qualité, tests et accessibilité automatisée.

### Données et applications Tapote

- [x] **Supabase** — PostgreSQL, Auth, Storage privé, Realtime, RLS et migrations.
- [x] **Tapote Gestion** — commandes, clients, stock, production, encodage NFC, contrôle et expédition.
- [x] **Tapote Pilot** — comptes clients, destinations modifiables, produits et statistiques d'interaction.
- [x] **Chrome Android + Web NFC** — écriture des liens courts sur les puces compatibles.

### Paiements et e-mails

- [x] **Stripe** — Checkout, webhooks signés, remboursements/litiges et synchronisation des commandes sont intégrés au code.
- [ ] `[partiel]` Valider Stripe Sandbox de bout en bout, puis configurer et tester Stripe Live.
- [x] **Resend** — envoi transactionnel intégré ; SPF, DKIM et DMARC sont présents dans les DNS.
- [ ] `[partiel]` Tester une commande et une invitation Pilot réelles, puis brancher Resend comme SMTP Supabase Auth.
- [x] **OVH Mail** — serveurs MX actifs pour les boîtes e-mail `tapote.fr`.

### Domaine, serveur et déploiement

- [x] **OVH** — registrar, DNS autoritaires et e-mail du domaine `tapote.fr`.
- [x] **Hostinger VPS + hPanel** — serveur, tableau de bord, ressources, sauvegardes et sécurité.
- [x] **Terminal navigateur Hostinger / SSH** — administration et déploiement du VPS.
- [x] **Docker + Docker Compose** — construction et exécution isolée de Tapote.
- [x] **Caddy** — reverse proxy, HTTPS/TLS, compression, domaines et protection d'accès à Gestion.
- [x] Les domaines `tapote.fr`, `www`, `pilot`, `gestion` et `t.tapote.fr` pointent vers le VPS.
- [x] `https://tapote.fr/api/health` et `https://t.tapote.fr/api/health` répondent correctement.
- [ ] `[partiel]` `https://tapote.fr/api/ready` répond encore `503` : au moins une condition de production (Stripe Live, webhook, base, stockage, e-mail ou juridique) reste incomplète.

### Supervision déjà préparée

- [x] **Sentry SDK** — installé et initialisé côté serveur sans données personnelles par défaut.
- [ ] `[partiel]` Créer/valider le projet Sentry, renseigner `SENTRY_DSN`, provoquer une erreur de test et configurer les alertes 5xx.
- [x] **Pino / Pino HTTP** — journaux structurés du serveur avec identifiants de requête.
- [x] **Hostinger Monitoring** — métriques VPS disponibles dans hPanel.

## 2. À terminer avant le premier client payant — priorité P0

### Comptes, secrets et accès

- [ ] Choisir **Bitwarden** comme gestionnaire de mots de passe et coffre de secrets partagé avec accès individuels.
- [ ] Y stocker les accès de secours et la procédure de récupération, mais garder `.env.production` uniquement sur le VPS.
- [ ] Activer la MFA sur GitHub, Supabase, Stripe, Resend, Sentry, OVH et Hostinger.
- [ ] Utiliser un compte par personne ; ne jamais partager un compte administrateur.

### Cybersécurité Hostinger/VPS

- [ ] Activer le **pare-feu managé Hostinger** et n'autoriser publiquement que SSH, HTTP et HTTPS.
- [ ] Conserver aussi **UFW** sur Ubuntu ; ne jamais exposer les ports de Node, PostgreSQL ou Docker.
- [ ] Créer un utilisateur d'administration non-root avec clé SSH.
- [ ] Tester une deuxième session SSH, puis désactiver la connexion root et l'authentification SSH par mot de passe.
- [ ] Installer et configurer **Fail2ban** pour SSH ; ne pas ajouter CrowdSec en même temps au lancement.
- [ ] Activer les mises à jour de sécurité automatiques Ubuntu et définir une fenêtre mensuelle de maintenance.
- [ ] Vérifier le scanner de malware Hostinger, les processus, l'espace disque, la RAM et les journaux Docker.
- [ ] Documenter une procédure d'incident : fermer le checkout, révoquer la clé, analyser, corriger, tester et rouvrir.

### Sauvegardes et reprise

- [ ] Passer le projet de production à **Supabase Pro** avant les ventes réelles afin d'avoir les sauvegardes quotidiennes.
- [ ] Faire un export logique Supabase chiffré et hors site à intervalle régulier.
- [ ] Tester une restauration dans un projet Supabase séparé ; une sauvegarde non restaurée n'est pas encore une stratégie de reprise validée.
- [ ] Activer les sauvegardes Hostinger adaptées et créer un snapshot juste avant chaque mise à jour système importante.
- [ ] Garder le code sur GitHub, les données chez Supabase et une copie des secrets dans Bitwarden : ces trois sauvegardes répondent à des risques différents.

### Supabase et authentification

- [ ] Séparer **production** et **staging** : un projet Supabase et des comptes de test distincts.
- [ ] Activer la protection contre les mots de passe compromis.
- [ ] Activer la MFA pour les administrateurs Supabase et les comptes internes Tapote Gestion.
- [ ] Tester l'isolation RLS avec deux organisations réelles.
- [ ] Configurer **Resend SMTP** dans Supabase Auth pour les invitations, liens magiques et réinitialisations.
- [ ] Révoquer les anciennes sessions et retirer les données/fonctions de démonstration du projet de production après confirmation.

### GitHub

- [ ] Reconnecter l'accès GitHub dans Codex ou la CLI `gh` pour pouvoir vérifier les PR et les Actions distantes.
- [ ] Activer Dependabot alerts, secret scanning et code scanning lorsque le plan GitHub le permet.
- [ ] Exiger une PR et une CI verte avant fusion sur `main` lorsque les rulesets sont disponibles.
- [ ] Ajouter `CODEOWNERS`, un modèle de PR et une politique de sécurité.

### Disponibilité et erreurs

- [ ] Ajouter **Better Stack Uptime** pour surveiller au minimum `/api/health`, `/api/ready`, `pilot`, `gestion` et le domaine court `t`.
- [ ] Faire envoyer les alertes par e-mail et notification mobile à au moins deux personnes.
- [ ] Ajouter un heartbeat pour les sauvegardes et les futures tâches planifiées.
- [ ] Utiliser **Sentry** pour les erreurs applicatives et Better Stack pour l'indisponibilité : les deux outils ne surveillent pas la même chose.

### Mesure marketing et conversion

- [ ] Ajouter **Plausible Analytics** pour les visites, UTM, événements personnalisés et conversions, sans multiplier les outils marketing.
- [ ] Mesurer `view_product`, `start_configurator`, `add_to_cart`, `begin_checkout`, `purchase`, `lead_submit` et `pilot_demo`.
- [ ] Conserver `utm_source`, `utm_medium` et `utm_campaign` dans les leads et commandes Tapote.
- [ ] Ne pas installer simultanément Google Analytics, Meta Pixel, Hotjar et Plausible au lancement.

### Exploitation de l'entreprise

- [ ] Choisir un **logiciel de comptabilité/facturation pour micro-entreprise** avec l'expert-comptable ; Stripe est le moyen de paiement, pas toute la comptabilité.
- [ ] Ajouter un pipeline prospects et relances dans **Tapote Gestion** avant d'acheter un CRM séparé.
- [ ] Créer des boîtes ou alias individuels : `commandes@`, `support@`, `securite@` et une adresse personnelle par administrateur.
- [ ] Définir le transporteur de départ et sa procédure de suivi ; connecter l'API transporteur seulement après validation du flux manuel.
- [ ] Conserver un registre fournisseurs, lots de puces, BAT, tests, incidents, retours et remboursements dans Gestion.

## 3. Cloudflare — recommandé, mais à installer proprement

- [ ] Créer un compte **Cloudflare** et activer sa MFA.
- [ ] Garder **OVH comme registrar** ; Cloudflare peut devenir le DNS autoritaire et le proxy HTTP sans transférer le domaine.
- [ ] Migrer d'abord tous les enregistrements DNS, notamment OVH Mail et Resend, puis changer les serveurs de noms chez OVH.
- [ ] Activer le proxy uniquement sur les cinq hôtes web, pas sur les enregistrements mail.
- [ ] Activer la protection DDoS, le CDN, le Free Managed WAF Ruleset et des règles de limitation raisonnables.
- [ ] Ajouter **Cloudflare Turnstile** aux formulaires exposés au spam ou aux abus et vérifier chaque jeton côté serveur.
- [ ] Adapter Caddy et la journalisation aux IP Cloudflare avant d'appliquer des règles fondées sur l'IP des visiteurs.
- [ ] Tester Stripe webhook, Supabase Auth, uploads, redirections NFC et accès Gestion après le basculement.

Cloudflare ajoute une couche de sécurité et de performance devant Hostinger. Il ne remplace ni le pare-feu du VPS, ni Caddy, ni Sentry, ni les sauvegardes.

## 4. Outils utiles plus tard, pas maintenant

- [ ] `[plus tard]` Déploiement continu automatique GitHub Actions vers Hostinger, une fois la procédure manuelle stable et réversible.
- [ ] `[plus tard]` Centralisation complète des logs dans Better Stack lorsque les logs Docker locaux ne suffiront plus.
- [ ] `[plus tard]` Page publique de statut lorsque Pilot aura plusieurs clients actifs.
- [ ] `[plus tard]` API Sendcloud, Boxtal ou Colissimo lorsque le volume d'expédition justifiera l'automatisation.
- [ ] `[plus tard]` CRM externe tel que HubSpot seulement si le pipeline de Tapote Gestion devient insuffisant.
- [ ] `[plus tard]` Outil de support/chat client seulement si l'e-mail ne suffit plus.
- [ ] `[plus tard]` Outil de newsletter distinct ; ne pas mélanger marketing et e-mails transactionnels.
- [ ] `[plus tard]` Stockage objet hors site, par exemple Cloudflare R2, si le volume de sauvegardes/export l'exige.

## 5. Stack Tapote cible à retenir

1. **Créer** : Codex, GitHub, Node/npm, React/Vite, Express et la suite de tests.
2. **Données et comptes** : Supabase Pro production + Supabase staging.
3. **Héberger** : Hostinger VPS, Ubuntu, Docker Compose, Caddy et terminal SSH/Hostinger.
4. **Domaine et périmètre** : OVH registrar/mail + Cloudflare DNS/proxy/WAF/Turnstile.
5. **Encaisser et écrire** : Stripe + Resend, y compris SMTP Supabase Auth.
6. **Surveiller** : Sentry + Better Stack + métriques Hostinger.
7. **Sécuriser les accès** : Bitwarden + MFA + clés SSH + pare-feu Hostinger/UFW + Fail2ban.
8. **Mesurer** : Plausible + événements métier et UTM enregistrés dans Tapote.
9. **Exploiter** : Tapote Gestion + Tapote Pilot + outil comptable choisi + transporteur.

## 6. Références officielles utiles

- Supabase — sauvegardes : <https://supabase.com/docs/guides/platform/backups>
- Supabase — checklist de production : <https://supabase.com/docs/guides/deployment/going-into-prod>
- Resend — SMTP avec Supabase : <https://resend.com/docs/send-with-supabase-smtp>
- Hostinger — sauvegardes et snapshots VPS : <https://support.hostinger.com/en/articles/1583232-how-to-back-up-or-restore-a-vps>
- Hostinger — pare-feu VPS : <https://www.hostinger.com/support/8172641-how-to-use-a-managed-vps-firewall-at-hostinger/>
- Cloudflare — fonctionnement du proxy DNS : <https://developers.cloudflare.com/fundamentals/concepts/how-cloudflare-works/>
- Cloudflare — règles WAF gérées : <https://developers.cloudflare.com/waf/managed-rules/>
- Cloudflare — Turnstile : <https://developers.cloudflare.com/turnstile/>
- Better Stack — surveillance de disponibilité : <https://betterstack.com/docs/uptime/monitoring-start/>
- Plausible — événements et UTM : <https://plausible.io/docs/events-api>

