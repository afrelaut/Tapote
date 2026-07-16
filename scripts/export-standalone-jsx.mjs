import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const appPath = path.join(projectDirectory, "src", "App.jsx");
const stylesPath = path.join(projectDirectory, "src", "styles.css");
const catalogPath = path.join(projectDirectory, "shared", "catalog.js");
const outputDirectory = path.join(projectDirectory, "livrables");
const outputPath = path.join(outputDirectory, "TapoteSite.jsx");

const [appSource, stylesSource, catalogSource] = await Promise.all([
  readFile(appPath, "utf8"),
  readFile(stylesPath, "utf8"),
  readFile(catalogPath, "utf8"),
]);

const productsStart = catalogSource.indexOf("export const PRODUCTS");
const actionsStart = catalogSource.indexOf("export const ACTIONS");
const plansStart = catalogSource.indexOf("export const PILOT_PLANS");
const moneyStart = catalogSource.indexOf("export const formatMoney");

if ([productsStart, actionsStart, plansStart, moneyStart].some((position) => position < 0)) {
  throw new Error("Le catalogue Tapote n'a pas le format attendu.");
}

const catalogForPage = [
  catalogSource.slice(productsStart, plansStart),
  catalogSource.slice(moneyStart),
]
  .join("\n")
  .replaceAll("export const ", "const ")
  .trim();

const catalogImport = 'import { ACTIONS, formatMoney, PRODUCTS } from "../shared/catalog.js";';
const lucideImportEnd = '} from "lucide-react";';

if (!appSource.includes(catalogImport) || !appSource.includes(lucideImportEnd)) {
  throw new Error("Les imports de l'application Tapote n'ont pas le format attendu.");
}

const cssForTemplate = stylesSource
  .replaceAll("`", "\\`")
  .replaceAll("${", "\\${");

const standalonePrelude = `

/**
 * TAPOTE — export JSX monofichier
 *
 * Utilisation :
 * 1. Installer React et lucide-react.
 * 2. Importer TapoteSite comme composant racine de l'application.
 *
 * Les styles, le catalogue et les images du site sont intégrés à ce fichier.
 *
 * Les routes /api (commande, upload et prise de contact) restent facultatives
 * pour la démonstration visuelle et utilisent le serveur Tapote en production.
 */
const STANDALONE_ENV = globalThis.__TAPOTE_ENV__ || {};

${catalogForPage}

const TAPOTE_STYLES = String.raw\`${cssForTemplate}\`;
`;

let standaloneSource = appSource
  .replace(`${catalogImport}\n`, "")
  .replace(`${lucideImportEnd}`, `${lucideImportEnd}${standalonePrelude}`)
  .replaceAll("import.meta.env.", "STANDALONE_ENV.");

const appDeclaration = "export default function App()";
const appStart = standaloneSource.indexOf(appDeclaration);
if (appStart < 0) throw new Error("Le composant App est introuvable.");

standaloneSource = standaloneSource.replace(appDeclaration, "function TapoteApplication()");
standaloneSource += `

export default function TapoteSite() {
  return (
    <>
      <style>{TAPOTE_STYLES}</style>
      <TapoteApplication />
    </>
  );
}
`;

const assetReferences = [...new Set(standaloneSource.match(/\/assets\/[a-zA-Z0-9._-]+/g) || [])];
const imageMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

for (const assetReference of assetReferences) {
  const assetName = assetReference.replace("/assets/", "");
  const assetPath = path.join(projectDirectory, "public", "assets", assetName);
  const mimeType = imageMimeTypes[path.extname(assetName).toLowerCase()];
  if (!mimeType) throw new Error(`Format d'image non pris en charge : ${assetName}`);
  const assetData = await readFile(assetPath);
  const dataUrl = `data:${mimeType};base64,${assetData.toString("base64")}`;
  standaloneSource = standaloneSource.replaceAll(assetReference, dataUrl);
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, standaloneSource, "utf8");

console.log(`Export créé : ${outputPath}`);
