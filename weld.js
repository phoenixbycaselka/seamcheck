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
    throw new Error("TODO minCutPath");
  }

  function transpose(buf, W, H) { throw new Error("TODO transpose"); }   // -> buffer of size H x W
  function shift(buf, W, H, dx, dy) { throw new Error("TODO shift"); }   // out[x,y] = in[(x-dx) mod W, (y-dy) mod H]

  // Repair the vertical seam between columns seamX-1 and seamX using a strip S wide (ov = floor(S/3)).
  // Candidate patches: column windows [cx, cx+S) mod W of buf itself that do not contain the boundary
  // seamX-1|seamX. Best candidate by SSD in both overlap zones; min-cut (toroidal rows) in each zone.
  // Returns { out, cx, cost } ; out is a new buffer.
  function weldVertical(buf, W, H, S, seamX) { throw new Error("TODO weldVertical"); }

  // Full pipeline: shift half, vertical pass, transpose + vertical pass + transpose back, shift back.
  // Returns { out, before:{x,y}, after:{x,y}, worst:{x,y}, S, ms }
  function weld(buf, W, H, S) { throw new Error("TODO weld"); }

  function defaultWidth(W, H) { return Math.max(24, Math.min(160, Math.round(Math.min(W, H) / 6))); }

  return { edge, seamRatio, worstSeam, minCutPath, transpose, shift, weldVertical, weld, defaultWidth };
});
