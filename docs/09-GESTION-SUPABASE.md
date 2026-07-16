# TAPOTE Gestion — Supabase privé

## Périmètre

`/gestion` est réservé aux collaborateurs TAPOTE invités. Il n’existe aucun formulaire d’inscription publique. L’autorisation ne dépend jamais des métadonnées modifiables du compte : elle est calculée dans PostgreSQL à partir de `organization_members`.

Rôles autorisés :

- `owner` : propriétaire de l’espace ;
- `admin` : administrateur interne ;
- `manager` : gérant opérationnel.

Les rôles Pilot `member` et `viewer` n’ont aucun accès aux données Gestion.

## Domaine de données

Les migrations `tapote_management_private` et `management_performance_indexes` créent :

- clients et commandes ;
- inventaire et catalogue e-commerce ;
- fournisseurs, achats et réceptions ;
- travaux d’assemblage et contrôles ;
- expéditions et suivi ;
- activité temps réel et audit privé ;
- réglages d’organisation ;
- bucket Storage privé `tapote-management-private` pour BAT, PDF et étiquettes.

Toutes les tables exposées ont RLS actif. Les pièces Storage doivent être rangées sous le préfixe `{organization_id}/...`.

## Variables requises

Le navigateur utilise uniquement :

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Les scripts d’administration, jamais le navigateur, utilisent :

```env
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://...
DATABASE_SSL=true
PUBLIC_URL=https://gestion.tapote.fr
```

## Inviter un gérant

La première invitation crée l’espace `TAPOTE Gestion`, son profil, ses réglages et les données opérationnelles initiales. Elle reçoit automatiquement le rôle `owner`.

```powershell
npm run management:invite -- --email aymeric@tapote.fr --name "Aymeric Roux" --role owner
```

Puis inviter chaque personne avec un compte individuel :

```powershell
npm run management:invite -- --email jules@tapote.fr --name "Jules" --role manager --seed false
```

Ne jamais partager un compte. Pour retirer un accès, supprimer la ligne correspondante dans `organization_members` ou supprimer l’utilisateur après révocation de ses sessions.

## Vérification

Une fois les secrets serveur présents :

```powershell
npm run management:verify
```

Le script crée un compte technique localement confirmé, vérifie l’isolation anonyme, RLS, la lecture et la création transactionnelle d’une commande, puis supprime automatiquement le compte et son organisation de test.

Vérifications applicatives :

```powershell
npm run lint
npm test
npm run build
```
