// seamcheck weld: make a texture tileable with minimum-error-boundary cuts (image quilting, toroidal).
// Pure functions, no DOM. Buffers are RGBA Uint8ClampedArray, row-major, W*H*4.
// Plan + algorithm: ~/mind/fable-plan.md (F27). Implement in build order: minCutPath -> transpose/shift ->
// weldVertical -> weld. Metrics are ported from index.html's seam() and must stay identical to it.
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.Weld = factory();
})(this, function () {
  "use strict";

  // Mean abs RGB diff between pixel line a and line b (columns if horiz, else rows). Same as index.html.
  function edge(d, w, h, a, b, horiz) {
    let s = 0, n = horiz ? h : w;
    for (let k = 0; k < n; k++) {
      const p = horiz ? (k * w + a) * 4 : (a * w + k) * 4, q = horiz ? (k * w + b) * 4 : (b * w + k) * 4;
      s += (Math.abs(d[p] - d[q]) + Math.abs(d[p + 1] - d[q + 1]) + Math.abs(d[p + 2] - d[q + 2])) / 3;
    }
    return s / n;
  }
  // Wrap-edge diff vs the 90th percentile of interior neighbour diffs. ratio <= ~1 means seamless.
  function seamRatio(d, w, h, horiz) {
    const L = horiz ? w : h, xs = [];
    for (let i = 0; i < L - 1; i++) xs.push(edge(d, w, h, i, i + 1, horiz));
    xs.sort((p, q) => p - q);
    const p90 = xs[Math.floor(xs.length * 0.9)], wrap = edge(d, w, h, L - 1, 0, horiz);
    return { wrap, p90, ratio: wrap / Math.max(p90, 1) };
  }
  // Worst boundary anywhere (interior AND wrap), per axis, relative to that axis's p90. Catches bad cuts.
  function worstSeam(d, w, h) {
    const out = {};
    for (const horiz of [true, false]) {
      const L = horiz ? w : h, xs = [];
      for (let i = 0; i < L; i++) xs.push(edge(d, w, h, i, (i + 1) % L, horiz));
      const sorted = xs.slice().sort((p, q) => p - q), p90 = Math.max(sorted[Math.floor(L * 0.9)], 1);
      let worst = 0, at = -1;
      for (let i = 0; i < L; i++) if (xs[i] / p90 > worst) { worst = xs[i] / p90; at = i; }
      out[horiz ? "x" : "y"] = { ratio: worst, at };
    }
    return out;
  }

  // cost: Float32Array rows*cols (row-major). Returns Int16Array(rows): chosen column per row, |dk|<=1.
  // toroidal=true: additionally require |path[rows-1]-path[0]|<=1 (tile wraps vertically). Exact: run the DP
  // once per start column and keep the cheapest path satisfying the end constraint.
  function minCutPath(cost, rows, cols, toroidal) {
    const path = new Int16Array(rows);
    if (cols <= 1 || rows === 0) return path;
    const D = new Float64Array(rows * cols), from = new Int16Array(rows * cols);
    function run(k0) { // k0 = -1: free start
      for (let k = 0; k < cols; k++) D[k] = (k0 < 0 || k === k0) ? cost[k] : Infinity;
      for (let r = 1; r < rows; r++) {
        const pr = (r - 1) * cols, cr = r * cols;
        for (let k = 0; k < cols; k++) {
          let best = D[pr + k], bk = k;
          if (k > 0 && D[pr + k - 1] < best) { best = D[pr + k - 1]; bk = k - 1; }
          if (k < cols - 1 && D[pr + k + 1] < best) { best = D[pr + k + 1]; bk = k + 1; }
          D[cr + k] = best + cost[cr + k]; from[cr + k] = bk;
        }
      }
      const lr = (rows - 1) * cols; let best = Infinity, bk = 0;
      for (let k = 0; k < cols; k++) {
        if (k0 >= 0 && Math.abs(k - k0) > 1) continue;
        if (D[lr + k] < best) { best = D[lr + k]; bk = k; }
      }
      return { cost: best, end: bk };
    }
    function backtrack(end) { let k = end; for (let r = rows - 1; r >= 0; r--) { path[r] = k; if (r > 0) k = from[r * cols + k]; } }
    if (!toroidal || rows === 1) { backtrack(run(-1).end); return path; }
    let bestCost = Infinity, bestK0 = 0, bestEnd = 0;
    for (let k0 = 0; k0 < cols; k0++) { const r = run(k0); if (r.cost < bestCost) { bestCost = r.cost; bestK0 = k0; bestEnd = r.end; } }
    run(bestK0); backtrack(bestEnd);
    return path;
  }

  function px32(buf, n) { return new Uint32Array(buf.buffer, buf.byteOffset, n); }
  function transpose(buf, W, H) {   // -> buffer of size H x W (width H, height W)
    const out = new Uint8ClampedArray(W * H * 4), a = px32(buf, W * H), b = px32(out, W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) b[x * H + y] = a[y * W + x];
    return out;
  }
  function shift(buf, W, H, dx, dy) {   // out[x,y] = in[(x-dx) mod W, (y-dy) mod H]
    const out = new Uint8ClampedArray(W * H * 4), a = px32(buf, W * H), b = px32(out, W * H);
    dx = ((dx % W) + W) % W; dy = ((dy % H) + H) % H;
    for (let y = 0; y < H; y++) { const sy = (y - dy + H) % H; for (let x = 0; x < W; x++) b[y * W + x] = a[sy * W + (x - dx + W) % W]; }
    return out;
  }

  // Repair the vertical seam between columns seamX-1 and seamX using a strip S wide (ov = floor(S/3)).
  // Candidate patches: column windows [cx, cx+S) mod W of buf itself that do not contain the boundary
  // seamX-1|seamX. Best candidate by SSD in both overlap zones; min-cut (toroidal rows) in each zone.
  // Returns { out, cx, cost, S } ; out is a new buffer.
  function weldVertical(buf, W, H, S, seamX) {
    S = Math.min(S, 2 * Math.min(seamX, W - seamX), W - 2);
    if (S < 6) return { out: buf.slice(), cx: -1, cost: Infinity, S };
    const ov = Math.floor(S / 3), x0 = seamX - (S >> 1);
    const cstep = W > 512 ? 2 : 1, rstep = H > 256 ? 2 : 1;
    let bestCx = -1, bestCost = Infinity;
    for (let cx = 0; cx < W; cx += cstep) {
      if (((seamX - 1 - cx + W) % W) < S - 1) continue;   // window would contain the seam boundary
      let c = 0;
      for (let y = 0; y < H && c < bestCost; y += rstep) {
        const row = y * W;
        for (let j = 0; j < S; j++) {
          if (j === ov) j = S - ov;                          // skip the core: overlaps only
          const p = (row + x0 + j) * 4, q = (row + (cx + j) % W) * 4;
          const dr = buf[p] - buf[q], dg = buf[p + 1] - buf[q + 1], db = buf[p + 2] - buf[q + 2];
          c += dr * dr + dg * dg + db * db;
        }
      }
      if (c < bestCost) { bestCost = c; bestCx = cx; }
    }
    if (bestCx < 0) return { out: buf.slice(), cx: -1, cost: Infinity, S };
    const out = buf.slice(), cx = bestCx;
    const copy = (y, j) => { const p = (y * W + x0 + j) * 4, q = (y * W + (cx + j) % W) * 4; out[p] = buf[q]; out[p + 1] = buf[q + 1]; out[p + 2] = buf[q + 2]; out[p + 3] = buf[q + 3]; };
    // overlap costs: per-pixel SSD between what is there and what the patch would put there
    const cL = new Float32Array(H * ov), cR = new Float32Array(H * ov);
    for (let y = 0; y < H; y++) for (let k = 0; k < ov; k++) {
      for (const [arr, j] of [[cL, k], [cR, S - ov + k]]) {
        const p = (y * W + x0 + j) * 4, q = (y * W + (cx + j) % W) * 4;
        const dr = buf[p] - buf[q], dg = buf[p + 1] - buf[q + 1], db = buf[p + 2] - buf[q + 2];
        arr[y * ov + k] = dr * dr + dg * dg + db * db;
      }
    }
    const pL = minCutPath(cL, H, ov, true), pR = minCutPath(cR, H, ov, true);
    let cutL = 0, cutR = 0;   // mean RGB diff per pixel along each cut: how visible the seam line is
    for (let y = 0; y < H; y++) { cutL += Math.sqrt(cL[y * ov + pL[y]] / 3); cutR += Math.sqrt(cR[y * ov + pR[y]] / 3); }
    for (let y = 0; y < H; y++) {
      for (let j = ov; j < S - ov; j++) copy(y, j);                 // core: all patch
      for (let k = pL[y] + 1; k < ov; k++) copy(y, k);              // left zone: right of the cut is patch
      for (let k = 0; k < pR[y]; k++) copy(y, S - ov + k);          // right zone: left of the cut is patch
    }
    return { out, cx, cost: bestCost, S, cut: Math.max(cutL, cutR) / H };
  }

  // Typical difference between horizontally adjacent pixels (mean abs RGB), sampled. Reference for cut cost.
  function neighbourDiff(buf, W, H) {
    let s = 0, n = 0;
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W - 1; x += 3) {
      const p = (y * W + x) * 4, q = p + 4;
      s += (Math.abs(buf[p] - buf[q]) + Math.abs(buf[p + 1] - buf[q + 1]) + Math.abs(buf[p + 2] - buf[q + 2])) / 3; n++;
    }
    return Math.max(s / n, 1);
  }

  // Full pipeline: shift half, vertical pass, transpose + vertical pass + transpose back, shift back.
  // Returns { out, before:{x,y}, after:{x,y}, worst:{x,y}, S, ms }
  function weld(buf, W, H, S) {
    const t0 = Date.now();
    S = Math.max(6, Math.min(S | 0, Math.floor(Math.min(W, H) / 2)));
    const before = { x: seamRatio(buf, W, H, true).ratio, y: seamRatio(buf, W, H, false).ratio };
    const dx = W >> 1, dy = H >> 1;
    const O = shift(buf, W, H, dx, dy);                 // seams now at column dx and row dy
    const ref = neighbourDiff(O, W, H);
    const v = weldVertical(O, W, H, S, dx);
    const T = transpose(v.out, W, H);                   // H wide, W tall; former row seam is now column dy
    const hz = weldVertical(T, H, W, S, dy);
    const refT = neighbourDiff(T, H, W);
    const out = shift(transpose(hz.out, H, W), W, H, -dx, -dy);
    const after = { x: seamRatio(out, W, H, true).ratio, y: seamRatio(out, W, H, false).ratio };
    return { out, before, after, worst: worstSeam(out, W, H), S, ms: Date.now() - t0, cx: v.cx, cy: hz.cx,
      cut: { x: v.cut / ref, y: hz.cut / refT } };   // >~2: the weld line itself is probably visible
  }

  function defaultWidth(W, H) { return Math.max(24, Math.min(160, Math.round(Math.min(W, H) / 6))); }

  return { edge, seamRatio, worstSeam, minCutPath, transpose, shift, weldVertical, weld, defaultWidth };
});
