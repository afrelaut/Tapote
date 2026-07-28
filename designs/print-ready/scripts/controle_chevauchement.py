#!/usr/bin/env python3
"""Detecte les chevauchements reels entre elements d'un chevalet.

    python controle_chevauchement.py ../svg/*courbes.svg

Deux pieges rendent ce controle moins trivial qu'il n'y parait, et les deux ont
produit de faux resultats avant d'etre traites :

- un test purement vertical signale comme conflit deux elements poses cote a
  cote, comme les moities du bloc d'action. Il faut un recouvrement sur les DEUX
  axes ;
- les coordonnees ecrites dans un chemin ne sont pas ses coordonnees de page :
  un logo insere vit dans un groupe transforme. Sans cumul des transformations
  d'ancetres, on compare des reperes differents.
"""
import math
import os
import re
import sys
import xml.etree.ElementTree as ET

from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path

SVG_NS = "{http://www.w3.org/2000/svg}"
TOLERANCE = 1.0     # unites de recouvrement en deca desquelles on ignore


def _matrice(transform):
    """Matrice affine (a, b, c, d, e, f) d'un attribut transform SVG."""
    m = (1, 0, 0, 1, 0, 0)
    for nom, args in re.findall(r"(\w+)\s*\(([^)]*)\)", transform or ""):
        v = [float(x) for x in re.findall(r"-?[\d.]+(?:e-?\d+)?", args)]
        if nom == "translate":
            n = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif nom == "scale":
            n = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        elif nom == "rotate":
            r = math.radians(v[0])
            n = (math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0)
        elif nom == "matrix":
            n = tuple(v[:6])
        else:
            continue
        m = (m[0]*n[0] + m[2]*n[1], m[1]*n[0] + m[3]*n[1],
             m[0]*n[2] + m[2]*n[3], m[1]*n[2] + m[3]*n[3],
             m[0]*n[4] + m[2]*n[5] + m[4], m[1]*n[4] + m[3]*n[5] + m[5])
    return m


def _applique(m, x, y):
    return m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]


def boites(chemin):
    """Boites englobantes en coordonnees de page, transformations cumulees."""
    racine = ET.parse(chemin).getroot()
    trouvees = []

    def descendre(el, m):
        m = _matrice_produit(m, _matrice(el.get("transform")))
        if el.tag == f"{SVG_NS}path" and el.get("data-texte"):
            pen = BoundsPen(None)
            parse_path(el.get("d"), pen)
            if pen.bounds:
                x0, y0, x1, y1 = pen.bounds
                coins = [_applique(m, x, y)
                         for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
                xs = [p[0] for p in coins]
                ys = [p[1] for p in coins]
                trouvees.append((min(xs), min(ys), max(xs), max(ys),
                                 el.get("data-texte")))
        for enfant in el:
            descendre(enfant, m)

    descendre(racine, (1, 0, 0, 1, 0, 0))
    return trouvees


def _matrice_produit(a, b):
    return (a[0]*b[0] + a[2]*b[1], a[1]*b[0] + a[3]*b[1],
            a[0]*b[2] + a[2]*b[3], a[1]*b[2] + a[3]*b[3],
            a[0]*b[4] + a[2]*b[5] + a[4], a[1]*b[4] + a[3]*b[5] + a[5])


def controler(chemin):
    b = boites(chemin)
    conflits = []
    for i, (ax0, ay0, ax1, ay1, an) in enumerate(b):
        for bx0, by0, bx1, by1, bn in b[i + 1:]:
            if an == bn:          # relief : la meme chaine dessinee deux fois
                continue
            rx = min(ax1, bx1) - max(ax0, bx0)
            ry = min(ay1, by1) - max(ay0, by0)
            if rx > TOLERANCE and ry > TOLERANCE:
                conflits.append(f"{an[:18]} / {bn[:18]} ({rx:.0f}x{ry:.0f})")
    nom = os.path.basename(chemin).replace("chevalet-avis-google-", "")[:44]
    print(f"{nom:<46} " + ("ok" if not conflits else "CHEVAUCHE " + " ; ".join(conflits[:3])))
    return not conflits


if __name__ == "__main__":
    cibles = sys.argv[1:]
    if not cibles:
        print(__doc__)
        raise SystemExit(2)
    res = [controler(c) for c in cibles]
    print(f"\n{sum(res)}/{len(res)} sans chevauchement")
    raise SystemExit(0 if all(res) else 1)
