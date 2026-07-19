# Checklist de mise en production Tapote

Cette checklist est la référence avant la première vente réelle. Les tests Stripe, y compris Sandbox, sont réalisés uniquement en présence d'Aymeric et après annonce explicite de l'action.

## 1. Parcours d'achat et juridique

- [x] Créer les pages Panier, Commande et Confirmation.
- [x] Réserver la boutique aux achats professionnels et recueillir l'acceptation des CGV.
- [x] Préremplir les mentions légales publiques de l'entreprise individuelle.
- [ ] Déployer le nouveau parcours sur le VPS.
- [ ] Vérifier sur le site déployé les pages Panier, Commande, CGV, Mentions légales et Confidentialité.
- [ ] Ajouter officiellement l'activité de vente de marchandises à l'entreprise via le Guichet unique avant toute vente réelle.
- [ ] Organiser le suivi séparé du chiffre d'affaires ventes de biens / prestations de services.

## 2. Validation Stripe Sandbox — ensemble uniquement

- [ ] Activer temporairement le Checkout Sandbox sur le VPS.
- [ ] Créer un panier de test et vérifier les produits, quantités, prix, livraison et coordonnées B2B.
- [ ] Ouvrir Stripe Checkout et effectuer un paiement avec une carte de test.
- [ ] Vérifier la page de confirmation et l'état de la commande en base.
- [ ] Vérifier la réception du webhook signé.
- [ ] Vérifier les e-mails client et interne.
- [ ] Vérifier la facture Sandbox : vendeur, acheteur, produits, TVA non applicable, paiement et numérotation.
- [ ] Désactiver le Checkout Sandbox après le test.

## 3. Audits avant ouverture

- [ ] Auditer l'UI/UX et l'accessibilité sur ordinateur et mobile.
- [ ] Auditer les textes marketing, les prix et le contenu des offres.
- [ ] Auditer le frontend, le backend, Supabase, Stripe et Resend.
- [ ] Vérifier les intégrations encore manquantes ou optionnelles.
- [ ] Réaliser la revue de sécurité applicative et corriger les points bloquants.
- [ ] Mettre à jour Ubuntu et Docker, redémarrer le VPS et vérifier le retour des services.
- [ ] Créer un utilisateur d'administration non-root, durcir SSH et le pare-feu.
- [ ] Examiner les processus zombies et l'espace disque du VPS.
- [ ] Configurer une surveillance des erreurs et des alertes de disponibilité.

## 4. Passage Stripe Live — ensemble uniquement

- [ ] Faire valider le compte Stripe au nom de l'entreprise individuelle.
- [ ] Configurer l'identité, le SIREN, le régime de TVA, le modèle de facture et la numérotation.
- [ ] Créer le webhook Live avec les événements attendus par Tapote.
- [ ] Remplacer simultanément la clé secrète et le secret webhook Sandbox par les valeurs Live.
- [ ] Passer `VITE_STRIPE_MODE=live` et reconstruire l'image Docker.
- [ ] Vérifier que `/api/ready` répond 200.
- [ ] Effectuer ensemble un petit paiement réel, puis vérifier commande, facture, e-mails et webhook.
- [ ] Effectuer ensemble le remboursement et vérifier son traitement.

## 5. Juste avant le premier client

- [ ] Souscrire Supabase Pro.
- [ ] Créer un snapshot du VPS.
- [ ] Vérifier sauvegardes, restauration et procédure de retour arrière.
- [ ] Faire une dernière vérification de disponibilité de `tapote.fr`, `pilot.tapote.fr`, `gestion.tapote.fr` et `t.tapote.fr`.
- [ ] Confirmer que GitHub `main`, le VPS et le commit déployé sont alignés.
