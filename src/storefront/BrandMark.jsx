// Monogramme de substitution et pictogrammes de plateforme utilisés dans les
// aperçus produit. Le monogramme n'est qu'un remplissage : dès que le client
// importe son logo, c'est ce dernier qui occupe l'emplacement.

import { brandInitials, brandMarkVariant, normalizeBrandName } from "./brandIdentity.js";

export function GeneratedBrandMark({ name, className = "" }) {
  const safeName = name || "VOTRE MARQUE";
  const isPlaceholder = normalizeBrandName(safeName) === "VOTRE MARQUE";
  if (isPlaceholder) {
    return (
      <span className={`tp-brand-mark is-placeholder ${className}`.trim()} aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <rect x="4" y="4" width="40" height="40" rx="9" />
          <path d="M14 24h20M24 14v20" />
          <text x="24" y="43" textAnchor="middle">LOGO</text>
        </svg>
      </span>
    );
  }
  const variant = brandMarkVariant(safeName);
  return (
    <span className={`tp-brand-mark is-variant-${variant} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        {variant === 0 && <><circle cx="24" cy="24" r="18" /><path d="M9 24h30M24 9v30" /></>}
        {variant === 1 && <><path d="M8 32 24 8l16 24-16 8Z" /><path d="m15 31 18-13" /></>}
        {variant === 2 && <><rect x="8" y="8" width="32" height="32" rx="9" /><path d="M8 25h32M24 8v32" /></>}
        {variant === 3 && <><path d="M24 6c11 0 18 7 18 18s-7 18-18 18S6 35 6 24 13 6 24 6Z" /><path d="M12 34 36 14" /></>}
        {variant === 4 && <><path d="M7 14h34L32 40H16Z" /><path d="M12 21h24" /></>}
        {variant === 5 && <><path d="M24 6 42 24 24 42 6 24Z" /><circle cx="24" cy="24" r="11" /></>}
        <text x="24" y="28.5" textAnchor="middle">{brandInitials(safeName)}</text>
      </svg>
    </span>
  );
}

export function PlatformGlyph({ id, className = "" }) {
  const classes = `tp-glyph tp-glyph-${id} ${className}`.trim();
  if (id === "google") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#4285f4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.45c-.28 1.46-1.12 2.7-2.38 3.53v2.94h3.85c2.25-2.08 3.57-5.14 3.57-8.71Z" /><path fill="#34a853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.85-2.94c-1.07.72-2.43 1.14-4.08 1.14-3.13 0-5.78-2.11-6.73-4.96H1.29v3.04A12 12 0 0 0 12 24Z" /><path fill="#fbbc05" d="M5.27 14.33A7.15 7.15 0 0 1 4.9 12c0-.81.14-1.59.37-2.33V6.63H1.29A12 12 0 0 0 0 12c0 1.94.46 3.78 1.29 5.37l3.98-3.04Z" /><path fill="#ea4335" d="M12 4.71c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.49 11.49 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.04C6.22 6.82 8.87 4.71 12 4.71Z" /></svg></span>;
  if (id === "instagram") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.25" /><circle className="is-filled" cx="17.45" cy="6.65" r="1.15" /></svg></span>;
  if (id === "facebook") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><path className="is-filled" d="M13.6 22v-8.8h3l.45-3.45H13.6v-2.2c0-1 .28-1.68 1.72-1.68h1.84V2.8c-.32-.04-1.42-.13-2.72-.13-2.7 0-4.55 1.64-4.55 4.65v2.43H6.84v3.45h3.05V22h3.71Z" /></svg></span>;
  if (id === "linkedin") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><path className="is-filled" d="M5.2 8.2H1.4V22h3.8V8.2ZM3.3 2A2.2 2.2 0 1 0 3.3 6.4 2.2 2.2 0 0 0 3.3 2ZM22.6 14.1c0-4.15-2.2-6.08-5.15-6.08-2.37 0-3.44 1.3-4.03 2.22V8.2H9.63V22h3.79v-6.83c0-1.8.34-3.55 2.58-3.55 2.2 0 2.23 2.06 2.23 3.67V22H22l.6-7.9Z" /></svg></span>;
  if (id === "tiktok") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><path className="is-shadow" d="M15.6 3c.34 2.16 1.55 3.54 3.64 4.1v3.17a9.13 9.13 0 0 1-3.64-1.05v6.12a6.14 6.14 0 1 1-5.3-6.08v3.22a2.95 2.95 0 1 0 2.1 2.82V3h3.2Z" /><path className="is-filled" d="M16.7 2c.34 2.16 1.55 3.54 3.64 4.1v3.17a9.13 9.13 0 0 1-3.64-1.05v6.12a6.14 6.14 0 1 1-5.3-6.08v3.22a2.95 2.95 0 1 0 2.1 2.82V2h3.2Z" /></svg></span>;
  if (id === "whatsapp") return <span className={classes} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.55 7.47L3.5 20.5l1.3-4.33A8.5 8.5 0 1 1 20.5 11.7Z" /><path d="M8.3 7.2c.3-.3.63-.22.82.16l.88 2.05c.13.3.05.57-.16.82l-.64.74c.73 1.45 1.84 2.55 3.3 3.28l.73-.65c.25-.22.52-.3.82-.16l2.04.9c.4.17.47.51.17.82-.66.7-1.5 1.03-2.48.86-3.73-.63-6.62-3.52-7.25-7.25-.17-.98.17-1.83.87-2.49Z" /></svg></span>;
  return null;
}
