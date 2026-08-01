import { Camera, Flashlight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import LivePhoneScreen from "./LivePhoneScreen.jsx";
import { resolveScreenModel } from "./screenData.js";
import "./scene-engine.css";

// Le châssis du téléphone : bordure, coins, boutons latéraux, mise à l'échelle
// et séquence de déverrouillage de la démonstration. Le contenu de l'écran est
// entièrement délégué à LivePhoneScreen, qui reproduit les vraies applications.
export default function DeviceFrame({
  actionId = "avis",
  sectorId = "",
  sectorTitle = "",
  brandName = "",
  brandLogo = "",
  primaryColor = "",
  secondaryColor = "",
  textColor = "",
  sceneImage = "",
  personalization = "ready",
  destinationUrl = "",
  accentColor = "#2458ff",
  embedded = false,
  demonstration = false,
  className = "",
}) {
  const model = resolveScreenModel({
    actionId,
    sectorId,
    sectorTitle,
    brandName,
    personalization,
    destinationUrl,
  });
  const style = { "--tapote-device-accent": accentColor };
  const frameRef = useRef(null);

  useLayoutEffect(() => {
    if (embedded) return undefined;
    const frame = frameRef.current;
    if (!frame) return undefined;
    const syncScreenScale = () => {
      // offsetWidth ignore la rotation appliquée par le CSS, contrairement à
      // getBoundingClientRect qui renvoie la boîte englobante : sans cela
      // l'écran était calculé trop grand et rogné sur la droite.
      const frameWidth = frame.offsetWidth;
      if (!frameWidth) return;
      const bezel = frameWidth * 0.034;
      const chromeInset = bezel * 2;
      const outerRadius = frameWidth * 0.152;
      const innerRadius = Math.max(outerRadius - bezel, frameWidth * 0.112);
      const scale = Math.max(0.18, (frameWidth - chromeInset) / 390);
      frame.style.setProperty("--tapote-device-bezel", `${bezel.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-outer-radius", `${outerRadius.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-inner-radius", `${innerRadius.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-scale", scale.toFixed(5));
      frame.style.setProperty("--tapote-device-height", `${(844 * scale) + chromeInset}px`);
    };
    syncScreenScale();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(syncScreenScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [embedded]);

  return (
    <div
      ref={frameRef}
      className={`tapote-device-frame v3-live-phone-screen ${embedded ? "is-embedded" : "is-standalone"} ${demonstration ? "is-demonstration" : ""} ${className}`}
      style={style}
      data-phone-action={model.actionId}
      data-phone-sector={sectorId || undefined}
      data-screen-family={model.family}
      data-phone-render-mode={embedded ? "screen-inlay" : "complete-device"}
      role={model.destinationUrl ? "group" : "img"}
      aria-label={`Écran du téléphone après ouverture : ${model.actionLabel}`}
    >
      <svg className="v3-live-phone-svg tapote-device__geometry" viewBox="0 0 390 844" aria-hidden="true">
        <rect x="1" y="1" width="388" height="842" rx="60" />
      </svg>
      <div className="v3-live-phone-canvas tapote-device__canvas">
        {/* La séquence de déverrouillage vit dans le même viewport logique de
            390 x 844 que l'écran : sans cela, ses tailles fixes débordaient du
            téléphone dès qu'il était affiché en petit, sur mobile notamment. */}
        {demonstration && (
          <div className="tapote-device__screen v3-live-phone-ui tapote-device__lock-layer" aria-hidden="true">
          <div className="tapote-device__lock-sequence">
            <div className="tapote-device__status">
              <span>9:41</span>
              <i className="tapote-device__island" />
              <span className="tapote-device__indicators"><i className="tapote-device__signal" /><b /></span>
            </div>
            <div className="tapote-device__lock-icon"><span /></div>
            <div className="tapote-device__lock-clock">
              <span>Jeudi 30 juillet</span>
              <strong>9:41</strong>
            </div>
            <div className="tapote-device__tap-notification">
              <i>t.</i>
              <span><small>TAPOTE · NFC</small><strong>{model.actionLabel}</strong><em>Toucher pour ouvrir</em></span>
              <b>maintenant</b>
            </div>
            <div className="tapote-device__lock-actions">
              <i><Flashlight /></i>
              <span>Balayez vers le haut pour ouvrir</span>
              <i><Camera /></i>
            </div>
            <i className="tapote-device__lock-home" />
          </div>
          </div>
        )}
        <LivePhoneScreen
          actionId={model.actionId}
          brandName={model.brandName}
          brandLogo={brandLogo}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          textColor={textColor}
          sceneImage={sceneImage}
          sectorId={sectorId}
          destinationUrl={model.destinationUrl}
          showStatusBar={!embedded}
        />
      </div>
    </div>
  );
}
