# MCP et plugins — installer et utiliser, pour Tapote

Date : 2 août 2026
Version de Claude Code de référence : 2.1.220
Statut : guide d'outillage. **Ce document ne touche ni l'offre, ni les prix, ni les
promesses.** La source de vérité reste `TAPOTE-SOURCE-DE-VERITE.md`.

Toutes les commandes de ce guide ont été vérifiées contre la documentation
officielle du 2 août 2026, pas reconstituées de mémoire.

---

## 0. Les deux notions, en une phrase chacune

| | Ce que c'est | Ce que ça apporte à Tapote |
|---|---|---|
| **MCP** | Un protocole qui branche Claude sur un outil externe (base, monitoring, design) | Claude lit et agit dans Supabase, Sentry ou Stripe au lieu que tu copies-colles |
| **Plugin** | Un paquet installable contenant des skills, agents, hooks — **et parfois un MCP déjà configuré** | Ajoute des commandes `/…` et des comportements réutilisables |

**Le point qui fait gagner le plus de temps :** pour Supabase, Figma, Sentry,
GitHub, Vercel et Stripe, un plugin officiel existe qui contient déjà le serveur
MCP configuré. Installer le plugin évite entièrement l'étape `claude mcp add`.
Fais toujours le réflexe « plugin d'abord, MCP manuel ensuite ».

---

## 1. Tuto — installer

### 1.1 Installer un plugin (voie recommandée)

Le marketplace officiel `claude-plugins-official` est ajouté automatiquement au
premier lancement. S'il manque :

```shell
/plugin marketplace add anthropics/claude-plugins-official
```

Parcourir le catalogue, puis installer :

```shell
/plugin                                    # panneau interactif, onglet « Discover »
/plugin install sentry@claude-plugins-official
/reload-plugins                            # obligatoire pour activer sans relancer
```

Au moment d'installer, Claude Code demande une **portée** :

| Portée | Effet | Quand l'utiliser sur Tapote |
|---|---|---|
| **User** | Pour toi, sur tous tes projets | Défaut raisonnable pour ton poste |
| **Project** | Pour tous les collaborateurs, écrit dans `.claude/settings.json` **versionné** | Seulement pour un outil que Jules doit aussi avoir |
| **Local** | Pour toi, dans ce dépôt uniquement | Essais |

Le panneau affiche avant installation un **coût en contexte** (tokens ajoutés à
chaque tour), la date de dernière mise à jour et la liste exacte de ce qui sera
installé. Lis-la : c'est ta seule protection contre un plugin bavard.

Marketplace communautaire (tiers, validés automatiquement par Anthropic) :

```shell
/plugin marketplace add anthropics/claude-plugins-community
/plugin install <nom>@claude-community
```

Le plugin `scroll-world` vient d'un dépôt tiers, donc :

```shell
/plugin marketplace add oso95/scroll-world
/plugin install scroll-world@scroll-world
/reload-plugins
```

### 1.2 Gérer les plugins installés

```shell
/plugin list                      # + --enabled ou --disabled
/plugin disable <nom>@<marketplace>
/plugin enable  <nom>@<marketplace>
/plugin uninstall <nom>@<marketplace>
/plugin marketplace list
/plugin marketplace update <marketplace>
/plugin marketplace remove <marketplace>     # désinstalle aussi ses plugins
```

L'onglet **Installed** regroupe sous « Not used recently » les plugins non
utilisés depuis deux semaines. Ils coûtent du contexte à chaque tour : purge-les.

### 1.3 Installer un MCP à la main (quand aucun plugin ne le couvre)

```shell
# Serveur distant HTTP — le cas normal en 2026
claude mcp add --transport http <nom> <url>

# Exemples vérifiés
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add --transport http stripe https://mcp.stripe.com

# Avec en-tête d'authentification
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer VOTRE_TOKEN"

# Serveur local (stdio) : tout ce qui suit -- est passé tel quel au serveur
claude mcp add --env CLE=valeur --transport stdio monserveur -- npx un-serveur
```

Portées MCP, à ne pas confondre avec celles des plugins :

