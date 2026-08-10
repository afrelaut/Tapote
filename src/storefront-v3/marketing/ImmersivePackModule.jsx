import { useRef, useState } from "react";
import { ArrowRight, Check, Layers3, MapPin, Sparkles } from "lucide-react";
import { formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { ProductArt } from "../scenes/ProductArt.jsx";

const FORMATS = [
  { id: "comptoir", label: "Chevalet", moment: "Au comptoir", readyId: "chevalet_pret", customId: "chevalet_personnalise" },
  { id: "plaque", label: "Plaque", moment: "À l’entrée", readyId: "plaque_prete", customId: "plaque_personnalisee" },
  { id: "carte", label: "Carte", moment: "En rendez-vous", readyId: "carte_prete", customId: "carte_personnalisee" },
];

export default function ImmersivePackModule() {
  const stageRef = useRef(null);
  const [activeFormat, setActiveFormat] = useState("comptoir");

  const handlePointerMove = (event) => {
    if (event.pointerType === "touch" || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    stageRef.current.style.setProperty("--immersive-x", x.toFixed(3));
    stageRef.current.style.setProperty("--immersive-y", y.toFixed(3));
  };

  const resetPerspective = () => {
    if (!stageRef.current) return;
    stageRef.current.style.setProperty("--immersive-x", "0");
    stageRef.current.style.setProperty("--immersive-y", "0");
  };

  return (
    <section className="v3-immersive-pack" aria-labelledby="v3-immersive-pack-title">
      <div className="v3-immersive-pack__copy">
        <span className="v3-eyebrow"><Sparkles aria-hidden="true" /> LA GAMME EN MOUVEMENT</span>
        <h2 id="v3-immersive-pack-title">Trois formats.<br />Une seule signature.</h2>
        <p>Une identité cohérente au comptoir, à l’entrée et en rendez-vous. Chaque Tapote garde son propre lien.</p>
        <div className="v3-immersive-pack__proofs" aria-label="Avantages des packs Tapote">
          <span><Check aria-hidden="true" /> Même design partout</span>
          <span><MapPin aria-hidden="true" /> Une destination par support</span>
        </div>
        <a href="/boutique#packs">Composer mon équipement <ArrowRight aria-hidden="true" /></a>
      </div>

      <div
        ref={stageRef}
        className="v3-immersive-pack__stage"
        data-active-format={activeFormat}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPerspective}
      >
        <div className="v3-immersive-pack__halo" aria-hidden="true"><i /><i /><i /></div>
        <div className="v3-immersive-pack__objects" aria-hidden="true">
          <div className="is-comptoir">
            <ProductArt surface="comptoir" actionId="avis" brandName="tapote." theme="nuit" personalization="ready" />
            <span>Chevalet</span>
          </div>
          <div className="is-plaque">
            <ProductArt surface="plaque" actionId="instagram" brandName="tapote." theme="creme" personalization="ready" />
            <span>Plaque</span>
          </div>
          <div className="is-carte">
            <ProductArt surface="carte" actionId="linkedin" brandName="tapote." theme="nuit" personalization="ready" />
            <span>Carte</span>
          </div>
        </div>
        <div className="v3-immersive-pack__signal" aria-hidden="true">
          <i /><i /><span><Layers3 /></span>
        </div>
        <div className="v3-immersive-pack__legend">
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              className={activeFormat === format.id ? "is-active" : ""}
              aria-pressed={activeFormat === format.id}
              aria-label={`${format.label} : prêt à poser ${formatMoney(PRODUCTS[format.readyId].price)}, à votre image ${formatMoney(PRODUCTS[format.customId].price)}`}
              onClick={() => setActiveFormat(format.id)}
            >
              <small>{format.moment}</small>
              <strong>{format.label}</strong>
              <em>{formatMoney(PRODUCTS[format.readyId].price)} prêt · {formatMoney(PRODUCTS[format.customId].price)} image</em>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
