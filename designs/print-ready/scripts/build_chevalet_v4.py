#!/usr/bin/env python3
"""Tapote — chevalet avis Google v4 (105 x 148 mm).

Hierarchie validee le 24/07/2026 apres les tests de mise en page :
emplacement logo client -> nom du commerce -> « Votre avis compte, tapotez. »
-> logo Google -> 5 etoiles -> sous-titre -> bloc action -> pied de page.

Deux invariants non negociables :
- 1 unite SVG = 0,1 mm. Le viewBox 1050 x 1480 est donc le format fini exact.
- Le bloc action fait 855 x 540 unites = 85,5 x 54 mm, soit l'empreinte de la
  carte NFC collee derriere. Toute autre taille casse le geste : le client pose
  son telephone sur la zone bleue et la puce n'est pas dessous.

Typographie : Archivo Black / Archivo (charte de marque, docs/01-CHARTE-DE-MARQUE.md).
Les fichiers de police sont dans ../fonts, licences OFL incluses.
"""
import io
import os
import re

import qrcode

import build_protos as bp   # logo Tapote vectoriel du lot v3

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# ---------------------------------------------------------------- palette
WHITE = "#FFFFFF"
# Seule la TAILLE du bloc d'action est verrouillee par la puce NFC. Sa hauteur
# sur la page reste un levier de mise en page, utile quand un logo client
# encombrant demande de la place au-dessus.
BLOC_Y_DEFAUT = 810
# Edition Tapote : bleu de marque et or des etoiles. Une edition personnalisee
# reprend la couleur du commerce sur le bloc ; l'edition Tapote garde le bleu.
GOLD = "#F5B301"        # etoiles
BLOC = "#2458FF"        # bleu Tapote
BLOC_CLAIR = "#3B6BFF"  # haut du degrade du bloc
BLOC_ENCRE = WHITE      # textes et picto NFC dans le bloc


def _rvb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def fondu(couleur, fond, taux):
    """Melange `couleur` sur `fond` — remplace une opacite par une couleur pleine.

    Une opacite pousse Chrome a creer un groupe de transparence dans le PDF : les
    flux prepresse le signalent, et elle empeche de relire la geometrie du fichier.
    """
    a, b = _rvb(couleur), _rvb(fond)
    return "#%02x%02x%02x" % tuple(round(a[i] * taux + b[i] * (1 - taux)) for i in range(3))


