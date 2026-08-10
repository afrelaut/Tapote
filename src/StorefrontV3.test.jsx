// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StorefrontV3 from "./StorefrontV3.jsx";
import { PRODUCTS } from "../shared/catalog.js";

function renderRoute(path) {
  window.history.pushState({}, "", path);
  return render(<StorefrontV3 />);
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url === "/api/catalog") {
      return {
        ok: true,
        json: async () => ({
          products: Object.keys(PRODUCTS).map((productId) => ({ productId, online: true, availableStock: 20 })),
        }),
      };
    }
    return { ok: true, json: async () => ({ ok: true }) };
  }));
});

async function waitForCatalog() {
  await waitFor(() => expect(document.querySelector(".v3-site")).toHaveAttribute("data-catalog-status", "ready"));
}

function fillRequiredDestination(url = "https://example.com/tapote") {
  fireEvent.change(screen.getByLabelText("Lien obligatoire à ouvrir"), { target: { value: url } });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Boutique Tapote V3", () => {
  it("rend le menu mobile modal au clavier et restaure le focus", () => {
    renderRoute("/");
    const toggle = screen.getByRole("button", { name: "Ouvrir le menu" });
    const main = document.getElementById("main-content");
    toggle.focus();
    fireEvent.click(toggle);
    const firstMenuLink = document.querySelector(".v3-header nav a");
    expect(firstMenuLink).toHaveFocus();
    expect(main).toHaveAttribute("inert");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(main).not.toHaveAttribute("inert");
  });

  it("déplace le focus du lien d’évitement vers le contenu principal", () => {
    renderRoute("/");
    fireEvent.click(screen.getByRole("link", { name: "Aller au contenu" }));
    const main = document.getElementById("main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveFocus();
  });

  it("ouvre une vraie navigation Boutique structurée par formats, packs et projets", () => {
    renderRoute("/");
    const trigger = screen.getByRole("button", { name: /Boutique/i });
    fireEvent.mouseEnter(trigger.closest(".v3-shop-nav"));
    fireEvent.click(trigger, { detail: 1 });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Les trois formats")).toBeVisible();
    expect(screen.getByText("Les trois packs")).toBeVisible();
    expect(screen.getByText("Projet")).toBeVisible();
    expect(screen.getByText("Chevalet · dès 49 €")).toBeVisible();
    expect(screen.getByText("Essentiel · dès 79 €")).toBeVisible();
    expect(document.querySelector('.v3-desktop-nav-link[href="/comment-ca-marche"]')).toHaveTextContent("Comment ça marche");
    expect(document.querySelector('.v3-desktop-nav-link[href="/tapote-pilot"]')).toHaveTextContent("Tapote Pilot");
    expect(document.querySelector('.v3-desktop-nav-link[href="/entreprises"]')).toHaveTextContent("Entreprises");
  });

  it("publie une route Entreprises distincte et conserve la route Devis", () => {
    renderRoute("/entreprises");
    expect(screen.getByRole("heading", { level: 1, name: /Votre projet.*Un tarif clair/i })).toBeVisible();
    expect(screen.getByText("Entreprises", { selector: ".v3-breadcrumb b" })).toBeVisible();
    expect(document.title).toContain("entreprises");
    cleanup();
    renderRoute("/devis");
    expect(screen.getByText("Devis", { selector: ".v3-breadcrumb b" })).toBeVisible();
  });

  it("présente une landing de marque orientée produit sans preuve inventée", () => {
    renderRoute("/");
    expect(screen.getByRole("heading", { level: 1, name: /Le bon geste.*Au bon moment/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le geste devient.*une vraie fonction/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Trois formats.*Une seule signature/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Une action utile.*Au bon endroit/i })).toBeVisible();
    expect(screen.getByText("BAT avant fabrication personnalisée")).toBeVisible();
    expect(screen.getAllByText("Tapote Pilot inclus").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Prêt à créer le vôtre/i })).toBeVisible();
    // La landing conserve une sélection courte d'usages, mais évite les
    // anciennes sections redondantes et les promesses sans preuve.
    expect(screen.queryByRole("heading", { name: /Un support imprimé est figé/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Tapote Link/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/20\s*000|30\s*000/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Voir les recommandations par activité/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Solutions par métier/i })).not.toBeInTheDocument();
    expect(document.querySelector(".v3-home-pilot")).not.toBeInTheDocument();
    expect(document.querySelector(".v3-faq")).not.toBeInTheDocument();
    const proof = document.querySelector(".v3-proof-band");
    const feature = document.querySelector(".v3-feature-3d");
    const products = document.querySelector(".v3-immersive-pack");
    expect(proof.compareDocumentPosition(feature) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(feature.compareDocumentPosition(products) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("n’expose pas de centre de preuves tant que Tapote ne dispose pas de preuves publiables", () => {
    renderRoute("/preuves");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Preuves" })).not.toBeInTheDocument();
  });

  it("retire la page FAQ autonome", () => {
    renderRoute("/faq");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
    expect(screen.queryByRole("searchbox", { name: /FAQ/i })).not.toBeInTheDocument();
  });

  it("montre les trois formats, leurs prix de départ et mène vers la boutique", () => {
    renderRoute("/");
    expect(screen.getByRole("button", { name: /Chevalet.*49\s*€.*59\s*€/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Plaque.*29\s*€.*39\s*€/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Carte.*19\s*€.*29\s*€/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Composer mon équipement/i })).toHaveAttribute("href", "/boutique#packs");
  });

  it("sépare la découverte de Tapote Pilot de la connexion", () => {
    renderRoute("/tapote-pilot");
    expect(screen.getByRole("heading", { level: 1, name: /Le lien change.*Le support reste/i })).toBeInTheDocument();
    expect(screen.queryByText(/tarif en validation/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Accéder à Tapote Pilot/i }).every((link) => link.getAttribute("href") === "/connexion")).toBe(true);
    expect(document.title).toContain("Tapote Pilot");
  });

  it("présente les prix décidés pour les trois supports", () => {
    renderRoute("/boutique");
    expect(screen.getByRole("heading", { name: "Chevalet" }).closest("article")).toHaveTextContent(/49 €.*59 €/s);
    expect(screen.getByRole("heading", { name: "Plaque" }).closest("article")).toHaveTextContent(/29 €.*39 €/s);
    expect(screen.getByRole("heading", { name: "Carte" }).closest("article")).toHaveTextContent(/19 €.*29 €/s);
  });

  it("envoie chaque format vers la bonne offre prête à poser", async () => {
    renderRoute("/boutique");
    await waitForCatalog();
    const plaque = screen.getByRole("heading", { name: "Plaque" }).closest("article");
    expect(within(plaque).getByRole("link", { name: /Voir l’offre Plaque/i }))
      .toHaveAttribute("href", "/produits/plaque?offre=plaque_prete");
  });

  it("envoie la personnalisation vers le Studio de la fiche produit", async () => {
    renderRoute("/boutique");
    await waitForCatalog();
    const comptoir = screen.getByRole("heading", { name: "Chevalet" }).closest("article");
    expect(within(comptoir).getByRole("link", { name: /À votre image/i }))
      .toHaveAttribute("href", "/produits/comptoir?offre=chevalet_personnalise");
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([]);
  });

  it("affiche les trois packs et les deux finitions", () => {
    renderRoute("/boutique#packs");
    expect(screen.getByRole("heading", { name: "Pack Essentiel" }).closest("article")).toHaveTextContent(/79 €.*99 €/s);
    expect(screen.getByRole("heading", { name: "Pack Comptoir" }).closest("article")).toHaveTextContent(/119 €.*149 €/s);
    expect(screen.getByRole("heading", { name: "Pack Équipe" }).closest("article")).toHaveTextContent(/179 €.*219 €/s);
  });

  it("garde une seule action d’achat sur la fiche personnalisée", () => {
    renderRoute("/produits/comptoir?offre=chevalet_personnalise");
    expect(screen.getByRole("heading", { level: 1, name: "Tapote Comptoir" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Je personnalise moi-même/i }));
    expect(screen.getByText(/Nous vérifions le design, le QR et la zone NFC/i)).toBeVisible();
    expect(within(document.querySelector(".v3-buybox-summary")).getByRole("button", { name: /Ajouter le lien/i })).toBeVisible();
    expect(document.querySelectorAll(".v3-buybox-summary")).toHaveLength(1);
    expect(screen.getAllByText("59 €", { selector: "strong" }).length).toBeGreaterThan(0);
  });

  it("considère le slug public Comptoir comme un vrai PDP indexable", () => {
    renderRoute("/produits/comptoir?mode=custom");
    expect(screen.getByRole("heading", { level: 1, name: "Tapote Comptoir" })).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow,max-image-preview:large");
    expect(document.title).toContain("Tapote Comptoir");
  });

  it("ajoute la fiche personnalisée au panier avec sa quantité", async () => {
    renderRoute("/produits/comptoir?offre=chevalet_personnalise");
    await waitForCatalog();
    const offerChoice = screen.getByRole("group", { name: /Choisissez votre offre/i });
    const comptoirOffer = within(offerChoice).getByRole("button", { name: /Comptoir/i });
    expect(comptoirOffer).toHaveTextContent("149 €");
    fireEvent.click(comptoirOffer);
    fillRequiredDestination();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(screen.getByText("Ajouté au panier")).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({
        productId: "pack_comptoir",
        actionId: "avis",
        quantity: 1,
        supportComposition: { comptoir: 2, plaque: 1, carte: 1 },
      }),
    ]);
  });

  it("ajoute la version prête à servir depuis sa fiche", async () => {
    renderRoute("/produits/carte?mode=ready");
    await waitForCatalog();
    fillRequiredDestination();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "carte_prete", actionId: "contact", quantity: 1 }),
    ]);
  });

  it("bloque l’ajout si le catalogue serveur ne peut pas être vérifié", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    renderRoute("/produits/carte?mode=ready");
    await waitFor(() => expect(document.querySelector(".v3-site")).toHaveAttribute("data-catalog-status", "error"));
    fillRequiredDestination();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(screen.getByText(/Le catalogue ne peut pas être vérifié/i)).toBeVisible();
    expect(window.localStorage.getItem("tapote-cart-v3")).toBe("[]");
    // Un échec ne doit jamais emprunter l’habillage du succès : ni le titre
    // « Ajouté au panier », ni le lien vers un panier resté vide.
    const alert = screen.getByRole("alert");
    expect(alert).toBeVisible();
    expect(within(alert).getByText("Ajout impossible")).toBeVisible();
    expect(screen.queryByText("Ajouté au panier")).not.toBeInTheDocument();
    // Le panier de l’en-tête reste, lui, toujours présent : on ne contrôle que
    // les actions proposées par l’alerte elle-même.
    expect(within(alert).queryByRole("link", { name: /Voir le panier/i })).not.toBeInTheDocument();
  });

  it("intègre le Studio directement dans la fiche du support sans changer de page", async () => {
    renderRoute("/produits/comptoir?action=avis");
    await waitForCatalog();
    expect(screen.queryByRole("button", { name: "Chevalet" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Plaque" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));
    expect(screen.getByLabelText("Nom de votre entreprise")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Nom de votre entreprise"), { target: { value: "CAFÉ RICO" } });
    // Instagram ne fait pas partie des six actions mises en avant : il faut
    // d’abord déplier les actions secondaires.
    expect(screen.queryByRole("button", { name: "Instagram" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /autres actions/ }));
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    fillRequiredDestination("https://instagram.com/tapote");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({
        productId: "chevalet_personnalise",
        brandName: "CAFÉ RICO",
        actionId: "instagram",
        destinationUrl: "https://instagram.com/tapote",
      }),
    ]);
  });

  it("synchronise le décor métier, le support et l’écran du téléphone sur les fiches produit", () => {
    renderRoute("/produits/comptoir?action=avis");
    fireEvent.click(screen.getByRole("button", { name: "En situation" }));
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Avis Google" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Menu" })).toBeVisible();

    fireEvent.change(screen.getByRole("combobox", { name: "Choisir votre activité" }), { target: { value: "salon" } });
    expect(screen.getByRole("button", { name: /Beauté, coiffure & bien-être/i })).toBeVisible();
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Réservation" })).toBeVisible();
  });

  it("partage une architecture PDP courte avec une seule zone principale d’achat", () => {
    renderRoute("/produits/comptoir?action=avis");
    const main = document.getElementById("main-content");
    const intro = main.querySelector(".v3-product-intro");
    const gallery = main.querySelector(".v3-product-gallery");

    expect(main.querySelectorAll(":scope > section")).toHaveLength(6);
    expect(main.querySelector(".v3-product-examples")).not.toBeInTheDocument();
    expect(main.querySelectorAll(".v3-buybox")).toHaveLength(1);
    expect(main.querySelectorAll(".v3-product-assurance, .v3-product-price-line, .v3-product-facts")).toHaveLength(0);
    expect(intro.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(intro).queryByText("69 €")).not.toBeInTheDocument();
    expect(main.querySelector(".v3-product-offer-summary")).not.toBeInTheDocument();
    expect(within(intro).queryByRole("link", { name: /Configurer Comptoir/i })).not.toBeInTheDocument();
  });

  it("n’affiche la barre d’achat mobile qu’après l’offre initiale", async () => {
    const observers = [];
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }

      observe(element) {
        this.element = element;
      }

      disconnect() {}
    });
    renderRoute("/produits/plaque");
    const sticky = screen.getByRole("complementary", { name: "Résumé de la configuration" });
    const initialObserver = observers.find(({ element }) => element?.classList.contains("v3-product-intro"));
    const summaryObserver = observers.find(({ element }) => element?.classList.contains("v3-buybox-summary"));

    expect(sticky).not.toHaveClass("is-visible");
    act(() => initialObserver.callback([{ isIntersecting: false, boundingClientRect: { bottom: -1 } }]));
    await waitFor(() => expect(sticky).toHaveClass("is-visible"));
    act(() => summaryObserver.callback([{ isIntersecting: true, boundingClientRect: { bottom: 600 } }]));
    await waitFor(() => expect(sticky).not.toHaveClass("is-visible"));
  });

  it("complète la fiche produit avec processus, Pilot inclus et FAQ", () => {
    renderRoute("/produits/comptoir?action=avis");
    expect(screen.getByRole("heading", { name: /Prêt, sans réglage technique/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Ce support reste visible dans Pilot/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Voir Tapote Pilot/i })).toHaveAttribute("href", "/tapote-pilot");
    expect(within(document.querySelector(".v3-related-pack-selector")).getAllByText("Inclus")).toHaveLength(3);
    expect(screen.getByText("1 chevalet · 1 plaque · 1 carte")).toBeVisible();
    expect(screen.getByText("2 chevalets · 1 plaque · 1 carte")).toBeVisible();
    expect(screen.getByText("2 chevalets · 2 plaques · 3 cartes")).toBeVisible();
    expect(screen.queryByText("Gestion des supports")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avant de commander." })).toBeVisible();
  });

  it("retire le répertoire des secteurs et toutes ses sous-pages", () => {
    renderRoute("/secteurs");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
    cleanup();
    renderRoute("/secteurs/artisans-services-terrain");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
  });

  it("démontre le geste sans dupliquer les explications ni la page Pilot", () => {
    renderRoute("/comment-ca-marche");
    fireEvent.click(screen.getByRole("button", { name: "En situation" }));
    fireEvent.click(screen.getByRole("button", { name: "Instagram · Plaque" }));
    expect(screen.getByRole("button", { name: "Instagram · Plaque" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("img", { name: "Écran du téléphone après ouverture : Instagram" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "LinkedIn · Card" })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Du support à la bonne page/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Approchez ou scannez/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le support reste visible/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Voir Tapote Pilot/i })).toHaveAttribute("href", "/tapote-pilot");
    expect(document.querySelector(".v3-how-plan-panel")).not.toBeInTheDocument();
    expect(document.querySelector(".v3-how-faq")).not.toBeInTheDocument();
  });

  it("récapitule le prix et Tapote Pilot inclus dans la commande", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "plaque_personnalisee",
      actionId: "avis",
      quantity: 1,
      brandName: "",
      theme: "nuit",
      targetId: "cafe",
      customHeadline: "",
      destinationUrl: "",
      brandLogoId: "",
      logoFileName: "",
    }]));
    renderRoute("/commande");
    expect(screen.getByText(/Tapote Pilot est inclus pour retrouver vos supports/i)).toBeVisible();
    expect(screen.getAllByText("39 €").length).toBeGreaterThan(0);
  });

  it("présente des CGV compatibles avec l’invitation Studio et le BAT", () => {
    renderRoute("/cgv");
    expect(screen.getByRole("heading", { name: "Conditions générales de vente", level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Personnalisation et BAT/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Conformité et réclamations/i })).toBeVisible();
  });

  /* La readiness gate vérifie que les variables légales sont remplies, jamais
     que les CGV contiennent les clauses obligatoires : basculer LEGAL_READY
     ouvrirait la vente quel que soit le contenu publié. Ce test ferme l'écart. */
  it("publie les mentions contractuelles obligatoires avant toute vente", () => {
    renderRoute("/cgv");
    const cgv = document.querySelector(".v3-legal-sections").textContent;
    expect(cgv).toMatch(/rétractation/i);
    expect(cgv).toMatch(/L221-28/);
    expect(cgv).toMatch(/garantie légale de conformité/i);
    expect(cgv).toMatch(/vices cachés/i);
    expect(cgv).toMatch(/médiateur de la consommation/i);
    expect(cgv).not.toMatch(/prix actuel/i);
  });

  it("expose les mentions légales et la politique de confidentialité attendues", () => {
    renderRoute("/mentions-legales");
    const mentions = document.querySelector(".v3-legal-sections").textContent;
    expect(mentions).toMatch(/\bEI\b/);
    expect(mentions).toMatch(/RCS/);

    cleanup();
    renderRoute("/confidentialite");
    const privacy = document.querySelector(".v3-legal-sections").textContent;
    expect(privacy).toMatch(/Sentry/);
    expect(privacy).toMatch(/clauses contractuelles types/i);
    expect(privacy).toMatch(/portabilité/i);
    expect(privacy).toMatch(/Cookies et traceurs/i);
  });

  it("rend une vraie page introuvable sans planter", () => {
    renderRoute("/produits/invente");
    expect(screen.getByRole("heading", { name: /Cette page n’existe pas/i })).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  });

  it("nomme le champ anti-robot et envoie la demande de devis", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal("fetch", fetchSpy);
    renderRoute("/devis");
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(honeypot.labels[0]).toHaveTextContent("Site web");
    fireEvent.change(screen.getByLabelText("Nombre de lieux *"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Volume estimé *"), { target: { value: "10–24 supports" } });
    fireEvent.change(screen.getByLabelText("Action principale *"), { target: { value: "Avis Google" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuer vers vos coordonnées/i }));
    fireEvent.change(screen.getByLabelText("Votre nom *"), { target: { value: "Rico Test" } });
    fireEvent.change(screen.getByLabelText("E-mail professionnel *"), { target: { value: "rico@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuer vers le brief/i }));
    fireEvent.change(screen.getByLabelText("Précisions utiles *"), { target: { value: "12 supports pour trois établissements" } });
    fireEvent.click(screen.getByLabelText(/J’accepte que Tapote/i));
    fireEvent.click(screen.getByRole("button", { name: /Recevoir une proposition/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/lead", expect.objectContaining({ method: "POST" })));
    const [, request] = fetchSpy.mock.calls.find(([url]) => url === "/api/lead");
    expect(JSON.parse(request.body).need).toContain("Nombre de lieux : 3");
    expect(JSON.parse(request.body).need).toContain("Volume estimé : 10–24 supports");
    expect(await screen.findByText(/Demande reçue/i)).toBeVisible();
  });

  it("remplace le paiement par un devis à partir de 10 supports", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "pack_equipe_pret",
      actionId: "avis",
      quantity: 2,
      brandName: "GROUPE TEST",
      theme: "nuit",
      targetId: "cafe",
      customHeadline: "",
      destinationUrl: "",
      brandLogoId: "",
      logoFileName: "",
      supportComposition: { comptoir: 2, plaque: 2, carte: 3 },
    }]));
    renderRoute("/panier");
    expect(screen.getByText(/14 supports : un devis sera plus juste/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Demander un devis/i })).toHaveAttribute("href", "/devis");
    expect(screen.queryByRole("link", { name: /Continuer vers la commande/i })).not.toBeInTheDocument();
  });

  it("permet de reprendre une session Stripe expirée", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ status: "expired" }) })));
    renderRoute("/commande/confirmee?session_id=cs_test_expired");
    expect(await screen.findByRole("heading", { name: /La session de paiement a expiré/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Reprendre la commande/i })).toHaveAttribute("href", "/commande");
  });
});
