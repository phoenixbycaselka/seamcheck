// node test/corpus-gen/tone.js F  - F61 prototype: seamRatio on an FxF box-downsampled image (low-frequency/tone seams).
const os = require("os"), fs = require("fs"), path = require("path"), P = require(os.homedir() + "/tools/png.js"), W = require("../../weld.js");
const F = +process.argv[2] || 8;
function down(d, w, h) { const sw = Math.floor(w / F), sh = Math.floor(h / F), o = new Float32Array(sw * sh * 4);
  for (let y = 0; y < sh * F; y++) for (let x = 0; x < sw * F; x++) { const p = (y * w + x) * 4, q = ((y / F | 0) * sw + (x / F | 0)) * 4; for (let j = 0; j < 3; j++) o[q + j] += d[p + j] / (F * F); }
  return { d: o, w: sw, h: sh }; }
const tone = (im) => { const s = down(im.data, im.w, im.h); return [true, false].map((hz) => W.seamRatio(s.d, s.w, s.h, hz).ratio); };
const csv = (set, f) => fs.readFileSync(path.join(__dirname, set, f), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
for (const set of ["real1", "real2"]) { const lab = Object.fromEntries(csv(set, "labels.csv").map(([f, l, a]) => [f, l + (a ? "/" + a : "")]));
  const rows = Object.entries(lab).map(([f, l]) => { const im = P.read(path.join(__dirname, set, f)), [x, y] = tone(im); return [Math.max(x, y), `${set}/${f} ${l.padEnd(8)} tone x${x.toFixed(2)} y${y.toFixed(2)}`]; });
  rows.sort((a, b) => b[0] - a[0]).forEach((r) => console.log(r[1])); }
let png = []; for (const f of fs.readdirSync(path.join(__dirname, "png")).filter((f) => f.endsWith(".png"))) { const [x, y] = tone(P.read(path.join(__dirname, "png", f))); png.push([Math.max(x, y), f]); }
png.sort((a, b) => b[0] - a[0]); console.log("png top:", png.slice(0, 6).map(([v, f]) => f.slice(0, 26) + " " + v.toFixed(2)).join(" | "));
for (const f of process.argv.slice(3)) { const [x, y] = tone(P.read(f)); console.log(f, "tone", x.toFixed(2), y.toFixed(2)); }
