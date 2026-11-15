// node runs.js files... - checkerboard ground truth: colour run lengths along row 3 and column 3 (cyclic, so the
// run that crosses the wrap is joined). A tile is exact on an axis only if all runs are equal.
const { read } = require(require("os").homedir() + "/tools/png.js");
for (const f of process.argv.slice(2)) {
  const { w, h, data } = read(f), px = (x, y) => data.slice((y * w + x) * 4, (y * w + x) * 4 + 3).join();
  const runs = (n, get) => { let r = [], c = 1; for (let i = 1; i < n; i++) { if (get(i) === get(i - 1)) c++; else { r.push(c); c = 1; } } r.push(c); if (r.length > 1 && get(0) === get(n - 1)) r[0] += r.pop(); return r; };
  console.log(f.split("/").pop(), "x:", runs(w, (i) => px(i, 3)).join(" "), "| y:", runs(h, (i) => px(3, i)).join(" "));
}
