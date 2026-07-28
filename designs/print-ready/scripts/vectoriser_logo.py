#!/usr/bin/env python3
"""Vectorise un logo bitmap en SVG, couleur par couleur.

    python vectoriser_logo.py "chemin/logo.png" ../logos/enseigne-client.svg

Contrairement a une photo d'enseigne, un logo numerique propre — aplats francs,
fond uni, contours nets — se trace tres bien. C'est le cas pour lequel les
traceurs sont faits. Sur une photo prise de biais, le resultat serait mauvais :
ne pas confondre les deux situations.

Methode : la palette est reduite aux quelques couleurs reellement presentes, le
fond est ecarte, puis chaque couleur donne un masque trace separement. Les
calques sont empiles du plus grand au plus petit, pour que les details posent
par-dessus les aplats.

L'image est agrandie avant tracage : les bords anticreneles deviennent des
transitions plus longues, dont le seuillage tire des courbes plus douces.
"""
import os
import sys
from collections import Counter

import numpy as np
import potrace
from PIL import Image

AGRANDISSEMENT = 4      # facteur de suréchantillonnage avant seuillage
# Seuil de fond exprime en LUMINANCE, et non sur le canal minimal : au bord
# d'une lettre coloree, l'anticrenelage passe par des gris clairs peu satures.
# Testes sur le canal minimal ils echappaient au fond, etaient juges "non
# satures" donc envoyes vers le noir, et dessinaient un lisere sombre fantome
# autour de chaque lettre rouge.
SEUIL_FOND = 205
AIRE_MIN = 12           # taches plus petites : bruit de compression, ignorees


def couleurs_utiles(im, maxi=6):
    """Couleurs significatives de l'image, fond exclu, triees par surface."""
    comptes = Counter(im.getdata())
    total = im.width * im.height
    gardees = []
    for (r, v, b), n in comptes.most_common(40):
        if n / total < 0.004:            # moins de 0,4 % : residu d'anticrenelage
            continue
        if 0.299 * r + 0.587 * v + 0.114 * b > SEUIL_FOND:   # fond clair
            continue
        # gris clair peu sature : halo d'anticrenelage entre le trait et le fond,
        # pas une couleur du logo.
        if max(r, v, b) - min(r, v, b) < 32 and (r + v + b) / 3 > 165:
            continue
        if any(abs(r - cr) + abs(v - cv) + abs(b - cb) < 90 for cr, cv, cb in gardees):
            continue                      # variante d'une couleur deja retenue
        gardees.append((r, v, b))
        if len(gardees) == maxi:
            break
    return gardees


SATURATION_MIN = 42     # au-dela, le pixel est considere comme colore


def _sature(c):
    return max(c) - min(c) >= SATURATION_MIN


def masque(px, couleur, couleurs):
    """Pixels dont `couleur` est la teinte de reference la plus proche.

    La comparaison se fait d'abord par saturation, ensuite seulement par
    distance. Sans cela, les traits fins anticreneles — donc gris moyen — sont
    attribues au rouge : en distance RVB un gris moyen en est plus proche que
    du quasi-noir, et le dessin au trait ressort a la mauvaise couleur.
    """
    p16 = px.astype(np.int16)
    colore = (px.max(axis=2).astype(np.int16)
              - px.min(axis=2).astype(np.int16)) >= SATURATION_MIN
    famille = [c for c in couleurs if _sature(c) == _sature(couleur)]

    d = np.abs(p16 - np.array(couleur, dtype=np.int16)).sum(axis=2)
    proche = np.ones(d.shape, dtype=bool)
    for c in famille:
        if c != couleur:
            proche &= d <= np.abs(p16 - np.array(c, dtype=np.int16)).sum(axis=2)
    proche &= colore if _sature(couleur) else ~colore

    lum = (0.299 * px[:, :, 0] + 0.587 * px[:, :, 1] + 0.114 * px[:, :, 2])
    return proche & (lum <= SEUIL_FOND)


