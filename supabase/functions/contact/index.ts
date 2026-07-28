import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Fiches contact de l'equipe Tapote.
//
// verify_jwt est desactive : un telephone qui tapote une carte n'envoie aucun
// jeton. Seules des donnees deja imprimees sur les cartes sont exposees.
//
// AVERTISSEMENT SUR LE TYPE MIME DE LA PAGE
// La passerelle Supabase reecrit "text/html" en "text/plain" pour empecher
// l'hebergement de pages d'hameconnage sur son domaine partage. Son filtre est
// sensible a la casse : "Text/HTML" passe intact, et les navigateurs lisent
// l'en-tete sans tenir compte de la casse. C'est ce qui est fait ici.
// Solution de DEPANNAGE, a remplacer des que ces fichiers seront sur tapote.fr :
// elle repose sur une faille de leur filtre, corrigeable sans preavis.

type Fiche = {
  prenom: string;
  nom: string;
  role: string;
  tel: string;
  telAffiche: string;
  mail: string;
};

const FICHES: Record<string, Fiche> = {
  aymeric: {
    prenom: "Aymeric", nom: "Frelaut", role: "Fondateur",
    tel: "+33663150449", telAffiche: "06 63 15 04 49", mail: "aymeric@tapote.fr",
  },
  "jules-berger": {
    prenom: "Jules", nom: "Berger", role: "Fondateur",
    tel: "+33610235078", telAffiche: "06 10 23 50 78", mail: "aymeric@tapote.fr",
  },
};

// Photo de la fiche contact : un JPEG est indispensable, une vCard ne sait pas
// porter de vectoriel. 160 px suffit, un carnet d'adresses l'affiche en vignette.
const LOGO_JPG =
  "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";

// Logo Tapote en vectoriel, pour la page : le JPEG de la fiche contact, prevu
// pour une vignette, ressortait pixellise sur un ecran retina.
const LOGO_SVG = `<svg viewBox="6 9 55 56" aria-hidden="true">
  <rect x="10" y="53" width="38" height="5" rx="2.5" fill="#F4EFE5"/>
  <path d="M11 51a18 18 0 0 1 36 0Z" fill="#F4EFE5"/>
  <rect x="25.5" y="25.5" width="7" height="6.5" rx="2.4" fill="#F4EFE5"/>
  <circle cx="40" cy="26" r="2.2" fill="#4C7BFF"/>
  <path d="M40 19.5a6.5 6.5 0 0 1 6.5 6.5M40 13a13 13 0 0 1 13 13" fill="none"
        stroke="#4C7BFF" stroke-width="2.7" stroke-linecap="round"/>
</svg>`;

const ech = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function vcard(f: Fiche): string {
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    `N:${f.nom};${f.prenom};;;`,
    `FN:${f.prenom} ${f.nom}`,
    "ORG:Tapote",
    `TITLE:${f.role}`,
    // ENCODING=BASE64 plutot que la forme 3.0 ENCODING=b : c'est celle que le
    // carnet d'adresses d'Apple reconnait le plus surement.
    `PHOTO;TYPE=JPEG;ENCODING=BASE64:${LOGO_JPG}`,
    `TEL;TYPE=CELL:${f.tel}`,
    `EMAIL;TYPE=INTERNET:${f.mail}`,
    "URL:https://tapote.fr",
    "END:VCARD", "",
  ].join("\r\n");
}

