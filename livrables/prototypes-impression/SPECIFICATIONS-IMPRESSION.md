# Prototypes Tapote — À imprimer chez l'imprimeur

Deux inserts A6 recto, prêts à imprimer, reprenant la charte du site Tapote
(logo, bleu geste `#2458FF`/`#2946F5`, encre `#161310`, papier `#F4EFE6`,
ambre `#F2A91C`, Archivo Black + Archivo).

| Prototype | Fichier print | Aperçu | Usage |
|---|---|---|---|
| **1 — Avis Google** | `prototype-avis-google-A6.pdf` | `apercu-avis-google.png` | Récolter des avis. Fond encre, « Votre avis compte. », 5 étoiles. |
| **2 — Site & liens (généraliste)** | `prototype-site-liens-A6.pdf` | `apercu-site-liens.png` | Carte « tout-en-un » : site, menu, réseaux, contact. Fond papier clair. |

> **Fichier à donner à l'imprimeur en priorité : `tapote-prototypes-A6-impression.pdf`**
> (les deux prototypes, 2 pages, avec fond perdu et traits de coupe).

---

## 1. Format & fichier

- **Format fini (rogné) :** A6 — **105 × 148 mm**, portrait, **recto seul**.
- **Fond perdu :** 3 mm sur chaque bord → **fichier = 111 × 154 mm** (déjà inclus dans le PDF).
- **Zone de sécurité :** 5 mm (aucun texte important n'y déborde).
- **Traits de coupe :** inclus aux 4 coins.
- **Type :** PDF **vectoriel** (polices embarquées, QR vectoriel) → net à n'importe quelle taille, pas de pixellisation.
- **Résolution :** vectoriel = infini ; si l'imprimeur demande un aplat rasterisé, exporter à **300 dpi minimum**.

## 2. Couleurs (à préciser à l'imprimeur)

- Les fichiers sont en **RVB** (écran). L'imprimeur les convertira en **CMJN** — profil conseillé **FOGRA39 / PSO Coated v3**.
- **Bleu geste (`#2946F5`) :** couleur vive. En CMJN pur elle perd un peu d'éclat → demander « **bleu le plus vif possible** ». Pour un rendu parfaitement fidèle : bleu en **Pantone** (proche **P. Blue 072 / 2727 C**) si le budget le permet, sinon accepter la conversion CMJN.
- **Noir de l'insert Avis :** demander un **noir riche** (ex. C40 M30 J30 **N100**) pour un fond dense, profond, non délavé.
- **Ambre (`#F2A91C`)** et **papier (`#F4EFE6`)** passent bien en CMJN.

## 3. Papier

- **Recommandé : couché mat 300 g/m²**, certifié **FSC/PEFC**.
  - 300 g = bonne tenue debout dans le chevalet, et l'insert est manipulé (le client pose son téléphone dessus).
  - Minimum acceptable : 250 g/m². Haut de gamme : 350 g/m².
- **Aspect : mat** (pas brillant) → moins de reflets sous l'éclairage d'un comptoir.
- **Verso :** laisser **vierge (blanc)**. Un 300 g reste opaque : le dos ne transparaîtra pas à travers le chevalet transparent.

## 4. Plastification / pelliculage — *ta question*

- **Le pelliculage n'empêche PAS le NFC.** Le champ NFC traverse sans problème papier + pelliculage + plaque plexi. (Ce qui bloque le NFC, c'est le **métal**, pas le plastique — voir §5.)
- **Recommandé : pelliculage soft-touch MAT.**
  - Toucher premium, anti-traces de doigts, anti-reflets → important puisqu'on **pose le téléphone dessus**.
  - **Éviter le pelliculage brillant** (reflets gênants sous les spots du comptoir).
- **Est-ce obligatoire ?** Non. Comme sur ta photo, l'insert est **déjà protégé à l'intérieur du chevalet plexi transparent** → le plexi fait office de protection.
  - **Prototype aujourd'hui :** ça fonctionne très bien **sans pelliculage**, tu gagnes du temps.
  - **Rendu final / insert utilisé seul (sans plexi) :** **soft-touch mat**, nettement plus qualitatif.

## 5. Montage NFC — important (à corriger vs la photo)

Sur ta photo, la puce est **collée sur la face extérieure** du chevalet. **À déplacer :** elle doit être **au dos de la feuille imprimée**, invisible, et malgré tout plus proche du téléphone (qui touche la plaque avant).

**Ordre des couches, du client vers l'arrière :**

```
Téléphone du client
   ↓
Plaque plexi AVANT
Feuille A6 imprimée (recto vers le client)
Sticker NFC collé AU DOS de la feuille   ← ici
Plaque plexi ARRIÈRE
```

- **Puce :** sticker rond **NTAG213** (ou NTAG215 pour plus de mémoire), ~25 mm.
- **Position :** exactement derrière le **pictogramme téléphone du bandeau bleu** (moitié **gauche**, loin du QR).
  Repère sur le gabarit : **~30–35 mm du bord gauche**, **~112–120 mm du haut**. Antenne bien à plat.
- **Éviter le métal** juste derrière (comptoir/plaque métallique). Si inévitable → puce **anti-métal à ferrite**.
- **Encodage :** URL HTTPS courte au format **NDEF URI**, ex. `https://t.tapote.fr/a/xxxx`.
  Le **QR pointe vers la MÊME URL** que le NFC. Verrouiller la puce en lecture seule **seulement après** validation.
- **Test avant série :** iPhone **et** Android, à travers le plexi → viser **9 lectures/10 en < 2 s**, téléphone presque au contact. QR lisible à 30/50/80 cm.

> ⚠️ **QR de démonstration :** le QR des fichiers est un **visuel placeholder**. Avant l'impression finale, le remplacer par un QR qui encode **la vraie URL courte** (la même que le NFC). Pour un prototype de démonstration papier aujourd'hui, ce n'est pas bloquant.

## 6. Découpe & quantité

- **Découpe :** massicot à **105 × 148 mm** en suivant les traits de coupe.
- **Prototype :** imprimer **1 exemplaire de chaque** d'abord (valider couleur + papier + NFC), puis lancer la série.

---

### Récap express pour le comptoir de l'imprimeur

> A6 105 × 148 mm · recto · **fond perdu 3 mm** (fichier 111 × 154) · **couché mat 300 g FSC** ·
> **pelliculage soft-touch mat** (optionnel, recommandé) · conversion **CMJN FOGRA39**, bleu le plus vif possible,
> noir riche pour la carte foncée · PDF vectoriel fourni.
