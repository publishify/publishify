// Code language rule (LLD 1): no Turkish in code. Names, comments, tests and messages are English;
// author-facing text lives only in translation files. Run by CI on every pull request.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Written as escapes so that this file passes its own check.
const TURKISH = /[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00c7\u011e\u0130\u00d6\u015e\u00dc]/;

const CHECKED = /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|sql|css|html|yml|yaml|toml|sh)$/;

/** Places where the language is the content itself. File names and code there stay English. */
const EXEMPT = [
  /^app\/client\/src\/i18n\//, // translation files
  /(^|\/)test\/fixtures\//, // test data
];

export const isChecked = (path) => CHECKED.test(path) && !EXEMPT.some((e) => e.test(path));

/** Returns "path:line" for every checked line that holds a Turkish character, and every Turkish file name. */
export function findTurkish(paths, read) {
  const hits = [];
  for (const path of paths) {
    if (TURKISH.test(path)) hits.push(`${path}: file name`);
    if (!isChecked(path)) continue;
    read(path)
      .split("\n")
      .forEach((line, i) => {
        if (TURKISH.test(line)) hits.push(`${path}:${i + 1}`);
      });
  }
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
    .toString()
    .split("\0")
    .filter(Boolean);
  const hits = findTurkish(paths, (p) => {
    try {
      return readFileSync(resolve(root, p), "utf8");
    } catch {
      return ""; // deleted but still in the index
    }
  });
  if (hits.length > 0) {
    console.error("Turkish found in code. Move author-facing text to the translation files.\n");
    for (const h of hits) console.error("  " + h);
    process.exit(1);
  }
  console.log("No Turkish in code.");
}
