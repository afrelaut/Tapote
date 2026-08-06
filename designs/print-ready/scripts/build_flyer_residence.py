#!/usr/bin/env python3
"""Tapote — flyer boites aux lettres, Residence du Golf (105 x 148 mm).

Parti pris : ce n'est pas un prospectus, c'est un echantillon. Un sticker NFC
est colle sur le disque blanc du recto, donc le voisin qui pose son telephone
dessus a vecu le produit avant d'avoir lu la moindre explication. C'est aussi
ce qui rend le papier defendable pour une marque qui existe pour supprimer les
cartes de visite : le verso l'assume au lieu de l'eviter.

Quatre invariants :
- 1 unite SVG = 0,1 mm, comme tout le lot print. Canevas 1110 x 1540 = format
  livre, fond perdu de 3 mm compris ; la coupe tombe a 30 unites de chaque bord.
- Le disque blanc du recto fait 36 mm pour un sticker de 30 mm : 1,5 mm de
  tolerance de pose tout autour, invisible puisque sticker et disque sont blancs.
- Le fond reste le papier nu. Sur un recycle, une reserve blanche ne coute pas
  d'encre et laisse voir la matiere ; le seul aplat du recto est le bloc d'action.
- Aucune opacite : elle creerait un groupe de transparence dans le PDF, que les
  flux prepresse signalent. Les demi-teintes sont des couleurs pleines.

    python build_flyer_residence.py

Typographie Archivo Black / Archivo, meme lot de polices que le chevalet.
"""
import os
import subprocess

import build_chevalet_v4 as C
import build_protos as bp
import vectorize_text

ROOT = C.ROOT

# ---------------------------------------------------------------- format
W, H = 1110, 1540          # 111 x 154 mm, fond perdu compris
FOND_PERDU = 30            # 3 mm par cote
CX = W / 2                 # 555 — la coupe est symetrique, le centre aussi
COUPE_HAUT, COUPE_BAS = FOND_PERDU, H - FOND_PERDU
MARGE = 110                # 8 mm depuis la coupe : bord gauche du texte
UTILE = W - 2 * MARGE      # 890 unites = 89 mm, meme largeur utile que le chevalet

# Le disque et le sticker. Changer STICKER ici suffit : le disque suit.
STICKER = 300              # 30 mm — NTAG213/215 rond, reference la plus courante
DISQUE = STICKER + 60      # 36 mm — 3 mm de tolerance de pose au diametre

# QR et puce visent la meme page. Le parametre sert a distinguer les scans du
# flyer du reste du trafic ; il est inerte pour le routeur, qui lit le chemin.
URL = "https://tapote.fr/?r=voisins"

# ---------------------------------------------------------------- palette
INK = "#141414"
BLUE = "#2458FF"
BLUE_CLAIR = "#3B6BFF"
BLUE_ONDE = "#5E86FF"      # ondes sur l'aplat bleu : lisible sans etre criard
BLUE_PALE = "#EAF0FF"      # pastilles des pictos du verso
GRIS = "#6C6860"
GRIS_CLAIR = "#9A968E"
BEURRE = "#F7C85D"
PAPIER = "#FFFFFF"
FILET = "#E2DED6"
GUIDE = "#EDEDED"          # cercle de pose du sticker, couvert par le sticker
INK_TEXTE = "#CFCBC3"      # texte courant sur le bloc encre

F_BLACK = C.F_BLACK
F_BOLD = C.F_BOLD
F_REG = C.F_REG


# ---------------------------------------------------------------- texte
def texte(x, y, contenu, fonte, taille, fill, interlettre=0, ancre="start"):
    """Un <text> place. `ancre=middle` compense la gouttiere d'interlettrage.

    CSS ajoute la gouttiere apres la derniere lettre et centre cette chasse-la ;
    sans correction l'encre visible part d'un demi-interlettrage vers la gauche.
    Voir texte_centre() dans build_chevalet_v4 pour le detail.
    """
    if ancre == "middle":
        x += interlettre / 2
    a = (f'x="{x:g}" y="{y:g}" text-anchor="{ancre}" fill="{fill}" '
         f'{fonte} font-size="{taille:g}"')
    if interlettre:
        a += f' letter-spacing="{interlettre:g}"'
    return f'<text {a}>{contenu}</text>'


