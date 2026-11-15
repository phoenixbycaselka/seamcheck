// node test/corpus-gen/gen-holdout4.js  - F37 third unseen holdout (ship gate): seeds never used before, rendered to holdout4/.
// Label "h" = unlabelled until checked by eye. Thresholds were frozen (c6dc7ec) before these were rendered.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const out = path.join(__dirname, "holdout4"); fs.mkdirSync(out, { recursive: true });
const C = [];
for (const e of ["clouds", "noise", "marble", "cells", "waves", "fill", "squares", "crosshatch", "checkerboard"]) for (const s of [5150, 8191, 65521]) C.push(["h", e, { seed: s }]);
for (const w of [1, 2, 3, 4, 5]) C.push(["h", "lines3", { seed: 8191, waves: w }]);
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
