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

  it("présente l’offre produit puis Tapote Pilot avec un accès explicite", () => {
    renderRoute("/");

    expect(screen.getByRole("heading", { name: /Trois façons de commencer/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Tapote Noir ou Blanc/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Votre identité, en situation/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Un support là où ça compte/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le support reste/i })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Accéder à Tapote Pilot/i }).some((link) => link.getAttribute("href") === "/connexion")).toBe(true);
    expect(screen.getAllByRole("link", { name: /^Configurer un modèle prêt$/i }).some((link) => link.getAttribute("href") === "/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=noir&count=1")).toBe(true);
    expect(screen.getAllByRole("link", { name: /^Ouvrir le studio$/i }).some((link) => link.getAttribute("href") === "/personnaliser?activite=cafes-bars&support=comptoir&lien=avis&mode=custom&count=1")).toBe(true);
    expect(screen.getAllByRole("link", { name: /^Créer un pack$/i }).some((link) => link.getAttribute("href") === "/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=blanc&count=2&composition=mix")).toBe(true);
    expect(screen.queryByRole("heading", { name: /Tout ce qui doit être clair/i })).not.toBeInTheDocument();
    expect(document.querySelector(".v3-final-buy")).not.toBeInTheDocument();
  });

  it("sépare la découverte de Tapote Pilot de la connexion", () => {
    renderRoute("/tapote-pilot");

    expect(screen.getByRole("heading", { level: 1, name: /Un seul poste.*Tous vos Tapote/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Un changement de campagne/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Le contrôle utile/i })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Accéder à Tapote Pilot/i }).every((link) => link.getAttribute("href") === "/connexion")).toBe(true);
    expect(screen.getAllByRole("link", { name: /Tapote Pilot/i }).some((link) => link.getAttribute("href") === "/tapote-pilot")).toBe(true);
    expect(document.title).toContain("Tapote Pilot");
  });

  it("rend les quinze secteurs visibles dans un menu structuré", () => {
    renderRoute("/");

    const toggle = screen.getByRole("button", { name: /Changer · 15 secteurs/i });
    fireEvent.click(toggle);

    const panel = document.querySelector(".v3-sector-panel");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel.querySelectorAll(".v3-sector-panel-grid button")).toHaveLength(15);
    expect(screen.getAllByText("Restauration & commerce").some((node) => node.closest(".v3-sector-panel"))).toBe(true);
    expect(screen.getByText("Services, agences & mobilité")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Artisans & services terrain" }));
    expect(toggle).toHaveTextContent("Artisans & services terrain");
    expect(window.location.search).toContain("activite=artisans-services-terrain");
    expect(panel).toHaveAttribute("hidden");
  });

  it("synchronise l’écran du téléphone de la fiche avec le lien choisi", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=avis");

    const liveScreen = document.querySelector('[data-preview-mode="live"] [data-phone-action="avis"]');
    expect(liveScreen).toHaveAttribute("data-phone-sector", "cafe");
    expect(liveScreen).not.toHaveAttribute("data-native-source");
    expect(liveScreen.querySelector("foreignObject")).not.toBeInTheDocument();
    const phoneCanvas = liveScreen.querySelector(":scope > .v3-live-phone-canvas");
    expect(phoneCanvas).toBeInTheDocument();
    expect(phoneCanvas.style.clipPath).toMatch(/^polygon\(/);
    expect(phoneCanvas.style.WebkitClipPath).toMatch(/^polygon\(/);
    expect(phoneCanvas.querySelector(":scope > .v3-live-phone-ui")).toBeInTheDocument();
    expect(liveScreen.querySelector(".v3-live-phone-ui")).toHaveTextContent("Publier un avis");
    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "menu" } });

    const menuScreen = document.querySelector('[data-preview-mode="live"] [data-phone-action="menu"]');
    expect(menuScreen).toBeInTheDocument();
    expect(menuScreen.querySelector(".v3-live-phone-ui")).toHaveTextContent("Voir le menu");
    expect(window.location.search).toContain("lien=menu");
  });

  it("restaure atomiquement l’identité du mockup prêt à l’emploi", () => {
    renderRoute("/secteurs/boulangeries-patisseries");

    fireEvent.click(screen.getByRole("button", { name: /Studio en direct/i }));
    fireEvent.change(screen.getByLabelText("Nom de votre entreprise"), { target: { value: "BOULANGERIE RICO" } });
    fireEvent.change(screen.getByLabelText("Couleur principale"), { target: { value: "#123456" } });
    expect(document.querySelectorAll(".v3-sector-scene-support .tp-insert-brand")[0]).toHaveTextContent("BOULANGERIE RICO");

    fireEvent.click(screen.getByRole("button", { name: /Prêt à l’emploi/i }));

    const readySupportLogos = [...document.querySelectorAll(".v3-sector-scene-support .tp-insert-tapote-logo")];
    expect(readySupportLogos).toHaveLength(2);
    expect(readySupportLogos.every((logo) => logo.getAttribute("src") === "/brand/tapote-logo-light.svg")).toBe(true);
    expect(document.querySelectorAll(".v3-sector-scene-support .tp-insert-brand")).toHaveLength(0);
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
    expect(document.querySelectorAll(".v3-sector-scene-support .tp-insert-tapote-logo").length).toBeGreaterThan(0);
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-brand")).not.toBeInTheDocument();

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

  it("garde la même ossature de configuration pour la Carte NFC", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=reservation");

    fireEvent.click(screen.getByRole("button", { name: "Carte" }));

    expect(document.querySelector(".v3-card-quantity")).toHaveTextContent(/1carte NFC19 €/i);
    expect(document.querySelector(".v3-card-quantity")).toHaveTextContent(/ajustez la quantité dans le panier/i);
    expect(screen.getByText("La destination").previousElementSibling).toHaveTextContent("3");
    expect(screen.getByText("Le design").previousElementSibling).toHaveTextContent("4");
    expect(window.location.search).toContain("support=carte");
  });

  it("propose les créations Tapote Noir et Blanc sans dupliquer le grand aperçu", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=avis&design=blanc&count=1");

    const black = screen.getByRole("button", { name: "Design Tapote Noir" });
    const white = screen.getByRole("button", { name: "Design Tapote Blanc" });
    expect(white).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".v3-ready-design-panel .tp-insert")).not.toBeInTheDocument();
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-tapote-logo")).toHaveAttribute("src", "/brand/tapote-logo.svg");

    fireEvent.click(black);

    expect(black).toHaveAttribute("aria-pressed", "true");
    expect(window.location.search).toContain("design=noir");
    expect(window.location.search).toContain("count=1");
    expect(document.querySelector(".v3-sector-scene-support .tp-insert-tapote-logo")).toHaveAttribute("src", "/brand/tapote-logo-light.svg");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "comptoir_standard", theme: "nuit" }),
    ]);
  });

  it("associe pictogramme et signature typographique aux vraies applications", () => {
    renderRoute("/?support=comptoir&mode=ready&lien=avis&design=noir&count=1");

    const destination = screen.getByLabelText("Le lien à ouvrir");
    const applications = [
      ["avis", "google", "Google"],
      ["instagram", "instagram", "Instagram"],
      ["facebook", "facebook", "facebook"],
      ["linkedin", "linkedin", "LinkedIn"],
      ["tiktok", "tiktok", "TikTok"],
      ["whatsapp", "whatsapp", "WhatsApp"],
    ];

    applications.forEach(([actionId, platformId, wordmark]) => {
      fireEvent.change(destination, { target: { value: actionId } });
      const lockup = document.querySelector(`.v3-sector-scene-support .tp-insert-platform-lockup.is-${platformId}`);
      expect(lockup).toHaveAttribute("data-platform", platformId);
      expect(lockup.querySelector(`.tp-glyph-${platformId}`)).toBeInTheDocument();
      expect(lockup).toHaveTextContent(wordmark);
    });
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

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "reservation" } });
    expect(window.location.search).toContain("count=2");
    expect(window.location.search).toContain("composition=plaques");
    expect(window.location.search).toContain("mode=custom");
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

  it("explique clairement que le changement de lien passe par Pilot", () => {
    renderRoute("/comment-ca-marche");

    expect(screen.getByRole("heading", { name: /Vous ne touchez pas au support/i })).toBeVisible();
    expect(screen.getByText("Modifications à distance")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Accéder à Tapote Pilot/i }).every((link) => link.getAttribute("href") === "/connexion")).toBe(true);
    expect(screen.queryByText("Sans abonnement obligatoire")).not.toBeInTheDocument();
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

  it("restaure puis remplace un article du panier sans créer de doublon", () => {
    const cartItem = {
      productId: "comptoir",
      actionId: "reservation",
      quantity: 1,
      brandName: "STUDIO TEST",
      theme: "blue",
      targetId: "salon",
      customHeadline: "On se revoit ? Tapotez.",
      customSubline: "Réservez votre prochain créneau",
      customTapLabel: "Réserver",
      destinationUrl: "https://example.com/reserver",
      brandLogoId: "",
      logoFileName: "",
    };
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([cartItem]));
    window.sessionStorage.setItem("tapote-config-draft-v2:cart:0", JSON.stringify({
      actionId: cartItem.actionId,
      count: 1,
      composition: { comptoir: 1, plaque: 0 },
      brandName: cartItem.brandName,
      customHeadline: cartItem.customHeadline,
      customSubline: cartItem.customSubline,
      customTapLabel: cartItem.customTapLabel,
      destinationUrl: cartItem.destinationUrl,
      theme: cartItem.theme,
      primaryColor: "#fffdf8",
      secondaryColor: "#2458ff",
      textColor: "#161310",
    }));

    renderRoute("/produits/chevalet?mode=custom&action=reservation&edit=0");

    expect(screen.getByLabelText("Nom de votre entreprise")).toHaveValue("STUDIO TEST");
    expect(screen.getByLabelText("Le lien à ouvrir")).toHaveValue("reservation");
    expect(screen.getByLabelText("Adresse exacte à ouvrir")).toHaveValue("https://example.com/reserver");
    fireEvent.change(screen.getByLabelText("Nom de votre entreprise"), { target: { value: "STUDIO MODIFIÉ" } });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));

    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({
        productId: "comptoir",
        actionId: "reservation",
        brandName: "STUDIO MODIFIÉ",
        destinationUrl: "https://example.com/reserver",
      }),
    ]);
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
