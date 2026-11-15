// node test/corpus-gen/eval-eye1.js - score eye1/ against eye1/labels.csv (labels were committed before this ran).
// Axis flagged = edge >= 2.5 (red, "Seam") or structure() kind ("Hidden seam"), as on the page. 1.2-2.5 = "maybe" (yellow).
const os = require("os"), fs = require("fs"), path = require("path"), P = require(os.homedir() + "/tools/png.js"), W = require("../../weld.js");
const rows = fs.readFileSync(path.join(__dirname, "eye1/labels.csv"), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
const t = {}, add = (k) => (t[k] = (t[k] || 0) + 1);
for (const [file, label, axes] of rows) {
  if (label === "?") continue;
  const im = P.read(path.join(__dirname, "eye1", file)), ax = {};
  for (const hz of [true, false]) { const e = W.seamRatio(im.data, im.w, im.h, hz).ratio, k = W.structure(im.data, im.w, im.h, hz).kind;
    ax[hz ? "x" : "y"] = { e, k, flag: e >= 2.5 || !!k, maybe: e >= 1.2 && e < 2.5 && !k }; }
  const flagged = ax.x.flag || ax.y.flag, cls = file.split("-")[1] === "pp" ? "pp-" + file.split("-")[2] : file.split("-")[1];
  const how = ["x", "y"].filter((a) => ax[a].flag).map((a) => a + (ax[a].e >= 2.5 ? ":edge" : ":hidden")).join(" ");
  if (label === "bad") { add(flagged ? "TP" : "FN"); add(cls + (flagged ? " TP" : " FN"));
    const axOK = flagged && [...axes].every((a) => ax[a].flag); if (flagged) add(axOK ? "axes right" : "axes partly wrong"); }
  else { add(flagged ? "FP" : "TN"); if (!flagged && (ax.x.maybe || ax.y.maybe)) add("good shown as maybe"); }
  console.log(label.padEnd(5), (flagged ? "FLAG " + how : (ax.x.maybe || ax.y.maybe) ? "maybe" : "clean").padEnd(22), axes.padEnd(3), file, `x e${ax.x.e.toFixed(2)} y e${ax.y.e.toFixed(2)}`);
}
console.log(JSON.stringify(t, null, 0));
