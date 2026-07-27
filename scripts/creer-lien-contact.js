import "dotenv/config";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

/**
 * Crée un lien court Tapote pointant vers une fiche contact commerciale.
 *
 *   node scripts/creer-lien-contact.js \
 *     --organization <uuid> \
 *     --code aymeric \
 *     --target https://tapote.fr/c/aymeric.html \
 *     --label "Contact — Aymeric Frelaut" \
 *     --confirmer
 *
 * Sans --confirmer le script n'écrit rien : il affiche ce qu'il ferait. C'est
 * une écriture en production, autant la relire avant de la lancer.
 *
 * Convention retenue : préfixe `c-` sur le code, pour que les tapotes de
 * prospection ne se mélangent pas aux liens d'avis clients dans les statistiques.
 */

function lireArguments(valeurs) {
  const resultat = {};
  for (let index = 0; index < valeurs.length; index += 1) {
    const cle = valeurs[index];
    if (!cle?.startsWith("--")) continue;
    const suivant = valeurs[index + 1];
    if (suivant === undefined || suivant.startsWith("--")) {
      resultat[cle.slice(2)] = true;          // drapeau sans valeur
    } else {
      resultat[cle.slice(2)] = suivant;
      index += 1;
    }
  }
  return resultat;
}

function requis(valeur, libelle) {
  if (!String(valeur || "").trim()) throw new Error(`${libelle} est requis.`);
  return String(valeur).trim();
}

const args = lireArguments(process.argv.slice(2));
const organizationId = requis(args.organization, "--organization");
const codeBrut = requis(args.code, "--code").toLowerCase();
const targetUrl = requis(args.target, "--target");
const label = String(args.label || `Contact — ${codeBrut}`).trim();
const locationId = String(args.location || "").trim() || null;
const confirmer = args.confirmer === true;

if (!/^https:\/\//.test(targetUrl)) throw new Error("--target doit être une URL HTTPS.");
if (!/^[a-z0-9-]{3,32}$/.test(codeBrut)) {
  throw new Error("--code n'accepte que lettres minuscules, chiffres et tirets (3 à 32).");
}

const shortCode = codeBrut.startsWith("c-") ? codeBrut : `c-${codeBrut}`;

const supabaseUrl = requis(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, "SUPABASE_URL");
const secretKey = requis(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SECRET_KEY");

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existant, error: erreurLecture } = await admin
  .from("tapote_links")
  .select("id, short_code, target_url, label, active")
  .eq("short_code", shortCode)
  .maybeSingle();
if (erreurLecture) throw erreurLecture;

if (existant) {
  console.log(`Le code ${shortCode} existe déjà :`);
  console.log(`  cible actuelle : ${existant.target_url}`);
  console.log(`  libellé        : ${existant.label}`);
  console.log("Choisis un autre --code, ou mets à jour la ligne depuis Tapote Gestion.");
  process.exit(1);
}

console.log("Lien à créer");
console.log(`  organisation : ${organizationId}`);
console.log(`  code court   : ${shortCode}`);
console.log(`  destination  : ${targetUrl}`);
console.log(`  libellé      : ${label}`);
if (locationId) console.log(`  emplacement  : ${locationId}`);

if (!confirmer) {
  console.log("\nRien n'a été écrit. Relance avec --confirmer pour créer le lien.");
  process.exit(0);
}

const { data, error } = await admin
  .from("tapote_links")
  .insert({
    organization_id: organizationId,
    location_id: locationId,
    short_code: shortCode,
    target_url: targetUrl,
    label,
    active: true,
  })
  .select("id, short_code")
  .single();
if (error) throw error;

console.log(`\nLien créé (${data.id}).`);
console.log(`À encoder dans la puce : https://t.tapote.fr/a/${data.short_code}?s=nfc`);
console.log("Vérifie la redirection avant d'encoder :");
console.log(`  curl -I "https://t.tapote.fr/a/${data.short_code}?s=nfc"`);
console.log("La réponse doit être 302 avec la destination dans l'en-tête Location.");