def _luminance(c):
    def canal(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, v, b = (canal(x) for x in _rvb(c))
    return 0.2126 * r + 0.7152 * v + 0.0722 * b


def contraste(a, b):
    """Rapport de contraste WCAG entre deux couleurs. 4,5 est le seuil du texte."""
    la, lb = sorted((_luminance(a), _luminance(b)))
    return (lb + 0.05) / (la + 0.05)


def attenue(couleur, fond, depart=0.62, seuil=4.5):
    """Couleur attenuee sur son fond, mais jamais au point de devenir illisible.

    On part du taux souhaite et on le renforce jusqu'a repasser le seuil de
    contraste : une edition claire exige moins d'attenuation qu'une sombre.
    """
    taux = depart
    while taux < 1.0:
        c = fondu(couleur, fond, taux)
        if contraste(c, fond) >= seuil:
            return c
        taux += 0.02
    return couleur


def assombri(couleur, taux=0.68):
    """Teinte assombrie servant d'extrusion sous les lettres de l'enseigne.

    0,68 et non 0,55 : sur une lettre decoupee, le flanc reste de la meme couleur
    que la face, simplement dans l'ombre. Trop sombre, l'effet se lit comme une
    ombre portee decollee au lieu d'une epaisseur de matiere.
    """
    return "#%02x%02x%02x" % tuple(round(v * taux) for v in _rvb(couleur))


def eclairci(couleur, taux=1.12):
    """Teinte eclaircie pour le haut du degrade de face."""
    return "#%02x%02x%02x" % tuple(min(255, round(v * taux)) for v in _rvb(couleur))


def da(cle, nom, picto, fond, encre, gris, enseigne=None, filigrane=None, metier=None,
       picto_metier=None, contact=None, ornement="", sous_titre=True, logo=None,
       embleme=None, titre_taille=82, metier_bas=False, bloc_y=None,
       bloc=BLOC, bloc_clair=BLOC_CLAIR, bloc_encre=BLOC_ENCRE, etoiles=GOLD,
       logo_tapote=False):
    """Direction artistique d'une edition : fond, textes, enseigne. Rien d'autre.

    Le bloc d'action et les etoiles sont des invariants Tapote — voir les
    constantes en tete de fichier. Une DA client ne peut pas les teinter."""
    d = {
        "cle": cle, "nom": nom, "picto": picto, "enseigne": enseigne,
        "filigrane": filigrane, "metier": metier, "ornement": ornement,
        "picto_metier": picto_metier, "contact": contact,
        "sous_titre": sous_titre, "logo": logo, "embleme": embleme,
        "titre_taille": titre_taille, "metier_bas": metier_bas,
        "bloc_y": bloc_y or BLOC_Y_DEFAUT,
        "fond": fond, "encre": encre, "gris": gris,
        "bloc": bloc, "bloc_clair": bloc_clair, "bloc_encre": bloc_encre,
        "etoiles": etoiles, "logo_tapote": logo_tapote,
        "encre_faible": attenue(encre, fond, 0.62),
        "bloc_encre_faible": attenue(bloc_encre, bloc, 0.88),
    }
    # Garde-fou : une DA client ne doit pas produire de texte illisible a l'impression.
    for etiquette, a, b, seuil in (
            ("accroche", encre, fond, 4.5),
            ("sous-titre", gris, fond, 4.5),
            ("pied de page", d["encre_faible"], fond, 4.5),
            ("texte du bloc", bloc_encre, bloc, 4.5),
            # les etoiles sont un element graphique, pas du texte : seuil WCAG 3:1
            # enseigne et etoiles sont du grand corps ou du graphique : seuil 3:1
            ("etoiles", etoiles, fond, 3.0),
            *((("enseigne", enseigne["couleur"], fond, 3.0),) if enseigne else ())):
        r = contraste(a, b)
        if r < seuil:
            print(f"  ! contraste faible ({cle}, {etiquette}) : "
                  f"{r:.1f}:1 < {seuil:g}".replace(".", ","))
    return d


F_BLACK = 'font-family="Archivo Black" font-weight="400"'
# Polices d'enseigne : on ne dessine JAMAIS un logo qu'on n'a pas. Quand le client
# n'a pas de logo, on compose son nom dans la police la plus proche de sa plaque.
F_RONDE = 'font-family="Nunito" font-weight="800"'   # sans geometrique arrondi
F_GROTESQUE = 'font-family="Archivo" font-weight="700"'  # grotesque type Helvetica
# Serif a fort contraste, type Didone : c'est la lettre du logo Bulle de Jeux.
F_SERIF = 'font-family="Playfair Display" font-weight="800"'
F_BOLD = 'font-family="Archivo" font-weight="700"'
F_REG = 'font-family="Archivo" font-weight="400"'

# Editions Tapote non personnalisees : logo Tapote en tete, bloc bleu de marque.
# Deux fonds au choix, noir ou blanc, meme mise en page par ailleurs.
DA_TAPOTE = da("tapote-noir", "TAPOTE.", None,
               fond="#141414", encre="#F4EFE5", gris="#8E8B86",
               logo_tapote=True)

# Sur fond blanc l'or des etoiles tombe a 1,9:1 : il est assombri pour repasser
# le seuil graphique de 3:1. C'est le seul ecart entre les deux fonds.
DA_TAPOTE_BLANC = da("tapote-blanc", "TAPOTE.", None,
                     fond="#FFFFFF", encre="#141414", gris="#6B6864",
                     etoiles="#C08800", logo_tapote=True)

# Editions personnalisees, couleurs relevees sur les photos d'enseigne fournies.
# Access Phone : lettrage vert sur enseigne blanche, boutique claire, bandeaux LED
# verts. D'ou une edition CLAIRE, seule facon d'etre en accord avec le lieu. Le
# fond n'est pas blanc pur : la moitie QR du bloc, blanche, doit rester lisible.
# Fond sombre teinte vert, et non clair : les etoiles dorees et le bloc bleu
# etant invariables, ils sont concus pour un fond sombre. Une edition claire
# ferait tomber l'or a 2,6:1.
DA_ACCESS_PHONE = da("access-phone", "ACCESS PHONE.", None,
                     fond="#0E1410", encre="#E7F3EA", gris="#87A08E",
                     # plaque en sans geometrique arrondi, casse mixte
                     enseigne={"texte": "Access Phone", "fonte": F_RONDE,
                               "taille": 80, "interlettre": 1.5, "couleur": "#57B36A",
                               "relief": (4, 5)},
                     metier="RÉPARATION EXPRESS · GARANTIE 1 AN "
                            "· SMARTPHONES RECONDITIONNÉS",
                     picto_metier="telephone",
                     # le prefixe https:// est retire : bruit inutile a l'impression
                     contact="01 46 52 03 26 · sites.google.com/view/accessphone",
                     # vert de l'enseigne, assombri pour tenir 4,5:1 sous le blanc
                     bloc="#337F46", bloc_clair="#4FB268",
                     # composition validee : le chevalet se lit comme un ecran de
                     # telephone, ce qui raconte le metier sans dessiner d'objet
                     sous_titre=False,
                     ornement="fond-degrade,ecran-smartphone,metier,contact,halo-bloc")

# Photo Concept : facade anthracite, lettrage et menuiseries rouges. Structure
# tres proche de l'edition Tapote sombre — le chevalet sera natif dans la vitrine.
DA_PHOTOCONCEPT = da("photo-concept", "PHOTO CONCEPT.", None,
                     fond="#2F343B", encre="#F5F3F1", gris="#A5AEB6",
                     # plaque en grotesque bold tout en capitales, legerement espacee
                     enseigne={"texte": "PHOTO CONCEPT", "fonte": F_GROTESQUE,
                               "taille": 72, "interlettre": 3, "couleur": "#EE3B31",
                               "relief": (4, 5)},
                     metier="PHOTOS D'IDENTITÉ · ENCADREMENT · REPORTAGES",
                     picto_metier="objectif",
                     # releve sur la vitrine, A VERIFIER avant tout envoi client
                     contact="09 62 08 14 59",
                     # rouge de l'enseigne, tient 5,0:1 sous le blanc
                     bloc="#D8271F", bloc_clair="#EC3F35",
                     # composition validee : perforations de pellicule sur les
                     # deux bords, ligne de specialites, halo autour du bloc
                     sous_titre=False,
                     ornement="fond-degrade,pellicule,metier,contact,halo-bloc")

# Bulle de Jeux : enseigne noire sur facade sable, logo de vitrine noir et rouge
# (« Bulle » noir, « de jeux » rouge). Sur fond sombre le noir dispararait, la
# partie noire passe donc en creme et le rouge reste le rouge de la marque.
DA_BULLE_DE_JEUX = da("bulle-de-jeux", "BULLE DE JEUX.", None,
                      # Edition CLAIRE, imposee par leur logo : il est noir et
                      # rouge sur blanc. Sur un fond sombre, le dragon et le mot
                      # « Bulle » disparaitraient. Le creme reprend la teinte de
                      # leur facade, le rouge est celui de leur logo.
                      fond="#F5F1EA", encre="#1D1D1B", gris="#6E665E",
                      etoiles="#B07A00",   # or assombri : l'or clair chute sur creme
                      # logo vectorise depuis leur fichier, jamais redessine
                      # logo trace depuis leur fichier, avec la mention de ville composee
                      # dans la meme Didone, sous la jonction j/e de « jeux »
                      logo=("logos/bulle-de-jeux-colombes.svg", 430),
                      embleme="logos/bulle-de-jeux-dragon.svg",
                      metier="LIBRAIRIE BD · JEUX DE SOCIÉTÉ · FIGURINES",
                      contact="@bulledejeuxcolombes",
                      sous_titre=False,
                      bloc="#A81023", bloc_clair="#C00B25",
                      # composition validee le 26/07/2026 : le dragon deborde du
                      # format des deux cotes, on n'en voit qu'une portion — c'est
                      # ce qui le fait lire comme une intention graphique et non
                      # comme une image posee sur le fond.
                      ornement="geant-deborde,metier,contact,halo-bloc")

# Le Repaire de Bacchus, caviste : logo circulaire vert fonce sur blanc. Comme
# pour Bulle de Jeux, un logo sombre impose une edition claire. Le creme evoque
# l'etiquette de bouteille, le vert du bloc est celui du logo.
DA_BACCHUS = da("repaire-bacchus", "LE REPAIRE DE BACCHUS.", None,
                fond="#F4F1E9", encre="#1B2E28", gris="#5E6E63",
                etoiles="#B07A00",   # or assombri : l'or clair chute sur creme
                # 195 unites = 19,5 mm : taille a laquelle la colonne complete
                # — logo, metier, contact, Google, accroche, etoiles — tient
                # au-dessus du bloc sans deplacer ni reduire quoi que ce soit.
                logo=("logos/repaire-bacchus-original.svg", 195),
                embleme="logos/repaire-bacchus-tete.svg",
                metier="VINS · CHAMPAGNES · SPIRITUEUX",
                # telephone de la boutique de Colombes inconnu, a completer
                contact="lerepairedebacchus.com",
                sous_titre=False,
                bloc="#234B41", bloc_clair="#33685A",
                ornement="fond-logo-moyen,metier,contact,halo-bloc")

# ---------------------------------------------------------------- format
W, H = 1050, 1480          # 105 x 148 mm
BLOC_W, BLOC_H = 855, 540  # 85,5 x 54 mm EXACT — empreinte carte NFC
BLOC_X = (W - BLOC_W) / 2  # 97,5 → marges laterales de 9,75 mm


# Emplacement logo client : zone carree reservee, remplie par Tapote Gestion.
# Le picto tasse ci-dessous n'est qu'un exemple de remplissage (demo Cafe Lume).
LOGO_SLOT = 150            # 15 x 15 mm
LOGO_SLOT_Y = 62

QR_URL = "https://tapote.fr"   # prototype ; en production https://t.tapote.fr/a/<shortcode>


def fragments(contenu, couleur):
    """Rend le contenu d'un <text> : chaine simple, ou suite de (texte, couleur).

    Les logos a deux teintes — « Bulle » en creme, « de jeux » en rouge — se
    composent en tspan, que le vectoriseur convertit ensuite chemin par chemin.
    """
    if isinstance(contenu, str):
        return contenu
    return "".join(f'<tspan fill="{c or couleur}">{t}</tspan>' for t, c in contenu)


LARGEUR_UTILE = 890     # 105 mm moins 8 mm de marge de chaque cote


def _largeur(texte, fonte, taille, interlettre):
    """Largeur reelle d'une chaine, mesuree sur la police et non estimee."""
    import vectorize_text
    famille = re.search(r'font-family="([^"]+)"', fonte).group(1)
    poids = float(re.search(r'font-weight="([\d.]+)"', fonte).group(1))
    f = vectorize_text._font(famille, poids)
    return vectorize_text._avance(f, vectorize_text._glyph_names(f, texte),
                                  taille, interlettre)


def repartir(texte, fonte, taille, interlettre, maxi=LARGEUR_UTILE):
    """Coupe une mention en deux lignes sur un separateur, si elle deborde.

    Preferable a la reduction de corps : une ligne de metier a 1,7 mm parait
    chetive a cote des 2,5 mm des autres editions. La coupe se fait sur le point
    median, jamais au milieu d'un mot, et au plus pres de l'equilibre.
    """
    if _largeur(texte, fonte, taille, interlettre) <= maxi or "·" not in texte:
        return [texte]
    bouts = [b.strip() for b in texte.split("·")]
    meilleur, ecart_min = None, None
    for i in range(1, len(bouts)):
        a = " · ".join(bouts[:i])
        b = " · ".join(bouts[i:])
        la, lb = (_largeur(x, fonte, taille, interlettre) for x in (a, b))
        if max(la, lb) > maxi:
            continue
        if ecart_min is None or abs(la - lb) < ecart_min:
            meilleur, ecart_min = (a, b), abs(la - lb)
    return list(meilleur) if meilleur else [texte]


def ajuster(texte, fonte, taille, interlettre, maxi=LARGEUR_UTILE, mini=16):
    """Reduit le corps jusqu'a ce que la ligne tienne dans la largeur utile.

    Les mentions de metier et de contact varient beaucoup d'un commerce a
    l'autre. Plutot que de rogner le texte du client, on adapte le corps — et on
    le signale, pour qu'une ligne devenue minuscule ne passe pas inapercue.
    """
    t, ls = taille, interlettre
    while t > mini and _largeur(texte, fonte, t, ls) > maxi:
        t -= 0.5
        ls = max(0, interlettre * t / taille)
    if t < taille:
        print(f"  corps ajuste {taille:g} -> {t:g} pour « {texte[:38]}... »")
    return t, ls


def texte_centre(cx, y, contenu, fonte, taille, fill, interlettre=0, opacity=None):
    """Texte centre sur cx, gouttiere d'interlettrage compensee.

    CSS ajoute une gouttiere d'interlettrage apres chaque lettre, la derniere
    comprise, et `text-anchor=middle` centre cette chasse-la. Sans correction,
    l'encre visible part d'un demi-interlettrage vers la gauche : 0,65 mm sur un
    titre a 13 d'interlettrage. Invisible a l'ecran, mesurable a l'impression.
    """
    attrs = (f'x="{cx + interlettre / 2:g}" y="{y:g}" text-anchor="middle" '
             f'fill="{fill}" {fonte} font-size="{taille:g}"')
    if interlettre:
        attrs += f' letter-spacing="{interlettre:g}"'
    if opacity is not None:
        attrs += f' opacity="{opacity}"'
    return f'<text {attrs}>{fragments(contenu, fill)}</text>'


# ---------------------------------------------------------------- briques
# --- picto tasse : construit autour d'un axe de symetrie, pas dessine a vue ---
# Traces en aplats pleins et non en traits d'epaisseur constante : c'est ce qui
# donne le rendu calligraphique (le trait s'epaissit dans les courbes et s'affine
# aux extremites). Chaque element est un ruban ferme = bord exterieur puis bord
# interieur parcouru en sens inverse.
_CUP_PARTS = {
    # bol : deux flancs convergents vers un fond arrondi
    "bol": ("M19 47C19 68 33 83 50 83C67 83 81 68 81 47"
            "L76 47C76 65.5 64.5 78 50 78C35.5 78 24 65.5 24 47Z"),
    # bord superieur : anneau elliptique, evide par fill-rule evenodd
    "bord": ("M50 37.2a31 9 0 1 0 0 18 31 9 0 1 0 0-18z"
             "m0 4a27 5 0 1 1 0 10 27 5 0 1 1 0-10z"),
    # anse : volute ouverte et allongee, la seule rupture de symetrie du dessin.
    # Remontee de 3 unites pour degager la pointe droite de la soucoupe.
    "anse": ("M77 44C97 42 107 54 99.5 65.5C94.5 73 83 75.5 75.5 69.5"
             "L79 65.5C85 69 92 67 95 60.5C98.5 52.5 91.5 47 77 48.5Z"),
    # soucoupe : croissant epais au centre, effile aux deux pointes, symetrique
    "soucoupe": ("M14 76C26.5 84.5 37.5 87.5 50 87.5C62.5 87.5 73.5 84.5 86 76"
                 "C80.5 89 66.5 94 50 94C33.5 94 19.5 89 14 76Z"),
    # vapeur : deux rubans en S, larges en bas, effiles vers le haut. Amplitude
    # faible et course longue, sinon les volutes se lisent comme des crochets.
    # Les deux bords se rejoignent en un point unique au sommet : sans ce
    # rebroussement le ruban se termine a plat et casse le geste calligraphique.
    "vapeur_haute": ("M53 36C47 26.5 60.5 21.5 56.5 13C53.5 6.5 57 2.5 62 0.5"
                     "C59 5 58 8.5 60 12C64 21 50.5 26 57 36.5Z"),
    "vapeur_basse": ("M40.5 34C35 26 45.5 21.5 42.5 15C41 11.5 42.5 9 45 7.5"
                     "C43.5 11 43.5 13.5 45 15.5C48.5 22.5 37.5 26 44.5 34Z"),
}
# Boite du dessin, mesuree sur les traces ci-dessus.
_CUP_AXIS = 50.0            # axe de symetrie du bol, du bord et de la soucoupe
# Bornes relevees sur le trace lui-meme (getBBox), pas estimees a la lecture des
# chemins : les points de controle des courbes debordent des extremites reelles.
_CUP_LEFT, _CUP_RIGHT = 14.0, 102.0
_CUP_TOP, _CUP_BOTTOM = 0.5, 94.0
# Compensation optique de l'anse, en unites locales. A 0, l'axe bol/soucoupe
# tombe exactement sur l'axe de la page : c'est le reglage retenu.
_CUP_OPTICAL_DX = 0.0


def cup_picto(cx, cy, size, color):
    """Exemple de remplissage de l'emplacement logo — tasse de cafe calligraphique.

    Le centrage se fait sur l'axe de symetrie du bol, pas sur la boite englobante :
    celle-ci inclut l'anse et la vapeur, qui tireraient le bol hors de l'axe.
    """
    s = size / max(_CUP_RIGHT - _CUP_LEFT, _CUP_BOTTOM - _CUP_TOP)
    tx = cx - s * (_CUP_AXIS + _CUP_OPTICAL_DX)
    ty = cy - s * (_CUP_TOP + _CUP_BOTTOM) / 2
    body = "".join(f'<path d="{d}"/>' for d in _CUP_PARTS.values())
    return (f'<g transform="translate({tx:.2f} {ty:.2f}) scale({s:.4f})" '
            f'fill="{color}" fill-rule="evenodd">{body}</g>')


def _pose(cx, cy, size, axe, haut, bas, gauche, droite):
    """Echelle et translation communes aux pictos : centrage sur l'axe de symetrie
    du motif principal, jamais sur la boite englobante — les appendices
    asymetriques (anse, ondes) tireraient le motif hors de l'axe de la page."""
    s = size / max(droite - gauche, bas - haut)
    return f'translate({cx - s * axe:.2f} {cy - s * (haut + bas) / 2:.2f}) scale({s:.4f})'


def picto_telephone(cx, cy, size, couleur):
    """Access Phone — telephonie. Corps symetrique, ondes de reception a droite."""
    return (
        f'<g transform="{_pose(cx, cy, size, 50, 11.5, 88.5, 27.5, 89)}" '
        f'fill="none" stroke="{couleur}" stroke-width="5" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<rect x="30" y="14" width="40" height="72" rx="9"/>'    # corps
        f'<path d="M43 24h14"/>'                                  # ecouteur
        f'<path d="M43 77h14"/>'                                  # barre de retour
        f'<path d="M77 34a15 15 0 0 1 0 32"/>'                    # onde courte
        f'<path d="M86.5 25a25 25 0 0 1 0 50"/>'                  # onde longue
        f'</g>')


def picto_telephone_plein(cx, cy, size, couleur):
    """Telephone en silhouette pleine — plus de matiere qu'un trace au trait."""
    return (
        f'<g transform="{_pose(cx, cy, size, 50, 11.5, 88.5, 27.5, 89)}" '
        f'fill="{couleur}" fill-rule="evenodd">'
        f'<path d="M39 14h22a9 9 0 0 1 9 9v54a9 9 0 0 1-9 9H39a9 9 0 0 1-9-9V23a9 9 0 0 1 9-9z'
        f'm0 9v54h22V23H39z"/>'
        f'<path d="M77 31a18 18 0 0 1 0 38l-4-5a13 13 0 0 0 0-28z"/>'
        f'<path d="M86.5 22a28 28 0 0 1 0 56l-4-5a23 23 0 0 0 0-46z"/>'
        f'</g>')


def picto_objectif_plein(cx, cy, size, couleur):
    """Diaphragme en silhouette pleine : anneau evide et lamelles massives."""
    import math
    R, RI = 36.0, 15.0
    pts = [(50 + RI * math.cos(math.radians(-90 + i * 60)),
            50 + RI * math.sin(math.radians(-90 + i * 60))) for i in range(6)]
    lam = "".join(
        f'M{x:.2f} {y:.2f}L{50 + R*(x-50)/RI:.2f} {50 + R*(y-50)/RI:.2f}'
        f'l{4.5*math.cos(math.radians(-90+i*60+90)):.2f} '
        f'{4.5*math.sin(math.radians(-90+i*60+90)):.2f}'
        f'L{x + 4.5*math.cos(math.radians(-90+i*60+90)):.2f} '
        f'{y + 4.5*math.sin(math.radians(-90+i*60+90)):.2f}Z'
        for i, (x, y) in enumerate(pts))
    return (
        f'<g transform="{_pose(cx, cy, size, 50, 11.5, 88.5, 11.5, 88.5)}" '
        f'fill="{couleur}" fill-rule="evenodd">'
        f'<path d="M50 8a42 42 0 1 1 0 84 42 42 0 0 1 0-84zm0 6a36 36 0 1 0 0 72 36 36 0 0 0 0-72z"/>'
        f'<path d="{lam}"/>'
        f'</g>')


def picto_objectif(cx, cy, size, couleur):
    """Photoconcept — diaphragme d'objectif. Six lamelles generees par calcul,
    pour que la symetrie soit exacte plutot qu'approchee a la main."""
    import math
    R_EXT, R_INT = 36.0, 15.0
    pts = [(50 + R_INT * math.cos(math.radians(-90 + i * 60)),
            50 + R_INT * math.sin(math.radians(-90 + i * 60))) for i in range(6)]
    iris = "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"
    lamelles = "".join(
        f'M{x:.2f} {y:.2f}L{50 + R_EXT * (x - 50) / R_INT:.2f} '
        f'{50 + R_EXT * (y - 50) / R_INT:.2f}' for x, y in pts)
    return (
        f'<g transform="{_pose(cx, cy, size, 50, 11.5, 88.5, 11.5, 88.5)}" '
        f'fill="none" stroke="{couleur}" stroke-width="5" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<circle cx="50" cy="50" r="{R_EXT}"/>'
        f'<path d="{iris}"/>'
        f'<path d="{lamelles}"/>'
        f'</g>')


PICTOS = {"tasse": cup_picto, "telephone": picto_telephone, "objectif": picto_objectif,
          "telephone-plein": picto_telephone_plein, "objectif-plein": picto_objectif_plein}


def google_g(cx, cy, size):
    """Geometrie officielle du « G » Google, dessinee dans une boite 24x24."""
    s = size / 24.0
    paths = [
        ("#4285F4", "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 "
                    "2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"),
        ("#34A853", "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 "
                    "1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"),
        ("#FBBC05", "M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 "
                    "8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"),
        ("#EA4335", "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 "
                    "1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"),
    ]
    body = "".join(f'<path fill="{c}" d="{d}"/>' for c, d in paths)
    return (f'<g transform="translate({cx - size/2:.1f} {cy - size/2:.1f}) '
            f'scale({s:.4f})">{body}</g>')


def google_wordmark(x, y, size):
    """Mention « Google » aux couleurs de la marque, ancree a gauche."""
    letters = [("G", "#4285F4"), ("o", "#EA4335"), ("o", "#FBBC05"),
               ("g", "#4285F4"), ("l", "#34A853"), ("e", "#EA4335")]
    spans = "".join(f'<tspan fill="{c}">{ch}</tspan>' for ch, c in letters)
    return f'<text x="{x:.1f}" y="{y:.1f}" {F_BOLD} font-size="{size}">{spans}</text>'


def star(cx, cy, r, color=GOLD):
    import math
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.42
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f"{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}")
    return f'<path d="M{"L".join(pts)}Z" fill="{color}"/>'


