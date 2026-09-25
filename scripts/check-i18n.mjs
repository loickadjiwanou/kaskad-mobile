// Vérifie les traductions : mêmes clés en français et en anglais, et toutes les clés tr("…") / t("…") du code définies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (lang) => {
    const src = fs.readFileSync(path.join(root, "src", "i18n", `${lang}.js`), "utf8").replace("export default", "module.exports =");
    const module = { exports: {} };
    new Function("module", src)(module);
    return module.exports;
};
const fr = load("fr");
const en = load("en");
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const F = new Set(flat(fr));
const E = new Set(flat(en));
// Objets lus en entier (ex. sections de la FAQ)
const OBJECT_KEYS = new Set(["faq.sections"]);
const errors = [];
for (const k of F) if (!E.has(k)) errors.push(`missing in en: ${k}`);
for (const k of E) if (!F.has(k)) errors.push(`missing in fr: ${k}`);
const has = (k) => F.has(k) || F.has(`${k}_one`) || OBJECT_KEYS.has(k);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.js$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of [...walk(path.join(root, "app")), ...walk(path.join(root, "src"))]) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/\b(?:tr|t|translate)\("([a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+)"/g)) if (!has(m[1])) errors.push(`undefined key ${m[1]} (${path.relative(root, f)})`);
}
if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
}
console.log(`i18n OK: ${F.size} keys`);