def trace_svg(m, echelle):
    """Convertit un masque booleen en donnees de chemin SVG."""
    # Deux pieges de potracer : il lui faut un tableau BOOLEEN (en uint8 0/1 il
    # voit tout comme du fond), et il trace le COMPLEMENT du masque — d'ou
    # l'inversion, sans laquelle on obtient le negatif du logo.
    chemin = potrace.Bitmap(~m).trace(
        turdsize=AIRE_MIN * echelle ** 2, alphamax=1.0,
        opticurve=True, opttolerance=0.2)
    e = 1.0 / echelle
    pt = lambda p: f"{p.x * e:.2f} {p.y * e:.2f}"   # potrace rend des _Point
    out = []
    for courbe in chemin:
        out.append("M" + pt(courbe.start_point))
        for seg in courbe.segments:
            if seg.is_corner:
                out.append("L" + pt(seg.c) + "L" + pt(seg.end_point))
            else:
                out.append("C" + pt(seg.c1) + " " + pt(seg.c2)
                           + " " + pt(seg.end_point))
        out.append("Z")
    return "".join(out)


def vectoriser(source, cible, remplacements=None):
    im = Image.open(source).convert("RGB")
    largeur, hauteur = im.size
    couleurs = couleurs_utiles(im)
    if not couleurs:
        raise SystemExit("aucune couleur exploitable : image trop claire ou vide")

    grand = im.resize((largeur * AGRANDISSEMENT, hauteur * AGRANDISSEMENT),
                      Image.LANCZOS)
    px = np.asarray(grand)

    calques = []
    for c in couleurs:
        m = masque(px, c, couleurs)
        if m.sum() < AIRE_MIN * AGRANDISSEMENT ** 2:
            continue
        d = trace_svg(m, AGRANDISSEMENT)
        if d:
            teinte = "#%02X%02X%02X" % c
            teinte = (remplacements or {}).get(teinte, teinte)
            calques.append((int(m.sum()), teinte, d))

    calques.sort(key=lambda t: -t[0])     # aplats d'abord, details par-dessus
    corps = "".join(f'<path d="{d}" fill="{t}" fill-rule="evenodd"/>'
                    for _, t, d in calques)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} '
           f'{hauteur}" width="{largeur}" height="{hauteur}">{corps}</svg>')

    os.makedirs(os.path.dirname(os.path.abspath(cible)), exist_ok=True)
    with open(cible, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg)

    print(f"{len(calques)} calques de couleur, {svg.count('M')} contours")
    for n, t, _ in calques:
        print(f"  {t}  {n // AGRANDISSEMENT ** 2:>7} px")
    print(f"-> {cible}  ({os.path.getsize(cible) // 1024} Ko)")
    return cible


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        raise SystemExit(2)
    vectoriser(sys.argv[1], sys.argv[2])


def ajouter_ligne(source, cible, texte, taille, x, y, couleur="#1D1D1B",
                  fonte='font-family="Playfair Display" font-weight="700"',
                  hauteur=None, ancre="end"):
    """Ajoute une ligne de texte a un logo deja vectorise, puis la vectorise.

    Sert aux mentions que le logo porte sans qu'elles fassent partie du dessin :
    nom de ville, baseline, annee de creation. On compose dans la police la plus
    proche du logo plutot que de tracer une photo de flyer, dont la texture
    papier et les ombres donneraient des contours sales.
    """
    import re as _re
    import vectorize_text

    src = open(source, encoding="utf-8").read()
    vb = _re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
    lw, lh = float(vb.group(1)), float(vb.group(2))
    h = hauteur or lh
    corps = src[src.index(">", src.index("<svg")) + 1: src.rindex("</svg>")]

    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lw:.0f} {h:.0f}" '
           f'width="{lw:.0f}" height="{h:.0f}">{corps}'
           f'<text x="{x}" y="{y}" text-anchor="{ancre}" fill="{couleur}" '
           f'{fonte} font-size="{taille}">{texte}</text></svg>')
    sortie = vectorize_text.vectoriser(svg)
    with open(cible, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + sortie)
    print(f"-> {cible}  ({os.path.getsize(cible) // 1024} Ko)")
    return cible