def stars_row(cx, cy, r, gap, couleur=GOLD):
    return "".join(star(cx - 2 * gap + i * gap, cy, r, couleur) for i in range(5))


def nfc_icon(cx, cy, size, color=WHITE):
    """Telephone + ondes NFC. Dessin natif dans une boite 22x24, ancre par son centre."""
    s = size / 24.0
    return (
        f'<g transform="translate({cx - 11*s:.1f} {cy - 12*s:.1f}) scale({s:.4f})" '
        f'fill="none" stroke="{color}" stroke-width="1.7" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<rect x="1" y="6" width="8" height="13" rx="1.6"/>'
        f'<path d="M13 8.6a7.2 7.2 0 0 1 0 7.8M16.6 6.4a11.6 11.6 0 0 1 0 12.2'
        f'M20.2 4.2a15.8 15.8 0 0 1 0 16.6"/>'
        f'</g>')


def bell_mark(cx, cy, size, color, accent):
    """Marque Tapote seule (cloche + ondes), extraite du logo. Boite source 44x46.

    L'accent des ondes suit la DA de l'edition : sur un fond chaud, le bleu
    Tapote ferait une tache froide isolee au pied du chevalet."""
    s = size / 46.0
    return (
        f'<g transform="translate({cx - 22*s:.1f} {cy - 23*s:.1f}) scale({s:.4f})">'
        f'<g transform="translate(-13 -16)">'
        f'<rect x="10" y="53" width="38" height="5" rx="2.5" fill="{color}"/>'
        f'<path d="M11 51a18 18 0 0 1 36 0Z" fill="{color}"/>'
        f'<rect x="25.5" y="25.5" width="7" height="6.5" rx="2.4" fill="{color}"/>'
        f'<circle cx="40" cy="26" r="2.2" fill="{accent}"/>'
        f'<path d="M40 19.5a6.5 6.5 0 0 1 6.5 6.5M40 13a13 13 0 0 1 13 13" fill="none" '
        f'stroke="{accent}" stroke-width="2.7" stroke-linecap="round"/>'
        f'</g></g>')