def envelopper(contenu, fonte, taille, maxi, interlettre=0):
    """Coupe un paragraphe en lignes mesurees sur la police, pas estimees.

    Les copies de ce flyer ont ete reecrites plusieurs fois ; compter les
    caracteres a la main aurait fait deborder une ligne a chaque retouche.
    """
    lignes, courante = [], ""
    for mot in contenu.split():
        essai = f"{courante} {mot}".strip()
        if courante and C._largeur(essai, fonte, taille, interlettre) > maxi:
            lignes.append(courante)
            courante = mot
        else:
            courante = essai
    if courante:
        lignes.append(courante)
    return lignes


def paragraphe(x, y, contenu, fonte, taille, fill, maxi, interligne, ancre="start"):
    """Paragraphe enveloppe, premiere ligne sur la baseline `y`."""
    return "".join(
        texte(x, y + i * interligne, ligne, fonte, taille, fill, ancre=ancre)
        for i, ligne in enumerate(envelopper(contenu, fonte, taille, maxi)))


def ajuster_titre(lignes, taille, interlettre, maxi=UTILE):
    """Reduit le corps du titre jusqu'a ce que sa ligne la plus large tienne."""
    t, ls = taille, interlettre
    while t > 30 and max(C._largeur(l, F_BLACK, t, ls) for l in lignes) > maxi:
        t -= 1
        ls = interlettre * t / taille
    return t, ls


# ---------------------------------------------------------------- pictos
def picto(cx, cy, taille, corps, couleur=BLUE, epaisseur=1.9):
    """Picto trace dans une boite 24 x 24, ancre par son centre."""
    s = taille / 24.0
    return (f'<g transform="translate({cx - 12*s:.2f} {cy - 12*s:.2f}) scale({s:.4f})" '
            f'fill="none" stroke="{couleur}" stroke-width="{epaisseur}" '
            f'stroke-linecap="round" stroke-linejoin="round">{corps}</g>')


P_CALENDRIER = '<rect x="3" y="5" width="18" height="16" rx="2.4"/><path d="M3 10h18M8 3v4M16 3v4"/>'
P_CONTACT = '<path d="M20.5 21a8.5 8.5 0 0 0-17 0"/><circle cx="12" cy="7.6" r="4.3"/>'


def pastille(cx, cy, corps, couleur=BLUE):
    """Picto pose sur un rond bleu pale : sert de puce de liste au verso."""
    return (f'<circle cx="{cx:g}" cy="{cy:g}" r="46" fill="{BLUE_PALE}"/>'
            + picto(cx, cy, 46, corps, couleur))


# ---------------------------------------------------------------- recto
def zone_nfc(cy):
    """Cible de pose : ondes concentriques, disque blanc, cercle de reperage.

    Le cercle de reperage est trace au diametre exact du sticker et dans un gris
    tres clair : il donne un centrage precis a la pose et disparait dessous. S'il
    reste une ombre de trait sur un exemplaire, elle est moins genante qu'un
    sticker pose de travers sur cent flyers.
    """
    ondes = "".join(
        f'<circle cx="{CX:g}" cy="{cy:g}" r="{r}" fill="none" '
        f'stroke="{BLUE_ONDE}" stroke-width="4"/>'
        for r in (DISQUE / 2 + 52, DISQUE / 2 + 104))
    return (ondes
            + f'<circle cx="{CX:g}" cy="{cy:g}" r="{DISQUE/2:g}" fill="{PAPIER}"/>'
            + f'<circle cx="{CX:g}" cy="{cy:g}" r="{STICKER/2:g}" fill="none" '
              f'stroke="{GUIDE}" stroke-width="3"/>')