def extraire(source, cible, xmax=None, xmin=None, marge=6):
    """Isole les contours d'un logo situes dans une bande horizontale.

    Sert a detacher un embleme du lettrage quand les deux partagent un meme
    chemin — cas du dragon de Bulle de Jeux, dans le meme aplat noir que le mot
    « Bulle ». Le viewBox est recadre sur ce qui reste.
    """
    import re as _re
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.svgLib.path import parse_path

    src = open(source, encoding="utf-8").read()
    gardes, bornes = [], []
    for m in _re.finditer(r'<path d="([^"]+)"([^>]*)>', src):
        teinte = _re.search(r'fill="(#[0-9A-Fa-f]{6})"', m.group(2))
        morceaux = []
        for bout in _re.split(r"(?=M)", m.group(1)):
            if not bout.strip():
                continue
            pen = BoundsPen(None)
            parse_path(bout, pen)
            if not pen.bounds:
                continue
            x0, y0, x1, y1 = pen.bounds
            if (xmax is not None and x1 > xmax) or (xmin is not None and x0 < xmin):
                continue
            morceaux.append(bout)
            bornes.append((x0, y0, x1, y1))
        if morceaux:
            gardes.append((teinte.group(1) if teinte else "#000000", "".join(morceaux)))

    if not bornes:
        raise SystemExit("aucun contour dans la bande demandee")
    x0 = min(b[0] for b in bornes) - marge
    y0 = min(b[1] for b in bornes) - marge
    x1 = max(b[2] for b in bornes) + marge
    y1 = max(b[3] for b in bornes) + marge
    corps = "".join(f'<path d="{d}" fill="{t}" fill-rule="evenodd"/>' for t, d in gardes)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} '
           f'{x1-x0:.1f} {y1-y0:.1f}" width="{x1-x0:.0f}" height="{y1-y0:.0f}">'
           f'{corps}</svg>')
    with open(cible, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg)
    print(f"-> {cible}  {len(bornes)} contours, "
          f"cadre {x1-x0:.0f} x {y1-y0:.0f}")
    return cible


def extraire_cercle(source, cible, rayon, centre=None, marge=8):
    """Isole les contours situes dans un disque, pour un logo circulaire.

    Un embleme cercle d'un texte en arc ne se decoupe pas par bande verticale :
    on garde les contours dont le centre tombe dans le disque, ce qui detache
    le motif central des lettres peripheriques.
    """
    import re as _re
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.svgLib.path import parse_path

    src = open(source, encoding="utf-8").read()
    vb = _re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', src)
    vx, vy, vw, vh = (float(vb.group(i)) for i in (1, 2, 3, 4))
    cx, cy = centre or (vx + vw / 2, vy + vh / 2)

    gardes, bornes = [], []
    for m in _re.finditer(r'<path d="([^"]+)"([^>]*)>', src):
        teinte = _re.search(r'fill="(#[0-9A-Fa-f]{6})"', m.group(2))
        morceaux = []
        for bout in _re.split(r"(?=M)", m.group(1)):
            if not bout.strip():
                continue
            pen = BoundsPen(None)
            parse_path(bout, pen)
            if not pen.bounds:
                continue
            x0, y0, x1, y1 = pen.bounds
            if ((x0 + x1) / 2 - cx) ** 2 + ((y0 + y1) / 2 - cy) ** 2 > rayon ** 2:
                continue
            morceaux.append(bout)
            bornes.append(pen.bounds)
        if morceaux:
            gardes.append((teinte.group(1) if teinte else "#000000", "".join(morceaux)))

    if not bornes:
        raise SystemExit("aucun contour dans le disque demande")
    x0 = min(b[0] for b in bornes) - marge
    y0 = min(b[1] for b in bornes) - marge
    x1 = max(b[2] for b in bornes) + marge
    y1 = max(b[3] for b in bornes) + marge
    corps = "".join(f'<path d="{d}" fill="{t}" fill-rule="evenodd"/>' for t, d in gardes)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} '
           f'{x1-x0:.1f} {y1-y0:.1f}" width="{x1-x0:.0f}" height="{y1-y0:.0f}">{corps}</svg>')
    with open(cible, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg)
    print(f"-> {cible}  {len(bornes)} contours, cadre {x1-x0:.0f} x {y1-y0:.0f}")
    return cible