def qr_code(cx, cy, size, url=QR_URL):
    """QR reellement scannable, genere depuis l'URL — pas un motif decoratif."""
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(url)
    q.make(fit=True)
    matrix = q.get_matrix()
    n = len(matrix)
    m = size / n
    d = []
    for row, line in enumerate(matrix):
        col = 0
        while col < n:
            if line[col]:
                run = 0
                while col + run < n and line[col + run]:
                    run += 1
                d.append(f"M{col*m:.2f} {row*m:.2f}h{run*m:.2f}v{m:.2f}h-{run*m:.2f}z")
                col += run
            else:
                col += 1
    # Un seul chemin fait de rectangles pleins : deja du vectoriel pur, aucune
    # image bitmap. Pas de shape-rendering : c'est un indice de rendu ecran qui
    # ferait accrocher les bords au RIP de l'imprimeur.
    return (f'<g transform="translate({cx - size/2:.1f} {cy - size/2:.1f})">'
            f'<path d="{"".join(d)}" fill="#000000"/></g>')


def action_block(x, y, d, sfx=""):
    """Bloc action 85,5 x 54 mm — geometrie verrouillee, voir docstring du module."""
    blue_w = 490
    cx_blue = x + blue_w / 2
    cx_white = x + blue_w + (BLOC_W - blue_w) / 2
    return (
        f'<g clip-path="url(#blocClip{sfx})">'
        f'<rect x="{x}" y="{y}" width="{BLOC_W}" height="{BLOC_H}" fill="{WHITE}"/>'
        f'<rect x="{x}" y="{y}" width="{blue_w}" height="{BLOC_H}" fill="url(#blocAccent{sfx})"/>'
        f'</g>'
        # ---- moitie NFC
        + nfc_icon(cx_blue, y + 160, 150, d["bloc_encre"])
        + texte_centre(cx_blue, y + 318, "Posez votre", F_BOLD, 43, d["bloc_encre"])
        + texte_centre(cx_blue, y + 370, "téléphone ici", F_BOLD, 43, d["bloc_encre"])
        + texte_centre(cx_blue, y + 436, "Sans application", F_BOLD, 28, d["bloc_encre_faible"])
        # ---- moitie QR
        + qr_code(cx_white, y + 218, 285)
        + texte_centre(cx_white, y + 448, "OU SCANNEZ", F_BOLD, 31, "#111111", 1)
    )


# ---------------------------------------------------------------- montage
# Deux variantes testees : elles ne different que par la place du logo Google,
# avant ou apres l'accroche. Tout le reste — picto, bloc action, pied de page —
# est strictement identique, pour que la comparaison ne porte que sur ce point.
# Les ordonnees sont des lignes de base pour les textes, des centres pour le
# reste. BLOC_Y et le pied de page ne bougent jamais d'une variante a l'autre.
LAYOUTS = {
    "A-google-avant-accroche": {
        "picto_cy": 137, "nom": 272, "enseigne": 148,
        "google_cy": 344, "titre1": 456, "titre2": 554,
        "etoiles_cy": 642, "sous_titre": 738,
    },
    "B-google-apres-accroche": {
        "picto_cy": 137, "nom": 272, "enseigne": 148,
        "titre1": 396, "titre2": 494, "google_cy": 556,
        "etoiles_cy": 648, "sous_titre": 742,
    },
}


def _google_logo(cy):
    """Pastille « G » + mention Google, l'ensemble centre sur l'axe de la page.

    Les deux pieces sont posees a la main : la pastille est plus large que haute
    une fois le wordmark aligne dessus, un simple centrage de chacune ne suffit pas.
    """
    return google_g(428, cy, 52) + google_wordmark(474, cy + 18, 50)


def degrade_enseigne(e, sfx=""):
    """Degrade vertical de la face des lettres — volume, pas effet de style.

    Une lettre en relief prend la lumiere par le haut. L'amplitude reste serree
    autour de la couleur de la plaque : au-dela, on ne reconnait plus la charte.
    """
    return (f'<linearGradient id="faceEnseigne{sfx}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{eclairci(e["couleur"])}"/>'
            f'<stop offset="1" stop-color="{assombri(e["couleur"], 0.9)}"/>'
            '</linearGradient>')


def dimensions_logo(chemin, largeur):
    """Largeur et hauteur d'un logo une fois mis a l'echelle demandee."""
    src = io.open(os.path.join(ROOT, chemin), encoding="utf-8").read()
    vb = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', src)
    lw, lh = float(vb.group(3)), float(vb.group(4))
    return largeur, largeur * lh / lw


def logo_fichier(cx, cy, largeur, chemin, teinte=None, rotation=0):
    """Insere un logo vectorise. `teinte` le rend monochrome, pour un filigrane.

    Un filigrane se fait par la couleur, jamais par l'opacite : une opacite
    recreerait un groupe de transparence dans le PDF.
    """
    src = io.open(os.path.join(ROOT, chemin), encoding="utf-8").read()
    vb = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', src)
    vx, vy, lw, lh = (float(vb.group(i)) for i in (1, 2, 3, 4))
    corps = src[src.index(">", src.index("<svg")) + 1: src.rindex("</svg>")]
    if teinte:
        corps = re.sub(r'fill="#[0-9A-Fa-f]{6}"', f'fill="{teinte}"', corps)
    e = largeur / lw
    return (f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rotation}) '
            f'scale({e:.4f}) translate({-vx - lw/2:.1f} {-vy - lh/2:.1f})">{corps}</g>')


def _logo_fichier_ancien(cx, cy, largeur, chemin):
    """Insere un logo client deja vectorise, a l'echelle et centre.

    Le fichier vient de vectoriser_logo.py, qui trace le logo fourni par le
    commercant. On n'y touche pas : c'est son identite, pas notre dessin.
    """
    src = io.open(os.path.join(ROOT, chemin), encoding="utf-8").read()
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
    lw, lh = float(vb.group(1)), float(vb.group(2))
    corps = src[src.index(">", src.index("<svg")) + 1: src.rindex("</svg>")]
    e = largeur / lw
    return (f'<g transform="translate({cx - largeur/2:.1f} {cy - lh*e/2:.1f}) '
            f'scale({e:.4f})">{corps}</g>')


def logo_tapote(cx, y, largeur, couleur):
    """Logo Tapote : cloche + mot « tapote », deja vectorise dans le lot v3.

    On ne recompose pas le mot avec une police : le logo existe en chemins, c'est
    lui qui fait foi. `bp.logo` ancre en haut a gauche, on recentre.
    """
    return bp.logo(cx - largeur / 2, y, largeur, couleur)


