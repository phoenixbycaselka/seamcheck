// node test/corpus-gen/gen-eye1.js  - F38 eye-labelled set (labels in eye1/labels.csv, written before scoring): seeds never used before, rendered to eye1/.
// Label "h" = unlabelled until checked by eye. Thresholds were frozen (c6dc7ec) before these were rendered.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const out = path.join(__dirname, "eye1"); fs.mkdirSync(out, { recursive: true });
const C = [];
if (process.env.BATCH === "2") {
  const S = [12345, 54321, 99991, 3141, 1618, 2718];
  for (const e of ["crosshatch", "checkerboard"]) for (const s of S) C.push(["h2", e, { seed: s }]);
  for (const w of [1, 2, 3, 4, 5]) C.push(["h2", "lines3", { seed: 12345, waves: w }]);
  for (const e of ["marble", "noise"]) for (const s of [12345, 54321]) C.push(["h2", e, { seed: s }]);
} else {
  const S = [31337, 9001, 271828, 141421, 60606, 777];
  for (const e of ["crosshatch", "checkerboard"]) for (const s of S) C.push(["h", e, { seed: s }]);
  for (const s of [31337, 777]) for (const w of [1, 2, 3, 4, 5]) C.push(["h", "lines3", { seed: s, waves: w }]);
  for (const e of ["squares", "clouds", "cells"]) for (const s of [31337, 9001]) C.push(["h", e, { seed: s }]);
}
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
