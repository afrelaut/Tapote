#!/usr/bin/env python3
"""Tapote — série personnalisée v3.
Deux versions par produit : AVIS GOOGLE (sombre, étoiles palette Google) et
meilleur cas d'usage (clair). Bloc action = 85,5 x 54 mm EXACT sur tous les
supports (= empreinte de la carte NFC collée derrière). Aucune imitation de
logo : mentions nominatives + icônes génériques + palette couleur seulement."""
import os
import build_protos as bp

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "persos-v3")
os.makedirs(OUT, exist_ok=True)

INK = bp.INK; DARK = bp.DARK; CREAM = bp.CREAM; BLUE = bp.BLUE; YELLOW = bp.YELLOW; WHITE = bp.WHITE
FB = bp.F_BLACK; FR = bp.F_REG; FBD = bp.F_BOLD
G_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853"]  # palette Google
IG = "url(#ig)"  # dégradé palette Instagram (couleurs seules, aucun glyphe imité)
IG_DEFS = ('<defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">'
           '<stop offset="0" stop-color="#833AB4"/><stop offset=".55" stop-color="#E1306C"/>'
           '<stop offset="1" stop-color="#F77737"/></linearGradient></defs>')

def g_stars(cx, cy, R, gap):
    total = 4 * gap
    return "".join(
        f'<path d="{bp.star_path(cx - total/2 + i*gap, cy, R)}" fill="{G_COLORS[i]}"/>'
        for i in range(5))

# ---------- BLOC ACTION UNIFIÉ : 855 x 540 unités = 85,5 x 54 mm EXACT ----------
def action_block(x, y):
    b = f'<rect x="{x}" y="{y}" width="855" height="540" rx="44" fill="{BLUE}"/>'
    b += f'<line x1="{x+515}" y1="{y+60}" x2="{x+515}" y2="{y+480}" stroke="{WHITE}" stroke-opacity=".25" stroke-width="2"/>'
    b += bp.nfc_icon(x+160, y+70, 9)
    b += f'<text x="{x+257}" y="{y+330}" text-anchor="middle" fill="{WHITE}" {FB} font-size="37">POSEZ VOTRE</text>'
    b += f'<text x="{x+257}" y="{y+377}" text-anchor="middle" fill="{WHITE}" {FB} font-size="37">TÉLÉPHONE ICI</text>'
    b += f'<text x="{x+257}" y="{y+432}" text-anchor="middle" fill="{WHITE}" opacity=".78" {FR} font-size="22">NFC · sans application</text>'
    b += bp.qr_block(x+560, y+50, 260)
    b += f'<text x="{x+690}" y="{y+365}" text-anchor="middle" fill="{WHITE}" {FB} font-size="28">OU SCANNEZ</text>'
    b += f'<text x="{x+690}" y="{y+405}" text-anchor="middle" fill="{WHITE}" opacity=".78" {FR} font-size="19">avec l’appareil photo</text>'
    return b

# ---------- icônes génériques (aucun logo de marque) ----------
def ic_menu(x, y, s, paint="currentColor"):
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({s})" fill="none" stroke-linecap="round">'
            f'<rect x="1" y="0" width="16" height="22" rx="2.4" stroke="{paint}" stroke-width="1.7"/>'
            f'<path d="M5 6h8M5 11h8M5 16h5" stroke="{paint}" stroke-width="1.7"/></g>')

def ic_cal(x, y, s, paint="currentColor", check=None):
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({s})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<rect x="0" y="2.5" width="20" height="18" rx="2.6" stroke="{paint}" stroke-width="1.7"/>'
            f'<path d="M5.5 0v5M14.5 0v5M0 8.5h20" stroke="{paint}" stroke-width="1.7"/>'
            f'<path d="M6 14l3 3 5.5-5.5" stroke="{check or paint}" stroke-width="1.9"/></g>')

def ic_cam(x, y, s, paint="currentColor"):
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({s})" fill="none">'
            f'<rect x="0" y="0" width="21" height="21" rx="5.5" stroke="{paint}" stroke-width="1.7"/>'
            f'<circle cx="10.5" cy="10.5" r="4.6" stroke="{paint}" stroke-width="1.7"/>'
            f'<circle cx="16.4" cy="4.6" r="1.35" fill="{paint}"/></g>')

