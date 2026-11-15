// node test/corpus-gen/raster-pp.js - rasterise patternpack SVGs (my archived generator, MIT) into eye1/ at 256x256.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const src = path.join(os.homedir(), "projects/patternpack/svg"), out = path.join(__dirname, "eye1");
const files = ["confetti", "diamonds", "dots", "grid", "hex", "scales", "stripes", "waves"].flatMap((d) => ["dusk", "earth"].map((p) => `${d}-${p}.svg`));
withPage(async (page, go) => {
  await go(path.join(__dirname, "blank.html"));
  for (const f of files) {
    const svg = fs.readFileSync(path.join(src, f), "utf8");
    const url = await page.evaluate(async (svg) => {
      const img = new Image(); img.src = "data:image/svg+xml;base64," + btoa(svg); await img.decode();
      const c = document.createElement("canvas"); c.width = c.height = 256; c.getContext("2d").drawImage(img, 0, 0, 256, 256);
      return c.toDataURL("image/png");
    }, svg);
    fs.writeFileSync(path.join(out, "h-pp-" + f.replace(".svg", ".png")), Buffer.from(url.split(",")[1], "base64"));
  }
  return files.length;
}).then((r) => console.log(r.value, "rasterised", r.errors));
