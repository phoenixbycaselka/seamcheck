// node test/corpus-gen/gen-real1.js <dir-of-polyhaven-1k-jpgs> - build real1/: each CC0 Poly Haven diffuse texture
// (published as tileable) at 256x256, plus a 60% off-centre crop of it (not tileable by construction).
// Shuffled under neutral names r00..; real1/key.csv maps names to source (written but not read until labels are committed).
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const src = path.resolve(process.argv[2]), out = path.join(__dirname, "real1");
fs.mkdirSync(out, { recursive: true });
const jobs = fs.readdirSync(src).filter((f) => f.endsWith(".jpg")).sort().flatMap((f) => [[f, "full"], [f, "crop"]]);
let s = 39039; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
for (let i = jobs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [jobs[i], jobs[j]] = [jobs[j], jobs[i]]; }
withPage(async (page, go) => {
  await go(path.join(__dirname, "blank.html"));
  const key = ["file,source,kind"];
  for (let i = 0; i < jobs.length; i++) {
    const [f, kind] = jobs[i], data = "data:image/jpeg;base64," + fs.readFileSync(path.join(src, f)).toString("base64");
    const url = await page.evaluate(async (data, kind) => {
      const img = new Image(); img.src = data; await img.decode();
      const W = img.width, H = img.height, c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
      if (kind === "full") g.drawImage(img, 0, 0, W, H, 0, 0, 256, 256);
      else g.drawImage(img, W * 0.23, H * 0.11, W * 0.6, H * 0.6, 0, 0, 256, 256);
      return c.toDataURL("image/png");
    }, data, kind);
    const name = "r" + String(i).padStart(2, "0") + ".png";
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(",")[1], "base64"));
    key.push([name, f.replace(".jpg", ""), kind].join(","));
  }
  fs.writeFileSync(path.join(out, "key.csv"), key.join("\n") + "\n");
  return jobs.length;
}).then((r) => console.log(r.value, "tiles", r.errors));