# Placements du pictogramme metier. Chaque entree : centre, taille, rotation,
# intensite du fondu sur le fond, et silhouette pleine ou au trait.
# Filigranes d'embleme : centre, largeur, rotation, intensite du fondu.
# Tous en moitie haute — sous le bloc d'action ils seraient masques.
PLACEMENTS_EMBLEME = {
    "embleme-diagonale":      (600, 430, 620, -28, 0.13),
    "embleme-diagonale-fort": (600, 430, 620, -28, 0.20),
    "embleme-angle":          (880, 250, 460, -22, 0.16),
    "embleme-geant":          (525, 470, 900, -18, 0.08),
    # declinaisons de position du geant : centre, largeur, rotation, intensite
    "geant-gauche":           (320, 455, 880, -24, 0.09),
    "geant-droite":           (730, 455, 880, 20, 0.09),
    "geant-haut":             (525, 335, 820, -14, 0.09),
    "geant-bas":              (525, 625, 880, -20, 0.08),
    "geant-deborde":          (560, 470, 1180, -12, 0.06),
    "geant-diagonale-forte":  (525, 470, 900, -36, 0.10),
    "geant-droit":            (525, 470, 860, 0, 0.08),
    "geant-coin-bas-gauche":  (210, 660, 760, 26, 0.10),
    # emblemes hauts : la largeur est petite, c'est la hauteur qui porte
    "haut-centre":            (525, 430, 420, 0, 0.10),
    "haut-deborde-droite":    (830, 420, 560, 12, 0.11),
    "haut-deborde-gauche":    (220, 420, 560, -12, 0.11),
    "haut-geant":             (525, 440, 700, 0, 0.07),
    "haut-diagonale":         (620, 450, 520, -18, 0.11),
    "haut-bas-droite":        (860, 690, 420, 14, 0.12),
    "embleme-duo":            (None, 300, 300, 24, 0.12),
    "embleme-tete":           (760, 210, 380, -16, 0.15),
}

# Filigrane du LOGO COMPLET, et non du seul embleme. Centre volontairement place
# en partie haute : plus bas, le bloc d'action le masquerait.
PLACEMENTS_FOND_LOGO = {
    "fond-logo-moyen":     (525, 430, 700, 0, 0.13),
    "fond-logo-grand":     (525, 420, 900, 0, 0.12),
    "fond-logo-geant":     (525, 400, 1120, 0, 0.10),
    "fond-logo-net":       (525, 430, 780, 0, 0.18),
    "fond-logo-tres-net":  (525, 430, 780, 0, 0.25),
    "fond-logo-haut":      (525, 350, 820, 0, 0.15),
    "fond-logo-decale":    (700, 410, 860, 0, 0.13),
    "fond-logo-incline":   (560, 420, 820, -12, 0.14),
}

PLACEMENTS_PICTO = {
    "picto-flanc-droit":   (1005, 560, 520, -18, 0.13, False),
    "picto-flanc-gauche":  (45, 560, 520, 18, 0.13, False),
    "picto-tete-droite":   (975, 175, 330, -14, 0.16, False),
    "picto-diagonal":      (525, 620, 900, -32, 0.07, False),
    "picto-bas-droite":    (960, 700, 400, -20, 0.15, False),
    "picto-plein-droit":   (1010, 560, 500, -18, 0.11, True),
    "picto-plein-tete":    (975, 172, 320, -14, 0.13, True),
    "picto-duo":           (None, 172, 190, 0, 0.15, False),
}


def ornement_defs(d, noms, sfx):
    """Definitions dont les ornements ont besoin. Vide pour la plupart."""
    return "".join(_defs_ornement(d, n.strip(), sfx) for n in noms.split(",") if n.strip())


def _defs_ornement(d, nom, sfx):
    if nom in ("sphere-marque", "dragon-marque"):
        return (f'<radialGradient id="sphere{sfx}" cx="0.35" cy="0.3" r="0.85">'
                f'<stop offset="0" stop-color="{fondu("#E8434F", d["fond"], 0.42)}"/>'
                f'<stop offset="1" stop-color="{fondu("#8E1420", d["fond"], 0.38)}"/>'
                '</radialGradient>')
    if nom == "fond-degrade":
        a = d["enseigne"]["couleur"] if d["enseigne"] else d["bloc"]
        return (f'<linearGradient id="fondDeg{sfx}" x1="0" y1="0" x2="0.35" y2="1">'
                f'<stop offset="0" stop-color="{fondu(a, d["fond"], 0.16)}"/>'
                f'<stop offset="0.55" stop-color="{d["fond"]}"/>'
                f'<stop offset="1" stop-color="{assombri(d["fond"], 0.72)}"/>'
                '</linearGradient>')
    return ""


def ornement(d, y, noms, sfx=""):
    """Applique un ou plusieurs ornements, dans l'ordre donne.

    Les pistes se cumulent : « pellicule,metier,halo-bloc » est une composition
    valide. L'ordre compte, le premier est dessine le plus au fond.
    """
    return "".join(_un_ornement(d, y, n.strip(), sfx) for n in noms.split(",") if n.strip())


