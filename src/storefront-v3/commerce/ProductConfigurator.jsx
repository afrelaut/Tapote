import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Check, CheckCircle2, ChevronDown, Eye, Globe2, Layers3, Minus, Pipette, Plus, Sparkles, Upload, X } from "lucide-react";
import { ACTIONS, calculateProductPrice, formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { prepareLogoFile, readFileAsDataUrl } from "../../storefront/logoFile.js";
import { extractLogoPalette, pickScreenColor } from "../../brandColors.js";
import { DEFAULT_THEME, DEVICE_THEMES, THEME_LABELS, readableInk, resolveThemeId } from "../../deviceThemes.js";
import { trackStorefrontEvent } from "../../storefront/analytics.js";
import { friendlyUploadError, readUploadPayload } from "../../storefront/uploadResponse.js";
import { CONFIG_DRAFT_PREFIX, cacheLogoPreview, compositionLabel, compositionSurface, getCachedLogoPreview, loadConfigDraft, makeCartItem } from "./cart.js";
import { ACTION_ORDER, FEATURED_ACTION_IDS, READY_ACTION_IDS, campaignHeadlineForAction, readyHeadlineForAction } from "../data/content.js";
import { DEFAULT_BLOCK_COLOR_MODE, resolveBlockPalette } from "../../storefront/actionPalettes.js";
import { PackArt } from "../scenes/PackArt.jsx";
import { ProductArt } from "../scenes/ProductArt.jsx";

function isValidHttpsUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function ReadyDesignPicker({ onChange, theme }) {
  return (
    <div className="v3-ready-design-panel">
      <div className="v3-ready-design-heading">
        <span>Couleur du support</span>
        <small>Deux déclinaisons du design Tapote</small>
      </div>
      <div className="v3-ready-design-choice" role="group" aria-label="Choisir le modèle Tapote prêt à poser">
        {Object.keys(DEVICE_THEMES).map((themeId) => {
          const selected = theme === themeId;
          return (
            <button
              type="button"
              key={themeId}
              className={selected ? "is-selected" : ""}
              aria-label={`Design ${THEME_LABELS[themeId]}`}
              aria-pressed={selected}
              onClick={() => onChange(themeId)}
            >
              <span
                className="v3-ready-design-swatch"
                style={{
                  "--ready-paper": DEVICE_THEMES[themeId].paper,
                  "--ready-ink": DEVICE_THEMES[themeId].ink,
                  "--ready-accent": DEVICE_THEMES[themeId].accent,
                }}
                aria-hidden="true"
              >
                <i />
                <b>t.</b>
              </span>
              <span className="v3-ready-design-copy">
                <strong>{THEME_LABELS[themeId]}</strong>
              </span>
              <Check aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const OFFER_FAMILIES = Object.freeze({
  chevalet: { label: "Chevalet", detail: "Caisse et accueil", ready: "chevalet_pret", custom: "chevalet_personnalise" },
  plaque: { label: "Plaque", detail: "Entrée et mur", ready: "plaque_prete", custom: "plaque_personnalisee" },
  carte: { label: "Carte", detail: "Poche et terrain", ready: "carte_prete", custom: "carte_personnalisee" },
  essentiel: { label: "Essentiel", detail: "1 + 1 + 1", ready: "pack_essentiel_pret", custom: "pack_essentiel" },
  comptoir: { label: "Comptoir", detail: "2 + 1 + 1", ready: "pack_comptoir_pret", custom: "pack_comptoir" },
  equipe: { label: "Équipe", detail: "2 + 2 + 3", ready: "pack_equipe_pret", custom: "pack_equipe" },
});

function offerFamilyFromProductId(productId, surface = "comptoir") {
  const match = Object.entries(OFFER_FAMILIES).find(([, ids]) => ids.ready === productId || ids.custom === productId);
  if (match) return match[0];
  return surface === "plaque" || surface === "carte" ? surface : "chevalet";
}

const PACK_SURFACES = Object.freeze([
  { id: "comptoir", label: "Chevalet" },
  { id: "plaque", label: "Plaque" },
  { id: "carte", label: "Carte" },
]);

function packUnitsFromComposition(composition = {}) {
  return PACK_SURFACES.flatMap(({ id, label }) => (
    Array.from({ length: composition[id] || 0 }, (_, index) => ({
      key: `${id}-${index + 1}`,
      surface: id,
      label: `${label} ${index + 1}`,
    }))
  ));
}

export function BuyBox({ onAdd, initialProductId = "", initialSurface = "comptoir", initialAction = "avis", initialCount = 1, initialComposition, initialPersonalization = "ready", initialTheme = DEFAULT_THEME, initialBrandName = "VOTRE MARQUE", initialReadyHeadline = "", targetId = "cafe", title = "Choisissez votre Tapote.", productOnly = false, compact = false, allowAllSurfaces = false, lockPersonalization = false, onPreviewChange, onExpandPreview, draftKey = "", stickyTriggerRef }) {
  const restoredDraft = useMemo(() => initialPersonalization === "custom" || draftKey.startsWith("cart:") ? loadConfigDraft(draftKey) : null, [draftKey, initialPersonalization]);
  const restoredTheme = resolveThemeId(restoredDraft?.theme || initialTheme);
  const restoredThemeColors = DEVICE_THEMES[restoredTheme];
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [offerFamily, setOfferFamily] = useState(() => offerFamilyFromProductId(initialProductId, initialSurface));
  const [surface, setSurface] = useState(initialSurface);
  const restoredCount = [1, 2, 3, 4, 5].includes(Number(restoredDraft?.count)) ? Number(restoredDraft.count) : initialCount;
  const [count, setCount] = useState(restoredCount);
  const [actionId, setActionId] = useState(ACTIONS[restoredDraft?.actionId] ? restoredDraft.actionId : initialAction);
  const [composition, setComposition] = useState(
    restoredDraft?.composition
    || initialComposition
    || (initialSurface === "carte"
      ? { comptoir: 0, carte: 1 }
      : restoredCount === 2
        ? { comptoir: 2, carte: 1 }
        : { comptoir: 1, carte: 1 }),
  );
  const [packDesignMode, setPackDesignMode] = useState(restoredDraft?.packDesignMode === "individual" ? "individual" : "shared");
  const [customizationPath, setCustomizationPath] = useState(restoredDraft?.customizationPath === "self" ? "self" : "assisted");
  const [activePackUnit, setActivePackUnit] = useState(restoredDraft?.activePackUnit || "comptoir-1");
  const [supportDesigns, setSupportDesigns] = useState(restoredDraft?.supportDesigns || {});
  const [studioPreviewTab, setStudioPreviewTab] = useState("pack");
  const [mobileStudioSection, setMobileStudioSection] = useState("identity");
  const [brandName, setBrandName] = useState(restoredDraft?.brandName || "");
  const [brandLogoId, setBrandLogoId] = useState(restoredDraft?.brandLogoId || "");
  const [brandLogo, setBrandLogo] = useState(() => getCachedLogoPreview(restoredDraft?.brandLogoId));
  const [logoFileName, setLogoFileName] = useState(restoredDraft?.logoFileName || "");
  const [customHeadline, setCustomHeadline] = useState(restoredDraft?.customHeadline || "");
  const [customSubline, setCustomSubline] = useState(restoredDraft?.customSubline || "");
  const [customTapLabel, setCustomTapLabel] = useState(restoredDraft?.customTapLabel || "");
  const [tagline, setTagline] = useState(restoredDraft?.tagline || "");
  const [contactLine, setContactLine] = useState(restoredDraft?.contactLine || "");
  const [signageId, setSignageId] = useState(restoredDraft?.signageId || "");
  const [signageFileName, setSignageFileName] = useState(restoredDraft?.signageFileName || "");
  const [signageStatus, setSignageStatus] = useState(restoredDraft?.signageId ? "success" : "idle");
  const [signageError, setSignageError] = useState("");
  // Les anciens brouillons pouvaient mémoriser le « Bleu Tapote ». Le Studio
  // ne propose désormais que deux choix compréhensibles : la couleur de
  // l'action ou une couleur personnalisée pour le pavé NFC.
  const [blockColorMode, setBlockColorMode] = useState(restoredDraft?.blockColorMode === "marque" ? "marque" : DEFAULT_BLOCK_COLOR_MODE);
  const [destinationUrl, setDestinationUrl] = useState(restoredDraft?.destinationUrl || "");
  const [destinationTouched, setDestinationTouched] = useState(false);
  const [theme, setTheme] = useState(restoredTheme);
  const [primaryColor, setPrimaryColor] = useState(restoredDraft?.primaryColor || restoredThemeColors.paper);
  const [secondaryColor, setSecondaryColor] = useState(restoredDraft?.secondaryColor || restoredThemeColors.accent);
  const [textColor, setTextColor] = useState(restoredDraft?.textColor || restoredThemeColors.ink);
  // Choisir une déclinaison ne change que le fond et l'encre du support. La
  // couleur personnalisée du pavé NFC reste intacte.
  const applyTheme = (nextTheme) => {
    const palette = DEVICE_THEMES[nextTheme];
    setTheme(nextTheme);
    setPrimaryColor(palette.paper);
    setTextColor(palette.ink);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
    markConfigurationStarted();
  };
  const summaryRef = useRef(null);
  const destinationInputRef = useRef(null);
  const supportLabelId = useId();
  const quantityLabelId = useId();
  const linkLabelId = useId();
  const designLabelId = useId();
  const [initialCtaPassed, setInitialCtaPassed] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [paletteDetected, setPaletteDetected] = useState(false);
  const [colorsManuallyEdited, setColorsManuallyEdited] = useState(false);
  const [manualPalettePreserved, setManualPalettePreserved] = useState(false);
  const configurationTrackedRef = useRef(false);
  const markConfigurationStarted = () => {
    if (configurationTrackedRef.current) return;
    configurationTrackedRef.current = true;
    trackStorefrontEvent("start_configurator", {
      surface: initialSurface,
      personalization,
      action_id: actionId,
    });
  };
  useEffect(() => {
    const target = stickyTriggerRef?.current || summaryRef.current;
    if ((!productOnly && !compact) || !target || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setInitialCtaPassed(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    }, { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [compact, productOnly, stickyTriggerRef]);
  useEffect(() => {
    if ((!productOnly && !compact) || !summaryRef.current || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setSummaryVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(summaryRef.current);
    return () => observer.disconnect();
  }, [compact, productOnly]);
  const [showAllActions, setShowAllActions] = useState(false);
  const [logoStatus, setLogoStatus] = useState(restoredDraft?.brandLogoId ? "success" : "idle");
  const [logoError, setLogoError] = useState("");
  const [added, setAdded] = useState(false);
  const activeFamily = OFFER_FAMILIES[offerFamily];
  const productId = activeFamily[personalization];
  const product = PRODUCTS[productId];
  const safeCount = count;
  const configuredPrice = calculateProductPrice(productId, composition) ?? product.price;
  const packUnits = useMemo(() => product.kind === "pack" ? packUnitsFromComposition(composition) : [], [composition, product.kind]);
  const resolvedActivePackUnit = packUnits.some((unit) => unit.key === activePackUnit) ? activePackUnit : packUnits[0]?.key || "";
  const readyColors = DEVICE_THEMES[resolveThemeId(theme)];
  const availableActions = ACTION_ORDER
    .filter((id) => personalization !== "ready" || READY_ACTION_IDS.includes(id))
    .map((id) => ACTIONS[id]);
  // Une action choisie hors des six mises en avant reste visible : sinon le
  // repli ferait disparaître la sélection en cours.
  const selectedActionIsExtra = !FEATURED_ACTION_IDS.includes(actionId);
  const actionsExpanded = showAllActions || selectedActionIsExtra;
  const shownActions = actionsExpanded
    ? availableActions
    : availableActions.filter((action) => FEATURED_ACTION_IDS.includes(action.id));
  const hiddenActionCount = availableActions.length - shownActions.length;
  const previewBrandName = personalization === "ready" ? initialBrandName : brandName || "VOTRE MARQUE";
  const previewBrandLogo = personalization === "ready" ? "" : brandLogo;
  const previewPrimaryColor = personalization === "ready" ? readyColors.paper : primaryColor;
  const previewSecondaryColor = personalization === "ready" ? readyColors.accent : secondaryColor;
  const previewTextColor = personalization === "ready" ? readyColors.ink : textColor;
  const readyHeadline = personalization === "ready"
    ? actionId === initialAction && initialReadyHeadline
      ? initialReadyHeadline
      : readyHeadlineForAction(actionId)
    : "";
  const previewHeadline = personalization === "custom" ? customHeadline : readyHeadline;
  const logoPending = personalization === "custom" && (logoStatus === "loading" || Boolean(brandLogo && !brandLogoId));
  const destinationReady = isValidHttpsUrl(destinationUrl.trim());
  const destinationInvalid = destinationTouched && !destinationReady;
  const logoPendingLabel = logoStatus === "loading"
    ? "Envoi du logo…"
    : logoStatus === "error"
      ? "Finaliser l’envoi du logo"
      : "Logo à retransmettre";
  const currentSupportDesign = {
    surface,
    actionId,
    destinationUrl,
    brandName,
    brandLogoId,
    brandLogo,
    logoFileName,
    logoStatus,
    signageId,
    signageFileName,
    signageStatus,
    tagline,
    contactLine,
    blockColorMode,
    theme,
    primaryColor,
    secondaryColor,
    textColor,
    customHeadline,
    customSubline,
    customTapLabel,
  };
  const liveSupportDesigns = packUnits.map((unit) => {
    const saved = packDesignMode === "individual" ? supportDesigns[unit.key] : null;
    const design = packDesignMode === "individual" && unit.key !== resolvedActivePackUnit
      ? (saved || currentSupportDesign)
      : currentSupportDesign;
    return { ...design, brandLogo: design.brandLogo || getCachedLogoPreview(design.brandLogoId) || "", key: unit.key, label: unit.label, surface: unit.surface };
  });
  const persistableSupportDesigns = Object.fromEntries(liveSupportDesigns.map((entry) => {
    const design = { ...entry };
    const key = design.key;
    delete design.key;
    delete design.label;
    delete design.brandLogo;
    return [key, design];
  }));
  const persistableSupportDesignsKey = JSON.stringify(persistableSupportDesigns);
  const applySupportDesign = (design = {}) => {
    setActionId(ACTIONS[design.actionId] ? design.actionId : "avis");
    setDestinationUrl(design.destinationUrl || "");
    setDestinationTouched(false);
    setBrandName(design.brandName || "");
    setBrandLogoId(design.brandLogoId || "");
    setBrandLogo(design.brandLogo || getCachedLogoPreview(design.brandLogoId) || "");
    setLogoFileName(design.logoFileName || "");
    setLogoStatus(design.logoStatus || (design.brandLogoId ? "success" : "idle"));
    setLogoError("");
    setSignageId(design.signageId || "");
    setSignageFileName(design.signageFileName || "");
    setSignageStatus(design.signageStatus || (design.signageId ? "success" : "idle"));
    setSignageError("");
    setTagline(design.tagline || "");
    setContactLine(design.contactLine || "");
    setBlockColorMode(design.blockColorMode === "marque" ? "marque" : DEFAULT_BLOCK_COLOR_MODE);
    const nextTheme = resolveThemeId(design.theme || theme);
    setTheme(nextTheme);
    setPrimaryColor(design.primaryColor || DEVICE_THEMES[nextTheme].paper);
    setSecondaryColor(design.secondaryColor || DEVICE_THEMES[nextTheme].accent);
    setTextColor(design.textColor || DEVICE_THEMES[nextTheme].ink);
    setCustomHeadline(design.customHeadline || "");
    setCustomSubline(design.customSubline || "");
    setCustomTapLabel(design.customTapLabel || "");
  };
  const selectPackUnit = (unit) => {
    markConfigurationStarted();
    const savedCurrent = { ...currentSupportDesign, surface };
    const nextDesign = supportDesigns[unit.key] || { ...savedCurrent, surface: unit.surface };
    setSupportDesigns((current) => ({ ...current, [resolvedActivePackUnit]: savedCurrent }));
    setActivePackUnit(unit.key);
    setSurface(unit.surface);
    applySupportDesign(nextDesign);
    setStudioPreviewTab("support");
    onExpandPreview?.();
  };
  const selectPackDesignMode = (mode) => {
    markConfigurationStarted();
    if (mode === "individual") {
      const seeded = Object.fromEntries(packUnits.map((unit) => [unit.key, { ...currentSupportDesign, surface: unit.surface }]));
      setSupportDesigns((current) => ({ ...seeded, ...current, [resolvedActivePackUnit]: { ...currentSupportDesign, surface } }));
      setActivePackUnit(resolvedActivePackUnit);
    }
    setPackDesignMode(mode);
  };
  const selectCustomizationPath = (path) => {
    markConfigurationStarted();
    setCustomizationPath(path);
    setMobileStudioSection("identity");
    if (path === "assisted") {
      setPackDesignMode("shared");
      setStudioPreviewTab("pack");
    }
  };
  const selectPersonalization = (value) => {
    markConfigurationStarted();
    setPersonalization(value);
    if (value === "custom") setMobileStudioSection("identity");
    if (value === "custom" && personalization !== "custom" && !colorsManuallyEdited && !brandLogo) {
      const palette = DEVICE_THEMES.creme;
      setTheme("creme");
      setPrimaryColor(palette.paper);
      setTextColor(palette.ink);
    }
    if (value === "ready" && !READY_ACTION_IDS.includes(actionId)) {
      setActionId("avis");
    }
  };
  const selectOfferFamily = (value) => {
    markConfigurationStarted();
    const nextId = OFFER_FAMILIES[value][personalization];
    const nextProduct = PRODUCTS[nextId];
    const nextComposition = { ...nextProduct.defaultComposition };
    setOfferFamily(value);
    const nextSurface = nextProduct.kind === "pack" ? "comptoir" : nextProduct.baseProductId;
    setSurface(nextSurface);
    setComposition(nextComposition);
    setCount(nextProduct.kind === "pack"
      ? nextProduct.supportCount
      : nextComposition[nextProduct.baseProductId]);
    setPackDesignMode("shared");
    setSupportDesigns({});
    setActivePackUnit(`${nextSurface}-1`);
    setStudioPreviewTab(nextProduct.kind === "pack" ? "pack" : "support");
  };
  const adjustComposition = (surfaceId, delta) => {
    markConfigurationStarted();
    const minimum = product.defaultComposition[surfaceId] || 0;
    setComposition((current) => {
      const next = Math.max(minimum, Math.min(20, (current[surfaceId] || 0) + delta));
      const nextComposition = { ...current, [surfaceId]: next };
      setCount(nextComposition.comptoir + nextComposition.plaque + nextComposition.carte);
      return nextComposition;
    });
  };
  const supportArticle = (surfaceId) => (surfaceId === "comptoir" ? "un" : "une");
  const selectAction = (value) => {
    markConfigurationStarted();
    setActionId(value);
  };
  // Un pack doit montrer le format choisi par le client, pas toujours son
  // premier chevalet. La composition reste complète dans le panier, tandis
  // que `surface` désigne uniquement l'objet actuellement agrandi.
  const previewSurface = product.kind === "pack" ? surface : compositionSurface(safeCount, composition, surface);
  useEffect(() => {
    onPreviewChange?.({ surface: previewSurface, baseSurface: surface, actionId, brandName: previewBrandName, brandLogo: previewBrandLogo, tagline: personalization === "custom" ? tagline : "", contactLine: personalization === "custom" ? contactLine : "", blockColorMode, theme, primaryColor: previewPrimaryColor, secondaryColor: previewSecondaryColor, textColor: previewTextColor, customHeadline: previewHeadline, customSubline: personalization === "custom" ? customSubline : "", customTapLabel: personalization === "custom" ? customTapLabel : "", personalization, customizationPath, count: safeCount, composition, productId, productName: product.name, price: configuredPrice, packDesignMode, supportDesigns: packDesignMode === "individual" ? JSON.parse(persistableSupportDesignsKey) : undefined });
  }, [actionId, blockColorMode, composition, configuredPrice, contactLine, customSubline, customTapLabel, customizationPath, onPreviewChange, packDesignMode, personalization, persistableSupportDesignsKey, previewBrandLogo, previewBrandName, previewHeadline, previewPrimaryColor, previewSecondaryColor, previewSurface, previewTextColor, product.name, productId, safeCount, surface, tagline, theme]);
  useEffect(() => {
    if (!draftKey || personalization !== "custom") return;
    try {
      window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`, JSON.stringify({ productId, actionId, count: safeCount, composition, customizationPath, packDesignMode, activePackUnit: resolvedActivePackUnit, supportDesigns: JSON.parse(persistableSupportDesignsKey), brandName, brandLogoId, logoFileName, signageId, signageFileName, tagline, contactLine, blockColorMode, theme, customHeadline, customSubline, customTapLabel, destinationUrl, primaryColor, secondaryColor, textColor }));
    } catch { /* A full browser storage area must never block configuration or checkout. */ }
  }, [actionId, blockColorMode, brandLogoId, brandName, composition, contactLine, signageId, signageFileName, customHeadline, customSubline, customTapLabel, customizationPath, destinationUrl, draftKey, logoFileName, packDesignMode, personalization, persistableSupportDesignsKey, primaryColor, productId, resolvedActivePackUnit, safeCount, secondaryColor, tagline, textColor, theme]);
  const uploadLogo = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setLogoStatus("loading");
    setLogoError("");
    setBrandLogoId("");
    setManualPalettePreserved(false);
    try {
      const file = await prepareLogoFile(selectedFile);
      const dataUrl = await readFileAsDataUrl(file);
      setBrandLogo(dataUrl);
      setPaletteDetected(false);
      void extractLogoPalette(dataUrl).then((palette) => {
        if (!palette) return;
        if (colorsManuallyEdited) {
          setManualPalettePreserved(true);
          return;
        }
        // Le logo ne recolore jamais tout le carton. Sa teinte dominante est
        // proposée uniquement sur le pavé NFC, dont le rôle est explicite.
        if (primaryColor.toLowerCase() === DEVICE_THEMES.nuit.paper) {
          setTheme("creme");
          setPrimaryColor(DEVICE_THEMES.creme.paper);
          setTextColor(DEVICE_THEMES.creme.ink);
        }
        setSecondaryColor(palette.primary);
        setBlockColorMode("marque");
        setPaletteDetected(true);
      });
      setLogoFileName(file.name.slice(0, 120));
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", { method: "POST", body: formData });
      const data = await readUploadPayload(response, "Le logo est bien visible dans l’aperçu, mais son envoi sécurisé n’a pas abouti.");
      cacheLogoPreview(data.uploadId, dataUrl);
      setBrandLogoId(data.uploadId);
      setLogoStatus("success");
    } catch (uploadError) {
      setLogoStatus("error");
      setLogoError(friendlyUploadError(uploadError, "Le logo"));
    }
  };
  // Un commerçant sans logo a toujours une enseigne, une devanture ou une carte.
  // La photographier prend dix secondes et donne exactement ce qu'il faut pour
  // tracer son identité avant le bon à tirer. Elle n'est jamais imprimée telle
  // quelle : elle accompagne la commande.
  const uploadSignage = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setSignageStatus("loading");
    setSignageError("");
    setSignageId("");
    try {
      const file = await prepareLogoFile(selectedFile);
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", { method: "POST", body: formData });
      const data = await readUploadPayload(response, "La photo est prête, mais son envoi sécurisé n’a pas abouti.");
      setSignageId(data.uploadId);
      setSignageFileName(file.name.slice(0, 120));
      setSignageStatus("success");
    } catch (uploadError) {
      setSignageStatus("error");
      setSignageError(friendlyUploadError(uploadError, "La photo"));
    }
  };

  const removeSignage = () => {
    setSignageId("");
    setSignageFileName("");
    setSignageStatus("idle");
    setSignageError("");
  };

  const removeLogo = () => {
    setBrandLogo("");
    setBrandLogoId("");
    setLogoFileName("");
    setLogoStatus("idle");
    setLogoError("");
    const palette = DEVICE_THEMES[theme];
    setPrimaryColor(palette.paper);
    setSecondaryColor(palette.accent);
    setTextColor(palette.ink);
    setBlockColorMode(DEFAULT_BLOCK_COLOR_MODE);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
  };
  const add = () => {
    if (logoPending) return;
    if (!destinationReady) {
      setDestinationTouched(true);
      destinationInputRef.current?.focus();
      return;
    }
    const wasAdded = onAdd(makeCartItem(productId, actionId, {
      targetId,
      supportComposition: composition,
      customizationPath: personalization === "custom" ? customizationPath : "ready",
      packDesignMode: product.kind === "pack" && personalization === "custom" ? packDesignMode : "shared",
      supportDesigns: product.kind === "pack" && personalization === "custom" && packDesignMode === "individual" ? JSON.parse(persistableSupportDesignsKey) : undefined,
      brandName: personalization === "custom" ? brandName : "",
      brandLogoId: personalization === "custom" ? brandLogoId : "",
      logoFileName: personalization === "custom" ? logoFileName : "",
      signageId: personalization === "custom" ? signageId : "",
      signageFileName: personalization === "custom" ? signageFileName : "",
      tagline: personalization === "custom" ? tagline : "",
      contactLine: personalization === "custom" ? contactLine : "",
      blockColorMode,
      theme,
      primaryColor: personalization === "custom" ? primaryColor : "",
      secondaryColor: personalization === "custom" ? secondaryColor : "",
      textColor: personalization === "custom" ? textColor : "",
      customHeadline: personalization === "custom" ? customHeadline : readyHeadline,
      customSubline: personalization === "custom" ? customSubline : "",
      customTapLabel: personalization === "custom" ? customTapLabel : "",
      destinationUrl: destinationUrl.trim(),
    }));
    if (wasAdded === false) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  // La première carte est à 29 €, puis chaque carte supplémentaire à 20 €.
  // La quantité fait donc partie de la composition calculée côté serveur.
  const showSupports = allowAllSurfaces || productOnly;
  const showQuantity = true;
  const supportStep = 1;
  const designStep = 2;
  const quantityStep = 3;
  const linkStep = 4;
  const renderIdentityFields = () => (
    <>
      <div className="v3-identity-grid">
        <input value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom de votre entreprise" aria-label="Nom de votre entreprise" />
        <label className={`v3-logo-upload is-${logoStatus}`}>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" onChange={uploadLogo} disabled={logoStatus === "loading"} />
          <Upload size={17} />
          <span><strong>{logoStatus === "loading" ? "Envoi sécurisé…" : brandLogo ? "Remplacer le logo" : "Ajouter votre logo"}</strong><small>Facultatif · PNG, JPG, WebP ou SVG.</small></span>
        </label>
      </div>
      {brandLogo && <div className="v3-uploaded-logo"><img src={brandLogo} alt="Aperçu du logo importé" /><span><strong>{logoFileName}</strong><small>{logoStatus === "success" ? "Logo reçu · aperçu à jour" : logoStatus === "error" ? "Aperçu à jour · envoi à relancer" : "Aperçu à jour"}</small></span><button type="button" onClick={removeLogo} aria-label="Retirer le logo"><X size={15} /></button></div>}
      {logoError && <p className="v3-upload-error" role="alert">{logoError} Sélectionnez-le à nouveau pour relancer l’envoi.</p>}
      {!brandLogo && (
        <details className="v3-signage-step">
          <summary>Je n’ai pas encore de fichier logo</summary>
          <label className={`v3-signage-upload is-${signageStatus} ${signageId ? "is-filled" : ""}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSignage} disabled={signageStatus === "loading"} />
            <Camera size={17} aria-hidden="true" />
            <span><strong>{signageStatus === "loading" ? "Envoi sécurisé…" : signageId ? "Photo reçue" : "Photographier mon enseigne"}</strong><small>{signageId ? "Le tracé sera proposé dans le BAT" : "Tapote pourra préparer un tracé propre."}</small></span>
          </label>
          {signageId && <div className="v3-uploaded-logo"><i className="v3-signage-thumb" aria-hidden="true"><Camera size={16} /></i><span><strong>{signageFileName}</strong><small>Jointe à la commande</small></span><button type="button" onClick={removeSignage} aria-label="Retirer la photo d’enseigne"><X size={15} /></button></div>}
          {signageError && <p className="v3-upload-error" role="alert">{signageError}</p>}
        </details>
      )}
    </>
  );
  return (
    <section id={productOnly ? "configurer" : undefined} className={`v3-buybox ${compact ? "is-compact" : ""} ${productOnly ? "is-product-only" : ""}`} aria-label="Configurer l’achat">
      <div className="v3-buybox-intro">
        <span className="v3-buybox-kicker"><Sparkles size={14} aria-hidden="true" /> Tapote Studio</span>
        <h2>{title}</h2>
      </div>
      <div className="v3-core-choice-grid is-single">
        {showSupports && (
          <div className="v3-field-block" role="group" aria-labelledby={supportLabelId}>
            <span className="v3-field-label" id={supportLabelId}><b>{supportStep}</b><span>Choisissez votre offre</span></span>
            <div className="v3-offer-family-choice">
              {Object.entries(OFFER_FAMILIES).map(([key, family]) => {
                const selected = offerFamily === key;
                const candidate = PRODUCTS[family[personalization]];
                return (
                  <button type="button" key={key} aria-pressed={selected} className={`${selected ? "is-selected" : ""} ${candidate.kind === "pack" ? "is-pack" : ""}`.trim()} onClick={() => selectOfferFamily(key)}>
                    <span><strong>{family.label}</strong><small>{family.detail}</small></span>
                    <b>{formatMoney(candidate.price)}</b>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="v3-field-block v3-mode-field" role="group" aria-labelledby={designLabelId}>
          <span className="v3-field-label" id={designLabelId}><b>{designStep}</b><span>Choisissez la finition</span></span>
          {!lockPersonalization && <div className="v3-design-choice">
            <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => selectPersonalization("ready")}>
              <span><strong>Prêt à poser</strong><small>Design Tapote, configuré pour votre lien</small></span>
            </button>
            <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => selectPersonalization("custom")}>
              <span><strong>À votre image</strong><small>Logo, couleurs et textes personnalisés</small></span>
            </button>
          </div>}
          {personalization === "ready" && (
            <ReadyDesignPicker
              onChange={applyTheme}
              theme={theme}
            />
          )}
          {personalization === "custom" && (
            <div className="v3-customization-path" role="group" aria-label="Choisir qui prépare le design">
              <span>Comment voulez-vous avancer ?</span>
              <div>
                <button type="button" className={customizationPath === "assisted" ? "is-selected" : ""} aria-pressed={customizationPath === "assisted"} onClick={() => selectCustomizationPath("assisted")}>
                  <Sparkles aria-hidden="true" />
                  <span><strong>Tapote le fait pour moi</strong><small>Logo ou idée, puis BAT avant impression</small></span>
                  <em>Recommandé</em>
                </button>
                <button type="button" className={customizationPath === "self" ? "is-selected" : ""} aria-pressed={customizationPath === "self"} onClick={() => selectCustomizationPath("self")}>
                  <Pipette aria-hidden="true" />
                  <span><strong>Je personnalise moi-même</strong><small>Accéder à tous les réglages du Studio</small></span>
                </button>
              </div>
            </div>
          )}
        </div>
        {showQuantity && (
          <div className="v3-field-block" role="group" aria-labelledby={quantityLabelId}>
            <span className="v3-field-label" id={quantityLabelId}><b>{quantityStep}</b><span>{product.kind === "pack" ? "Composition du pack" : "Quantité"}</span></span>
            <div className="v3-composition-editor">
              {(product.kind === "pack" ? ["comptoir", "plaque", "carte"] : [product.baseProductId]).map((surfaceId) => {
                const labels = { comptoir: "Chevalet", plaque: "Plaque", carte: "Carte" };
                const minimum = product.defaultComposition[surfaceId] || 0;
                const value = composition[surfaceId] || 0;
                return (
                  <div key={surfaceId}>
                    <span><strong>{labels[surfaceId]}</strong><small>{value === minimum ? "Inclus" : `+ ${value - minimum}`}</small></span>
                    <div>
                      <button type="button" onClick={() => adjustComposition(surfaceId, -1)} disabled={value <= minimum} aria-label={`Retirer ${supportArticle(surfaceId)} ${labels[surfaceId].toLowerCase()}`}><Minus /></button>
                      <b>{value}</b>
                      <button type="button" onClick={() => adjustComposition(surfaceId, 1)} aria-label={`Ajouter ${supportArticle(surfaceId)} ${labels[surfaceId].toLowerCase()}`}><Plus /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            {product.kind === "pack" && (
              <div className="v3-pack-preview-choice" role="group" aria-label="Choisir le support affiché dans l’aperçu">
                <span><Eye aria-hidden="true" /> Support affiché</span>
                <div>
                  {[{ id: "comptoir", label: "Chevalet" }, { id: "plaque", label: "Plaque" }, { id: "carte", label: "Carte" }].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={surface === item.id}
                      className={surface === item.id ? "is-selected" : ""}
                      onClick={() => {
                        markConfigurationStarted();
                        setSurface(item.id);
                        onExpandPreview?.();
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.kind === "pack" && (
              <div className={`v3-studio-pack-panel is-composition-preview${personalization === "custom" && customizationPath === "assisted" ? " is-assisted-compact" : ""}`}>
                {personalization === "custom" && customizationPath === "assisted" ? (
                  <div className="v3-assisted-pack-heading"><Layers3 size={16} /><span><strong>Votre pack</strong><small>Le même design sur chaque support</small></span></div>
                ) : (
                  <div className="v3-studio-pack-tabs" role="group" aria-label="Vue de la personnalisation">
                    <button type="button" className={studioPreviewTab === "pack" ? "is-selected" : ""} aria-pressed={studioPreviewTab === "pack"} onClick={() => setStudioPreviewTab("pack")}><Layers3 size={15} /> Pack complet</button>
                    <button type="button" className={studioPreviewTab === "support" ? "is-selected" : ""} aria-pressed={studioPreviewTab === "support"} onClick={() => setStudioPreviewTab("support")}><Eye size={15} /> Support en cours</button>
                  </div>
                )}
                <div className={`v3-studio-pack-preview is-${personalization === "custom" && customizationPath === "assisted" ? "pack" : studioPreviewTab}`}>
                  {(personalization === "custom" && customizationPath === "assisted") || studioPreviewTab === "pack" ? (
                    <PackArt
                      productId={productId}
                      composition={composition}
                      actionId={actionId}
                      brandName={previewBrandName}
                      brandLogo={previewBrandLogo}
                      theme={theme}
                      personalization={personalization}
                      primaryColor={previewPrimaryColor}
                      secondaryColor={previewSecondaryColor}
                      textColor={previewTextColor}
                      blockColorMode={blockColorMode}
                      customHeadline={previewHeadline}
                      customSubline={customSubline}
                      customTapLabel={customTapLabel}
                      supportDesigns={personalization === "custom" && packDesignMode === "individual" ? liveSupportDesigns : undefined}
                      className="is-studio-overview"
                    />
                  ) : (
                    <ProductArt
                      surface={surface}
                      actionId={actionId}
                      brandName={previewBrandName}
                      brandLogo={previewBrandLogo}
                      theme={theme}
                      personalization={personalization}
                      primaryColor={previewPrimaryColor}
                      secondaryColor={previewSecondaryColor}
                      textColor={previewTextColor}
                      blockColorMode={blockColorMode}
                      customHeadline={previewHeadline}
                      customSubline={customSubline}
                      customTapLabel={customTapLabel}
                    />
                  )}
                </div>
                {personalization === "custom" && customizationPath === "self" && (
                  <div className="v3-pack-design-mode" role="group" aria-label="Appliquer le design au pack">
                    <button type="button" className={packDesignMode === "shared" ? "is-selected" : ""} aria-pressed={packDesignMode === "shared"} onClick={() => selectPackDesignMode("shared")}><strong>Même design partout</strong><small>Le choix le plus simple</small></button>
                    <button type="button" className={packDesignMode === "individual" ? "is-selected" : ""} aria-pressed={packDesignMode === "individual"} onClick={() => selectPackDesignMode("individual")}><strong>Différencier les supports</strong><small>Un design et un lien par Tapote</small></button>
                  </div>
                )}
                {personalization === "custom" && customizationPath === "self" && packDesignMode === "individual" && (
                  <div className="v3-pack-unit-picker" role="group" aria-label="Support du pack à personnaliser">
                    <span>Vous modifiez</span>
                    <div>
                      {packUnits.map((unit) => (
                        <button type="button" key={unit.key} className={resolvedActivePackUnit === unit.key ? "is-selected" : ""} aria-pressed={resolvedActivePackUnit === unit.key} onClick={() => selectPackUnit(unit)}>{unit.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {personalization === "custom" && customizationPath === "assisted" && (
                  <details className="v3-pack-advanced-choice">
                    <summary>Vous voulez des designs différents ?</summary>
                    <div><p>Le Studio avancé permet de personnaliser chaque support et chaque lien séparément.</p><button type="button" onClick={() => { selectCustomizationPath("self"); selectPackDesignMode("individual"); }}>Configurer support par support <ArrowRight size={15} /></button></div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="v3-field-block v3-field-destination">
        <span className="v3-field-label" id={linkLabelId}><b>{linkStep}</b><span>Action</span></span>
        {/* Le menu déroulant natif rompait la logique du configurateur : les
            deux autres étapes se choisissent par cartes cliquables. */}
        <div className="v3-action-choice" role="group" aria-label="Le lien à ouvrir" aria-describedby={linkLabelId}>
          {shownActions.map((action) => {
            const selected = actionId === action.id;
            return (
              <button
                type="button"
                key={action.id}
                className={selected ? "is-selected" : ""}
                aria-pressed={selected}
                onClick={() => selectAction(action.id)}
              >
                {action.name}
              </button>
            );
          })}
        </div>
        {!selectedActionIsExtra && (
          <button
            type="button"
            className="v3-action-more"
            aria-expanded={actionsExpanded}
            onClick={() => setShowAllActions((open) => !open)}
          >
            {actionsExpanded ? "Réduire la liste" : `Voir les ${hiddenActionCount} autres actions`}
          </button>
        )}
        <div className={`v3-destination-card ${destinationInvalid ? "is-invalid" : ""} ${destinationReady ? "is-ready" : ""}`}>
          <div className="v3-destination-card-heading">
            <Globe2 size={18} aria-hidden="true" />
            <span><strong>Lien ouvert par ce Tapote</strong><small>La page affichée après le tap ou le scan.</small></span>
            <em>{destinationReady ? "Prêt" : "Obligatoire"}</em>
          </div>
          <label className={`v3-destination-field ${destinationInvalid ? "is-invalid" : ""}`}>
            <span>
              <input
                ref={destinationInputRef}
                type="url"
                required
                aria-required="true"
                value={destinationUrl}
                onFocus={markConfigurationStarted}
                onBlur={() => setDestinationTouched(true)}
                onChange={(event) => {
                  setDestinationUrl(event.target.value.slice(0, 500));
                  if (destinationTouched) setDestinationTouched(true);
                }}
                placeholder="https://votre-lien.fr"
                aria-label="Lien obligatoire à ouvrir"
              />
              <small>{destinationInvalid ? "Ajoutez une adresse complète commençant par https://" : destinationReady ? "Lien valide · il sera associé au NFC et au QR." : "Exemple : votre fiche Google, menu, Instagram ou prise de rendez-vous."}</small>
            </span>
            {destinationReady && <CheckCircle2 size={19} aria-hidden="true" />}
          </label>
        </div>
      </div>
      {personalization === "ready" && !compact && !productOnly && <div className="v3-field-block v3-personalization-panel v3-campaign-design-panel"><span className="v3-field-label">Design Tapote recommandé</span><div className="v3-campaign-design-note"><Sparkles /><span><strong>{campaignHeadlineForAction(actionId)}</strong><small>Composition optimisée automatiquement pour {ACTIONS[actionId].name}.</small></span><a href="/">Voir la collection <ArrowRight /></a></div></div>}
      {personalization === "custom" && customizationPath === "assisted" && (
        <div id="tapote-studio-fields" className="v3-field-block v3-personalization-panel v3-assisted-design">
          <div className="v3-assisted-design-heading">
            <span><Sparkles size={18} aria-hidden="true" /><strong>Confiez-nous votre design</strong></span>
            <small>Ajoutez seulement ce que vous avez. Nous préparons le reste et vous validez le BAT.</small>
          </div>
          {renderIdentityFields()}
          <div className="v3-assisted-design-footer">
            <span><CheckCircle2 size={17} aria-hidden="true" /><small>Aucune compétence graphique nécessaire.</small></span>
            <button type="button" onClick={() => { setCustomizationPath("self"); setMobileStudioSection("identity"); }}>Ouvrir les réglages avancés <ArrowRight size={16} /></button>
          </div>
        </div>
      )}
      {personalization === "custom" && customizationPath === "self" && (
        <div id="tapote-studio-fields" className="v3-field-block v3-branding-fields v3-personalization-panel v3-live-studio">
          <div className="v3-studio-heading"><span><Sparkles size={15} /><strong>Votre design</strong></span><small><i aria-hidden="true" /> Aperçu en direct</small></div>
          <div className={`v3-studio-section v3-studio-accordion ${mobileStudioSection === "identity" ? "is-mobile-open" : ""}`}>
            <button type="button" className="v3-studio-title-row" aria-expanded={mobileStudioSection === "identity"} onClick={() => setMobileStudioSection("identity")}><span className="v3-field-label">Votre identité</span><small>{brandName || (brandLogo ? "Logo ajouté" : "Nom et logo")}</small><ChevronDown aria-hidden="true" /></button>
            {renderIdentityFields()}
          </div>
          <div className={`v3-studio-section v3-studio-accordion ${mobileStudioSection === "copy" ? "is-mobile-open" : ""}`}>
            <button type="button" className="v3-studio-title-row" aria-expanded={mobileStudioSection === "copy"} onClick={() => setMobileStudioSection("copy")}><span className="v3-field-label">Vos textes</span><small>{customHeadline || "Message et phrase secondaire"}</small><ChevronDown aria-hidden="true" /></button>
            <div className="v3-live-copy-fields">
              <label className="is-wide"><span>Message principal <em>{customHeadline.length}/64</em></span><input value={customHeadline} onChange={(event) => setCustomHeadline(event.target.value.slice(0, 64))} placeholder={campaignHeadlineForAction(actionId)} aria-label="Message principal imprimé" /></label>
              <label className="is-wide"><span>Phrase secondaire <em>{customSubline.length}/90</em></span><input value={customSubline} onChange={(event) => setCustomSubline(event.target.value.slice(0, 90))} placeholder={ACTIONS[actionId].campaignSubline || ACTIONS[actionId].subline} aria-label="Phrase secondaire imprimée" /></label>
            </div>
            <details className="v3-studio-optional">
              <summary>Textes complémentaires</summary>
              <div className="v3-live-copy-fields">
                <label className="is-wide"><span>Appel à l’action <em>{customTapLabel.length}/32</em></span><input value={customTapLabel} onChange={(event) => setCustomTapLabel(event.target.value.slice(0, 32))} placeholder="Tapotez ici" aria-label="Appel à l’action imprimé" /></label>
                <label className="is-wide"><span>Phrase métier <em>{tagline.length}/48</em></span><input value={tagline} onChange={(event) => setTagline(event.target.value.slice(0, 48))} placeholder="Librairie BD · Jeux de société · Figurines" aria-label="Phrase métier imprimée" /></label>
                <label className="is-wide"><span>Réseau, site ou téléphone <em>{contactLine.length}/48</em></span><input value={contactLine} onChange={(event) => setContactLine(event.target.value.slice(0, 48))} placeholder="@votrecompte · 01 23 45 67 89" aria-label="Réseau, site ou téléphone imprimé" /></label>
              </div>
            </details>
          </div>

          <div className={`v3-studio-section v3-studio-accordion ${mobileStudioSection === "colors" ? "is-mobile-open" : ""}`}>
            <button type="button" className="v3-studio-title-row" aria-expanded={mobileStudioSection === "colors"} onClick={() => setMobileStudioSection("colors")}><span className="v3-field-label">Couleurs du support</span><small>{THEME_LABELS[theme]} · pavé {blockColorMode === "marque" ? "personnalisé" : "assorti"}</small><ChevronDown aria-hidden="true" /></button>
            <span className="v3-studio-subheading">Raccourcis Noir / Clair</span>
            <div className="v3-theme-choice" role="group" aria-label="Déclinaison de couleur">
              {Object.keys(DEVICE_THEMES).map((themeId) => {
                const presetSelected = primaryColor.toLowerCase() === DEVICE_THEMES[themeId].paper && textColor.toLowerCase() === DEVICE_THEMES[themeId].ink;
                return (
                <button type="button" key={themeId} className={presetSelected ? "is-selected" : ""} aria-pressed={presetSelected} onClick={() => applyTheme(themeId)}>
                  <span aria-hidden="true" style={{ background: DEVICE_THEMES[themeId].paper, color: DEVICE_THEMES[themeId].ink, borderColor: DEVICE_THEMES[themeId].ink }}>Aa</span>
                  <b>{THEME_LABELS[themeId]}</b>
                  {presetSelected && <Check size={16} aria-hidden="true" />}
                </button>
              );})}
            </div>
            <div className="v3-support-color-controls" aria-label="Réglages précis des couleurs du support">
              <label>
                <span><strong>Fond du support</strong></span>
                <div>
                  <input type="color" value={primaryColor} onChange={(event) => { const color = event.target.value; setPrimaryColor(color); setTextColor(readableInk(color)); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur de fond du support" />
                  <code>{primaryColor.toUpperCase()}</code>
                  {typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setPrimaryColor(color); setTextColor(readableInk(color)); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur de fond à l’écran"><Pipette size={14} /> Pipette</button>}
                </div>
              </label>
              <label>
                <span><strong>Textes du support</strong></span>
                <div>
                  <input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur des textes du support" />
                  <code>{textColor.toUpperCase()}</code>
                  {typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setTextColor(color); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur des textes à l’écran"><Pipette size={14} /> Pipette</button>}
                </div>
              </label>
            </div>
            <div className="v3-nfc-color-heading">
              <span className="v3-studio-subheading">Couleur du pavé NFC</span>
            </div>
            <div className="v3-block-color-choice" role="group" aria-label="Choisir la couleur du pavé NFC imprimé">
              {[
                { mode: "action", title: "Action choisie" },
                { mode: "marque", title: "Personnalisée" },
              ].map(({ mode, title: optionTitle }) => {
                const preview = resolveBlockPalette({ mode, actionId, brandAccent: secondaryColor });
                return (
                  <button
                    type="button"
                    key={mode}
                    className={blockColorMode === mode ? "is-selected" : ""}
                    aria-pressed={blockColorMode === mode}
                    onClick={() => { markConfigurationStarted(); setBlockColorMode(mode); }}
                  >
                    <i style={{ background: preview.gradient || preview.block, boxShadow: `0 0 0 3px ${preview.liseret}` }} aria-hidden="true" />
                    <span><strong>{optionTitle}</strong></span>
                    {blockColorMode === mode && <Check size={16} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {blockColorMode === "marque" && (
              <div className="v3-nfc-custom-color">
                <label>
                  <span>Couleur appliquée au pavé NFC</span>
                  <div>
                    <input type="color" value={secondaryColor} onChange={(event) => { setSecondaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur du pavé NFC" />
                    <code>{secondaryColor.toUpperCase()}</code>
                    {typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setSecondaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur du pavé NFC à l’écran"><Pipette size={14} /> Pipette</button>}
                  </div>
                </label>
                <small>{manualPalettePreserved ? "Votre réglage a été conservé après l’import du logo." : paletteDetected ? "Couleur extraite de votre logo. Vous pouvez l’ajuster." : "Le texte blanc ou noir est choisi automatiquement pour rester lisible."}</small>
              </div>
            )}
          </div>
          <p className="v3-studio-contract"><CheckCircle2 size={17} /><span><strong>Vous validez avant impression.</strong><small>Nous vérifions le design, le QR et la zone NFC dans un BAT final.</small></span></p>
        </div>
      )}
      <div className="v3-buybox-summary" ref={summaryRef}>
        <div><span>{product.name}</span><strong>{formatMoney(configuredPrice)}</strong></div>
        <button type="button" onClick={add} disabled={logoPending}>{logoPending ? logoPendingLabel : !destinationReady ? <>Ajouter le lien <ArrowRight size={18} /></> : added ? <><Check size={18} /> Ajouté</> : <>Ajouter au panier <ArrowRight size={18} /></>}</button>
      </div>
      {(productOnly || compact) && (
        <aside className={`v3-mobile-product-cta ${initialCtaPassed && !summaryVisible ? "is-visible" : ""}`} aria-label="Résumé de la configuration">
          <span><small>{product.kind === "pack" && composition ? compositionLabel(composition) : product.name.replace(/ · .+$/, "")}</small><strong>{formatMoney(configuredPrice)}</strong></span>
          <button type="button" onClick={add} disabled={logoPending}>{logoPending ? logoPendingLabel : !destinationReady ? "Ajouter le lien" : added ? "Ajouté" : "Ajouter"} <ArrowRight /></button>
        </aside>
      )}
    </section>
  );
}