def ic_bubble(x, y, s):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M21 10.5a9.3 9.3 0 0 1-9.5 9.1 10 10 0 0 1-4.2-.9L2 20l1.4-4.9a8.8 8.8 0 0 1-1.4-4.6A9.3 9.3 0 0 1 11.5 1.4 9.3 9.3 0 0 1 21 10.5Z" stroke="currentColor" stroke-width="1.7"/>'
            f'<path d="M7.2 10.6h.01M11.5 10.6h.01M15.8 10.6h.01" stroke="currentColor" stroke-width="2.6"/></g>')

def ic_mail(x, y, s):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<rect x="0" y="2" width="22" height="16" rx="2.6" stroke="currentColor" stroke-width="1.7"/>'
            f'<path d="m1.5 4.5 9.5 7 9.5-7" stroke="currentColor" stroke-width="1.7"/></g>')

def ic_tel(x, y, s):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M20 15.7v2.8a1.9 1.9 0 0 1-2.1 1.9A18.9 18.9 0 0 1 1.6 4.1 1.9 1.9 0 0 1 3.5 2h2.8a1.9 1.9 0 0 1 1.9 1.6c.12.9.34 1.8.65 2.6a1.9 1.9 0 0 1-.43 2L7.2 9.4a15.2 15.2 0 0 0 5.4 5.4l1.2-1.2a1.9 1.9 0 0 1 2-.43c.84.31 1.7.53 2.6.65A1.9 1.9 0 0 1 20 15.7Z" stroke="currentColor" stroke-width="1.7"/></g>')

# largeurs Arial/Liberation Sans Bold en millièmes de corps — pour dimensionner les pills
_WB = {"A":722,"B":722,"C":722,"D":722,"E":667,"F":611,"G":778,"H":722,"I":278,
       "J":556,"K":722,"L":611,"M":833,"N":722,"O":778,"P":667,"Q":778,"R":722,
       "S":667,"T":611,"U":722,"V":667,"W":944,"X":667,"Y":667,"Z":611,
       "É":667,"È":667,"À":722," ":278,"·":333,"-":333}

def _tw(label, size=24, ls=4):
    return sum(_WB.get(c, 700) for c in label) * size / 1000 + ls * (len(label) - 1)

def pill(cx, y, label, fg, icon=None, icon_wh=(0, 0), icon_paint=None,
         border_paint=None, label_paint=None):
    tw = _tw(label)
    iw, ih = (icon_wh[0] * 1.35, icon_wh[1] * 1.35) if icon else (0, 0)
    gap = 18 if icon else 0
    pad = 32
    w = pad + iw + gap + tw + pad
    x0 = cx - w / 2
    bp = border_paint or fg
    out = (f'<rect x="{x0:.1f}" y="{y}" width="{w:.1f}" height="58" rx="29" fill="none" '
           f'stroke="{bp}" stroke-opacity="{"1" if border_paint else ".55"}" stroke-width="2.5"/>')
    if icon:
        out += icon(x0 + pad, y + (58 - ih) / 2, 1.35, icon_paint or fg)
    out += (f'<text x="{x0 + pad + iw + gap:.1f}" y="{y+38}" fill="{label_paint or fg}" '
            f'{FBD} font-size="24" letter-spacing="4">{label}</text>')
    return out

# ---------- contenus par version ----------
def head_common(parts, W, fg, logo_w, logo_y):
    parts.append(bp.logo((W-logo_w)/2, logo_y, logo_w, fg))

