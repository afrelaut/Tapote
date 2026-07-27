#!/usr/bin/env python3
"""Explorations de design pour les editions personnalisees.

Produit une planche de contact : meme DA, meme couleurs, meme logo, meme mise en
page — seul l'ornement change. Sert a trancher visuellement avant de figer une
edition, sans polluer le dossier livre a l'imprimeur.

    python explorer_variantes.py

Les fichiers vont dans ../explorations. Ce ne sont PAS des fichiers d'impression :
une fois une piste retenue, on l'inscrit dans la DA et on repasse par
build_chevalet_v4.py, qui produit les quatre formats et les controles.
"""
import os

import build_chevalet_v4 as B
import vectorize_text

SORTIE = os.path.join(B.ROOT, "explorations")

# Chaque piste est un ornement, decrit pour pouvoir en parler sans le regarder.
# Compositions candidates. Le design de base ne bouge jamais : on ne fait
# qu'empiler des ornements par-dessus.
COMMUNES = []
BASE = "metier,contact,halo-bloc"
PROPRES = {}

# Variantes Bacchus : chaque piste repond a une contrainte differente, puisque
# la ligne metier est obligatoire et que le logo circulaire est encombrant.
BACCHUS = [
    (dict(logo=("logos/repaire-bacchus-original.svg", 195)),
     "fond-logo-moyen,metier,contact,halo-bloc", "Logo 19,5 mm — tout tient tel quel"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 260), metier_bas=True),
     "fond-logo-moyen,metier,contact,halo-bloc", "Métier sous les étoiles, logo 26 mm"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 285), metier_bas=True,
          titre_taille=74),
     "fond-logo-moyen,metier,contact,halo-bloc", "Métier en bas + accroche 7,4 mm"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 300), metier_bas=True,
          titre_taille=74, bloc_y=860),
     "fond-logo-moyen,metier,contact,halo-bloc", "Bloc descendu de 5 mm, logo 30 mm"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 230)),
     "fond-logo-geant,metier,contact,halo-bloc", "Filigrane géant débordant 10 %"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 230), metier_bas=True),
     "fond-logo-geant,metier,contact,halo-bloc", "Géant débordant + métier en bas"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 260), metier_bas=True),
     "fond-logo-net,metier,contact,halo-bloc", "Filigrane net 18 %"),
    (dict(logo=("logos/repaire-bacchus-tete.svg", 210), metier_bas=True),
     "fond-logo-moyen,metier,contact,halo-bloc", "Tête seule en tête, sans le cercle"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 260), metier_bas=True),
     "fond-degrade,fond-logo-moyen,metier,contact,halo-bloc", "Avec fond dégradé"),
    (dict(logo=("logos/repaire-bacchus-original.svg", 260), metier_bas=True),
     "fond-logo-moyen,cercle-medaille,metier,contact,halo-bloc", "Avec anneau"),
]


# Variante de composition retenue pour chaque client, d'apres ses validations.
# Google en haut, juste apres le logo du client, pour toutes les explorations.
CLIENTS = [(B.DA_BACCHUS, "A-google-avant-accroche", "Le Repaire de Bacchus")]


def main():
    os.makedirs(SORTIE, exist_ok=True)
    planches = []
    for d, variante, titre in CLIENTS:
        cases = []
        for reglages, ornement, libelle in BACCHUS:
            edition = dict(d, ornement=ornement, **reglages)
            svg = vectorize_text.vectoriser(B.build(variante, edition))
            nom = f"{d['cle']}-{libelle[:28].replace(' ', '-').replace(',', '')}.svg"
            B._ecrire(os.path.join(SORTIE, nom), B.ENTETE + svg)
            cases.append(f'<figure><div>{svg}</div>'
                         f'<figcaption>{libelle}<br><code>{ornement}</code></figcaption></figure>')
        planches.append(f'<h2>{titre}</h2><main>{"".join(cases)}</main>')

    B._ecrire(os.path.join(SORTIE, "planche.html"),
              '<!doctype html><meta charset="utf-8"><title>Explorations</title><style>'
              'body{margin:0;padding:22px;background:#6e6e76;font:13px system-ui;color:#fff}'
              'h2{font-size:15px;letter-spacing:.08em;text-transform:uppercase;'
              'margin:26px 0 12px;opacity:.85}'
              'main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}'
              'figure{margin:0}figure svg{width:100%;height:auto;display:block;border-radius:5px}'
              'figcaption{text-align:center;padding-top:6px;font-size:11.5px;line-height:1.45}'
              'code{opacity:.6;font-size:10.5px}</style>'
              + "".join(planches))

    print(f"{len(BACCHUS)} explorations dans explorations/")
    print("planche : explorations/planche.html")


if __name__ == "__main__":
    main()
