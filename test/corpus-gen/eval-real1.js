// node test/corpus-gen/eval-real1.js - score real1/ (frozen detector) against blind eye labels + construction key.
const os = require("os"), fs = require("fs"), path = require("path"), P = require(os.homedir() + "/tools/png.js"), W = require("../../weld.js");
const csv = (f) => fs.readFileSync(path.join(__dirname, "real1", f), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
const key = Object.fromEntries(csv("key.csv").map(([f, s, k]) => [f, { s, k }])), t = {}, add = (k) => (t[k] = (t[k] || 0) + 1);
for (const [file, label, axes] of csv("labels.csv")) {
  const im = P.read(path.join(__dirname, "real1", file)), ax = {};
  for (const hz of [true, false]) { const e = W.seamRatio(im.data, im.w, im.h, hz).ratio, k = W.structure(im.data, im.w, im.h, hz).kind;
    ax[hz ? "x" : "y"] = { e, k, flag: e >= 2.5 || !!k, maybe: e >= 1.2 && e < 2.5 && !k }; }
  const flag = ax.x.flag || ax.y.flag, maybe = !flag && (ax.x.maybe || ax.y.maybe), { s, k } = key[file];
  const how = ["x", "y"].filter((a) => ax[a].flag).map((a) => a + (ax[a].e >= 2.5 ? ":edge" : ":hidden")).join(" ");
  const out = flag ? "FLAG" : maybe ? "maybe" : "clean";
  add(`${k} eye-${label} -> ${out}`);
  console.log(file, k.padEnd(4), ("eye:" + label + (axes ? "/" + axes : "")).padEnd(11), (out + " " + how).padEnd(22),
    `x e${ax.x.e.toFixed(2)} y e${ax.y.e.toFixed(2)}`, s);
}
console.log(Object.entries(t).sort().map(([k, v]) => `${k}: ${v}`).join("\n"));