def chevalet(version):
    W, H = 1050, 1480
    dark = version == "avis"
    bg, fg = (DARK, CREAM) if dark else (CREAM, INK)
    p = [f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    head_common(p, W, fg, 510, 62)
    p.append(f'<text x="525" y="240" text-anchor="middle" fill="{fg}" opacity=".55" {FBD} font-size="20" letter-spacing="8">UN GESTE SUFFIT</text>')
    if dark:
        p.append(f'<text x="525" y="415" text-anchor="middle" fill="{fg}" {FB} font-size="100" letter-spacing="-5">Votre avis</text>')
        p.append(f'<text x="525" y="520" text-anchor="middle" fill="{fg}" {FB} font-size="100" letter-spacing="-5">compte.</text>')
        p.append(f'<text x="525" y="590" text-anchor="middle" fill="{fg}" opacity=".7" {FR} font-size="30">30 secondes suffisent</text>')
        p.append(g_stars(525, 645, 24, 62))
    else:
        p.append(f'<text x="525" y="415" text-anchor="middle" fill="{fg}" {FB} font-size="104" letter-spacing="-5">La carte,</text>')
        p.append(f'<text x="525" y="520" text-anchor="middle" fill="{fg}" {FB} font-size="104" letter-spacing="-5">juste ici.</text>')
        p.append(f'<text x="525" y="590" text-anchor="middle" fill="{fg}" opacity=".7" {FR} font-size="30">Toujours à jour</text>')
        p.append(pill(525, 615, "MENU", fg, ic_menu, (18, 23)))
    p.append(action_block(97.5, 720))
    p.append(f'<text x="525" y="1402" text-anchor="middle" fill="{fg}" opacity=".62" {FBD} font-size="17" letter-spacing="6">TAPOTE.FR · UN GESTE SUFFIT</text>')
    return bp.svg_doc(105, 148, "".join(p))

def plaque(version):
    W, H, b = 1260, 1260, 30
    dark = version == "avis"
    bg, fg = (DARK, CREAM) if dark else (CREAM, INK)
    p = [f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    p.append(bp.logo(420, 80, 420, fg))
    if dark:
        p.append(f'<text x="630" y="310" text-anchor="middle" fill="{fg}" {FB} font-size="86" letter-spacing="-4">Votre avis compte.</text>')
        p.append(f'<text x="630" y="375" text-anchor="middle" fill="{fg}" opacity=".7" {FR} font-size="28">30 secondes suffisent</text>')
        p.append(g_stars(630, 435, 20, 52))
    else:
        p.append(f'<text x="630" y="310" text-anchor="middle" fill="{fg}" {FB} font-size="88" letter-spacing="-4">On se revoit quand ?</text>')
        p.append(f'<text x="630" y="375" text-anchor="middle" fill="{fg}" opacity=".7" {FR} font-size="28">Réservez en 30 secondes</text>')
        p.append(pill(630, 405, "RÉSERVATION", fg,
                      lambda x, y, s, p_: ic_cal(x, y, s, p_, check=BLUE), (21.5, 21.5)))
    p.append(action_block((W-855)/2, 505))
    p.append(f'<text x="630" y="1175" text-anchor="middle" fill="{fg}" opacity=".6" {FBD} font-size="17" letter-spacing="5">TAPOTE.FR · UN GESTE SUFFIT</text>')
    p.append(bp.crop_marks(W, H, b))
    return bp.svg_doc(126, 126, "".join(p))

def vitrine(version):
    W, H, b = 960, 960, 30
    dark = version == "avis"
    bg, fg = (DARK, CREAM) if dark else (CREAM, INK)
    p = [f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    p.append(bp.logo(330, 52, 300, fg))
    if dark:
        p.append(f'<text x="480" y="205" text-anchor="middle" fill="{fg}" {FB} font-size="64" letter-spacing="-3">Votre avis compte.</text>')
        p.append(g_stars(480, 258, 17, 44))
    else:
        p.append(IG_DEFS)
        p.append(f'<text x="480" y="205" text-anchor="middle" fill="{fg}" {FB} font-size="62" letter-spacing="-3">La suite se passe ici.</text>')
        p.append(pill(480, 228, "INSTAGRAM", fg, ic_cam, (22, 22),
                      icon_paint=IG, border_paint=IG))
    p.append(action_block((W-855)/2, 320))
    p.append(f'<text x="480" y="905" text-anchor="middle" fill="{fg}" opacity=".58" {FBD} font-size="15" letter-spacing="4">TAPOTE.FR · MÊME FERMÉ</text>')
    p.append(bp.crop_marks(W, H, b))
    return bp.svg_doc(96, 96, "".join(p))

def carte_recto(version):
    W, H = 890, 580
    dark = version == "avis"
    bg, fg = (DARK, CREAM) if dark else (CREAM, INK)
    p = [f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    p.append(bp.logo(62, 55, 300, fg))
    if dark:
        p.append(f'<text x="65" y="235" fill="{fg}" {FB} font-size="63" letter-spacing="-3">Votre avis</text>')
        p.append(f'<text x="65" y="304" fill="{fg}" {FB} font-size="63" letter-spacing="-3">compte.</text>')
        p.append(f'<text x="66" y="355" fill="{fg}" opacity=".68" {FR} font-size="22">30 secondes suffisent</text>')
        p.append(g_stars(178, 408, 14, 38))
        p.append(f'<text x="66" y="495" fill="{fg}" opacity=".55" {FBD} font-size="15" letter-spacing="3">AVIS GOOGLE · TAPOTE.FR</text>')
    else:
        p.append(f'<text x="65" y="225" fill="{fg}" {FB} font-size="60" letter-spacing="-3">Gardons le</text>')
        p.append(f'<text x="65" y="292" fill="{fg}" {FB} font-size="60" letter-spacing="-3">contact.</text>')
        p.append(f'<text x="66" y="340" fill="{fg}" opacity=".68" {FR} font-size="22">WhatsApp, mail ou téléphone</text>')
        p.append(f'<g color="{fg}">{ic_bubble(66, 375, 2.1)}{ic_mail(140, 377, 2.1)}{ic_tel(216, 375, 2.1)}</g>')
        p.append(f'<text x="66" y="495" fill="{fg}" opacity=".55" {FBD} font-size="15" letter-spacing="3">CONTACT · TAPOTE.FR</text>')
    p.append(f'<rect x="555" y="55" width="270" height="430" rx="34" fill="{BLUE}"/>')
    p.append(bp.nfc_icon(610, 112, 7.2))
    p.append(f'<text x="690" y="330" text-anchor="middle" fill="{WHITE}" {FB} font-size="25">POSEZ VOTRE</text>')
    p.append(f'<text x="690" y="365" text-anchor="middle" fill="{WHITE}" {FB} font-size="25">TÉLÉPHONE</text>')
    p.append(f'<text x="690" y="425" text-anchor="middle" fill="{WHITE}" opacity=".75" {FR} font-size="16">NFC · sans application</text>')
    p.append(bp.crop_marks(W, H, 20))
    return bp.svg_doc(89, 58, "".join(p))

def carte_verso():
    W, H = 890, 580
    p = [f'<rect width="{W}" height="{H}" fill="{DARK}"/>']
    p.append(f'<rect x="45" y="45" width="800" height="490" rx="36" fill="{BLUE}"/>')
    p.append(bp.logo(82, 80, 230, CREAM))
    p.append(f'<text x="85" y="245" fill="{WHITE}" {FB} font-size="48">OU SCANNEZ</text>')
    p.append(f'<text x="86" y="292" fill="{WHITE}" opacity=".78" {FR} font-size="21">avec l’appareil photo</text>')
    p.append(f'<text x="86" y="408" fill="{WHITE}" opacity=".62" {FR} font-size="15" letter-spacing="2">MÊME DESTINATION QUE LE NFC</text>')
    p.append(f'<text x="86" y="452" fill="{YELLOW}" {FBD} font-size="17">tapote.fr</text>')
    p.append(bp.qr_block(590, 155, 210))
    p.append(bp.crop_marks(W, H, 20))
    return bp.svg_doc(89, 58, "".join(p))

FILES = {
    "chevalet-avis-google-PHOTO-105x148": chevalet("avis"),
    "chevalet-menu-PHOTO-105x148": chevalet("menu"),
    "plaque-avis-google-fondperdu-126x126": plaque("avis"),
    "plaque-reservation-fondperdu-126x126": plaque("reservation"),
    "vitrine-avis-google-fondperdu-96x96": vitrine("avis"),
    "vitrine-instagram-fondperdu-96x96": vitrine("instagram"),
    "carte-avis-google-recto-fondperdu-89x58": carte_recto("avis"),
    "carte-contact-recto-fondperdu-89x58": carte_recto("contact"),
    "carte-verso-universel-fondperdu-89x58": carte_verso(),
}

import re
for name, svg in FILES.items():
    with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
        f.write(svg)
    m = re.search(r'width="(\d+)mm" height="(\d+)mm"', svg)
    w, h = m.group(1), m.group(2)
    with open(os.path.join(OUT, f"{name}.html"), "w") as f:
        f.write(f'<!doctype html><html><head><meta charset="utf-8"><style>'
                f'@page{{size:{w}mm {h}mm;margin:0}}html,body{{margin:0;padding:0}}'
                f'svg{{display:block;width:{w}mm;height:{h}mm}}</style></head><body>{svg}</body></html>')

print(f"OK — {len(FILES)} fichiers dans {OUT}")
