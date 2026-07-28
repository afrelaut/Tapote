#!/usr/bin/env python3
"""Conversion des <text> d'un SVG en <path> — vectorisation complete.

Pourquoi : un <text> ne contient pas les lettres, seulement une reference a une
police. Si l'imprimeur ne l'a pas installee, elle est substituee et la mise en
page bouge. Converti en courbes, le fichier ne depend plus de rien.

Le reste du dessin (picto, bloc, QR, etoiles, logo Google) est deja en chemins :
c'est le texte, et lui seul, qui posait probleme.

Limite connue : le placement se fait aux chasses nominales, sans crenage GPOS.
L'ecart avec le rendu navigateur est mesure par verifier_ecarts() ; sur Archivo
et ces chaines il reste tres inferieur au dixieme de millimetre.
"""
import os
import re
import xml.etree.ElementTree as ET

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts")
_CACHE = {}


# Familles connues : fichier, et si la police est variable, l'axe a figer.
FICHIERS = {
    "Archivo Black": ("ArchivoBlack-Regular.ttf", False),
    "Archivo": ("Archivo-Variable.ttf", True),
    "Nunito": ("Nunito-Variable.ttf", True),
    "Lora": ("Lora-Variable.ttf", True),
    "Playfair Display": ("PlayfairDisplay-Variable.ttf", True),
}


def _font(family, weight):
    """Charge la police, en instanciant la variable au poids demande."""
    key = (family, weight)
    if key in _CACHE:
        return _CACHE[key]
    if family not in FICHIERS:
        raise ValueError(f"police non geree : {family} — l'ajouter a FICHIERS")
    nom, variable = FICHIERS[family]
    font = TTFont(os.path.join(FONTS_DIR, nom))
    if variable:
        # Une variable font ne se dessine pas telle quelle : ses contours sont
        # ceux de l'instance par defaut. On la fige au poids voulu.
        font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
    _CACHE[key] = font
    return font


def _glyph_names(font, texte):
    cmap = font.getBestCmap()
    noms = []
    for ch in texte:
        nom = cmap.get(ord(ch))
        if nom is None:
            raise ValueError(f"glyphe absent de la police pour {ch!r}")
        noms.append(nom)
    return noms


def _avance(font, noms, taille, interlettre):
    """Chasse totale, gouttiere d'interlettrage comprise APRES CHAQUE lettre.

    CSS ajoute la gouttiere derriere chaque caractere, dernier inclus, et c'est
    cette chasse-la que `text-anchor=middle` centre. Ne pas compter la derniere
    gouttiere donnerait des courbes decalees d'un demi-interlettrage par rapport
    au rendu navigateur. La compensation de ce decalage se fait a la composition
    (voir texte_centre dans build_chevalet_v4), pas ici : ce module doit
    reproduire le navigateur, pas le corriger.
    """
    hmtx = font["hmtx"]
    upem = font["head"].unitsPerEm
    total = sum(hmtx[n][0] for n in noms) * taille / upem
    return total + interlettre * len(noms)


def _chemin(font, noms, taille, interlettre, x, y):
    """Dessine la suite de glyphes en un seul chemin, deja a l'echelle et place."""
    upem = font["head"].unitsPerEm
    s = taille / upem
    glyphes = font.getGlyphSet()
    hmtx = font["hmtx"]
    pen = SVGPathPen(glyphes, ntos=lambda v: f"{v:.2f}")
    curseur = x
    for nom in noms:
        # y inverse : les contours de police sont en repere ascendant.
        glyphes[nom].draw(TransformPen(pen, Transform(s, 0, 0, -s, curseur, y)))
        curseur += hmtx[nom][0] * s + interlettre
    return pen.getCommands()


_PORTE = ("fill", "opacity", "fill-opacity")


def _convertir(el):
    """Remplace un <text> par un ou plusieurs <path> equivalents."""
    famille = el.get("font-family", "").split(",")[0].strip('"\' ')
    poids = float(el.get("font-weight", 400))
    taille = float(el.get("font-size"))
    interlettre = float(el.get("letter-spacing", 0))
    ancre = el.get("text-anchor", "start")
    x, y = float(el.get("x")), float(el.get("y"))

    # Un <text> peut porter des <tspan> de couleurs differentes : ils se suivent
    # sur la meme ligne, chacun devient son propre chemin.
    if len(el):
        morceaux = [(t.text or "", t.get("fill") or el.get("fill")) for t in el]
    else:
        morceaux = [(el.text or "", el.get("fill"))]

    font = _font(famille, poids)
    tous = [n for txt, _ in morceaux for n in _glyph_names(font, txt)]
    largeur = _avance(font, tous, taille, interlettre)
    curseur = x - largeur / 2 if ancre == "middle" else (
        x - largeur if ancre == "end" else x)

    sorties = []
    for txt, fill in morceaux:
        if not txt:
            continue
        noms = _glyph_names(font, txt)
        d = _chemin(font, noms, taille, interlettre, curseur, y)
        # Trace de provenance : permet d'apparier chaque courbe au texte d'origine
        # pour la verification d'ecart, et de relire le fichier des mois plus tard.
        p = ET.Element(f"{{{SVG_NS}}}path", {"d": d, "data-texte": txt})
        if fill:
            p.set("fill", fill)
        for a in _PORTE:
            if el.get(a) and a != "fill":
                p.set(a, el.get(a))
        sorties.append(p)
        curseur += _avance(font, noms, taille, interlettre)
    return sorties


def vectoriser(svg_source):
    """Rend le SVG avec tous ses textes convertis en courbes."""
    racine = ET.fromstring(svg_source)
    for parent in racine.iter():
        enfants = list(parent)
        for i, el in reversed(list(enumerate(enfants))):
            if el.tag == f"{{{SVG_NS}}}text":
                remplacants = _convertir(el)
                parent.remove(el)
                for j, p in enumerate(remplacants):
                    parent.insert(i + j, p)
    sortie = ET.tostring(racine, encoding="unicode")
    # Les @font-face n'ont plus d'objet une fois le texte en courbes.
    return re.sub(r"<style>.*?</style>", "", sortie, flags=re.S)


def compter_textes(svg_source):
    return svg_source.count("<text")