| Portée | Fichier | Versionné ? |
|---|---|---|
| `local` (défaut) | `~/.claude.json`, sous le chemin du projet | Non |
| `user` | `~/.claude.json` | Non |
| `project` | **`.mcp.json` à la racine du dépôt** | **Oui** |

```shell
claude mcp add --transport http sentry --scope user https://mcp.sentry.dev/mcp
```

> ⚠️ **Règle Tapote** : `--scope project` écrit `.mcp.json`, qui part dans Git.
> N'y mets **jamais** de token en clair. Pour tout ce qui porte un secret, reste
> en `local` ou `user`. Cette règle prolonge `docs/05-SECURITE-PRODUCTION.md`.

### 1.4 Vérifier et authentifier

```shell
claude mcp list          # statut : ✔ Connected / ! Needs authentication / ✘ Failed
claude mcp get sentry
claude mcp remove sentry
```

L'authentification OAuth se fait **uniquement en session interactive** :

```shell
/mcp
```

Tu y choisis le serveur et tu suis le navigateur. C'est là que se débloquent tes
connecteurs claude.ai actuellement en attente (Supabase, Figma, Canva, Drive…).
Un agent non interactif ne peut pas faire cette étape à ta place.

### 1.5 Sécurité — à lire avant d'installer quoi que ce soit

Un plugin et un marketplace exécutent du code arbitraire avec **tes droits
utilisateur**. Anthropic ne contrôle pas le contenu des plugins tiers et ne
garantit pas leur fonctionnement. N'installe que depuis des sources que tu
assumes. Un plugin communautaire n'est pas audité ligne à ligne : il est
seulement passé par une validation automatique.

---

## 2. Tuto — utiliser

### 2.1 Utiliser un plugin

Les skills d'un plugin sont **préfixées par le nom du plugin**, pour éviter les
collisions :

```shell
/commit-commands:commit
/scroll-world:…
```

Trois façons de s'en servir :

1. **Invocation explicite** — tu tapes `/nom-du-plugin:skill`.
2. **Invocation par le modèle** — une skill avec une bonne `description` est
   choisie toute seule quand la tâche correspond.
3. **Passive** — les hooks, agents, monitors et serveurs MCP du plugin agissent
   sans que tu les appelles.

`/help`, onglet **Custom commands**, liste tout ce qui est disponible.
`/context` montre les agents personnalisés chargés.

### 2.2 Utiliser un MCP

Tu ne « lances » pas un MCP : tu formules une demande, et Claude choisit l'outil.
Les tournures qui marchent sont celles qui nomment la source :

- « Regarde dans **Sentry** les 5xx des dernières 24 h sur tapote.fr et donne-moi
  la cause racine la plus probable. »
- « Liste les tables **Supabase** et dis-moi si une policy RLS manque sur les
  commandes. »
- « Ouvre ce lien **Figma** et implémente la section hero en respectant les
  tokens existants. »

Vérifie ce qui est réellement branché avec `/mcp` : le panneau affiche le nombre
d'outils par serveur, et signale un serveur qui n'en expose aucun.

**Ressources MCP** : certains serveurs exposent des fichiers en plus des outils.
Tu les référencer avec `@` dans ton message.

### 2.3 Le coût en contexte, le vrai piège

Chaque plugin et chaque MCP connecté consomme du contexte **à chaque tour**, même
inutilisé. Trois réflexes :

1. `/plugin` → **Installed** → purge « Not used recently ».
2. Désactive un serveur sans perdre sa config : bascule-le dans `/mcp`.
3. La **recherche d'outils** (tool search) diffère le chargement des schémas MCP :
   seuls les noms sont connus tant qu'un outil n'est pas nécessaire. C'est ce qui
   rend tenable d'avoir dix connecteurs.

Après `/reload-plugins`, la requête suivante coûte plus cher : les composants
rechargés se réannoncent. Si un plugin fournit un MCP non différé, le rechargement
invalide le cache de la conversation — Claude Code avertit et exige `--force`.

---

## 3. Ce qui vaut le coup pour Tapote, et à quel prix

Rappel de l'état actuel : **9 connecteurs sont déjà configurés mais non
authentifiés**. Avant d'en ajouter, authentifie ceux qui servent.

