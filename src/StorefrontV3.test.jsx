// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StorefrontV3 from "./StorefrontV3.jsx";

function renderRoute(path) {
  window.history.pushState({}, "", path);
  return render(<StorefrontV3 />);
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
});

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

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(toggle).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(firstMenuLink).toHaveFocus();

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

  it("nomme le champ anti-robot du formulaire de devis", () => {
    renderRoute("/devis");
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(honeypot.labels[0]).toHaveTextContent("Site web");
  });

  it("retire la structure des mockups décoratifs du plan de page", () => {
    renderRoute("/?support=comptoir&mode=custom&lien=site");

    const simulatedPage = document.querySelector(".v3-safari-app > .v3-safari-page");
    expect(simulatedPage.closest('[aria-hidden="true"]')).toHaveClass("v3-live-phone-canvas");
    expect(document.querySelector(".v3-safari-app > main")).not.toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(document.querySelector(".v3-product-art")).toHaveAttribute("aria-hidden", "true");
  });

  it("présente une offre e-commerce simple sans détourner vers Pilot", () => {
    renderRoute("/");

    expect(screen.getByRole("heading", { name: /Commencez simple/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Votre marque passe devant/i })).toBeVisible();
    expect(screen.getByText(/Duo dès 55/)).toBeVisible();
    expect(screen.queryByText(/Tapote Pilot/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Créer mon Tapote/i }).some((link) => link.getAttribute("href") === "/personnaliser")).toBe(true);
  });

  it("synchronise l’écran du téléphone de la fiche avec le lien choisi", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=avis");

    const liveScreen = document.querySelector('[data-preview-mode="live"] [data-phone-action="avis"]');
    expect(liveScreen).toHaveAttribute("data-phone-sector", "cafe");
    expect(liveScreen).not.toHaveAttribute("data-native-source");
    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "menu" } });

    expect(document.querySelector('[data-preview-mode="live"] [data-phone-action="menu"]')).toBeInTheDocument();
    expect(window.location.search).toContain("lien=menu");
  });

  it("restaure atomiquement l’identité du mockup prêt à l’emploi", () => {
    renderRoute("/secteurs/boulangeries-patisseries");

    fireEvent.click(screen.getByRole("button", { name: /Studio en direct/i }));
    fireEvent.change(screen.getByLabelText("Nom de votre entreprise"), { target: { value: "BOULANGERIE RICO" } });
    fireEvent.change(screen.getByLabelText("Couleur principale"), { target: { value: "#123456" } });
    expect(document.querySelectorAll(".v3-sector-scene-support .tp-insert-brand")[0]).toHaveTextContent("BOULANGERIE RICO");

    fireEvent.click(screen.getByRole("button", { name: /Prêt à l’emploi/i }));

    const readySupportBrands = [...document.querySelectorAll(".v3-sector-scene-support .tp-insert-brand")];
    expect(readySupportBrands).toHaveLength(2);
    expect(readySupportBrands.every((brand) => brand.textContent === "MAISON LEVAIN")).toBe(true);
    expect(document.querySelector(".v3-sector-scene-screen .v3-live-phone-brand small")).toHaveTextContent("MAISON LEVAIN");
    expect(document.querySelector(".v3-sector-scene-screen").style.getPropertyValue("--v3-phone-primary")).toBe("#141414");
    expect(document.querySelector(".v3-sector-scene-screen").style.getPropertyValue("--v3-phone-accent")).toBe("#2458ff");

    fireEvent.click(screen.getByRole("button", { name: /Studio en direct/i }));
    expect(screen.getByLabelText("Nom de votre entreprise")).toHaveValue("BOULANGERIE RICO");
    expect(screen.getByLabelText("Couleur principale")).toHaveValue("#123456");
  });

  it("masque le logo client en prêt à l’emploi puis le restaure avec le brouillon", () => {
    const uploadedLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    window.sessionStorage.setItem("tapote-logo-preview-v1:logo-test", uploadedLogo);
    window.sessionStorage.setItem("tapote-config-draft-v2:product:comptoir", JSON.stringify({
      actionId: "avis",
      count: 1,
      composition: { comptoir: 1, plaque: 0 },
      brandName: "CAFÉ RICO",
      brandLogoId: "logo-test",
      logoFileName: "rico.svg",
      designStyle: "signature",
      customHeadline: "",
      primaryColor: "#173b57",
      secondaryColor: "#f4b942",
      textColor: "#ffffff",
    }));
    renderRoute("/?support=comptoir&mode=custom&lien=avis");

    expect(document.querySelectorAll('.v3-sector-scene-support .tp-insert-logo img').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Prêt à l’emploi/i }));
    expect(document.querySelectorAll('.v3-sector-scene-support .tp-insert-logo img')).toHaveLength(0);
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-brand")).toHaveTextContent("CAFÉ NOMA");

    fireEvent.click(screen.getByRole("button", { name: /Studio en direct/i }));
    expect(document.querySelectorAll('.v3-sector-scene-support .tp-insert-logo img').length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nom de votre entreprise")).toHaveValue("CAFÉ RICO");
  });

  it("rend des écrans dédiés et reconnaissables pour les apps et réglages", () => {
    renderRoute("/?support=comptoir&mode=custom&lien=avis");

    expect(document.querySelector(".v3-phone-google-stars")).toHaveTextContent("★★★★★");
    expect(screen.getAllByText("Publier un avis")[0]).toBeVisible();

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "instagram" } });
    expect(document.querySelector(".v3-instagram-app")).toBeInTheDocument();
    expect(document.querySelectorAll(".v3-instagram-app .v3-live-social-grid i")).toHaveLength(6);
    expect(document.querySelectorAll(".v3-instagram-app > footer svg")).toHaveLength(5);
    expect(document.querySelector(".v3-instagram-app .v3-live-social-grid i").getAttribute("style")).toContain("sector-cafe-media-v1.webp");
    expect(document.querySelector(".v3-instagram-app .v3-live-social-grid i").getAttribute("style")).not.toContain("tapote-bg-");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "facebook" } });
    expect(document.querySelector(".v3-facebook-app")).toHaveTextContent("CAFÉ DE SPÉCIALITÉ");
    expect(document.querySelector(".v3-facebook-app > article > nav")).toHaveTextContent("Commenter");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "linkedin" } });
    expect(document.querySelector(".v3-linkedin-app")).toHaveTextContent("Torréfié avec soin");
    expect(document.querySelector(".v3-linkedin-app > article > nav")).toHaveTextContent("Republier");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "wifi" } });
    expect(document.querySelector(".v3-ios-wifi-app")).toHaveTextContent("Modifier");
    expect(document.querySelector(".v3-ios-wifi-app")).toHaveTextContent("CAFE_NOMA_GUEST");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "paiement" } });
    expect(document.querySelector(".v3-apple-pay-app")).toHaveTextContent("Confirmer avec le bouton latéral");
    expect(document.querySelector(".v3-apple-pay-app")).toHaveTextContent("contact masqué");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "site" } });
    expect(document.querySelector(".v3-safari-app")).toHaveTextContent("votremarque.fr");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "tiktok" } });
    expect(document.querySelectorAll(".v3-tiktok-app > footer > nav svg")).toHaveLength(5);

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "whatsapp" } });
    expect(document.querySelector(".v3-whatsapp-app")).toHaveTextContent("table pour deux");
    expect(document.querySelector(".v3-whatsapp-app")).toHaveTextContent("✓✓");
    expect(document.querySelectorAll(".v3-whatsapp-app > footer svg")).toHaveLength(3);
  });

  it("utilise les médias restaurant dédiés pour Instagram, Commander et TikTok", () => {
    renderRoute("/secteurs/restaurants-traiteurs-food-trucks");

    const actionSelect = screen.getByLabelText("Le lien à ouvrir");
    expect(Array.from(actionSelect.options, (option) => option.value)).toEqual(expect.arrayContaining([
      "avis", "formulaire", "menu", "reservation", "commande", "paiement", "pourboire", "fidelite", "instagram", "tiktok", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens",
    ]));
    fireEvent.change(actionSelect, { target: { value: "instagram" } });
    const instagramPosts = document.querySelectorAll('[data-preview-mode="live"] .v3-instagram-app .v3-live-social-grid i');
    expect(instagramPosts).toHaveLength(6);
    expect(instagramPosts[0].getAttribute("style")).toContain("restaurant-burrata-v1.webp");

    fireEvent.change(actionSelect, { target: { value: "commande" } });
    const orderImages = document.querySelectorAll('[data-preview-mode="live"] .v3-phone-order-card img');
    expect(orderImages).toHaveLength(3);
    expect(orderImages[1]).toHaveAttribute("src", "/assets/phone/restaurant-canard-v1.webp");

    fireEvent.change(actionSelect, { target: { value: "tiktok" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-tiktok-app').getAttribute("style")).toContain("restaurant-chef-tiktok-v1.webp");
  });

  it("rend les parcours restaurant opérationnels avec des détails crédibles", () => {
    renderRoute("/secteurs/restaurants-traiteurs-food-trucks");

    const actionSelect = screen.getByLabelText("Le lien à ouvrir");
    fireEvent.change(actionSelect, { target: { value: "menu" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-menu-card')).toHaveTextContent("Velouté de potimarron");
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-menu-card')).toHaveTextContent("Magret de canard");

    fireEvent.change(actionSelect, { target: { value: "reservation" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-booking-card')).toHaveTextContent("2 personnes");
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-booking-card')).toHaveTextContent("19:30");

    fireEvent.change(actionSelect, { target: { value: "fidelite" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-loyalty-card')).toHaveTextContent("Dessert maison offert");
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-loyalty-card')).toHaveTextContent("L’ATELIER 21");

    fireEvent.change(actionSelect, { target: { value: "contact" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-contact-card')).toHaveTextContent("bonjour@latelier21.fr");

    fireEvent.change(actionSelect, { target: { value: "multiliens" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-links-card')).toHaveTextContent("Réserver une table");

    fireEvent.change(actionSelect, { target: { value: "formulaire" } });
    expect(document.querySelector('[data-preview-mode="live"] .v3-phone-form-card')).toHaveTextContent("Réponse habituelle sous 24 h");
  });

  it("fait choisir la quantité au lieu d’ajouter un pack sans choix", () => {
    renderRoute("/?support=comptoir");

    // Les trois quantités sont proposées avec leur prix : on configure un pack,
    // on ne l’ajoute jamais à l’aveugle.
    const quantities = [...document.querySelectorAll(".v3-quantity-choice button")];
    expect(quantities).toHaveLength(3);
    expect(quantities.map((button) => button.querySelector("strong").textContent)).toEqual(["1", "2", "5"]);
    expect(quantities.every((button) => /€/.test(button.querySelector("b").textContent))).toBe(true);

    fireEvent.click(quantities[2]);
    expect(quantities[2]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Ajouter au panier/i })).toBeVisible();
  });

  it("enregistre exactement les textes et la destination configurés dans le studio", () => {
    renderRoute("/?support=comptoir&mode=custom&lien=avis");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "instagram" } });
    fireEvent.change(screen.getByLabelText("Message principal imprimé"), { target: { value: "Découvrez nos coulisses" } });
    fireEvent.change(screen.getByLabelText("Phrase secondaire imprimée"), { target: { value: "Nouveautés chaque semaine" } });
    fireEvent.change(screen.getByLabelText("Appel à l’action imprimé"), { target: { value: "Suivez-nous" } });
    fireEvent.change(screen.getByLabelText("Adresse exacte à ouvrir"), { target: { value: "https://instagram.com/tapote" } });

    expect(window.location.search).toContain("lien=instagram");
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-headline")).toHaveTextContent("Découvrez nos coulisses");
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-subline")).toHaveTextContent("Nouveautés chaque semaine");
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-nfc strong")).toHaveTextContent("Suivez-nous");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ actionId: "instagram", customHeadline: "Découvrez nos coulisses", customSubline: "Nouveautés chaque semaine", customTapLabel: "Suivez-nous", destinationUrl: "https://instagram.com/tapote" }),
    ]);
  });

  it("ne transforme jamais la marque de démonstration en identité client", () => {
    renderRoute("/?support=comptoir&mode=custom&lien=avis");

    expect(screen.getByLabelText("Nom de votre entreprise")).toHaveValue("");
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-brand")).toHaveTextContent("VOTRE MARQUE");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ brandName: "" }),
    ]);
  });

  it("garde les mêmes destinations et leur ordre dans les deux finitions", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=avis");

    const destination = screen.getByLabelText("Le lien à ouvrir");
    const readyOptions = [...destination.options].map((option) => `${option.value}:${option.textContent}`);
    expect(readyOptions).toContain("autre:Autre URL");
    fireEvent.click(screen.getByRole("button", { name: /Studio en direct/i }));
    const customOptions = [...screen.getByLabelText("Le lien à ouvrir").options].map((option) => `${option.value}:${option.textContent}`);
    expect(customOptions).toEqual(readyOptions);
  });

  it("affiche le total de la quantité sélectionnée pour chaque finition", () => {
    renderRoute("/?support=comptoir&mode=custom&count=2&lien=avis");

    const choices = document.querySelector(".v3-design-choice");
    expect(choices).toHaveTextContent(/Prêt à l’emploi.*55\s*€/s);
    expect(choices).toHaveTextContent(/Studio en direct.*69\s*€/s);
  });

  it("applique la composition demandée par le lien profond", () => {
    renderRoute("/?support=comptoir&mode=custom&count=2&composition=plaques&lien=instagram");

    // Le lien profond règle la quantité, la composition et l’action : la scène
    // doit montrer deux plaques, pas la composition par défaut du secteur.
    expect(screen.getByLabelText("Le lien à ouvrir")).toHaveValue("instagram");
    const composition = screen.getByRole("button", { name: "2 plaques" });
    expect(composition).toHaveAttribute("aria-pressed", "true");
    const inserts = [...document.querySelectorAll(".v3-sector-scene-support .tp-insert")];
    expect(inserts.length).toBeGreaterThan(0);
    expect(inserts.every((insert) => insert.classList.contains("tp-insert-plaque"))).toBe(true);
  });

  it("rend une vraie page introuvable sans faire planter une fausse fiche produit", () => {
    renderRoute("/produits/invente");

    expect(screen.getByRole("heading", { name: /Cette page n’existe pas/i })).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  });

  it("présente des CGV structurées pour la commande professionnelle", () => {
    renderRoute("/cgv");

    expect(screen.getByRole("heading", { name: "Conditions générales de vente", level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Personnalisation en direct/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Conformité et réclamations/i })).toBeVisible();
  });

  it("ajoute la version prête à l’emploi au panier par défaut", () => {
    renderRoute("/?support=comptoir&count=1");

    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));

    expect(screen.getByText("Ajouté au panier")).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "comptoir_standard", actionId: "avis", quantity: 1 }),
    ]);
  });

  it("explique que le changement de lien reste gratuit sans Pilot", () => {
    renderRoute("/comment-ca-marche");

    expect(screen.getByRole("heading", { name: /Vous ne touchez pas au support/i })).toBeVisible();
    expect(screen.getByText("Modifications illimitées")).toBeVisible();
    expect(screen.getByText("Sans abonnement obligatoire")).toBeVisible();
  });

  it("envoie la demande de devis volume vers l’API existante", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal("fetch", fetchSpy);
    renderRoute("/devis");

    fireEvent.change(screen.getByLabelText("Votre nom *"), { target: { value: "Rico Test" } });
    fireEvent.change(screen.getByLabelText("E-mail professionnel *"), { target: { value: "rico@example.com" } });
    fireEvent.change(screen.getByLabelText("Besoin, lieux et volumes *"), { target: { value: "12 supports pour trois établissements" } });
    fireEvent.click(screen.getByLabelText(/J’accepte que Tapote/i));
    fireEvent.click(screen.getByRole("button", { name: /Recevoir une proposition/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/lead", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText(/Demande reçue/i)).toBeVisible();
  });

  it("récapitule et prépare la modification d’un article personnalisé", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "comptoir",
      actionId: "reservation",
      quantity: 1,
      brandName: "STUDIO TEST",
      theme: "blue",
      targetId: "salon",
      designStyle: "signature",
      customHeadline: "On se revoit ? Tapotez.",
      customSubline: "Réservez votre prochain créneau",
      customTapLabel: "Réserver",
      destinationUrl: "https://example.com/reserver",
      brandLogoId: "",
      logoFileName: "",
      supportComposition: { comptoir: 1, plaque: 0 },
    }]));

    renderRoute("/panier");

    expect(screen.getAllByText("STUDIO TEST").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Lien configuré")).toBeVisible();
    const edit = screen.getByRole("link", { name: /Modifier/i });
    expect(edit).toHaveAttribute("href", expect.stringContaining("edit=0"));
    fireEvent.click(edit);
    expect(JSON.parse(window.sessionStorage.getItem("tapote-config-draft-v2:cart:0"))).toEqual(expect.objectContaining({
      brandName: "STUDIO TEST",
      destinationUrl: "https://example.com/reserver",
      customTapLabel: "Réserver",
    }));
  });

  it("remplace le paiement par un devis à partir de 10 supports", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "pack_cinq",
      actionId: "avis",
      quantity: 2,
      brandName: "GROUPE TEST",
      theme: "blue",
      targetId: "cafe",
      designStyle: "signature",
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

  it("permet de reprendre une commande dont la session Stripe a expiré", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ status: "expired" }) })));

    renderRoute("/commande/confirmee?session_id=cs_test_expired");

    expect(await screen.findByRole("heading", { name: /La session de paiement a expiré/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Reprendre la commande/i })).toHaveAttribute("href", "/commande");
  });
});
