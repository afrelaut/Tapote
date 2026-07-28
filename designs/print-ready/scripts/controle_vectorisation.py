#!/usr/bin/env python3
"""Controle de la vectorisation : superpose la version texte et la version courbes.

A relancer apres toute modification du generateur ou changement de police. La
page produite affiche les courbes en rouge translucide par-dessus le texte
d'origine : toute frange noire visible signale un decalage.

    python controle_vectorisation.py [variante]

Le fichier est ecrit hors du dossier livre a l'imprimeur.
"""
import io
import os
import sys
import tempfile
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts").replace("\\", "/")


def page(variante):
    base = f"chevalet-avis-google-v4-{variante}-105x148"
    lire = lambda suffixe: io.open(
        os.path.join(ROOT, "svg", base + suffixe), encoding="utf-8").read().split("?>", 1)[1]
    return f"""<!doctype html><meta charset="utf-8">
<title>Controle vectorisation — {variante}</title><style>
@font-face{{font-family:"Archivo Black";src:url("file:///{FONTS}/ArchivoBlack-Regular.ttf")}}
@font-face{{font-family:"Archivo";src:url("file:///{FONTS}/Archivo-Variable.ttf");font-weight:100 900}}
body{{margin:0;background:#141414}}
svg{{position:absolute;top:0;left:0;width:700px;height:987px}}
#courbes path[data-texte]{{fill:#FF0055 !important;opacity:.55 !important}}
</style>
<div id="texte">{lire(".svg")}</div>
<div id="courbes">{lire("-courbes.svg")}</div>"""


def main():
    variante = sys.argv[1] if len(sys.argv) > 1 else "B-google-apres-accroche"
    cible = os.path.join(tempfile.gettempdir(), f"controle-vectorisation-{variante}.html")
    io.open(cible, "w", encoding="utf-8").write(page(variante))
    print(cible)
    webbrowser.open(f"file:///{cible}".replace("\\", "/"))


if __name__ == "__main__":
    main()
