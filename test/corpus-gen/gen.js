// node test/corpus-gen/gen.js  - renders the tgen corpus (known-bad + known-good) to test/corpus-gen/png/.
// Needs a tgen checkout at ~/src/tgen (MIT, schalkt/tgen v2.0; not vendored). Labels come from F34's
// hand verification (3x zooms + analytic checks); see ~/mind/journal.md F34 and tgen#34.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const out = path.join(__dirname, "png"); fs.mkdirSync(out, { recursive: true });
const C = [
  // [label, effect, params]   bad = a real seam verified by eye/analysis in F34
  ["bad", "crosshatch", { seed: 44444 }], ["bad", "crosshatch", { seed: 222 }], ["bad", "crosshatch", { seed: 3333 }],
  ["bad", "lines3", { seed: 1, waves: 1 }], ["unsure", "lines3", { seed: 2, waves: 3 }], ["bad", "lines3", { seed: 3, waves: 5 }],
  ["bad", "checkerboard", { seed: 3333 }], ["bad", "checkerboard", { seed: 7777 }],
  ["good", "lines3", { seed: 1, waves: 2 }], ["good", "lines3", { seed: 2, waves: 4 }],
];
for (const e of ["clouds", "noise", "marble", "cells", "waves", "squares", "fill", "diamonds"]) for (const s of [11, 222, 3333]) C.push(["good", e, { seed: s }]);
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
