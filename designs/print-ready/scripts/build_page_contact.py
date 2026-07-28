#!/usr/bin/env python3
"""Page de contact vers laquelle pointe la puce NFC d'une carte de visite.

    python build_page_contact.py

Produit, pour chaque commercial, une page et une vCard dans ../contact :

    aymeric.html   page a heberger sur t.tapote.fr/c/aymeric
    aymeric.vcf    fiche contact, servie en text/vcard

Pourquoi passer par une page plutot que d'encoder la vCard dans la puce :
- les coordonnees se corrigent sans reimprimer les cartes ;
- on sait combien de personnes ont tapote, et quand — sur du terrain, cette
  statistique vaut autant que le contact lui-meme.

En echange, il faut du reseau. Le lien direct vers le .vcf reste donc mis en
avant : sur iPhone comme sur Android, un fichier servi en text/vcard ouvre la
fiche d'ajout de contact sans passer par un magasin d'applications.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(ROOT, "contact")

FICHES = [
    dict(cle="aymeric", prenom="Aymeric", nom="Frelaut", role="Fondateur",
         tel="+33663150449", tel_affiche="06 63 15 04 49",
         mail="aymeric@tapote.fr"),
    # Fiche associe : valeurs a remplacer, volontairement voyantes.
    dict(cle="jules-berger", prenom="Jules", nom="Berger", role="Fondateur",
         tel="+33610235078", tel_affiche="06 10 23 50 78",
         mail="aymeric@tapote.fr"),
]


def vcard(f):
    """vCard 3.0 — la version la plus largement acceptee par les telephones."""
    return "\r\n".join([
        "BEGIN:VCARD", "VERSION:3.0",
        f"N:{f['nom']};{f['prenom']};;;",
        f"FN:{f['prenom']} {f['nom']}".strip(),
        "ORG:Tapote",
        f"TITLE:{f['role']}",
        f"TEL;TYPE=CELL:{f['tel']}",
        f"EMAIL;TYPE=INTERNET:{f['mail']}",
        "URL:https://tapote.fr",
        "END:VCARD", ""])


def page(f):
    nom_complet = f"{f['prenom']} {f['nom']}".strip()
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{nom_complet} — Tapote</title>
<meta name="description" content="Fiche contact de {nom_complet}, {f['role']} chez Tapote.">
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; -webkit-tap-highlight-color: transparent; }}
  body {{ margin: 0; min-height: 100dvh; background: #141414; color: #F4EFE5;
          font: 16px/1.55 system-ui, sans-serif;
          display: grid; place-items: center; padding: 28px 22px; }}
  main {{ width: 100%; max-width: 380px; text-align: center; }}
  .marque {{ display: flex; align-items: center; justify-content: center; gap: 9px;
             font-size: 12px; letter-spacing: .22em; color: #9F9C96;
             text-transform: uppercase; margin-bottom: 34px; }}
  .marque svg {{ width: 17px; height: 17px; }}
  h1 {{ font-size: 30px; margin: 0 0 4px; letter-spacing: -.01em; }}
  .role {{ color: #8E8B86; font-size: 13.5px; letter-spacing: .16em;
           text-transform: uppercase; margin-bottom: 34px; }}

  a.principal {{ display: block; background: #2458FF; color: #fff; font-weight: 700;
                 font-size: 17px; text-decoration: none; padding: 17px 20px;
                 border-radius: 14px; margin-bottom: 12px; }}
  a.principal:active {{ background: #1c48d8; }}
  .lignes {{ display: grid; gap: 9px; margin-top: 12px; }}
  a.ligne {{ display: flex; align-items: center; justify-content: space-between;
             gap: 14px; background: #1e1e21; border: 1px solid #2c2c31;
             border-radius: 12px; padding: 14px 17px; color: #F4EFE5;
             text-decoration: none; font-size: 15.5px; }}
  a.ligne span:first-child {{ color: #8E8B86; font-size: 12px;
                              letter-spacing: .14em; text-transform: uppercase; }}
  a.ligne:active {{ background: #26262a; }}
  footer {{ margin-top: 34px; font-size: 12px; color: #6E6B67; }}
  footer a {{ color: #8E8B86; }}
</style>
</head>
<body>
<main>
  <p class="marque">
    <svg viewBox="0 0 44 46" aria-hidden="true"><g transform="translate(-13 -16)">
      <rect x="10" y="53" width="38" height="5" rx="2.5" fill="#F4EFE5"/>
      <path d="M11 51a18 18 0 0 1 36 0Z" fill="#F4EFE5"/>
      <rect x="25.5" y="25.5" width="7" height="6.5" rx="2.4" fill="#F4EFE5"/>
      <circle cx="40" cy="26" r="2.2" fill="#2458FF"/>
      <path d="M40 19.5a6.5 6.5 0 0 1 6.5 6.5M40 13a13 13 0 0 1 13 13" fill="none"
            stroke="#2458FF" stroke-width="2.7" stroke-linecap="round"/>
    </g></svg>
    Tapote
  </p>

  <h1>{nom_complet}</h1>
  <p class="role">{f['role']}</p>

  <!-- Lien vers un vrai fichier .vcf : servi en text/vcard, il ouvre
       directement la fiche d'ajout de contact sur iPhone comme sur Android.
       Un data: URL echouerait sur iOS. -->
  <a class="principal" href="{f['cle']}.vcf" download="{f['cle']}-tapote.vcf">
    Enregistrer dans mes contacts
  </a>

  <div class="lignes">
    <a class="ligne" href="tel:{f['tel']}">
      <span>Téléphone</span><span>{f['tel_affiche']}</span></a>
    <a class="ligne" href="mailto:{f['mail']}">
      <span>E-mail</span><span>{f['mail']}</span></a>
  </div>

  <footer>
    Ce contact vous a été transmis par un support Tapote.<br>
    <a href="https://tapote.fr">Découvrir Tapote</a>
  </footer>
</main>
</body>
</html>
"""


def main():
    os.makedirs(SORTIE, exist_ok=True)
    for f in FICHES:
        for nom, contenu in ((f"{f['cle']}.html", page(f)),
                             (f"{f['cle']}.vcf", vcard(f))):
            chemin = os.path.join(SORTIE, nom)
            with open(chemin, "w", encoding="utf-8", newline="") as fh:
                fh.write(contenu)
            print(f"  contact/{nom}  ({os.path.getsize(chemin)} octets)")
    print("\nA servir sur t.tapote.fr/c/<cle>. Le .vcf doit sortir en text/vcard,"
          "\nsinon le telephone le telecharge au lieu d'ouvrir la fiche contact.")


if __name__ == "__main__":
    main()
