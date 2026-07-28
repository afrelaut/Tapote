#!/usr/bin/env python3
"""Verifie qu'un fichier est integralement vectoriel — SVG ou PDF.

    python controle_vectoriel.py fichier1.svg fichier2.pdf ...
    python controle_vectoriel.py ../svg/*.svg

Un fichier est declare bon quand il ne contient AUCUN des elements suivants :

  - texte vivant       : depend d'une police, substituee si l'imprimeur ne l'a pas
  - police embarquee   : meme embarquee, c'est du texte, pas des courbes
  - police Type3       : vectoriel, mais forme non standard signalee en prepresse
  - image matricielle  : pixels, donc crenelage a l'agrandissement
  - filtre de rendu    : flou, ombre portee — rasterises a l'export

Aucune dependance : lecture directe des structures SVG et PDF.
"""
import os
import re
import sys
import zlib

# Couleurs seulement sur un vrai terminal : redirige dans un fichier ou lu par un
# outil, le fichier ne doit pas se remplir de codes d'echappement.
if sys.stdout.isatty():
    VERT, ROUGE, GRIS, RAZ = "\033[32m", "\033[31m", "\033[90m", "\033[0m"
else:
    VERT = ROUGE = GRIS = RAZ = ""


def _analyser_svg(octets):
    s = octets.decode("utf-8", "replace")
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    return {
        "texte vivant": len(re.findall(r"<text[\s>]", s)),
        "police embarquee": len(re.findall(r"@font-face", s)),
        "image matricielle": (len(re.findall(r"<image[\s>]", s))
                              + len(re.findall(r"data:image/(?!svg)", s))),
        "filtre de rendu": (len(re.findall(r"<filter[\s>]", s))
                            + len(re.findall(r'filter\s*=\s*"url\(', s))),
    }, {
        "chemins": len(re.findall(r"<path[\s>]", s)),
        "formes": len(re.findall(r"<(rect|circle|ellipse|line|polygon|polyline)[\s>]", s)),
    }


def _analyser_pdf(octets):
    fontes = re.findall(rb"/Type\s*/Font\b", octets)
    type3 = re.findall(rb"/Subtype\s*/Type3\b", octets)
    fichiers_police = re.findall(rb"/FontFile\d?\b", octets)
    images = re.findall(rb"/Subtype\s*/Image\b", octets)

    # les operateurs de texte vivent dans les flux, presque toujours compresses
    operateurs = 0
    for flux in re.findall(rb"stream\r?\n(.*?)endstream", octets, re.S):
        try:
            flux = zlib.decompress(flux)
        except zlib.error:
            pass
        operateurs += len(re.findall(rb"\b(?:Tj|TJ|')\b", flux))

    return {
        "texte vivant": operateurs,
        "police embarquee": len(fichiers_police),
        "police Type3": len(type3),
        "image matricielle": len(images),
    }, {
        "objets police declares": len(fontes),
        "taille": f"{len(octets)//1024} Ko",
    }


def controler(chemin):
    with open(chemin, "rb") as f:
        octets = f.read()
    ext = os.path.splitext(chemin)[1].lower()
    if ext == ".svg":
        defauts, info = _analyser_svg(octets)
    elif ext == ".pdf":
        defauts, info = _analyser_pdf(octets)
    else:
        print(f"{GRIS}ignore (ni .svg ni .pdf) : {chemin}{RAZ}")
        return None

    fautifs = {k: v for k, v in defauts.items() if v}
    ok = not fautifs
    marque = f"{VERT}[VECTORIEL]{RAZ}" if ok else f"{ROUGE}[NON VECTORIEL]{RAZ}"
    print(f"{marque} {os.path.basename(chemin)}")
    for cle, val in fautifs.items():
        print(f"    {ROUGE}x{RAZ} {cle} : {val}")
    print(f"    {GRIS}" + "  ".join(f"{k} {v}" for k, v in info.items()) + RAZ)
    return ok


def main():
    cibles = sys.argv[1:]
    if not cibles:
        print(__doc__)
        return 2
    resultats = [r for r in (controler(c) for c in cibles) if r is not None]
    rates = resultats.count(False)
    print(f"\n{len(resultats) - rates}/{len(resultats)} fichiers integralement vectoriels")
    return 1 if rates else 0


if __name__ == "__main__":
    sys.exit(main())
