#!/usr/bin/env python3
"""Tapote — cartes de visite de prospection (89 x 58 mm, fini 85 x 54 mm).

Format et fond perdu repris de la specification carte du lot v3 : 89 x 58 mm
livres, coupe a 85 x 54 mm, coins R3, fond perdu de 2 mm sur chaque cote.

Parti pris : la carte est elle-meme une demonstration du produit. La moitie
droite reprend le bloc d'action du chevalet — le prospect pose son telephone,
la fiche contact s'enregistre, il vient de vivre Tapote sans explication.

    python build_carte_contact.py
"""
import os

import build_chevalet_v4 as C
import vectorize_text
import build_protos as bp

ROOT = C.ROOT

# ---------------------------------------------------------------- format
W, H = 890, 580            # 89 x 58 mm, fond perdu compris
FOND_PERDU = 20            # 2 mm par cote
COUPE_X, COUPE_Y = FOND_PERDU, FOND_PERDU          # bord de coupe
MARGE_SURE = 50            # 5 mm depuis la coupe : rien d'important au-dela
BLEU_X = 530               # debut de la zone NFC, qui deborde a droite

DARK = "#141414"
CREAM = "#F4EFE5"
GRIS = "#8E8B86"


def texte(x, y, contenu, fonte, taille, fill, interlettre=0, ancre="start"):
    a = (f'x="{x:g}" y="{y:g}" text-anchor="{ancre}" fill="{fill}" '
         f'{fonte} font-size="{taille:g}"')
    if interlettre:
        a += f' letter-spacing="{interlettre:g}"'
    return f'<text {a}>{contenu}</text>'


LARGEUR_NOM = 444    # de la marge sure au bord de la zone NFC, gouttiere deduite


def lignes_nom(nom, taille):
    """Prenom et patronyme sur deux lignes, systematiquement.

    Deux raisons de ne pas decider au cas par cas : un nom long rapetisse pour
    tenir sur une ligne se lit comme une erreur, et surtout deux cartes posees
    cote a cote doivent avoir la meme structure — sinon le decalage saute aux
    yeux avant le contenu.
    """
    if " " not in nom:
        return [nom]
    coupe = nom.rfind(" ")
    return [nom[:coupe], nom[coupe + 1:]]


def recto(nom, role, mail, tel):
    """Recto : identite a gauche, zone NFC a droite."""
    defs = ('<defs>'
            f'<clipPath id="zoneNfc"><rect x="{BLEU_X}" y="0" width="{W - BLEU_X}" '
            f'height="{H}"/></clipPath>'
            '<linearGradient id="bleuCarte" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{C.BLOC_CLAIR}"/>'
            f'<stop offset="1" stop-color="{C.BLOC}"/></linearGradient>'
            '</defs>')

    x = MARGE_SURE + 12
    s = f'<rect width="{W}" height="{H}" fill="{DARK}"/>'

    # Ondes emanant de la zone NFC vers la moitie sombre : elles relient les deux
    # faces de la carte et disent le geste, sans rien ecrire. Couleurs pleines
    # fondues, jamais d'opacite — un groupe de transparence dans le PDF est a
    # eviter, on l'a paye assez cher sur les chevalets.
    cx_nfc = BLEU_X + (W - BLEU_X - FOND_PERDU) / 2
    s += "".join(
        f'<circle cx="{cx_nfc}" cy="210" r="{r}" fill="none" '
        f'stroke="{C.fondu(C.BLOC, DARK, i)}" stroke-width="{e}"/>'
        for r, e, i in ((265, 6, 0.30), (340, 5, 0.19), (420, 4, 0.11)))

    # zone NFC : debordante a droite, elle sera coupee au format fini
    s += (f'<g clip-path="url(#zoneNfc)"><rect x="{BLEU_X}" y="0" '
          f'width="{W - BLEU_X}" height="{H}" fill="url(#bleuCarte)"/></g>')

    # ---- identite
    s += bp.logo(x, 52, 240, CREAM)
    # Ordonnees fixes : la colonne de gauche est identique d'une carte a l'autre,
    # quel que soit le nom. C'est ce qui fait que deux cartes posees ensemble se
    # lisent comme une paire et non comme deux essais.
    for i, ligne in enumerate(lignes_nom(nom, 52)):
        s += texte(x, 232 + i * 54, ligne, C.F_BLACK, 52, CREAM, -1)
    s += texte(x, 332, role, C.F_BOLD, 23, GRIS, 3)
    s += f'<rect x="{x}" y="{368}" width="86" height="6" rx="3" fill="{C.BLOC}"/>'
    s += texte(x, 442, mail, C.F_BOLD, 27, CREAM)
    s += texte(x, 492, tel, C.F_BOLD, 27, CREAM)

    # ---- demonstration du produit
    cx = cx_nfc
    s += C.nfc_icon(cx, 210, 130, C.BLOC_ENCRE)
    s += texte(cx, 330, "POSEZ VOTRE", C.F_BLACK, 27, C.BLOC_ENCRE, 0, "middle")
    s += texte(cx, 364, "TÉLÉPHONE ICI", C.F_BLACK, 27, C.BLOC_ENCRE, 0, "middle")
    s += texte(cx, 414, "et gardez mon contact", C.F_BOLD, 23,
               C.fondu(C.BLOC_ENCRE, C.BLOC, 0.86), 0, "middle")

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W/10:g}mm" '
            f'height="{H/10:g}mm" viewBox="0 0 {W} {H}">{defs}{s}</svg>')


