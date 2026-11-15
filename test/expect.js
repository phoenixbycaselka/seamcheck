// node test/expect.js  - F86: asserts the verdict for each test/img photo (runs test/verdicts.js in a real browser).
// Expected = what my eye sees in the offset (rolled) view. grass/grunge/sandstone: glaring tone/colour seams that
// were rated only "Slight" before F86 (tone >= 1.8 -> Visible). Exit 1 on any mismatch.
const { execFileSync } = require("child_process"), path = require("path"), fs = require("fs");
const want = { "gray-gravel": "Slight", "green-grass": "Visible", "grunge": "Visible", "sand-rock": "Slight",
  "sandstone": "Visible", "wall-texture": "Slight", "wood-texture": "Visible" };
const dir = path.join(__dirname, "img"), imgs = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).map((f) => path.join(dir, f));
const out = execFileSync("node", [path.join(__dirname, "verdicts.js"), ...imgs], { encoding: "utf8" }).trim().split("\n");
let bad = 0;
for (const [k, v] of Object.entries(want)) { const l = out.find((s) => s.startsWith(k)), got = l ? (l.split("|")[0].match(/Seamless|Slight|Visible|Hidden/) || ["?"])[0] : "missing", ok = got === v;
  if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + k.padEnd(14) + "want " + v.padEnd(8) + "got " + got); }
if (out.some((l) => l.startsWith("ERRORS"))) { console.log("page errors"); bad++; }
process.exit(bad ? 1 : 0);