def _un_ornement(d, y, nom, sfx=""):
    """Element de design additionnel, au choix, pour differencier une edition.

    Tous sont des aplats ou des traits pleins : aucun filtre, aucune opacite,
    donc aucun risque pour l'audit vectoriel ni pour le flux prepresse.
    """
    a = d["enseigne"]["couleur"] if d["enseigne"] else d["bloc"]
    yb = y["enseigne"]
    # un logo image occupe plus de hauteur qu'une ligne de texte : les lignes
    # metier et contact descendent d'autant pour ne pas le toucher.
    ecart = 100 if d.get("logo") else 74

    # --- pistes sans pictogramme -------------------------------------------
    if nom == "fond-degrade":
        # profondeur par la lumiere, pas par un motif : le fond cesse d'etre plat
        return f'<rect width="{W}" height="{H}" fill="url(#fondDeg{sfx})"/>'

    if nom == "dragon-marque":
        # Dragon stylise inspire du logo de la boutique, redessine en trait —
        # ce n'est PAS une copie de leur illustration, dont je n'ai pas le
        # fichier : c'est une evocation, a remplacer par leur vectoriel des
        # qu'ils le fournissent. Trace au trait, comme leur original.
        # place en filigrane sur la moitie haute : sous le bloc d'action il
        # serait entierement masque.
        t = fondu(a, d["fond"], 0.26)
        cx, cy, r = 812, 560, 208
        return (
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sphere{sfx})"/>'
            f'<path d="M{cx - 208} {cy + 168}c100 34 208 8 266 -76l44 34-26-134'
            f'-124 52 44 34c-50 64-134 80-204 56z" '
            f'fill="{fondu("#FFFFFF", d["fond"], 0.28)}"/>'
            f'<g fill="none" stroke="{t}" stroke-width="7" stroke-linecap="round" '
            f'stroke-linejoin="round" transform="translate(288 300) scale(2.6)">'
            # aile : membrane et nervures
            f'<path d="M62 34C34 12 6 22 0 54c14-18 34-24 52-16"/>'
            f'<path d="M0 54c-4 34 14 62 44 72-18-26-24-52-16-74"/>'
            f'<path d="M12 30l22 26M6 48l30 20M8 72l30 12"/>'
            # tete, corne, museau
            f'<path d="M84 44c12-6 28-2 35 8 7 10 2 23-10 27-11 4-24-1-30-10"/>'
            f'<path d="M82 40l-14-22 25 10"/>'
            f'<path d="M104 56c5-1 9 2 9 6"/>'
            f'<circle cx="98" cy="52" r="3.4" fill="{t}" stroke="none"/>'
            # cou et corps
            f'<path d="M80 78c-16 12-25 31-23 52"/>'
            f'<path d="M62 88c-10 10-15 24-14 38"/>'
            # patte griffue
            f'<path d="M50 118c8-2 14 3 15 11m-7-13c6 0 11 5 11 12"/>'
            # queue vers la sphere
            f'<path d="M58 142c14 30 48 42 78 26"/>'
            f'</g>')

    if nom == "sphere-marque":
        # Sphere rouge et fleche blanche du logo. Reproduite parce que c'est une
        # forme geometrique simple ; le dragon qui l'accompagne est une
        # illustration au trait sous droits, il n'est pas redessine ici.
        cx, cy, r = 830, 1150, 300
        return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sphere{sfx})"/>'
                f'<path d="M{cx - 250} {cy + 210}c120 40 250 10 320-90l52 40-30-160'
                f'-150 62 54 42c-60 76-160 96-246 66z" '
                f'fill="{fondu("#FFFFFF", d["fond"], 0.30)}"/>')

    if nom == "bulle-bd":
        # bulle de bande dessinee debordant de l'angle : le nom de la boutique
        # et le symbole du metier sont la meme chose, on s'en sert.
        c = fondu(a, d["fond"], 0.20)
        return (f'<g fill="none" stroke="{c}" stroke-width="9" stroke-linejoin="round">'
                f'<path d="M960 300a250 190 0 1 0-500 0 250 190 0 0 0 250 190'
                f'l-40 120 150-124a250 190 0 0 0 140-186z"/>'
                f'<path d="M300 1180a150 114 0 1 0 300 0 150 114 0 0 0-150-114'
                f'l24-72-90 74a150 114 0 0 0-84 112z" '
                f'stroke="{fondu(a, d["fond"], 0.13)}"/></g>')

    if nom == "des":
        # des a jouer en trame legere le long des bords
        c = fondu(a, d["fond"], 0.16)
        pips = ((0, 0), (-9, -9), (9, 9), (-9, 9), (9, -9))
        return "".join(
            f'<g transform="translate({x} {yy}) rotate({r})">'
            f'<rect x="-21" y="-21" width="42" height="42" rx="9" fill="none" '
            f'stroke="{c}" stroke-width="5"/>'
            + "".join(f'<circle cx="{px}" cy="{py}" r="3.6" fill="{c}"/>'
                      for px, py in pips[:1 + (i % 5)])
            + '</g>'
            for i, (x, yy, r) in enumerate(
                [(52, 260 + j * 150, -12 + j * 9) for j in range(4)]
                + [(W - 52, 300 + j * 150, 10 - j * 7) for j in range(4)]))

    if nom == "cercle-medaille":
        # anneau fin en rappel de la forme circulaire du logo
        c = fondu(a, d["fond"], 0.22)
        return (f'<circle cx="{W/2}" cy="470" r="330" fill="none" stroke="{c}" '
                f'stroke-width="5"/>'
                f'<circle cx="{W/2}" cy="470" r="352" fill="none" '
                f'stroke="{fondu(a, d["fond"], 0.11)}" stroke-width="2.5"/>')

    if nom == "grappe":
        # grappe de raisin stylisee, construite par calcul : rangees decroissantes
        c = fondu(a, d["fond"], 0.16)
        grains, r, pas = [], 21, 46
        for i, n in enumerate((4, 3, 2, 1)):
            for j in range(n):
                grains.append((905 - (n - 1) * pas / 2 + j * pas, 300 + i * 40))
        feuille = ('M905 236c-34-26-78-20-96 10 26-6 52 0 68 14'
                   'c-30-2-56 10-64 34 34-14 66-8 92 12z')
        return ("".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{c}"/>'
                        for x, y in grains)
                + f'<path d="{feuille}" fill="{c}"/>')

    if nom == "bouteilles":
        # silhouettes de bouteilles alignees en pied de page
        c = fondu(a, d["fond"], 0.13)
        return "".join(
            f'<g transform="translate({120 + i * 118} 1355)">'
            f'<path d="M0 0h44v-96c0-16-6-24-13-32V-186h-18v58c-7 8-13 16-13 32z" '
            f'fill="{c}"/></g>' for i in range(7))

    if nom == "arceaux":
        # arcs concentriques en tete, echo du texte circulaire du logo
        c = fondu(a, d["fond"], 0.18)
        return "".join(
            f'<path d="M{W/2 - r} 300a{r} {r} 0 0 1 {2*r} 0" fill="none" '
            f'stroke="{c}" stroke-width="4"/>' for r in (300, 340, 380))

    if nom == "halo-bloc":
        # halo en marches successives : un flou serait un filtre, donc rasterise.
        # Quatre couronnes degressives donnent la meme lecture, en vectoriel pur.
        out = []
        for i, (m, t) in enumerate(((46, 0.05), (34, 0.08), (22, 0.12), (11, 0.18))):
            out.append(f'<rect x="{BLOC_X - m}" y="{d.get("bloc_y", BLOC_Y_DEFAUT) - m}" width="{BLOC_W + 2*m}" '
                       f'height="{BLOC_H + 2*m}" rx="{46 + m}" '
                       f'fill="{fondu(a, d["fond"], t)}"/>')
        return "".join(out)

    if nom == "ecran-smartphone":
        # le chevalet devient l'ecran d'un telephone : biseau, haut-parleur,
        # barre de retour. L'equivalent, pour un reparateur, de la pellicule
        # pour un photographe — le support raconte le metier.
        c = fondu(a, d["fond"], 0.42)
        return (f'<rect x="26" y="26" width="{W - 52}" height="{H - 52}" rx="86" '
                f'fill="none" stroke="{c}" stroke-width="6"/>'
                f'<rect x="{W/2 - 62}" y="52" width="124" height="11" rx="5.5" fill="{c}"/>'
                # remontee de 10 unites, soit 1 mm : a sa place d'origine elle
                # mordait sur la ligne « PROPULSE PAR TAPOTE.FR ».
                f'<rect x="{W/2 - 110}" y="{H - 84}" width="220" height="9" rx="4.5" '
                f'fill="{fondu(a, d["fond"], 0.55)}"/>')

    if nom == "barres-signal":
        c = fondu(a, d["fond"], 0.30)
        return "".join(
            f'<rect x="{W - 150 + i * 30}" y="{H - 150 - i * 26}" width="20" '
            f'height="{26 + i * 26}" rx="6" fill="{c}"/>' for i in range(4))

    if nom == "trame-pixels":
        c = fondu(a, d["fond"], 0.12)
        pas, t = 34, 12
        return "".join(
            f'<rect x="{x}" y="{yy}" width="{t}" height="{t}" rx="2.5" fill="{c}"/>'
            for yy in range(60, H - 60, pas) for x in (24, W - 36))

    if nom == "contact" and d.get("contact"):
        # la ligne contact suit le metier, qui peut occuper deux niveaux
        n = len(repartir(d.get("metier") or "", F_BOLD, 25, 5)) if d.get("metier") else 0
        base = y.get("contact", yb + ecart + 42 + max(0, n - 1) * 34)
        t, ls = ajuster(d["contact"], F_BOLD, 22, 3)
        return texte_centre(W / 2, base, d["contact"], F_BOLD, t,
                            fondu(a, d["fond"], 0.7), ls)

    if nom == "arcs-nfc":
        # ondes concentriques : la signature du geste Tapote, en abstraction
        c = fondu(a, d["fond"], 0.17)
        return "".join(
            f'<circle cx="{W + 60}" cy="{H - 40}" r="{r}" fill="none" '
            f'stroke="{c}" stroke-width="8"/>' for r in (250, 350, 450, 550, 650))

    if nom == "panneau-bloc":
        # panneau en retrait derriere le bloc : effet de carte posee sur carte
        m = 26
        return (f'<rect x="{BLOC_X - m}" y="{d.get("bloc_y", BLOC_Y_DEFAUT) - m}" width="{BLOC_W + 2*m}" '
                f'height="{BLOC_H + 2*m}" rx="66" fill="{fondu(a, d["fond"], 0.10)}"/>')

    if nom == "bande-laterale":
        return (f'<rect x="0" y="0" width="18" height="{H}" fill="{a}"/>'
                f'<rect x="{W - 18}" y="0" width="18" height="{H}" fill="{a}"/>')

    if nom == "angle-coupe":
        c = fondu(a, d["fond"], 0.20)
        return (f'<path d="M{W} 0v420L{W - 300} 0Z" fill="{c}"/>'
                f'<path d="M0 {H}v-260l190 260Z" fill="{fondu(a, d["fond"], 0.12)}"/>')

    if nom == "filets-tete-pied":
        c = fondu(a, d["fond"], 0.55)
        return (f'<rect x="0" y="64" width="{W}" height="5" fill="{c}"/>'
                f'<rect x="0" y="{H - 69}" width="{W}" height="5" fill="{c}"/>')

    if nom == "trame-points":
        c = fondu(a, d["fond"], 0.13)
        pas, r = 30, 3.2
        pts = "".join(f'<circle cx="{x}" cy="{yy}" r="{r}" fill="{c}"/>'
                      for yy in range(int(yb) + 120, 790, pas)
                      for x in range(30, W, pas)
                      if (x < 250 or x > W - 250))
        return pts

    if nom == "coins-photo":
        # cornieres de photo aux angles du bloc : clin d'oeil au metier
        c, t = fondu(a, d["fond"], 0.85), 78
        yb_ = d.get("bloc_y", BLOC_Y_DEFAUT)
        x0, y0, x1, y1 = BLOC_X - 14, yb_ - 14, BLOC_X + BLOC_W + 14, yb_ + BLOC_H + 14
        return "".join(
            f'<path d="M{px} {py}l{sx*t} 0l0 {sy*18}l{-sx*(t-18)} 0l0 {sy*(t-18)}l{-sx*18} 0Z" '
            f'fill="{c}"/>'
            for px, py, sx, sy in ((x0, y0, 1, 1), (x1, y0, -1, 1),
                                   (x1, y1, -1, -1), (x0, y1, 1, -1)))

    if nom == "pellicule":
        # perforations de film le long des deux bords : signature photo
        c = fondu(a, d["fond"], 0.35)
        return "".join(
            f'<rect x="{x}" y="{yy}" width="26" height="34" rx="7" fill="{c}"/>'
            for yy in range(70, H - 90, 62) for x in (16, W - 42))

    if nom == "barre-led":
        # rappel des bandeaux lumineux de la boutique
        return (f'<rect x="{W/2 - 190}" y="{yb + 46}" width="380" height="12" rx="6" '
                f'fill="{a}"/>'
                f'<rect x="{W/2 - 300}" y="{yb + 50}" width="600" height="4" rx="2" '
                f'fill="{fondu(a, d["fond"], 0.35)}"/>')

    if nom in PLACEMENTS_FOND_LOGO and d.get("logo"):
        cx, cy, larg, rot, intens = PLACEMENTS_FOND_LOGO[nom]
        return logo_fichier(cx, cy, larg, d["logo"][0],
                            fondu(a, d["fond"], intens), rot)

    if nom in PLACEMENTS_EMBLEME and d.get("embleme"):
        cx, cy, larg, rot, intens = PLACEMENTS_EMBLEME[nom]
        teinte = fondu(a, d["fond"], intens)
        if cx is None:
            return "".join(logo_fichier(x, cy, larg, d["embleme"], teinte, r)
                           for x, r in ((190, -rot), (W - 190, rot)))
        return logo_fichier(cx, cy, larg, d["embleme"], teinte, rot)

    if nom in PLACEMENTS_PICTO and d.get("picto_metier"):
        cx, cy, taille, rot, intens, plein = PLACEMENTS_PICTO[nom]
        motif = d["picto_metier"] + ("-plein" if plein else "")
        couleur = fondu(a, d["fond"], intens)
        dessin = PICTOS[motif]
        if cx is None:      # duo symetrique de part et d'autre de l'enseigne
            return "".join(f'<g transform="translate({x} {cy})">'
                           f'{dessin(0, 0, taille, couleur)}</g>' for x in (128, W - 128))
        return (f'<g transform="translate({cx} {cy}) rotate({rot})">'
                f'{dessin(0, 0, taille, couleur)}</g>')
    if nom == "filet":
        return (f'<rect x="{W/2 - 150}" y="{yb + 44}" width="300" height="7" '
                f'rx="3.5" fill="{a}"/>')
    if nom == "bandeau":
        # bande de tete teintee : l'enseigne s'y pose, le reste respire
        return f'<rect width="{W}" height="{yb + 82}" fill="{fondu(a, d["fond"], 0.16)}"/>'
    if nom == "cadre":
        return (f'<rect x="34" y="34" width="{W - 68}" height="{H - 68}" rx="34" '
                f'fill="none" stroke="{a}" stroke-width="5"/>')
    if nom == "coins":
        c, e = 96, 6      # longueur des equerres, epaisseur
        m = 44
        d_ = (f"M{m} {m + c}V{m}h{c}M{W - m - c} {m}h{c}v{c}"
              f"M{W - m} {H - m - c}v{c}h-{c}M{m + c} {H - m}h-{c}v-{c}")
        return f'<path d="{d_}" fill="none" stroke="{a}" stroke-width="{e}" stroke-linecap="round"/>'
    if nom == "metier" and d.get("metier"):
        base = y.get("metier", yb + ecart)
        lignes = repartir(d["metier"], F_BOLD, 25, 5)
        return "".join(
            texte_centre(W / 2, base + i * 34, ligne, F_BOLD, 25,
                         fondu(a, d["fond"], 0.85), 5)
            for i, ligne in enumerate(lignes))
    if nom == "liseré-bloc":
        # liseré de rappel autour du bloc d'action, a la couleur de l'enseigne
        return (f'<rect x="{BLOC_X - 9}" y="{d.get("bloc_y", BLOC_Y_DEFAUT) - 9}" width="{BLOC_W + 18}" '
                f'height="{BLOC_H + 18}" rx="55" fill="none" stroke="{a}" stroke-width="4"/>')
    if nom == "pied-teinte":
        # aplat de pied de page : ancre le chevalet et rappelle la couleur
        return (f'<rect x="0" y="{H - 118}" width="{W}" height="118" '
                f'fill="{fondu(a, d["fond"], 0.14)}"/>')
    if nom == "double-filet":
        return "".join(
            f'<rect x="{W/2 - l/2}" y="{yb + 44 + i * 16}" width="{l}" height="{e}" '
            f'rx="{e/2}" fill="{fondu(a, d["fond"], o)}"/>'
            for i, (l, e, o) in enumerate(((320, 7, 1.0), (180, 5, 0.5))))
    if nom == "chevron":
        # deux chevrons discrets de part et d'autre de l'enseigne
        b, w = yb - 18, 46
        return "".join(
            f'<path d="M{x} {b - w/2}l{s_ * w/2} {w/2}l{-s_ * w/2} {w/2}" fill="none" '
            f'stroke="{fondu(a, d["fond"], 0.7)}" stroke-width="6" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
            for x, s_ in ((92, 1), (W - 92, -1)))
    if nom == "soulignement":
        # trait large sous l'enseigne, de la largeur du bloc d'action
        return (f'<rect x="{BLOC_X}" y="{yb + 50}" width="{BLOC_W}" height="4" '
                f'fill="{fondu(a, d["fond"], 0.45)}"/>')
    return ""


