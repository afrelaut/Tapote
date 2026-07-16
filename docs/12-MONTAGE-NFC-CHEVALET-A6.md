# Montage NFC du chevalet A6 Tapote

## Montage recommandé

La puce ne doit pas être collée sur la face extérieure du chevalet. Elle reste invisible derrière l'impression, tout en étant aussi proche que possible du téléphone.

Ordre des couches, du client vers l'arrière :

```text
Téléphone du client
        ↓
Plaque acrylique avant
Feuille A6 imprimée
Sticker NFC collé au dos de la feuille
Plaque acrylique arrière
```

- Coller le sticker au dos de la feuille, exactement derrière le pictogramme NFC du bandeau bleu.
- Garder l'antenne du sticker bien plane et parallèle au téléphone. Ne pas la plier, la froisser ou la recouvrir d'une seconde puce.
- Placer le centre de la puce dans la moitié gauche du bandeau bleu, loin du QR code. Sur le gabarit actuel, viser environ 30 à 35 mm depuis le bord gauche et 112 à 120 mm depuis le haut de la feuille A6, puis ajuster selon le diamètre réel du sticker.
- Le QR reste dans la moitié droite, visible et contrasté. Il constitue le second accès obligatoire lorsque le NFC est désactivé ou difficile à détecter.
- Éviter une plaque, un support ou un comptoir métallique juste derrière la puce. Si le chevalet est posé près du métal, utiliser une puce dite « anti-métal » avec ferrite.

Si la lecture est encore trop faible, le plan B consiste à coller la puce sur la face intérieure de la plaque acrylique avant, puis à la masquer avec un vinyle opaque reprenant exactement le bandeau bleu. Le client voit le visuel, jamais la puce.

## Encodage

1. Encoder une URL HTTPS courte de type `https://t.tapote.fr/a/...` au format NDEF URI.
2. Vérifier l'ouverture de la bonne page sur iPhone et Android.
3. Ne verrouiller la puce en lecture seule qu'après validation complète du lien et du montage.
4. Conserver le QR code vers la même URL afin que les deux gestes aient toujours le même résultat.

## Test d'acceptation avant assemblage des six chevalets

Commencer par un seul prototype :

1. Tester la puce seule, avant collage.
2. Tester la puce derrière la feuille imprimée.
3. Ajouter les deux plaques acryliques et retester.
4. Poser le chevalet à son emplacement réel et retester avec les coques de téléphone conservées.
5. Tester plusieurs zones du dos de chaque téléphone, car la position de l'antenne varie selon les modèles.
6. Répéter sur au moins trois iPhone et trois Android.
7. Accepter le montage si neuf lectures sur dix ouvrent la page en moins de deux secondes, téléphone presque au contact, sans déplacer le chevalet.
8. Scanner également le QR à 30, 50 et 80 cm sous plusieurs éclairages.

Avec des stickers peu puissants, la promesse réaliste est « approchez ou posez votre téléphone », pas une lecture à plusieurs centimètres. Le pictogramme doit indiquer précisément le centre de la zone à toucher.

## Sources techniques

- [STMicroelectronics — NFC Touchpoints](https://www.st.com/content/st_com/en/support/learning/essentials-and-insights/connectivity/nfc/nfc-touchpoints.html)
- [STMicroelectronics — AN2972, position et couplage des antennes NFC](https://www.st.com/content/ccc/resource/technical/document/application_note/bc/ac/13/fe/69/fb/49/8a/CD00232630.pdf/files/CD00232630.pdf/jcr%3Acontent/translations/en.CD00232630.pdf)
- [NXP — NTAG213, NTAG215 et NTAG216](https://www.nxp.com/products/NTAG213_215_216)
- [NFC Forum — règles d'utilisation du N-Mark](https://nfc-forum.org/uploads/Branding-and-Marks/NFC_N_Mark_Guidelines.pdf)
