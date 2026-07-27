#!/usr/bin/env python3
"""Marque Tapote en PNG carre, pour la photo d'une fiche contact vCard.

    python logo_tapote_png.py ../contact/logo-tapote.png 512

Le logo n'existe qu'en vectoriel et aucun moteur de rendu SVG n'est installe :
la cloche est donc redessinee ici avec les primitives de Pillow, a partir des
memes coordonnees que le trace SVG d'origine (build_protos._LOGO_INNER).

Le dessin est fait a quatre fois la taille demandee puis reduit : c'est ce qui
donne des bords lisses, Pillow ne sachant pas antialiaser ses primitives.
"""
import os
import sys

from PIL import Image, ImageDraw

FOND = (20, 20, 20)
CREME = (244, 239, 229)
BLEU = (36, 88, 255)
SUR = 4                      # facteur de surechantillonnage

# Boite du dessin dans le repere du logo SVG, translate(4 4) applique.
BOITE = (13.0, 16.0, 58.0, 63.0)


def dessiner(taille):
    c = taille * SUR
    img = Image.new("RGB", (c, c), FOND)
    d = ImageDraw.Draw(img)

    x0, y0, x1, y1 = BOITE
    marge = 0.16 * c
    k = (c - 2 * marge) / max(x1 - x0, y1 - y0)
    px = lambda x, y: (marge + (x - x0) * k, marge + (y - y0) * k)
    ep = lambda v: max(1, round(v * k))

    # cloche : demi-disque superieur, centre (33, 55), rayon 18
    cx, cy, r = 33, 55, 18
    a, b = px(cx - r, cy - r)
    e, f = px(cx + r, cy + r)
    d.pieslice([a, b, e, f], start=180, end=360, fill=CREME)

    # socle : barre arrondie sous la cloche
    a, b = px(14, 57)
    e, f = px(52, 62)
    d.rounded_rectangle([a, b, e, f], radius=ep(2.5), fill=CREME)

    # bouton superieur
    a, b = px(29.5, 29.5)
    e, f = px(36.5, 36)
    d.rounded_rectangle([a, b, e, f], radius=ep(2.4), fill=CREME)

    # point et ondes, en bleu de marque
    a, b = px(44 - 2.2, 30 - 2.2)
    e, f = px(44 + 2.2, 30 + 2.2)
    d.ellipse([a, b, e, f], fill=BLEU)
    for rayon in (6.5, 13):
        a, b = px(44 - rayon, 30 - rayon)
        e, f = px(44 + rayon, 30 + rayon)
        d.arc([a, b, e, f], start=-90, end=0, fill=BLEU, width=ep(2.7))

    return img.resize((taille, taille), Image.LANCZOS)


def main():
    cible = sys.argv[1] if len(sys.argv) > 1 else "../contact/logo-tapote.png"
    taille = int(sys.argv[2]) if len(sys.argv) > 2 else 512
    os.makedirs(os.path.dirname(os.path.abspath(cible)), exist_ok=True)
    dessiner(taille).save(cible, "PNG", optimize=True)
    print(f"-> {cible}  {taille}x{taille}  ({os.path.getsize(cible) // 1024} Ko)")


if __name__ == "__main__":
    main()