def recto():
    y_bloc, h_bloc = 596, 626
    cy_cible = y_bloc + h_bloc / 2
    titre, ls = ajuster_titre(["Posez votre téléphone", "sur ce papier."], 68, -2)

    defs = ('<defs><linearGradient id="aplat" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{BLUE_CLAIR}"/>'
            f'<stop offset="1" stop-color="{BLUE}"/></linearGradient></defs>')

    entete = (
        C.logo_tapote(CX, 118, 250, INK)
        + texte(CX, 268, "VOTRE VOISIN · RÉSIDENCE DU GOLF", F_BOLD, 24, GRIS,
                interlettre=7, ancre="middle"))

    accroche = (
        texte(CX, 400, "Posez votre téléphone", F_BLACK, titre, INK, ls, "middle")
        + texte(CX, 400 + titre * 1.26, "sur ce papier.", F_BLACK, titre, INK, ls, "middle")
        + texte(CX, 546, "Oui, vraiment. Il contient une puce.", F_REG, 32, GRIS,
                ancre="middle"))

    bloc = (
        f'<rect x="{MARGE + 15}" y="{y_bloc}" width="{UTILE - 30}" height="{h_bloc}" '
        f'rx="52" fill="url(#aplat)"/>'
        + texte(CX, y_bloc + 92, "POSEZ VOTRE TÉLÉPHONE ICI", F_BOLD, 34, PAPIER,
                interlettre=4, ancre="middle")
        + zone_nfc(cy_cible + 14)
        + texte(CX, y_bloc + h_bloc - 56, "Sans application. Rien à installer.",
                F_REG, 28, "#D8E2FF", ancre="middle"))

    y_pied = 1300
    pied = (
        f'<path d="M{MARGE} {y_pied - 62}h{UTILE}" stroke="{FILET}" stroke-width="2"/>'
        + C.qr_code(MARGE + 82, y_pied + 78, 156, URL)
        + texte(MARGE + 196, y_pied + 52, "Pas de NFC ?", F_BOLD, 30, INK)
        + texte(MARGE + 196, y_pied + 96, "Scannez, même page.", F_REG, 27, GRIS)
        + texte(W - MARGE, y_pied + 40, "Pourquoi du papier, pour un produit",
                F_REG, 26, GRIS, ancre="end")
        + texte(W - MARGE, y_pied + 78, "qui sert à ne plus en distribuer ?",
                F_REG, 26, GRIS, ancre="end")
        + texte(W - MARGE, y_pied + 128, "La réponse est au dos.", F_BOLD, 28, BLUE,
                ancre="end"))

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W/10:g}mm" '
            f'height="{H/10:g}mm" viewBox="0 0 {W} {H}">{defs}'
            f'<rect width="{W}" height="{H}" fill="{PAPIER}"/>'
            f'{entete}{accroche}{bloc}{pied}</svg>')


# ---------------------------------------------------------------- verso
PROMESSES = (
    ("etoile", "Un avis Google", "au moment où le client paie"),
    (P_CALENDRIER, "Une réservation", "dès l’entrée, sans passer un appel"),
    (P_CONTACT, "Votre contact enregistré", "à la fin d’un rendez-vous"),
)

POURQUOI = (
    "Tapote existe pour arrêter de distribuer des cartes qu’on jette. "
    "Ce flyer est donc tiré en toute petite série, sur papier recyclé, "
    "et il porte une vraie puce. Ce n’est pas un prospectus : c’est un échantillon."
)


