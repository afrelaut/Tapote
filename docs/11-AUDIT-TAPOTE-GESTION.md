# Audit TAPOTE Gestion

Date : 16 juillet 2026
Périmètre : interface `/gestion`, authentification privée, données opérationnelles, RLS, Realtime, commandes, clients, assemblage, supply, stock, expédition et catalogue e-commerce.

## Synthèse exécutive

TAPOTE Gestion est désormais un espace interne cohérent, connecté à Supabase et réservé aux rôles `owner`, `admin` et `manager`. L’organisation privée `TAPOTE Gestion` possède deux owners vérifiés : `afrelaut@gmail.com` et `marketmenow75@gmail.com`.

L’audit a corrigé les points les plus risqués : chiffres de démonstration présentés comme réels, fausses données logistiques, commandes annulées comptées comme actives, numéro de suivi inventé, réception de stock non atomique, transition de commande vulnérable aux écritures concurrentes et plusieurs impasses UX.

L’organisation privée ne contient actuellement aucun client ni commande. C’est volontaire : aucune donnée de démonstration n’est injectée dans l’espace réel. Un onboarding guide maintenant les owners vers la création des premières données métier.

## Corrections et améliorations appliquées

| Domaine | Avant | Après |
| --- | --- | --- |
| Dashboard | CA, tendances, graphique et rythme codés en dur | CA, volumes, priorités, échéances et série 14 jours calculés depuis Supabase |
| Commandes | Une commande annulée pouvait être active ou réouverte | Statut `cancelled` géré comme état fermé sur toutes les vues |
| Concurrence | Deux gérants pouvaient écraser un stock ou avancer la même commande | RPC atomiques, verrou de ligne et conflit `40001` explicite |
| Expédition | Numéro de suivi généré artificiellement | Saisie obligatoire d’un numéro réel avant passage à `shipped` |
| Supply | Bouton `+10` enregistrait immédiatement | Modal de confirmation avec quantité réelle et aperçu du nouveau stock |
| Assemblage | Charge, délai, qualité et progressions fictifs | Compteurs réels : atelier, échéances 48 h, priorités et étapes |
| E-commerce | Sessions, funnel et conversion fictifs | Santé catalogue réelle : produits en ligne, ventes, prix, liaison stock, blocages |
| Logistique | Performances La Poste/Chronopost fictives | État réel de la file ; connexion transporteur clairement indiquée comme à faire |
| Réglages | Bouton limité à un toast | Panneau complet : organisation, compte, rôle, préfixe, cut-off, fuseau, sync et logout |
| Clients | État vide peu guidant et liens invalides possibles | Onboarding, état vide utile et coordonnées affichées seulement si valides |
| Identité | Marque texte et icône générique | Logos officiels `tapote-logo.svg`, `tapote-logo-light.svg` et `tapote-mark.svg` |
| Lisibilité | Échelle faible sur certains breakpoints | Passe de lisibilité laptop/desktop/mobile et tableau atelier à cinq étapes |
| Accessibilité | Plusieurs actions ambiguës ou mortes | Libellés explicites, états vides, focus visible, annonces de statut et réduction de mouvement |

## Audit Supabase

- Projet : `pesgnpchntoxosthgzek`, région `eu-west-1`.
- Toutes les tables Gestion exposées utilisent RLS.
- Les politiques limitent l’accès Gestion aux membres internes autorisés.
- Les tables opérationnelles utiles sont publiées sur Supabase Realtime.
- Les fonctions `advance_management_order` et `receive_management_stock` sont `SECURITY INVOKER` et exécutables uniquement par `authenticated`.
- Les transitions de commandes sont séquentielles et verrouillées par ligne.
- Les réceptions de stock incrémentent le physique et décrémentent l’entrant dans une seule transaction.
- Les journaux API audités ne montrent aucun `5xx` récent ; les réponses observées sont principalement `200`.
- Les index signalés comme inutilisés par l’advisor sont conservés : le volume de production est encore trop faible pour conclure qu’ils sont superflus.

Migrations ajoutées :

- `management_operations_hardening`
- `fix_management_order_transition_lock`

## Vérifications réalisées

- ESLint : réussi, zéro warning autorisé.
- Vitest : 4 fichiers, 21 tests réussis.
- Tests TAPOTE Gestion ajoutés : données réelles, commandes annulées, expédition avec suivi réel, panneau owner.
- Build Vite de production : réussi.
- Test transactionnel Supabase sous rôle `authenticated` : réception de stock et transition `assembly → quality` réussies.
- Test de conflit : ancien statut volontairement erroné rejeté avec le code `40001`.
- `ROLLBACK` vérifié : aucune donnée de démonstration n’a été modifiée pendant le test.
- Advisor sécurité relancé après les migrations.

Le navigateur intégré n’a pas autorisé la reprise de la page locale pendant cet audit. La validation visuelle après modification repose donc sur les tests de composants et le build ; un smoke test visuel final reste conseillé dès que l’URL locale est de nouveau contrôlable.

## Points restant à connecter

### Priorité haute

1. Activer la protection contre les mots de passe compromis dans Supabase Auth : [documentation officielle](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
2. Configurer un SMTP de production pour fiabiliser invitations et réinitialisations, et éviter les limites du service e-mail par défaut.
3. Vérifier les URL de redirection Auth du domaine de production avant mise en ligne publique.

### Priorité produit

1. Connecter l’API du transporteur choisi avant d’afficher délais, livraisons et incidents.
2. Connecter une source analytics consentie avant d’afficher sessions, paniers et abandons.
3. Ajouter pagination et agrégations serveur lorsque le volume dépassera quelques milliers de commandes.
4. Définir la politique de sauvegarde/PITR selon le plan Supabase retenu.

## Verdict

L’outil est prêt pour saisir de vraies données internes et exploiter les parcours principaux. Le socle privé, RLS, Realtime, les transactions sensibles, le build et les tests automatisés sont opérationnels. Les seules données volontairement absentes sont celles qui nécessitent une intégration réelle — analytics et transporteur — afin de ne jamais afficher de métriques inventées.