### 3.1 À authentifier en priorité — gratuit

| Outil | Ce que ça débloque | Prix |
|---|---|---|
| **Supabase** | Migrations versionnées, Advisors sécurité, logs, types TypeScript | Gratuit ; Pro 25 $/mois |
| **Figma** | Design → code, si tu lances la refonte « Vero » | Gratuit avec ton compte |

### 3.2 À ajouter — gratuit, déjà présents comme plugins officiels

```shell
/plugin install sentry@claude-plugins-official      # 5xx et cause racine
/plugin install github@claude-plugins-official      # PR contre main
/plugin install supabase@claude-plugins-official    # si tu préfères au connecteur
/reload-plugins
```

Stripe n'a pas de plugin officiel listé : passe par le MCP.

```shell
claude mcp add --transport http stripe https://mcp.stripe.com
```

Autres plugins officiels utiles ici :

- **`typescript-lsp`** — diagnostics de type après chaque édition. Nécessite le
  binaire `typescript-language-server` installé séparément. C'est le plus gros
  gain qualité pour ce dépôt.
- **`pr-review-toolkit`** — agents de revue spécialisés, au moment d'ouvrir la PR.
- **`security-guidance`** — relit chaque changement à la recherche de failles.
- **`commit-commands`** — workflows commit/push/PR.

### 3.3 ⚠️ Ce qui coûte cher et ne sert pas la vitrine

| Outil | Prix réel | Verdict |
|---|---|---|
| **Clay** | Plus de tier gratuit exploitable (100 crédits). **185 $/mois** minimum, double système Data Credits + Actions | Prospection B2B. Hors sujet pour le site. Déconnecte-le tant que tu ne prospectes pas |
| **Vibe Prospecting** | Facturation à l'usage | Même logique |
| **Context7** | Tier gratuit passé de ~6 000 à **1 000 requêtes/mois** en janvier 2026 ; 10 $ / 1 000 appels au-delà | Utile pour de la doc à jour, mais s'épuise vite |

### 3.4 Garde-fous propres à Tapote

- **Supabase MCP écrit sur la vraie base.** `docs/08-STRIPE-HOSTINGER.md` §9
  interdit de modifier la base à la main : passe toujours par une migration
  versionnée, contrôle les Advisors, puis applique. Travaille sur une branche
  Supabase quand c'est possible.
- **Aucun MCP ne déploie.** Le déploiement reste SSH + Docker Compose, §9 du même
  document. `main` n'est pas la production.
- **Aucun MCP ne valide une preuve.** Un chiffre remonté par un connecteur reste
  soumis à `TAPOTE-SOURCE-DE-VERITE.md` §9.2 : publiable seulement avec sa source
  datée à l'écran.

---

## 4. Dépannage

| Symptôme | Cause et correction |
|---|---|
| `/plugin` inconnu | Version trop ancienne : `npm install -g @anthropic-ai/claude-code@latest`, puis relancer |
| `Marketplace "claude-plugins-official" not found` | `/plugin marketplace add anthropics/claude-plugins-official` |
| Plugin absent du marketplace | Copie locale périmée : `/plugin marketplace update <marketplace>` |
| Skills du plugin invisibles | `rm -rf ~/.claude/plugins/cache`, relancer, réinstaller |
| `! Needs authentication` | `/mcp` en session interactive, impossible autrement |
| `Executable not found in $PATH` | Plugin LSP sans son binaire : installe le langage serveur |
| Serveur `not configured` | Entrée MCP avec `url` vide — renseigne l'URL |
| MCP `✘ Failed to connect` | Le serveur ne répond pas ; `claude mcp get <nom>` pour le détail |

---

## 5. Sources

- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
- [Discover and install prebuilt plugins](https://code.claude.com/docs/en/discover-plugins)
- [Create plugins](https://code.claude.com/docs/en/plugins)
- [Clay Pricing 2026](https://www.warmly.ai/p/blog/clay-pricing)
- [Context7 free tier reduction](https://blog.devgenius.io/context7-quietly-slashed-its-free-tier-by-92-16fa05ddce03)