def filigrane(d):
    """Silhouette du metier, en angle de page, a peine detachee du fond.

    Sa couleur est un fondu de l'encre sur le fond, pas une opacite : une opacite
    ferait creer a Chrome un groupe de transparence dans le PDF. Le motif deborde
    volontairement du format, il se lit comme une texture et non comme un objet
    pose. L'intensite reste basse pour ne jamais concurrencer l'accroche.
    """
    f = d["filigrane"]
    if not f:
        return ""
    couleur = fondu(d["encre"], d["fond"], f.get("intensite", 0.11))
    motif = PICTOS[f["picto"]](0, 0, f["taille"], couleur)
    return (f'<g transform="translate({f["cx"]} {f["cy"]}) '
            f'rotate({f.get("rotation", 0)})">{motif}</g>')


def enseigne_relief(cx, y, e, sfx=""):
    """Enseigne du commerce, lettres en relief comme sur la plaque physique.

    L'effet vient d'une duplication decalee en teinte assombrie, pas d'une ombre
    portee : un filtre SVG serait rasterise a l'export et ferait echouer l'audit
    vectoriel. Ici le relief reste deux chemins pleins, imprimables tels quels.
    """
    dx, dy = e.get("relief", (5, 6))
    brut = e["texte"]
    ombre = (e.get("relief_couleur") or assombri(e["couleur"]) if isinstance(brut, str)
             else [(t, assombri(c or e["couleur"])) for t, c in brut])
    # un degrade unique ne convient pas a une enseigne bicolore : chaque fragment
    # porte alors sa propre couleur pleine.
    bicolore = not isinstance(e["texte"], str)
    face = (e["couleur"] if bicolore or not e.get("degrade", True)
            else f"url(#faceEnseigne{sfx})")
    texte_ombre = brut if isinstance(ombre, str) else ombre
    return (texte_centre(cx + dx, y + dy, texte_ombre, e["fonte"], e["taille"],
                         ombre if isinstance(ombre, str) else assombri(e["couleur"]),
                         e["interlettre"])
            + texte_centre(cx, y, brut, e["fonte"], e["taille"], face, e["interlettre"]))


# Sans picto, l'enseigne occupe moins de hauteur que le bloc picto + nom : on
# remonte tout le groupe central pour supprimer le vide, sans toucher au bloc
# d'action ni au pied de page, qui restent a leur place sur toutes les editions.
MARGE_HAUTE = 50        # marge au-dessus du logo client
REMONTEE_ENSEIGNE = 62
# Sans le sous-titre, l'espace libere est repris par le groupe central, qui
# redescend d'autant : la page respire au lieu de laisser un trou au-dessus du bloc.
DESCENTE_SANS_SOUS_TITRE = 78


def build(variante="B-google-apres-accroche", d=DA_TAPOTE):
    """Compose une edition : une DA (couleurs + enseigne ou picto) x une variante."""
    # Suffixe unique : deux editions affichees dans la meme page HTML ne doivent
    # pas se partager leurs degrades ni leur detourage.
    sfx = "-" + d["cle"] + ("-" + d["ornement"] if d.get("ornement") else "")
    y = dict(LAYOUTS[variante])
    if d["enseigne"] or d["logo_tapote"] or d.get("logo"):
        for k in ("google_cy", "titre1", "titre2", "etoiles_cy", "sous_titre"):
            y[k] -= REMONTEE_ENSEIGNE
    if not d["sous_titre"]:
        for k in ("google_cy", "titre1", "titre2", "etoiles_cy"):
            y[k] += DESCENTE_SANS_SOUS_TITRE

    by = d.get("bloc_y", BLOC_Y_DEFAUT)
    if d.get("logo"):
        # Un lockup circulaire fait cinq fois la hauteur d'un mot : des decalages
        # fixes le font deborder par le haut et percuter les lignes suivantes.
        # On deroule donc la colonne a partir de la hauteur reelle du logo.
        _, hl = dimensions_logo(d["logo"][0], d["logo"][1])
        y["logo_cy"] = MARGE_HAUTE + hl / 2
        curseur = MARGE_HAUTE + hl
        nb_metier = len(repartir(d["metier"], F_BOLD, 25, 5)) if d.get("metier") else 0
        if nb_metier and not d.get("metier_bas"):
            curseur += 46
            y["metier"] = curseur
            curseur += 34 * nb_metier
        if d.get("contact"):
            curseur += 40
            y["contact"] = curseur
        tt = d.get("titre_taille", 82)
        y["google_cy"] = curseur + 82
        y["titre1"] = y["google_cy"] + 30 + tt
        y["titre2"] = y["titre1"] + tt + 16
        y["etoiles_cy"] = y["titre2"] + 84
        if nb_metier and d.get("metier_bas"):
            # la mention de metier prend la place de l'ancien sous-titre
            y["metier"] = y["etoiles_cy"] + 78
    defs = (
        '<defs>'
        f'<clipPath id="blocClip{sfx}"><rect x="{BLOC_X}" y="{by}" width="{BLOC_W}" '
        f'height="{BLOC_H}" rx="46"/></clipPath>'
        f'<linearGradient id="blocAccent{sfx}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{d["bloc_clair"]}"/>'
        f'<stop offset="1" stop-color="{d["bloc"]}"/>'
        '</linearGradient>'
        + (degrade_enseigne(d["enseigne"], sfx) if d["enseigne"] else '')
        + ornement_defs(d, d.get("ornement", ""), sfx)
        + '</defs>')

    c = f'<rect width="{W}" height="{H}" fill="{d["fond"]}"/>'
    c += filigrane(d)          # tout au fond : rien ne doit passer devant lui
    c += ornement(d, y, d.get("ornement", ""), sfx)
    by = d.get("bloc_y", BLOC_Y_DEFAUT)
    if d.get("logo"):
        c += logo_fichier(W / 2, y["logo_cy"], d["logo"][1], d["logo"][0])
    elif d["logo_tapote"]:
        c += logo_tapote(W / 2, y["enseigne"] - 96, 420, d["encre"])
    elif d["enseigne"]:
        c += enseigne_relief(W / 2, y["enseigne"], d["enseigne"], sfx)
    else:
        c += PICTOS[d["picto"]](W / 2, y["picto_cy"], LOGO_SLOT, d["encre"])
        c += texte_centre(W / 2, y["nom"], d["nom"], F_BOLD, 33, d["encre"], 13)
    if variante.startswith("A"):
        c += _google_logo(y["google_cy"])
    tt = d.get("titre_taille", 82)
    c += texte_centre(W / 2, y["titre1"], "Votre avis compte,", F_BLACK, tt, d["encre"], -2)
    c += texte_centre(W / 2, y["titre2"], "tapotez.", F_BLACK, tt, d["encre"], -2)
    if variante.startswith("B"):
        c += _google_logo(y["google_cy"])
    c += stars_row(W / 2, y["etoiles_cy"], 30, 68, d["etoiles"])
    if d["sous_titre"]:
        c += texte_centre(W / 2, y["sous_titre"], "Laissez un avis en 30 secondes",
                          F_REG, 32, d["gris"])
    c += action_block(BLOC_X, by, d, sfx)
    c += bell_mark(303, 1421, 34, d["encre"], d["bloc"])
    c += texte_centre(551, 1430, "PROPULSÉ PAR TAPOTE.FR", F_BOLD, 21,
                      d["encre_faible"], 6)

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="105mm" height="148mm" '
            f'viewBox="0 0 {W} {H}">{defs}{c}</svg>')


