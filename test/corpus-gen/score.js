// node test/corpus-gen/score.js a.png ...  - edge score + structure() per image (node, no browser).
const os = require("os"), path = require("path"), P = require(os.homedir() + "/tools/png.js"), W = require("../../weld.js");
for (const f of process.argv.slice(2)) { const im = P.read(f), r = [];
  for (const hz of [true, false]) { const e = W.seamRatio(im.data, im.w, im.h, hz).ratio, s = W.structure(im.data, im.w, im.h, hz);
    r.push(`${hz ? "x" : "y"} e${e.toFixed(2).padStart(6)} tex${s.tex.toFixed(2).padStart(6)} kink${s.kink.toFixed(2).padStart(6)} per${s.period.toFixed(2).padStart(7)} ${s.kind ? "FLAG:" + s.kind.split(" ").slice(0, 3).join(" ") : ""}`); }
  console.log(path.basename(f).padEnd(34), r.join(" | ")); }
