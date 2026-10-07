/**
 * One-off codemod: rewrites raw <img> tags to <SmartImage> (next/image based).
 * Run with: node scripts/migrate-img-to-smart-image.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components"];
const SKIP = new Set(["components/ui/smart-image.tsx"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Find `<img` ... `/>` spans, respecting nested braces/quotes. */
function findImgTags(src) {
  const tags = [];
  const re = /<img\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const start = m.index;
    let i = m.index + 4;
    let depth = 0;
    let quote = null;
    let end = -1;
    while (i < src.length) {
      const ch = src[i];
      if (quote) {
        if (ch === quote && src[i - 1] !== "\\") quote = null;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) { end = i + 1; break; }
      i++;
    }
    if (end === -1) break;
    tags.push({ start, end, text: src.slice(start, end) });
    re.lastIndex = end;
  }
  return tags;
}

const RELATIVE_PREFIX = "@/components/ui/smart-image";

let changedFiles = 0;
let changedTags = 0;
const missingAlt = [];

for (const root of ROOTS) {
  const files = walk(root);
  for (const file of files) {
    const rel = path.relative(".", file).replace(/\\/g, "/");
    if (SKIP.has(rel)) continue;

    const original = fs.readFileSync(file, "utf8");
    if (!original.includes("<img")) continue;

    const tags = findImgTags(original);
    let out = "";
    let cursor = 0;

    for (const tag of tags) {
      let text = tag.text;
      text = text.replace(/^<img\b/, "<SmartImage");

      const hasAlt = /\balt\s*=/.test(text);
      if (!hasAlt) {
        const line = original.slice(0, tag.start).split("\n").length;
        missingAlt.push(`${rel}:${line}`);
      }

      out += original.slice(cursor, tag.start) + text;
      cursor = tag.end;
    }
    out += original.slice(cursor);

    // Add the import if this file now uses SmartImage and does not import it.
    if (out.includes("<SmartImage") && !out.includes(RELATIVE_PREFIX)) {
      const needsRelative = !rel.startsWith("components/");
      const spec = needsRelative ? RELATIVE_PREFIX : "./smart-image";

      // Insert after the first import line, keeping imports grouped at the top.
      const firstImport = out.match(/^import .*?;$/m);
      if (firstImport) {
        const at = firstImport.index + firstImport[0].length;
        out = `${out.slice(0, at)}\nimport { SmartImage } from "${spec}";${out.slice(at)}`;
      }
    }

    if (out !== original) {
      fs.writeFileSync(file, out, "utf8");
      changedFiles++;
      changedTags += tags.length;
    }
  }
}

console.log(`Rewrote ${changedTags} <img> tags across ${changedFiles} files.`);
if (missingAlt.length) {
  console.log(`\n${missingAlt.length} tags had no alt attribute (need manual text):`);
  for (const loc of missingAlt) console.log("  " + loc);
}