def verso():
    """Verso : le geste Tapote en abstraction — des ondes qui partent du logo.

    Les cercles concentriques disent ce que fait le produit sans l'ecrire, et
    ils sont dessines en couleurs pleines fondues, jamais en opacite : une
    transparence recreerait un groupe de transparence dans le PDF.
    """
    cx, cy = W / 2, H / 2 - 18
    ondes = "".join(
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" '
        f'stroke="{C.fondu(C.BLOC, DARK, i)}" stroke-width="{e}"/>'
        for r, e, i in ((150, 7, 0.42), (215, 6, 0.28),
                        (285, 5, 0.18), (360, 4, 0.11), (440, 3, 0.06)))
    s = f'<rect width="{W}" height="{H}" fill="{DARK}"/>{ondes}'
    # pastille sombre sous le logo : les ondes ne doivent pas le traverser
    s += f'<circle cx="{cx}" cy="{cy}" r="118" fill="{DARK}"/>'
    s += bp.logo(cx - 150, cy - 34, 300, CREAM)
    s += texte(cx, H - 108, "UN GESTE SUFFIT", C.F_BOLD, 21,
               C.fondu(CREAM, DARK, 0.62), 9, "middle")
    # le verso doit aussi savoir dire ou nous trouver : pose cote pile sur un
    # comptoir, la carte ne portait aucune information.
    s += texte(cx, H - 66, "TAPOTE.FR", C.F_BOLD, 20,
               C.fondu(C.BLOC_CLAIR, DARK, 0.9), 7, "middle")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W/10:g}mm" '
            f'height="{H/10:g}mm" viewBox="0 0 {W} {H}">{s}</svg>')


CARTES = [
    ("aymeric", "AYMERIC FRELAUT", "FONDATEUR",
     "aymeric@tapote.fr", "06 63 15 04 49"),
    ("jules-berger", "JULES BERGER", "FONDATEUR",
     "aymeric@tapote.fr", "06 10 23 50 78"),
]


def main():
    faces = [(cle, "recto", recto(nom, role, mail, tel))
             for cle, nom, role, mail, tel in CARTES]
    faces += [(cle, "verso", verso()) for cle, *_ in CARTES]

    for cle, face, svg in faces:
        base = f"carte-contact-{cle}-{face}-fondperdu-89x58"
        entete = C.ENTETE

        p_src = os.path.join(ROOT, "svg", f"{base}.svg")
        C._ecrire(p_src, entete + svg.replace("<defs>", f"<defs><style>{C.FACE_CSS}</style>", 1))

        courbes = vectorize_text.vectoriser(svg)
        p_courbes = os.path.join(ROOT, "svg", f"{base}-courbes.svg")
        C._ecrire(p_courbes, entete + courbes)

        gabarit = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
                   f'<title>Tapote — carte {cle} {face}</title><style>{{css}}'
                   '@page{{size:89mm 58mm;margin:0}}'
                   f'html,body{{{{margin:0;padding:0;background:{DARK}}}}}'
                   'svg{{display:block;width:89mm;height:58mm}}'
                   '</style></head><body>{{corps}}</body></html>')
        C._ecrire(os.path.join(ROOT, "html", f"{base}.html"),
                  gabarit.format(css=C.FACE_CSS, corps=svg))
        C._ecrire(os.path.join(ROOT, "html", f"{base}-courbes.html"),
                  gabarit.format(css="", corps=courbes.split("?>", 1)[-1]))

        restants = vectorize_text.compter_textes(courbes)
        print(f"{cle:<13} {face} {base}-courbes.svg  "
              f"({'aucun texte' if restants == 0 else f'{restants} <text> restants'})")

    print(f"\nFormat livre {W/10:g} x {H/10:g} mm, fini "
          f"{(W - 2*FOND_PERDU)/10:g} x {(H - 2*FOND_PERDU)/10:g} mm, "
          f"fond perdu {FOND_PERDU/10:g} mm")


if __name__ == "__main__":
    main()
