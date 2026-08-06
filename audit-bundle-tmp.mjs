import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dir = "dist-audit/assets";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
const out = [];
for (const f of files) {
  const jsPath = path.join(dir, f);
  const raw = fs.readFileSync(jsPath);
  const mapPath = `${jsPath}.map`;
  let groups = {};
  if (fs.existsSync(mapPath)) {
    const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    const sources = map.sources || [];
    const contents = map.sourcesContent || [];
    sources.forEach((s, i) => {
      const len = (contents[i] || "").length;
      let key;
      if (/node_modules/.test(s)) {
        const m = s.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
        key = `npm:${m ? m[1] : "?"}`;
      } else {
        key = s.replace(/^.*?(src|shared)\//, "$1/").split("?")[0];
      }
      groups[key] = (groups[key] || 0) + len;
    });
  }
  const top = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 12);
  out.push({
    file: f,
    bytes: raw.length,
    gzip: zlib.gzipSync(raw).length,
    brotli: zlib.brotliCompressSync(raw).length,
    top,
  });
}
out.sort((a, b) => b.bytes - a.bytes);
for (const e of out) {
  if (e.bytes < 3000) continue;
  console.log(`\n=== ${e.file}  ${(e.bytes / 1024).toFixed(1)} kB raw | ${(e.gzip / 1024).toFixed(1)} kB gzip | ${(e.brotli / 1024).toFixed(1)} kB br`);
  for (const [k, v] of e.top) console.log(`     ${(v / 1024).toFixed(1).padStart(8)} kB src  ${k}`);
}
const totalRaw = out.reduce((s, e) => s + e.bytes, 0);
const totalGz = out.reduce((s, e) => s + e.gzip, 0);
console.log(`\nTOTAL JS: ${(totalRaw / 1024).toFixed(1)} kB raw / ${(totalGz / 1024).toFixed(1)} kB gzip across ${out.length} chunks`);

// CSS
const cssFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".css"));
console.log("\n--- CSS ---");
for (const f of cssFiles.sort()) {
  const raw = fs.readFileSync(path.join(dir, f));
  console.log(`${f}  ${(raw.length / 1024).toFixed(1)} kB raw | ${(zlib.gzipSync(raw).length / 1024).toFixed(1)} kB gzip`);
}
