// node test/proto.js a.png ...  - PROTOTYPE seam signals beyond the edge score (F36). Not shipped.
// kink:   2nd difference straddling the wrap vs interior p90 (slope flips: lines3 cusps).
// period: if lines repeat with period T inside (near-exact), mismatch of pairs straddling the wrap vs interior.
const os = require("os"), path = require("path"), P = require(os.homedir() + "/tools/png.js"), W = require("../weld.js");

// Line profiles: P[i] = Float32Array of gray values along line i (column i if horiz), subsampled to <=128 samples.
function profiles({ w, h, data }, horiz) {
  const L = horiz ? w : h, n = horiz ? h : w, st = Math.max(1, Math.floor(n / 128)), m = Math.floor(n / st), out = [];
  for (let i = 0; i < L; i++) { const o = new Float32Array(m);
    for (let k = 0; k < m; k++) { const x = horiz ? i : k * st, y = horiz ? k * st : i, p = (y * w + x) * 4; o[k] = (data[p] + data[p + 1] + data[p + 2]) / 3; }
    out.push(o); }
  return out;
}
const md = (a, b) => { let s = 0; for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]); return s / a.length; };
const pct = (xs, q) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.floor((s.length - 1) * q)]; };

function kink(Pr) {
  const L = Pr.length, d2 = (i) => { const a = Pr[(i - 1 + L) % L], b = Pr[i], c = Pr[(i + 1) % L]; let s = 0;
    for (let k = 0; k < b.length; k++) s += Math.abs(a[k] - 2 * b[k] + c[k]); return s / b.length; };
  const inner = []; for (let i = 2; i < L - 2; i++) inner.push(d2(i));
  return Math.max(d2(0), d2(L - 1)) / Math.max(pct(inner, 0.9), 1);
}

function period(Pr) {
  const L = Pr.length, d1 = []; for (let i = 0; i < L - 1; i++) d1.push(md(Pr[i], Pr[i + 1]));
  const typ = Math.max(pct(d1, 0.5), 1);
  let best = Infinity, T = 0;
  for (let t = 2; t <= Math.floor(L / 3); t++) { let s = 0, c = 0; for (let i = 0; i + t < L; i += 1) { s += md(Pr[i], Pr[i + t]); c++; } if (s / c < best) { best = s / c; T = t; } }
  if (!(best < 0.1 * typ)) return { T: 0, score: 0 };       // not strongly periodic: no claim
  const inner = []; for (let i = 0; i + T < L; i++) inner.push(md(Pr[i], Pr[i + T]));
  let cross = 0; for (let i = L - T; i < L; i++) cross = Math.max(cross, md(Pr[i], Pr[(i + T) % L]));
  return { T, score: cross / Math.max(pct(inner, 0.99), 1) };
}

// texture change: per sample k, activity (mean |adjacent diff|) in a window of R lines left vs right of a boundary;
// score = mean_k |log((aL+e)/(aR+e))|. Wrap boundary vs interior p95 (interior boundaries every line).
function texchg(Pr, R = 8, e = 4) {
  const L = Pr.length, m = Pr[0].length, A = [];   // A[i][k] = |P[i+1][k]-P[i][k]| (wrapping)
  for (let i = 0; i < L; i++) { const a = Pr[i], b = Pr[(i + 1) % L], o = new Float32Array(m); for (let k = 0; k < m; k++) o[k] = Math.abs(b[k] - a[k]); A.push(o); }
  const at = (bd) => { let s = 0; for (let k = 0; k < m; k++) { let l = 0, r = 0;
      for (let j = 1; j <= R; j++) { l += A[(bd - j - 1 + 2 * L) % L][k]; r += A[(bd + j) % L][k]; }   // skip the boundary diff itself
      s += Math.abs(Math.log((l / R + e) / (r / R + e))); } return s / m; };
  const inner = []; for (let b = R + 2; b < L - R - 2; b++) inner.push(at(b));
  return at(0) / Math.max(pct(inner, 0.95), 0.02);
}
const rows = [];
for (const f of process.argv.slice(2)) {
  const im = P.read(f), r = { name: path.basename(f, ".png").slice(0, 34) };
  for (const [ax, hz] of [["x", true], ["y", false]]) {
    const Pr = profiles(im, hz), pe = period(Pr);
    r["edge" + ax] = +W.seamRatio(im.data, im.w, im.h, hz).ratio.toFixed(2);
    r["kink" + ax] = +kink(Pr).toFixed(2); r["tex" + ax] = +texchg(Pr).toFixed(2); r["per" + ax] = pe.T ? pe.T + ":" + pe.score.toFixed(1) : "-";
  }
  rows.push(r);
}
console.table(rows);