FACE_CSS = """@font-face{font-family:"Archivo Black";src:url("../fonts/ArchivoBlack-Regular.ttf") format("truetype");font-weight:400;font-style:normal}
@font-face{font-family:"Archivo";src:url("../fonts/Archivo-Variable.ttf") format("truetype");font-weight:100 900;font-style:normal}
@font-face{font-family:"Nunito";src:url("../fonts/Nunito-Variable.ttf") format("truetype");font-weight:200 1000;font-style:normal}"""


def face_css_embedded():
    """Meme @font-face, mais polices en base64 : le SVG devient autonome.

    Utile pour l'imprimeur et pour toute visionneuse qui ne resout pas les
    chemins relatifs. Cout : environ 1 Mo de fichier."""
    import base64
    faces = []
    for family, fname, weight in (
            ("Archivo Black", "ArchivoBlack-Regular.ttf", "400"),
            ("Archivo", "Archivo-Variable.ttf", "100 900"),
            ("Nunito", "Nunito-Variable.ttf", "200 1000")):
        with open(os.path.join(ROOT, "fonts", fname), "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode("ascii")
        faces.append(f'@font-face{{font-family:"{family}";'
                     f'src:url(data:font/ttf;base64,{b64}) format("truetype");'
                     f'font-weight:{weight};font-style:normal}}')
    return "".join(faces)


ENTETE = '<?xml version="1.0" encoding="UTF-8"?>' + chr(10)


def _ecrire(chemin, contenu):
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    return os.path.getsize(chemin)


# Editions a produire : une DA x une variante. Les deux editions Tapote servent
# de reference et attendent l'arbitrage entre A et B ; les deux suivantes sont des
# propositions personnalisees pour des prospects.
EDITIONS = ([(d, v) for d in (DA_TAPOTE, DA_TAPOTE_BLANC) for v in LAYOUTS]
            # editions client : variante A validee, Google juste apres l'enseigne
            + [(DA_ACCESS_PHONE, "A-google-avant-accroche"),
               (DA_PHOTOCONCEPT, "A-google-avant-accroche"),
               (DA_BULLE_DE_JEUX, "A-google-avant-accroche"),
               (DA_BACCHUS, "A-google-avant-accroche")])


def exporter_logos(vectorise):
    """Enregistre chaque enseigne comme logo vectoriel autonome, hors chevalet.

    Meme trace que sur le chevalet, relief compris. Sert aux devis, aux mails de
    prospection et a tout support ou l'enseigne doit apparaitre seule.
    """
    dossier = os.path.join(ROOT, "logos")
    os.makedirs(dossier, exist_ok=True)
    produits = []
    for d in (DA_ACCESS_PHONE, DA_PHOTOCONCEPT, DA_BULLE_DE_JEUX):
        e = d["enseigne"]
        if not e:      # enseigne fournie en fichier : rien a recomposer ici
            continue
        marge, hauteur = 40, e["taille"] * 1.9
        # largeur genereuse puis recadrage sur l'encre reelle par le viewBox
        largeur = e["taille"] * len(e["texte"]) * 0.78 + 2 * marge
        corps = enseigne_relief(largeur / 2, hauteur * 0.72, e, "-" + d["cle"])
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur:.0f} '
               f'{hauteur:.0f}"><defs>{degrade_enseigne(e, "-" + d["cle"])}</defs>'
               f'{corps}</svg>')
        chemin = os.path.join(dossier, f"enseigne-{d['cle']}.svg")
        _ecrire(chemin, ENTETE + vectorise(svg))
        produits.append(chemin)
    return produits


def main():
    import vectorize_text

    for d, variante in EDITIONS:
        svg = build(variante, d)
        name = f"chevalet-avis-google-{d['cle']}-{variante}-105x148"
        entete = '<?xml version="1.0" encoding="UTF-8"?>\n'

        # 1. source editable : textes vivants, polices referencees
        p_src = os.path.join(ROOT, "svg", f"{name}.svg")
        _ecrire(p_src, entete + svg.replace("<defs>", f"<defs><style>{FACE_CSS}</style>", 1))

        # 2. autonome : textes vivants, polices embarquees en base64
        p_auto = os.path.join(ROOT, "svg", f"{name}-autonome.svg")
        _ecrire(p_auto, entete
                + svg.replace("<defs>", f"<defs><style>{face_css_embedded()}</style>", 1))

        # 3. courbes : plus aucun texte, rien a substituer — fichier imprimeur
        courbes = vectorize_text.vectoriser(svg)
        p_courbes = os.path.join(ROOT, "svg", f"{name}-courbes.svg")
        taille = _ecrire(p_courbes, entete + courbes)

        # 4. sources d'impression navigateur. Deux versions, et ce n'est pas
        # cosmetique : imprimer la version texte donne un PDF ou Chrome embarque
        # Archivo Black correctement mais convertit la variable Archivo en
        # polices Type3, forme non standard que les flux prepresse signalent.
        # La version courbes donne un PDF sans aucune police. C'est celle-la
        # qu'il faut envoyer a l'imprimeur.
        # Fond de page a la couleur du design, et non blanc : 105 mm valent
        # 297,64 points PostScript, or Chrome arrondit la taille de page au point
        # entier (298 x 420 pt = 105,16 x 148,17 mm). Il reste donc un liseré de
        # 0,16 mm en bord droit et bas. Blanc, il ferait un cheveu clair sur ce
        # fond sombre livré au format exact ; a la couleur du design, il disparait.
        gabarit = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
                   '<title>Tapote — chevalet avis Google {n} {v}{s}</title><style>{css}'
                   '@page{{size:105mm 148mm;margin:0}}'
                   f'html,body{{{{margin:0;padding:0;background:{d["fond"]}}}}}'
                   'svg{{display:block;width:105mm;height:148mm}}'
                   '</style></head><body>{corps}</body></html>')

        p_html = os.path.join(ROOT, "html", f"{name}.html")
        _ecrire(p_html, gabarit.format(n=d["cle"], v=variante, s="", css=FACE_CSS, corps=svg))

        p_html_c = os.path.join(ROOT, "html", f"{name}-courbes.html")
        _ecrire(p_html_c, gabarit.format(n=d["cle"], v=variante, s=" (courbes)", css="",
                                         corps=courbes.split("?>", 1)[-1]))

        restants = vectorize_text.compter_textes(courbes)
        etat = "aucun texte restant" if restants == 0 else f"ATTENTION {restants} <text> restants"
        print(f"{d['cle']} / {variante}")
        print(f"  source   : {os.path.basename(p_src)}")
        print(f"  autonome : {os.path.basename(p_auto)}")
        print(f"  courbes  : {os.path.basename(p_courbes)}  ({taille//1024} Ko, {etat})")
        print(f"  html     : {os.path.basename(p_html)}")
        print(f"  html PDF : {os.path.basename(p_html_c)}  <- a imprimer pour l'imprimeur")

    for chemin in exporter_logos(vectorize_text.vectoriser):
        print(f"logo autonome : logos/{os.path.basename(chemin)}")

    print(f"\nBloc action : {BLOC_W/10:.1f} x {BLOC_H/10:.1f} mm à x={BLOC_X/10:.2f} mm")


if __name__ == "__main__":
    main()
