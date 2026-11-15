// node test/corpus-gen/gen-holdout3.js  - F37 second fresh holdout (after the kink fix): seeds never used before, rendered to holdout3/.
// Label "h" = unlabelled until checked by eye. Thresholds were frozen (c6dc7ec) before these were rendered.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const out = path.join(__dirname, "holdout3"); fs.mkdirSync(out, { recursive: true });
const C = [];
for (const s of [4242, 5003, 60607, 91919, 13579, 24680, 86420, 31415]) C.push(["h", "checkerboard", { seed: s }]);
for (const e of ["clouds", "noise", "marble", "cells"]) for (const s of [27182, 16180]) C.push(["h", e, { seed: s }]);
withPage(async (page, go) => {
  await go(path.join(__dirname, "blank.html"));
  await page.addScriptTag({ path: path.join(os.homedir(), "src/tgen/dist/tgen.min.js") });
  const names = [];
  for (const [label, eff, p] of C) {
    const url = await page.evaluate((eff, p) => tgen.init(256, 256).do(eff, p).toCanvas().toDataURL("image/png"), eff, p);
    const name = `${label}-${eff}-${Object.entries(p).map(([k, v]) => k + v).join("-")}.png`;
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(",")[1], "base64")); names.push(name);
  }
  return names;
}).then((r) => console.log(r.value.length, "rendered", r.errors.length ? r.errors : ""));