def verso():
    entete = (
        texte(CX, 152, "CE QUE FAIT TAPOTE", F_BOLD, 24, GRIS_CLAIR,
              interlettre=8, ancre="middle")
        + texte(CX, 258, "Un geste suffit.", F_BLACK, 76, INK, -2, "middle")
        + paragraphe(CX, 322,
                     "Votre client pose son téléphone sur votre support. "
                     "La page que vous avez choisie s’ouvre. C’est tout.",
                     F_REG, 29, GRIS, 780, 42, ancre="middle"))

    lignes = []
    for i, (forme, titre, detail) in enumerate(PROMESSES):
        cy = 480 + i * 132
        marque = (f'<path d="{bp.star_path(MARGE + 46, cy, 26)}" fill="{BEURRE}"/>'
                  if forme == "etoile" else picto(MARGE + 46, cy, 46, forme))
        lignes.append(f'<circle cx="{MARGE + 46}" cy="{cy:g}" r="46" fill="{BLUE_PALE}"/>'
                      + marque
                      + texte(MARGE + 122, cy - 6, titre, F_BOLD, 34, INK)
                      + texte(MARGE + 122, cy + 36, detail, F_REG, 26, GRIS))
    promesses = "".join(lignes)

    supports = texte(CX, 916,
                     "COMPTOIR À LA CAISSE · PLAQUE AU MUR · CARD DANS LA POCHE",
                     F_BOLD, 22, GRIS_CLAIR, interlettre=2, ancre="middle")

    y_bloc = 972
    corps = envelopper(POURQUOI, F_REG, 26, UTILE - 128)
    h_bloc = 118 + len(corps) * 40 + 44
    encart = (
        f'<rect x="{MARGE}" y="{y_bloc}" width="{UTILE}" height="{h_bloc:g}" '
        f'rx="44" fill="{INK}"/>'
        + texte(MARGE + 64, y_bloc + 82, "Pourquoi du papier ?", F_BLACK, 42, PAPIER, -1)
        + "".join(texte(MARGE + 64, y_bloc + 142 + i * 40, l, F_REG, 26, INK_TEXTE)
                  for i, l in enumerate(corps)))

    y_pied = y_bloc + h_bloc + 84
    pied = (
        texte(CX, y_pied, "Vous êtes commerçant, artisan ou indépendant ?",
              F_BOLD, 30, INK, ancre="middle")
        + texte(CX, y_pied + 46, "Écrivez-moi, je passe vous montrer en deux minutes.",
                F_REG, 27, GRIS, ancre="middle")
        + texte(CX, y_pied + 122, "AYMERIC · 06 63 15 04 49 · TAPOTE.FR",
                F_BOLD, 30, BLUE, interlettre=1, ancre="middle")
        + texte(CX, y_pied + 170, "Fondateur de Tapote, et votre voisin à la Résidence du Golf.",
                F_REG, 22, GRIS_CLAIR, ancre="middle"))

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W/10:g}mm" '
            f'height="{H/10:g}mm" viewBox="0 0 {W} {H}">'
            f'<rect width="{W}" height="{H}" fill="{PAPIER}"/>'
            f'{entete}{promesses}{supports}{encart}{pied}</svg>')


# ---------------------------------------------------------------- version ecran
# Le pendant numerique du flyer, pour le groupe WhatsApp ou Facebook de la
# residence. Deux differences assumees avec le papier : fond encre, parce qu'a
# l'ecran l'aplat ne coute rien et sort du flux, et surtout aucun QR — personne
# ne scanne un code affiche sur son propre telephone. C'est l'adresse ecrite en
# clair qui remplace le geste.
DW, DH = 1080, 1350


