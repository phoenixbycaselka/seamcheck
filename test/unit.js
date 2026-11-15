// node test/unit.js  - pure-JS tests for weld.js (no browser). Exit code 1 on failure.
const W = require("../weld.js");
let fails = 0;
function eq(name, got, want) { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++;
  console.log((ok ? "ok   " : "FAIL ") + name + (ok ? "" : "  got " + JSON.stringify(got) + " want " + JSON.stringify(want))); }
function check(name, cond, info) { if (!cond) fails++; console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : "  " + (info || ""))); }

// --- minCutPath: hand-computed grids (rows x cols, row-major) ---
// Grid A: 4 rows x 3 cols. Cheapest |dk|<=1 path is 1,0,0,1 (cost 0) ; straight col 1 costs 0+9+9+0=18.
const A = Float32Array.from([
  9, 0, 9,
  0, 9, 9,
  0, 9, 9,
  9, 0, 9]);
eq("minCut A (free)", Array.from(W.minCutPath(A, 4, 3, false)), [1, 0, 0, 1]);
// Grid B: 3 rows x 4 cols. Free path jumps 0 -> 1 -> 2 -> ... cheapest free path: 0,1,2 (cost 0),
// but toroidal requires |end-start|<=1, so best toroidal is 0,1,1 (cost 0+0+1=1) or 1,1,2 (1+0+0=1)
// -> tie; we only assert the constraint + total cost == 1.
const B = Float32Array.from([
  0, 1, 5, 5,
  5, 0, 5, 5,
  5, 1, 0, 5]);
const pb = Array.from(W.minCutPath(B, 3, 4, true));
const costB = pb.reduce((s, k, r) => s + B[r * 4 + k], 0);
check("minCut B toroidal wrap constraint", Math.abs(pb[2] - pb[0]) <= 1, JSON.stringify(pb));
check("minCut B toroidal cost == 1", costB === 1, "cost " + costB + " path " + JSON.stringify(pb));
check("minCut B steps <=1", pb.every((k, r) => r === 0 || Math.abs(k - pb[r - 1]) <= 1), JSON.stringify(pb));
eq("minCut B free", Array.from(W.minCutPath(B, 3, 4, false)), [0, 1, 2]);
// Grid C: single column -> all zeros.
eq("minCut C 1 col", Array.from(W.minCutPath(Float32Array.from([3, 3, 3]), 3, 1, true)), [0, 0, 0]);

// --- transpose / shift round trips on a 3x2 RGBA buffer with distinct pixels ---
const w = 3, h = 2, b = new Uint8ClampedArray(w * h * 4);
for (let i = 0; i < w * h; i++) { b[i * 4] = i; b[i * 4 + 1] = 10 + i; b[i * 4 + 2] = 20 + i; b[i * 4 + 3] = 255; }
const t = W.transpose(b, w, h);           // now h x w (2 wide, 3 tall)
check("transpose pixel(1,0) == orig(0,1)", t[(0 * h + 1) * 4] === b[(1 * w + 0) * 4]);
eq("transpose round trip", Array.from(W.transpose(t, h, w)), Array.from(b));
const s = W.shift(b, w, h, 1, 1);
check("shift: out(1,1) == in(0,0)", s[(1 * w + 1) * 4] === b[0]);
eq("shift round trip", Array.from(W.shift(s, w, h, -1, -1)), Array.from(b));

// --- weld on a synthetic 64x64: smooth noise whose edges don't match (hard step at the wrap) ---
const N = 64, img = new Uint8ClampedArray(N * N * 4);
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const base = []; for (let i = 0; i < N * N; i++) base.push(rnd());
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  // low-frequency bump + noise + a linear ramp in x so the left/right edges differ strongly
  const v = 90 + 60 * Math.sin(x / 7) * Math.cos(y / 5) + 40 * base[y * N + x] + (x / N) * 80;
  const p = (y * N + x) * 4; img[p] = v; img[p + 1] = v * 0.8; img[p + 2] = v * 0.6; img[p + 3] = 255;
}
const before = { x: W.seamRatio(img, N, N, true).ratio, y: W.seamRatio(img, N, N, false).ratio };
const r = W.weld(img, N, N, 16);
check("weld: output size", r.out.length === img.length);
check("weld: x seam improved (" + before.x.toFixed(2) + " -> " + r.after.x.toFixed(2) + ")", r.after.x < before.x);
check("weld: x seam <= 1.5", r.after.x <= 1.5, r.after.x);
check("weld: y seam <= 1.5", r.after.y <= 1.5, r.after.y);
const ws = W.worstSeam(r.out, N, N);
check("weld: worst interior seam < 2.5 (x " + ws.x.ratio.toFixed(2) + ", y " + ws.y.ratio.toFixed(2) + ")", ws.x.ratio < 2.5 && ws.y.ratio < 2.5);
check("weld: alpha intact", r.out.every((v, i) => i % 4 !== 3 || v === 255));

