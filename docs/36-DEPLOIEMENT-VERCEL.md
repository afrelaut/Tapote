# Déploiement Tapote sur Vercel

Remplace le VPS Hostinger (Docker + Caddy). Le Dockerfile reste valable si besoin de revenir en arrière.

## Ce qui tourne où

- **Fichiers statiques** (JS, CSS, images) : CDN Vercel.
- **Tout le reste** (API, Stripe webhook, redirecteur `/a/:code`, pages HTML avec méta SEO et CSP) : une fonction Express unique, `api/index.js`.
- **E-mails et comptage des taps** : lancés après la réponse via `waitUntil`, plus un rattrapage quotidien par Vercel Cron (`/api/cron/outbox`, 6 h UTC).
- **Domaines** (`vercel.json`) : `www` → apex, `pilot.` → `/pilot`, `t.tapote.fr` ne sert que `/a/*` et `/api/health`, `gestion.tapote.fr` sert l'outil interne, `tapote.fr/gestion` renvoie vers `gestion.tapote.fr`.

## Variables d'environnement Vercel

Reprendre toutes celles de `.env.production.example`, **sauf** `API_PORT`, `TAPOTE_HOST_PORT`, `TRUST_PROXY_HOPS`, `OUTBOX_INTERVAL_MS` et `GESTION_*_PASSWORD_HASH` (inutiles ici).

À ajouter :

| Variable | Valeur |
|---|---|
| `CRON_SECRET` | chaîne aléatoire d'au moins 16 caractères |
| `NODEJS_HELPERS` | `0` |
| `VITE_LEGAL_HOST` | `Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis` |

`DATABASE_URL` doit pointer vers le **pooler Supabase en mode transaction (port 6543)**.

## Après mise en ligne

1. Stripe → Webhooks : URL `https://tapote.fr/api/stripe/webhook` (inchangée), envoyer un événement test.
2. Vérifier `https://tapote.fr/api/ready` et un lien `https://t.tapote.fr/a/<code>`.

## Limite connue

La double barrière « basic auth » de Caddy devant `gestion.tapote.fr` n'existe plus : l'accès reste protégé par l'authentification Supabase et les règles RLS.