def digital():
    dcx = DW / 2
    corps = envelopper(
        "Vos clients posent leur téléphone sur votre support. "
        "Avis Google, réservation, contact : la bonne page s’ouvre. Sans application.",
        F_REG, 30, 800)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{DW}" height="{DH}" '
        f'viewBox="0 0 {DW} {DH}">'
        f'<rect width="{DW}" height="{DH}" fill="{INK}"/>'
        + C.logo_tapote(dcx, 96, 232, PAPIER)
        + texte(dcx, 232, "RÉSIDENCE DU GOLF · SAINT-GERMAIN-LÈS-CORBEIL",
                F_BOLD, 21, GRIS_CLAIR, interlettre=5, ancre="middle")
        + texte(dcx, 350, "Un geste suffit.", F_BLACK, 88, PAPIER, -2, "middle")
        + "".join(texte(dcx, 424 + i * 44, l, F_REG, 30, INK_TEXTE, ancre="middle")
                  for i, l in enumerate(corps))
        + f'<circle cx="{dcx}" cy="770" r="212" fill="none" stroke="#2C2C2C" stroke-width="6"/>'
        + f'<circle cx="{dcx}" cy="770" r="162" fill="{BLUE}"/>'
        + C.nfc_icon(dcx, 770, 150, PAPIER)
        + texte(dcx, 1042, "Sans application. Sans compte à créer.",
                F_REG, 27, GRIS_CLAIR, ancre="middle")
        + texte(dcx, 1146, "tapote.fr", F_BLACK, 78, PAPIER, -2, "middle")
        + texte(dcx, 1218, "Aymeric, votre voisin · 06 63 15 04 49",
                F_BOLD, 28, BLUE_ONDE, ancre="middle")
        + texte(dcx, 1282, "Commerçant, artisan ou indépendant dans la résidence ?",
                F_REG, 24, GRIS_CLAIR, ancre="middle")
        + texte(dcx, 1318, "Répondez-moi, je passe vous montrer en deux minutes.",
                F_REG, 24, GRIS_CLAIR, ancre="middle")
        + '</svg>')


# ---------------------------------------------------------------- sortie
ENTETE = '<?xml version="1.0" encoding="UTF-8"?>\n'

CHROME = next((c for c in (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium") if os.path.exists(c)), None)


def gabarit(titre, largeur_mm, hauteur_mm, css, corps, fond=PAPIER):
    return ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
            f'<title>{titre}</title><style>{css}'
            f'@page{{size:{largeur_mm:g}mm {hauteur_mm:g}mm;margin:0}}'
            f'html,body{{margin:0;padding:0;background:{fond}}}'
            f'svg{{display:block;width:{largeur_mm:g}mm;height:{hauteur_mm:g}mm}}'
            f'</style></head><body>{corps}</body></html>')


def rendre_pdf(html, pdf):
    """PDF via Chrome sans en-tete. Le HTML doit deja etre en courbes.

    Imprimer la version texte donnerait un PDF ou Chrome convertit l'Archivo
    variable en polices Type3, forme non standard que les flux prepresse
    signalent. La version courbes ne contient plus aucune police.
    """
    if not CHROME:
        return None
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf}", f"file:///{html.replace(os.sep, '/')}"],
                   check=True, capture_output=True, timeout=120)
    return pdf


def rendre_png(html, png, largeur_px, hauteur_px, echelle=3.125):
    """Apercu a 300 dpi : 96 dpi CSS x 3,125."""
    if not CHROME:
        return None
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                    f"--force-device-scale-factor={echelle}",
                    f"--window-size={largeur_px},{hauteur_px}",
                    f"--screenshot={png}", f"file:///{html.replace(os.sep, '/')}"],
                   check=True, capture_output=True, timeout=120)
    return png