// --- seam score on hard-edged patterns (F34: a perfect 16px checkerboard used to score ~57 = "Visible seam") ---
{ const M = 64, cb = new Uint8ClampedArray(M * M * 4);
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { const v = ((x >> 4) + (y >> 4)) % 2 ? 200 : 20, i = (y * M + x) * 4; cb[i] = cb[i + 1] = cb[i + 2] = v; cb[i + 3] = 255; }
  const cx = W.seamRatio(cb, M, M, true).ratio, cy = W.seamRatio(cb, M, M, false).ratio;
  check("seam: tiling checkerboard scores seamless (x " + cx.toFixed(2) + ", y " + cy.toFixed(2) + ")", cx < 1.2 && cy < 1.2);
  // smooth non-periodic field (sinusoids with periods that don't divide 60): a real wrap seam, must stay flagged
  const M2 = 60, cc = new Uint8ClampedArray(M2 * M2 * 4);
  for (let y = 0; y < M2; y++) for (let x = 0; x < M2; x++) { const v = 128 + 50 * Math.sin(x / 7.3) + 40 * Math.cos(y / 5.1 + x / 11), i = (y * M2 + x) * 4;
    cc[i] = cc[i + 1] = cc[i + 2] = v; cc[i + 3] = 255; }
  const bx = W.seamRatio(cc, M2, M2, true).ratio;
  check("seam: non-periodic smooth field still flagged (x " + bx.toFixed(2) + ")", bx >= 1.2);
}

// --- structure(): seams the edge score misses (F36). Synthetic versions of the tgen corpus classes. ---
function simg(w, h, f) { const d = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const v = f(x, y), p = (y * w + x) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; } return d; }
if (typeof W.structure !== "function") { fails++; console.log("FAIL structure() missing"); } else {
  // stripes 8px wide on a 60px image: the last stripe is 4px, so the rhythm breaks at the wrap (tgen checkerboard)
  const s1 = simg(60, 40, (x) => (Math.floor(x / 8) % 2) * 200);
  check("structure: broken stripe rhythm flagged", !!W.structure(s1, 60, 40, true).kind, JSON.stringify(W.structure(s1, 60, 40, true)));
  check("structure: ...while the edge score misses it", W.seamRatio(s1, 60, 40, true).ratio < 1.2);
  // frequency ramps across the image: fine texture meets coarse texture at the wrap (tgen crosshatch)
  let ph = 0; const fq = []; for (let x = 0; x < 200; x++) { fq.push(ph); ph += 0.15 + 2.6 * x / 200; }
  const s2 = simg(200, 64, (x, y) => 128 + 90 * Math.sin(fq[x]) * (0.6 + 0.4 * Math.sin(y * 0.7)));
  check("structure: texture change flagged", !!W.structure(s2, 200, 64, true).kind, JSON.stringify(W.structure(s2, 200, 64, true)));
  // negatives: exact stripes that tile, flat image, smooth periodic waves
  const n1 = simg(64, 40, (x) => (Math.floor(x / 8) % 2) * 200), n2 = simg(64, 64, () => 90), n3 = simg(128, 64, (x, y) => 128 + 100 * Math.sin(2 * Math.PI * (x / 32 + y / 64)));
  // exact checkerboard, 32px cells on 256: cell edges are sparse (<10% of lines), so p90 of interior ~0 (F37 holdout FP)
  const n4 = simg(256, 64, (x, y) => ((Math.floor(x / 32) + Math.floor(y / 32)) % 2) * 200);
  for (const hz of [true, false]) check("structure: exact 32px checkerboard" + (hz ? " x" : " y") + " not flagged", !W.structure(n4, 256, 64, hz).kind, JSON.stringify(W.structure(n4, 256, 64, hz)));
  for (const [nm, d, w, h] of [["tiling stripes", n1, 64, 40], ["flat", n2, 64, 64], ["periodic waves", n3, 128, 64]])
    for (const hz of [true, false]) check("structure: " + nm + (hz ? " x" : " y") + " not flagged", !W.structure(d, w, h, hz).kind, JSON.stringify(W.structure(d, w, h, hz)));
}

console.log(fails ? "\n" + fails + " FAILED" : "\nall passed");
process.exit(fails ? 1 : 0);