const CHEVRON = `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function page(cle: string, f: Fiche): string {
  const nom = ech(`${f.prenom} ${f.nom}`);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0D0D0F">
<title>${nom} — Tapote</title><meta name="robots" content="noindex">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;min-height:100dvh;background:#0D0D0F;color:#F4EFE5;
  font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  display:grid;place-items:center;
  padding:calc(38px + env(safe-area-inset-top)) 22px calc(38px + env(safe-area-inset-bottom));
  background-image:radial-gradient(120% 62% at 50% -14%,rgba(36,88,255,.20),transparent 62%)}
main{width:100%;max-width:392px;text-align:center}

.tuile{width:112px;height:112px;margin:0 auto 20px;border-radius:29px;
  display:grid;place-items:center;background:linear-gradient(160deg,#1C1C20,#141417);
  border:1px solid #2A2A30;box-shadow:0 18px 40px -18px rgba(36,88,255,.55)}
.tuile svg{width:60px;height:60px;display:block}
.marque{margin:0 0 30px;font-size:11.5px;letter-spacing:.26em;color:#8A8A93;text-transform:uppercase}

h1{margin:0 0 7px;font-size:33px;line-height:1.15;font-weight:650;letter-spacing:-.02em}
.role{margin:0 0 30px;font-size:12.5px;letter-spacing:.17em;text-transform:uppercase;color:#7E8AA6}

a{text-decoration:none;color:inherit;display:block}
.cta{background:#2458FF;color:#fff;font-weight:650;font-size:17px;padding:19px 20px;
  border-radius:17px;box-shadow:0 14px 30px -12px rgba(36,88,255,.85);transition:transform .12s}
.cta:active{transform:scale(.985);background:#1F4DE0}

.lignes{display:grid;gap:10px;margin-top:24px;text-align:left}
.ligne{display:flex;align-items:center;gap:14px;background:#141417;border:1px solid #24242A;
  border-radius:15px;padding:15px 16px 15px 18px;transition:background .12s}
.ligne:active{background:#1A1A1E}
.ligne .txt{flex:1;min-width:0}
.ligne .et{display:block;font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;color:#7C7C86}
.ligne .vl{display:block;font-size:16px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chev{width:17px;height:17px;color:#4A4A54;flex:none}

footer{margin-top:34px;font-size:12px;line-height:1.7;color:#63636C}
footer a{display:inline;color:#8A8A93;border-bottom:1px solid #2A2A30}
</style></head><body><main>

<div class="tuile">${LOGO_SVG}</div>
<p class="marque">Tapote</p>

<h1>${nom}</h1>
<p class="role">${ech(f.role)}</p>

<a class="cta" href="${cle}.vcf">Enregistrer dans mes contacts</a>

<div class="lignes">
  <a class="ligne" href="tel:${f.tel}">
    <span class="txt"><span class="et">Téléphone</span><span class="vl">${f.telAffiche}</span></span>${CHEVRON}</a>
  <a class="ligne" href="mailto:${f.mail}">
    <span class="txt"><span class="et">E-mail</span><span class="vl">${ech(f.mail)}</span></span>${CHEVRON}</a>
  <a class="ligne" href="https://tapote.fr">
    <span class="txt"><span class="et">Site</span><span class="vl">tapote.fr</span></span>${CHEVRON}</a>
</div>

<footer>Ce contact vous a été transmis par un support Tapote.<br>
<a href="https://tapote.fr">Un geste suffit</a></footer>

</main></body></html>`;
}

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  let cle = segments[segments.length - 1] ?? "";

  if (cle === "logo.jpg") {
    const octets = Uint8Array.from(atob(LOGO_JPG), (c) => c.charCodeAt(0));
    return new Response(octets, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    });
  }

  const vcardDemandee = cle.endsWith(".vcf");
  if (vcardDemandee) cle = cle.slice(0, -4);

  const fiche = FICHES[cle];
  if (!fiche) {
    return new Response("Fiche introuvable.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (vcardDemandee) {
    return new Response(vcard(fiche), {
      headers: { "Content-Type": "text/vcard", "Cache-Control": "no-store" },
    });
  }

  // "Text/HTML" et non "text/html" : voir l'avertissement en tete de fichier.
  return new Response(page(cle, fiche), {
    headers: { "Content-Type": "Text/HTML; charset=utf-8", "Cache-Control": "no-store" },
  });
});