def produire(nom, svg, largeur_mm, hauteur_mm, titre, fond=PAPIER):
    """Les cinq fichiers d'une face : source, autonome, courbes, HTML, PDF, PNG."""
    chemins = {}
    for dossier in ("svg", "html", "pdf", "previews"):
        os.makedirs(os.path.join(ROOT, dossier), exist_ok=True)

    src = svg
    style = f'<style>{C.FACE_CSS}</style>'
    # Le SVG du verso n'a pas de <defs> ; on injecte le style juste apres <svg ...>.
    coupe = src.index(">", src.index("<svg")) + 1
    avec_style = src[:coupe] + style + src[coupe:]

    chemins["source"] = os.path.join(ROOT, "svg", f"{nom}.svg")
    C._ecrire(chemins["source"], ENTETE + avec_style)

    autonome = src[:coupe] + f'<style>{C.face_css_embedded()}</style>' + src[coupe:]
    chemins["autonome"] = os.path.join(ROOT, "svg", f"{nom}-autonome.svg")
    C._ecrire(chemins["autonome"], ENTETE + autonome)

    courbes = vectorize_text.vectoriser(src)
    chemins["courbes"] = os.path.join(ROOT, "svg", f"{nom}-courbes.svg")
    C._ecrire(chemins["courbes"], ENTETE + courbes)

    chemins["html"] = os.path.join(ROOT, "html", f"{nom}.html")
    C._ecrire(chemins["html"], gabarit(titre, largeur_mm, hauteur_mm, C.FACE_CSS, src, fond))

    chemins["html_courbes"] = os.path.join(ROOT, "html", f"{nom}-courbes.html")
    C._ecrire(chemins["html_courbes"],
              gabarit(f"{titre} (courbes)", largeur_mm, hauteur_mm, "", courbes, fond))

    restants = vectorize_text.compter_textes(courbes)
    if restants:
        print(f"  ATTENTION {restants} <text> restants apres vectorisation")

    pdf = rendre_pdf(chemins["html_courbes"], os.path.join(ROOT, "pdf", f"{nom}-courbes.pdf"))
    png = rendre_png(chemins["html_courbes"],
                     os.path.join(ROOT, "previews", f"{nom}.png"),
                     round(largeur_mm * 96 / 25.4), round(hauteur_mm * 96 / 25.4))
    chemins["pdf"], chemins["png"] = pdf, png
    return chemins


def main():
    faces = (
        ("flyer-residence-golf-recto-fondperdu-111x154", recto(),
         "Tapote — flyer residence recto", PAPIER),
        ("flyer-residence-golf-verso-fondperdu-111x154", verso(),
         "Tapote — flyer residence verso", PAPIER),
    )
    for nom, svg, titre, fond in faces:
        print(nom)
        c = produire(nom, svg, W / 10, H / 10, titre, fond)
        for cle in ("source", "courbes", "html_courbes", "pdf", "png"):
            if c.get(cle):
                print(f"  {cle:13s} {os.path.relpath(c[cle], ROOT)}")

    # Version ecran : pas de PDF, c'est un visuel de message, pas un imprime.
    nom = "flyer-residence-golf-digital-1080x1350"
    svg = digital()
    coupe = svg.index(">", svg.index("<svg")) + 1
    C._ecrire(os.path.join(ROOT, "svg", f"{nom}.svg"),
              ENTETE + svg[:coupe] + f'<style>{C.face_css_embedded()}</style>' + svg[coupe:])
    courbes = vectorize_text.vectoriser(svg)
    html = os.path.join(ROOT, "html", f"{nom}.html")
    C._ecrire(html, '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
              '<title>Tapote — visuel voisins</title><style>'
              f'html,body{{margin:0;padding:0;background:{INK}}}'
              f'svg{{display:block;width:{DW}px;height:{DH}px}}'
              f'</style></head><body>{courbes}</body></html>')
    rendre_png(html, os.path.join(ROOT, "previews", f"{nom}.png"), DW, DH, echelle=1)
    print(f"{nom}\n  previews/{nom}.png")

    print(f"\nSticker {STICKER/10:g} mm dans un disque de {DISQUE/10:g} mm, "
          f"centre a {CX/10:g} x {(596 + 626/2 + 14)/10:g} mm depuis le bord du fichier.")
    print(f"Coupe a {FOND_PERDU/10:g} mm de chaque bord — format fini "
          f"{(W - 2*FOND_PERDU)/10:g} x {(H - 2*FOND_PERDU)/10:g} mm.")


if __name__ == "__main__":
    main()
