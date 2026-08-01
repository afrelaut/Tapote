import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Check, CheckCircle2, Globe2, Pipette, Sparkles, Upload, X } from "lucide-react";
import { ACTIONS, formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { prepareLogoFile, readFileAsDataUrl } from "../../storefront/logoFile.js";
import { extractLogoPalette, pickScreenColor } from "../../brandColors.js";
import { DEFAULT_THEME, DEVICE_THEMES, THEME_LABELS, resolveThemeId } from "../../deviceThemes.js";
import { trackStorefrontEvent } from "../../storefront/analytics.js";
import { CONFIG_DRAFT_PREFIX, cacheLogoPreview, compositionLabel, compositionSurface, getCachedLogoPreview, getProductId, loadConfigDraft, makeCartItem } from "./cart.js";
import { ACTION_ORDER, READY_ACTION_IDS, campaignHeadlineForAction, readyHeadlineForAction } from "../data/content.js";
import { BLOCK_COLOR_MODES, DEFAULT_BLOCK_COLOR_MODE, actionPaletteLabel, resolveBlockPalette } from "../../storefront/actionPalettes.js";

function CompositionPicker({ count, composition, onChange, labelId }) {
  if (count !== 2) return null;
  const choices = [
    { label: "1 Comptoir + 1 Plaque", value: { comptoir: 1, plaque: 1 } },
    { label: "2 Comptoirs", value: { comptoir: 2, plaque: 0 } },
    { label: "2 Plaques", value: { comptoir: 0, plaque: 2 } },
  ];
  return (
    <div className="v3-field-block" role="group" aria-labelledby={labelId}>
      <span className="v3-field-label" id={labelId}><b aria-hidden="true">↳</b><span>Composition</span></span>
      <div className="v3-choice-row v3-choice-row-three">
        {choices.map((choice) => {
          const selected = choice.value.comptoir === composition.comptoir && choice.value.plaque === composition.plaque;
          return <button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onChange(choice.value)} key={choice.label}>{choice.label}</button>;
        })}
      </div>
    </div>
  );
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

export function BuyBox({ onAdd, initialSurface = "comptoir", initialAction = "avis", initialCount = 1, initialComposition, initialPersonalization = "ready", initialTheme = DEFAULT_THEME, initialBrandName = "VOTRE MARQUE", initialReadyHeadline = "", targetId = "cafe", title = "Choisissez votre Tapote.", productOnly = false, compact = false, allowAllSurfaces = false, lockPersonalization = false, onPreviewChange, draftKey = "", stickyTriggerRef }) {
  const initialColors = DEVICE_THEMES[resolveThemeId(initialTheme)];
  const restoredDraft = useMemo(() => initialPersonalization === "custom" || draftKey.startsWith("cart:") ? loadConfigDraft(draftKey) : null, [draftKey, initialPersonalization]);
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [surface, setSurface] = useState(initialSurface);
  const restoredCount = [1, 2].includes(Number(restoredDraft?.count)) ? Number(restoredDraft.count) : initialCount;
  const [count, setCount] = useState(restoredCount);
  const [actionId, setActionId] = useState(ACTIONS[restoredDraft?.actionId] ? restoredDraft.actionId : initialAction);
  const [composition, setComposition] = useState(
    restoredDraft?.composition
    || initialComposition
    || (restoredCount === 2 ? { comptoir: 1, plaque: 1 } : { comptoir: 1, plaque: 0 }),
  );
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
  const [blockColorMode, setBlockColorMode] = useState(restoredDraft?.blockColorMode || DEFAULT_BLOCK_COLOR_MODE);
  const [destinationUrl, setDestinationUrl] = useState(restoredDraft?.destinationUrl || "");
  const [theme, setTheme] = useState(resolveThemeId(restoredDraft?.theme || initialTheme));
  const [primaryColor, setPrimaryColor] = useState(restoredDraft?.primaryColor || initialColors.paper);
  const [secondaryColor, setSecondaryColor] = useState(restoredDraft?.secondaryColor || initialColors.accent);
  const [textColor, setTextColor] = useState(restoredDraft?.textColor || initialColors.ink);
  // Choisir une déclinaison réapplique ses trois couleurs : le client voit
  // immédiatement le résultat sans toucher au réglage fin.
  const applyTheme = (nextTheme) => {
    const palette = DEVICE_THEMES[nextTheme];
    setTheme(nextTheme);
    setPrimaryColor(palette.paper);
    setSecondaryColor(palette.accent);
    setTextColor(palette.ink);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
    markConfigurationStarted();
  };
  const summaryRef = useRef(null);
  const supportLabelId = useId();
  const quantityLabelId = useId();
  const compositionLabelId = useId();
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
  const [logoStatus, setLogoStatus] = useState(restoredDraft?.brandLogoId ? "success" : "idle");
  const [logoError, setLogoError] = useState("");
  const [added, setAdded] = useState(false);
  const isCard = surface === "carte";
  const safeCount = isCard ? 1 : count;
  const quantityChoices = [1, 2];
  const productId = getProductId(surface, personalization, safeCount);
  const product = PRODUCTS[productId];
  const readyColors = DEVICE_THEMES[resolveThemeId(theme)];
  const availableActions = ACTION_ORDER
    .filter((id) => personalization !== "ready" || READY_ACTION_IDS.includes(id))
    .map((id) => ACTIONS[id]);
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
  const destinationInvalid = Boolean(destinationUrl && !/^https:\/\/.+/i.test(destinationUrl));
  const logoPendingLabel = logoStatus === "loading" ? "Envoi du logo…" : "Logo à retransmettre";
  const selectPersonalization = (value) => {
    markConfigurationStarted();
    setPersonalization(value);
    if (value === "ready" && !READY_ACTION_IDS.includes(actionId)) {
      setActionId("avis");
    }
  };
  const selectAction = (value) => {
    markConfigurationStarted();
    setActionId(value);
  };
  const previewSurface = compositionSurface(safeCount, composition, surface);
  useEffect(() => {
    onPreviewChange?.({ surface: previewSurface, baseSurface: surface, actionId, brandName: previewBrandName, brandLogo: previewBrandLogo, tagline: personalization === "custom" ? tagline : "", contactLine: personalization === "custom" ? contactLine : "", blockColorMode, theme, primaryColor: previewPrimaryColor, secondaryColor: previewSecondaryColor, textColor: previewTextColor, customHeadline: previewHeadline, customSubline: personalization === "custom" ? customSubline : "", customTapLabel: personalization === "custom" ? customTapLabel : "", personalization, count: safeCount, composition, productId, productName: product.name, price: product.price });
  }, [actionId, blockColorMode, composition, contactLine, customSubline, customTapLabel, onPreviewChange, personalization, previewBrandLogo, previewBrandName, previewHeadline, previewPrimaryColor, previewSecondaryColor, previewSurface, previewTextColor, product.name, product.price, productId, safeCount, surface, tagline, theme]);
  useEffect(() => {
    if (!draftKey || personalization !== "custom") return;
    try {
      window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`, JSON.stringify({ actionId, count: safeCount, composition, brandName, brandLogoId, logoFileName, signageId, signageFileName, tagline, contactLine, blockColorMode, theme, customHeadline, customSubline, customTapLabel, destinationUrl, primaryColor, secondaryColor, textColor }));
    } catch { /* A full browser storage area must never block configuration or checkout. */ }
  }, [actionId, blockColorMode, brandLogoId, brandName, composition, contactLine, signageId, signageFileName, customHeadline, customSubline, customTapLabel, destinationUrl, draftKey, logoFileName, personalization, primaryColor, safeCount, secondaryColor, tagline, textColor, theme]);
  const selectCount = (value) => {
    markConfigurationStarted();
    setCount(value);
    if (productOnly && initialSurface === "comptoir") {
      setComposition({ comptoir: value, plaque: 0 });
    } else if (productOnly && initialSurface === "plaque") {
      setComposition({ comptoir: 0, plaque: value });
    } else if (value === 1) {
      setComposition(surface === "plaque" ? { comptoir: 0, plaque: 1 } : { comptoir: 1, plaque: 0 });
    } else {
      setComposition({ comptoir: 1, plaque: 1 });
    }
  };
  const selectSurface = (value) => {
    markConfigurationStarted();
    setSurface(value);
    if (value === "carte") return;
    if (count > 1) setComposition(value === "plaque" ? { comptoir: 0, plaque: count } : { comptoir: count, plaque: 0 });
  };
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
        setPrimaryColor(palette.primary);
        setSecondaryColor(palette.secondary);
        setPaletteDetected(true);
      });
      setLogoFileName(file.name.slice(0, 120));
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi du logo impossible.");
      cacheLogoPreview(data.uploadId, dataUrl);
      setBrandLogoId(data.uploadId);
      setLogoStatus("success");
    } catch (uploadError) {
      setLogoStatus("error");
      setLogoError(uploadError.message);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi de la photo impossible.");
      setSignageId(data.uploadId);
      setSignageFileName(file.name.slice(0, 120));
      setSignageStatus("success");
    } catch (uploadError) {
      setSignageStatus("error");
      setSignageError(uploadError.message);
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
    setPrimaryColor(initialColors.paper);
    setSecondaryColor(initialColors.accent);
    setTextColor(initialColors.ink);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
  };
  const add = () => {
    if (logoPending || destinationInvalid) return;
    onAdd(makeCartItem(productId, actionId, {
      targetId,
      supportComposition: composition,
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
      destinationUrl,
    }));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  // La page unifiée garde volontairement la même ossature quand on passe à la
  // carte. La carte est vendue à l'unité, mais l'étape quantité reste visible
  // pour éviter un changement brutal du configurateur.
  const showSupports = !productOnly && (!isCard || allowAllSurfaces);
  const showQuantity = !isCard || allowAllSurfaces;
  const supportStep = 1;
  const quantityStep = showSupports ? 2 : 1;
  const linkStep = (showSupports ? 1 : 0) + (showQuantity ? 1 : 0) + 1;
  const designStep = linkStep + 1;
  return (
    <section id={productOnly ? "configurer" : undefined} className={`v3-buybox ${compact ? "is-compact" : ""} ${productOnly ? "is-product-only" : ""}`} aria-label="Configurer l’achat">
      <div className="v3-buybox-intro"><h2>{title}</h2></div>
      <div className={`v3-core-choice-grid ${showSupports && showQuantity ? "" : "is-single"}`}>
        {showSupports && (
          <div className="v3-field-block" role="group" aria-labelledby={supportLabelId}>
            <span className="v3-field-label" id={supportLabelId}><b>{supportStep}</b><span>Support</span></span>
            <div className={`v3-choice-row ${allowAllSurfaces ? "v3-choice-row-three" : ""}`}>
              <button type="button" aria-label="Tapote Comptoir" aria-pressed={surface === "comptoir"} className={surface === "comptoir" ? "is-selected" : ""} onClick={() => selectSurface("comptoir")}><strong>Tapote Comptoir</strong></button>
              <button type="button" aria-label="Tapote Plaque" aria-pressed={surface === "plaque"} className={surface === "plaque" ? "is-selected" : ""} onClick={() => selectSurface("plaque")}><strong>Tapote Plaque</strong></button>
              {allowAllSurfaces && <button type="button" aria-label="Tapote Card" aria-pressed={surface === "carte"} className={surface === "carte" ? "is-selected" : ""} onClick={() => selectSurface("carte")}><strong>Tapote Card</strong></button>}
            </div>
          </div>
        )}
        {showQuantity && (
          <div className="v3-field-block" role="group" aria-labelledby={quantityLabelId}>
            <span className="v3-field-label" id={quantityLabelId}><b>{quantityStep}</b><span>Quantité</span></span>
            {isCard ? (
              <div className="v3-card-quantity" aria-label={`1 carte NFC · ${formatMoney(product.price)}`}>
                <span>
                  <strong>1</strong>
                  <span><small>carte NFC</small><b>à l’unité</b></span>
                  <CheckCircle2 aria-hidden="true" />
                </span>
                <p><b>Vendue à l’unité</b><span>Pour plusieurs cartes, ajoutez celle-ci puis ajustez la quantité dans le panier.</span></p>
              </div>
            ) : (
              <div className="v3-quantity-choice">
                {/* Le prix du lot est affiché sur l'option : le visiteur compare
                    sans avoir à changer de choix pour découvrir le tarif. */}
                {quantityChoices.map((value) => {
                  const optionId = getProductId(surface, personalization, value);
                  const optionPrice = formatMoney(PRODUCTS[optionId].price);
                  const optionName = value === 1 ? "support" : "Pack Local";
                  return (
                    <button
                      type="button"
                      aria-label={`${value === 1 ? "1 support" : "Pack Local, 2 supports"} · ${optionPrice}`}
                      aria-pressed={count === value}
                      className={count === value ? "is-selected" : ""}
                      onClick={() => selectCount(value)}
                      key={value}
                    >
                      <strong>{value}</strong>
                      <span>{optionName}</span>
                      <b>{optionPrice}</b>
                      {value === 2 && <em>Le plus choisi</em>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <CompositionPicker count={safeCount} composition={composition} onChange={setComposition} labelId={compositionLabelId} />
      <div className="v3-field-block v3-field-destination">
        <span className="v3-field-label" id={linkLabelId}><b>{linkStep}</b><span>Action</span></span>
        <select aria-label="Le lien à ouvrir" aria-describedby={linkLabelId} value={actionId} onChange={(event) => selectAction(event.target.value)}>
          {availableActions.map((action) => <option value={action.id} key={action.id}>{action.name}</option>)}
        </select>
        {productOnly ? (
          <details className={`v3-destination-details ${destinationInvalid ? "is-invalid" : ""}`} open={Boolean(destinationUrl)}>
            <summary>
              <Globe2 size={16} aria-hidden="true" />
              <span><strong>Préciser l’adresse exacte</strong><small>Facultatif — vous pouvez aussi nous l’envoyer après la commande</small></span>
              <b aria-hidden="true">+</b>
            </summary>
            <label className={`v3-destination-field ${destinationInvalid ? "is-invalid" : ""}`}><span><input type="url" value={destinationUrl} onFocus={markConfigurationStarted} onChange={(event) => setDestinationUrl(event.target.value.slice(0, 500))} placeholder="https://votre-lien.fr" aria-label="Adresse exacte à ouvrir" />{destinationInvalid && <small>Le lien doit commencer par https://</small>}</span></label>
          </details>
        ) : (
          <label className={`v3-destination-field ${destinationInvalid ? "is-invalid" : ""}`}><Globe2 size={16} /><span><input type="url" value={destinationUrl} onFocus={markConfigurationStarted} onChange={(event) => setDestinationUrl(event.target.value.slice(0, 500))} placeholder="https://votre-lien.fr" aria-label="Adresse exacte à ouvrir" /><small>{destinationInvalid ? "Le lien doit commencer par https://" : "Adresse initiale encodée dans le NFC et le QR. Vous pouvez aussi la transmettre après la commande, avant production."}</small></span></label>
        )}
      </div>
      <div className="v3-field-block" role="group" aria-labelledby={designLabelId}>
        <span className="v3-field-label" id={designLabelId}><b>{designStep}</b><span>Mode</span></span>
        {!lockPersonalization && <div className="v3-design-choice">
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => selectPersonalization("ready")}>
            <span><strong>Prêt à poser</strong><small>Le design Tapote, livré tel quel</small></span>
          </button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => selectPersonalization("custom")}>
            <span><strong>À votre image</strong><small>Votre logo, vos couleurs, vos textes</small></span>
          </button>
        </div>}
        {personalization === "ready" && (
          <ReadyDesignPicker
            onChange={applyTheme}
            theme={theme}
          />
        )}
      </div>
      {personalization === "ready" && !compact && !productOnly && <div className="v3-field-block v3-personalization-panel v3-campaign-design-panel"><span className="v3-field-label">Design Tapote recommandé</span><div className="v3-campaign-design-note"><Sparkles /><span><strong>{campaignHeadlineForAction(actionId)}</strong><small>Composition optimisée automatiquement pour {ACTIONS[actionId].name}.</small></span><a href="/">Voir la collection <ArrowRight /></a></div></div>}
      {personalization === "custom" && (
        <div className="v3-field-block v3-branding-fields v3-personalization-panel v3-live-studio">
          <div className="v3-studio-heading"><span><Sparkles size={15} /><strong>Tapote Studio</strong></span></div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Identité imprimée</span>
            <div className="v3-identity-grid">
              <input value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom de votre entreprise" aria-label="Nom de votre entreprise" />
              <label className={`v3-logo-upload is-${logoStatus}`}>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" onChange={uploadLogo} disabled={logoStatus === "loading"} />
                <Upload size={17} />
                <span><strong>{logoStatus === "loading" ? "Envoi sécurisé…" : brandLogo ? "Remplacer le logo" : "Ajouter votre logo"}</strong><small>PNG, JPG, WebP ou SVG · 2 Mo max.</small></span>
              </label>
            </div>
            {brandLogo && <div className="v3-uploaded-logo"><img src={brandLogo} alt="Aperçu du logo importé" /><span><strong>{logoFileName}</strong><small>{logoStatus === "success" ? "Affiché dans l’aperçu" : "À retransmettre"}</small></span><button type="button" onClick={removeLogo} aria-label="Retirer le logo"><X size={15} /></button></div>}
            {logoError && <p className="v3-upload-error" role="alert">{logoError} Retirez le fichier pour continuer sans logo.</p>}
            {/* Sans fichier de logo, le client photographie son enseigne : c'est
                la matière dont Tapote Studio a besoin pour tracer son identité
                avant le bon à tirer. */}
            {!brandLogo && (
              <div className="v3-signage-step">
                <label className={`v3-signage-upload is-${signageStatus} ${signageId ? "is-filled" : ""}`}>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSignage} disabled={signageStatus === "loading"} />
                  <Camera size={17} aria-hidden="true" />
                  <span>
                    <strong>{signageStatus === "loading" ? "Envoi sécurisé…" : signageId ? "Photo reçue" : "Vous voulez qu’on trace votre logo ?"}</strong>
                    <small>{signageId ? "Le tracé vous sera proposé avec le bon à tirer" : "Envoyez une photo de votre enseigne — facultatif"}</small>
                  </span>
                </label>
                {signageId && (
                  <div className="v3-uploaded-logo">
                    <i className="v3-signage-thumb" aria-hidden="true"><Camera size={16} /></i>
                    <span><strong>{signageFileName}</strong><small>Jointe à la commande · jamais imprimée telle quelle</small></span>
                    <button type="button" onClick={removeSignage} aria-label="Retirer la photo d’enseigne"><X size={15} /></button>
                  </div>
                )}
                {signageError && <p className="v3-upload-error" role="alert">{signageError}</p>}
              </div>
            )}
            <p className="v3-bat-promise"><CheckCircle2 size={15} aria-hidden="true" /><span>Un bon à tirer vous est envoyé avant impression. Rien ne part sans votre accord.</span></p>
          </div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Textes imprimés</span>
            <div className="v3-live-copy-fields">
              <label className="is-wide"><span>Message principal <em>{customHeadline.length}/64</em></span><input value={customHeadline} onChange={(event) => setCustomHeadline(event.target.value.slice(0, 64))} placeholder={campaignHeadlineForAction(actionId)} aria-label="Message principal imprimé" /></label>
              <label className="is-wide"><span>Phrase secondaire <em>{customSubline.length}/90</em></span><input value={customSubline} onChange={(event) => setCustomSubline(event.target.value.slice(0, 90))} placeholder={ACTIONS[actionId].campaignSubline || ACTIONS[actionId].subline} aria-label="Phrase secondaire imprimée" /></label>
              <label><span>Appel à l’action <em>{customTapLabel.length}/32</em></span><input value={customTapLabel} onChange={(event) => setCustomTapLabel(event.target.value.slice(0, 32))} placeholder="Tapotez ici" aria-label="Appel à l’action imprimé" /></label>
              <label className="is-wide"><span>Phrase métier <em>{tagline.length}/48</em></span><input value={tagline} onChange={(event) => setTagline(event.target.value.slice(0, 48))} placeholder="Librairie BD · Jeux de société · Figurines" aria-label="Phrase métier imprimée" /></label>
              <label className="is-wide"><span>Réseau, site ou téléphone <em>{contactLine.length}/48</em></span><input value={contactLine} onChange={(event) => setContactLine(event.target.value.slice(0, 48))} placeholder="@votrecompte · 01 23 45 67 89" aria-label="Réseau, site ou téléphone imprimé" /></label>
            </div>
          </div>

          {/* Couleur du bloc d'action : Tapote, la marque du client, ou la
              couleur du service ouvert par le lien. */}
          <div className="v3-studio-section">
            <span className="v3-field-label">Couleur du bloc d’action</span>
            <div className="v3-block-color-choice" role="group" aria-label="Source de couleur du bloc d’action">
              {Object.entries(BLOCK_COLOR_MODES).map(([mode, label]) => {
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
                    <span><strong>{label}</strong><small>{mode === "action" ? actionPaletteLabel(actionId) : mode === "marque" ? secondaryColor.toUpperCase() : "#2458FF"}</small></span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Couleur du support</span>
            {/* Deux déclinaisons du design Tapote : c'est le choix par défaut.
                Le réglage couleur par couleur reste possible, mais replié. */}
            <div className="v3-theme-choice" role="group" aria-label="Déclinaison de couleur">
              {Object.keys(DEVICE_THEMES).map((themeId) => (
                <button
                  type="button"
                  key={themeId}
                  className={theme === themeId ? "is-selected" : ""}
                  aria-pressed={theme === themeId}
                  onClick={() => applyTheme(themeId)}
                >
                  <span aria-hidden="true" style={{ background: DEVICE_THEMES[themeId].paper, color: DEVICE_THEMES[themeId].ink, borderColor: DEVICE_THEMES[themeId].ink }}>Aa</span>
                  <b>{THEME_LABELS[themeId]}</b>
                </button>
              ))}
            </div>
            <details className="v3-advanced-colors">
              <summary>Utiliser mes propres couleurs</summary>
            <div className="v3-brand-colors" aria-label="Couleurs de votre identité">
            <label><span>Couleur principale</span><div><input type="color" value={primaryColor} onChange={(event) => { setPrimaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur principale" /><code>{primaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setPrimaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur principale à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur secondaire</span><div><input type="color" value={secondaryColor} onChange={(event) => { setSecondaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur secondaire" /><code>{secondaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setSecondaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur secondaire à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur du texte</span><div><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur du texte" /><code>{textColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setTextColor(color); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur du texte à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <small>{manualPalettePreserved ? "Logo importé : vos couleurs choisies ont été conservées." : paletteDetected ? "Palette détectée depuis votre logo. Ajustez-la si besoin." : "Choisissez les trois couleurs ou conservez la proposition Tapote."} Le contraste d’impression est sécurisé automatiquement et le QR reste noir sur blanc.</small>
            </div>
            </details>
          </div>
          <p className="v3-studio-contract"><CheckCircle2 size={15} /><span><strong>L’aperçu prépare votre commande.</strong><small>Un BAT technique final vérifie les marges, le QR et la zone NFC avant toute impression.</small></span></p>
        </div>
      )}
      <div className="v3-buybox-summary" ref={summaryRef}>
        <div><span>{product.name}</span><strong>{formatMoney(product.price)}</strong></div>
        <button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{logoPending ? logoPendingLabel : destinationInvalid ? "Vérifier le lien" : added ? <><Check size={18} /> Ajouté</> : <>Ajouter au panier <ArrowRight size={18} /></>}</button>
      </div>
      {(productOnly || compact) && <aside className={`v3-mobile-product-cta ${initialCtaPassed && !summaryVisible ? "is-visible" : ""}`} aria-label="Résumé de la configuration"><span><small>{product.kind === "pack" && composition ? compositionLabel(composition) : product.name.replace(/ · .+$/, "")}</small><strong>{formatMoney(product.price)}</strong></span><button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{destinationInvalid ? "Lien invalide" : added ? "Ajouté" : "Ajouter"} <ArrowRight /></button></aside>}
    </section>
  );
}
