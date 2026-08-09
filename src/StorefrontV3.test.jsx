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

  it("ouvre une vraie navigation Boutique structurée par produits, matières et packs", () => {
    renderRoute("/");
    const trigger = screen.getByRole("button", { name: /Boutique/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Les supports")).toBeVisible();
    expect(screen.getByText("Deux modes")).toBeVisible();
    expect(screen.getByText("Packs & entreprises")).toBeVisible();
    expect(screen.getByText("Prêt à poser")).toBeVisible();
    expect(screen.getByText("À votre image")).toBeVisible();
  });

  it("présente une landing de marque orientée produit sans preuve inventée", () => {
    renderRoute("/");
    expect(screen.getByRole("heading", { level: 1, name: /Le bon geste.*Au bon moment/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Quatre choix.*Le prix tout de suite/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Vous choisissez.*On prépare.*Vous posez/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Vos supports.*Leurs destinations/i })).toBeVisible();
    expect(screen.getByText("BAT avant fabrication personnalisée")).toBeVisible();
    expect(screen.getAllByText("Tapote Pilot inclus").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Un support imprimé est figé/i })).toBeVisible();
    expect(screen.getByText("Le NFC et le QR ouvrent la même destination Tapote.")).toBeVisible();
    // Tout chiffre publié doit rester attaché à sa source datée.
    expect(screen.getByText(/Avis Vérifiés by Skeepers.*fin 2024/)).toBeVisible();
    expect(screen.queryByText(/Tapote Link/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/20\s*000|30\s*000/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Voir les recommandations par activité/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Solutions par métier/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll("#main-content > section")).toHaveLength(9);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("n’expose pas de centre de preuves tant que Tapote ne dispose pas de preuves publiables", () => {
    renderRoute("/preuves");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Preuves" })).not.toBeInTheDocument();
  });

  it("propose une FAQ complète et filtrable", () => {
    renderRoute("/faq");
    expect(screen.getByRole("heading", { level: 1, name: /Une réponse claire.*Avant de commander/i })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher dans la FAQ" }), { target: { value: "BAT" } });
    expect(screen.getByText("Qu’est-ce qu’un BAT ?")).toBeVisible();
    expect(screen.queryByText("Quel support choisir ?")).not.toBeInTheDocument();
  });

  it("montre les quatre offres publiques, leurs prix et mène vers la boutique", () => {
    renderRoute("/");
    expect(screen.getByRole("heading", { name: "Tapote Comptoir" }).closest("article")).toHaveTextContent("69 €");
    expect(screen.getByRole("heading", { name: "Tapote Plaque" }).closest("article")).toHaveTextContent("59 €");
    expect(screen.getByRole("heading", { name: "Tapote Card" }).closest("article")).toHaveTextContent("39 €");
    expect(screen.getByRole("heading", { name: "Pack Local" }).closest("article")).toHaveTextContent("119 €");
    expect(screen.getAllByRole("link", { name: "Voir la boutique" })[0]).toHaveAttribute("href", "/boutique");
  });

  it("sépare la découverte de Tapote Pilot de la connexion", () => {
    renderRoute("/tapote-pilot");
    expect(screen.getByRole("heading", { level: 1, name: /Le bon lien.*Même après la pose/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le lien change.*Le support reste/i })).toBeVisible();
    expect(screen.queryByText(/tarif en validation/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Accéder à Tapote Pilot/i }).every((link) => link.getAttribute("href") === "/connexion")).toBe(true);
    expect(document.title).toContain("Tapote Pilot");
  });

  it("présente les prix décidés pour les trois supports", () => {
    renderRoute("/boutique");
    expect(screen.getByRole("heading", { name: "Tapote Comptoir" }).closest("article")).toHaveTextContent("69 €");
    expect(screen.getByRole("heading", { name: "Tapote Plaque" }).closest("article")).toHaveTextContent("59 €");
    expect(screen.getByRole("heading", { name: "Tapote Card" }).closest("article")).toHaveTextContent("39 €");
    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));
    expect(screen.getByRole("heading", { name: "Tapote Comptoir" }).closest("article")).toHaveTextContent("89 €");
    expect(screen.getByRole("heading", { name: "Tapote Plaque" }).closest("article")).toHaveTextContent("79 €");
    expect(screen.getByRole("heading", { name: "Tapote Card" }).closest("article")).toHaveTextContent("59 €");
  });

  it("garde l’action de l’aperçu lors d’un ajout rapide depuis la boutique", async () => {
    renderRoute("/boutique");
    await waitForCatalog();
    const plaque = screen.getByRole("heading", { name: "Tapote Plaque" }).closest("article");
    fireEvent.click(within(plaque).getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "plaque_standard", actionId: "reservation" }),
    ]);
  });

  it("envoie la personnalisation vers le Studio de la fiche produit", async () => {
    renderRoute("/boutique");
    await waitForCatalog();
    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));
    const comptoir = screen.getByRole("heading", { name: "Tapote Comptoir" }).closest("article");
    expect(within(comptoir).getByRole("link", { name: /Personnaliser/i })).toHaveAttribute("href", "/produits/comptoir?mode=custom");
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([]);
  });

  it("affiche uniquement le Pack Local public et son prix selon le mode", () => {
    renderRoute("/boutique#packs");
    expect(screen.getByRole("heading", { name: "Pack Local" }).closest("article")).toHaveTextContent("119 €");
    expect(screen.queryByRole("heading", { name: "Pack Parcours" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));
    expect(screen.getByRole("heading", { name: "Pack Local" }).closest("article")).toHaveTextContent("159 €");
  });

  it("garde une seule action d’achat sur la fiche personnalisée", () => {
    renderRoute("/produits/chevalet?mode=custom");
    expect(screen.getByRole("heading", { level: 1, name: "Tapote Comptoir" })).toBeVisible();
    expect(screen.getByText("Tapote Studio")).toBeVisible();
    expect(screen.getByText(/Un BAT technique final vérifie/i)).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Ajouter au panier" })).toHaveLength(1);
    expect(screen.getAllByText("89 €", { selector: "strong" }).length).toBeGreaterThan(0);
  });

  it("considère le slug public Comptoir comme un vrai PDP indexable", () => {
    renderRoute("/produits/comptoir?mode=custom");
    expect(screen.getByRole("heading", { level: 1, name: "Tapote Comptoir" })).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow,max-image-preview:large");
    expect(document.title).toContain("Tapote Comptoir");
  });

  it("ajoute la fiche personnalisée au panier avec sa quantité", async () => {
    renderRoute("/produits/chevalet?mode=custom");
    await waitForCatalog();
    fireEvent.click(screen.getByRole("button", { name: /2 supports/i }));
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(screen.getByText("Ajouté au panier")).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "pack_duo", actionId: "avis", quantity: 1 }),
    ]);
  });

  it("ajoute la version prête à servir depuis sa fiche", async () => {
    renderRoute("/produits/carte?mode=ready");
    await waitForCatalog();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "carte_standard", actionId: "contact", quantity: 1 }),
    ]);
  });

  it("bloque l’ajout si le catalogue serveur ne peut pas être vérifié", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    renderRoute("/produits/carte?mode=ready");
    await waitFor(() => expect(document.querySelector(".v3-site")).toHaveAttribute("data-catalog-status", "error"));
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
    // d’abord déplier « Plus d’actions ».
    expect(screen.queryByRole("button", { name: "Instagram" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Plus d’actions/ }));
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    fireEvent.change(screen.getByLabelText("Adresse exacte à ouvrir"), { target: { value: "https://instagram.com/tapote" } });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({
        productId: "comptoir",
        brandName: "CAFÉ RICO",
        actionId: "instagram",
        destinationUrl: "https://instagram.com/tapote",
      }),
    ]);
  });

  it("synchronise le décor métier, le support et l’écran du téléphone sur les fiches produit", () => {
    renderRoute("/produits/comptoir?action=avis");
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

    expect(main.querySelectorAll(":scope > section")).toHaveLength(7);
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
    expect(screen.getByRole("heading", { name: /Vous choisissez.*On contrôle le reste/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le support reste.*Sa destination évolue/i })).toBeVisible();
    expect(screen.getByText("Gestion des supports")).toBeVisible();
    expect(screen.getByText("Pilot Pro", { selector: "strong" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Avant de commander." })).toBeVisible();
  });

  it("retire le répertoire des secteurs et toutes ses sous-pages", () => {
    renderRoute("/secteurs");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
    cleanup();
    renderRoute("/secteurs/artisans-services-terrain");
    expect(screen.getByRole("heading", { level: 1, name: "Cette page n’existe pas." })).toBeVisible();
  });

  it("démontre les destinations et garde Pilot Pro sans prix inventé", () => {
    renderRoute("/comment-ca-marche");
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Menu" })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Changez la destination.*Pas l’objet/i })).toBeVisible();
    expect(screen.getByText("Voir la destination active")).toBeVisible();
    expect(screen.getByText("Pilot Pro", { selector: "strong" })).toBeVisible();
    expect(document.querySelector(".v3-how-plan-panel")).not.toHaveTextContent(/Tarif|€|mois/i);
  });

  it("récapitule le prix et Tapote Pilot inclus dans la commande", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "plaque",
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
    expect(screen.getByText(/Tapote Pilot est inclus pour l’activation/i)).toBeVisible();
    expect(screen.getAllByText("79 €").length).toBeGreaterThan(0);
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
      productId: "pack_cinq",
      actionId: "avis",
      quantity: 2,
      brandName: "GROUPE TEST",
      theme: "nuit",
      targetId: "cafe",
      customHeadline: "",
      destinationUrl: "",
      brandLogoId: "",
      logoFileName: "",
      supportComposition: { comptoir: 2, plaque: 3 },
    }]));
    renderRoute("/panier");
    expect(screen.getByText(/10 supports : un devis sera plus juste/i)).toBeVisible();
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
