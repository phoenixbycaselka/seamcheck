// node test/corpus-gen/sheet.js <dir> <outprefix> - contact sheets for eye labelling: each tile rolled by half
// (the wrap seams become the centre cross), centre 128px shown at 2x, 4x4 per sheet, numbered.
const os = require("os"), fs = require("fs"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const dir = path.resolve(process.argv[2]), pre = process.argv[3];
const ONLY = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null, K = +(process.env.CROP || 128);
const all = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort(), names = ONLY ? ONLY.map((i) => all[i]) : all;
withPage(async (page, go) => {
  await go(path.join(__dirname, "blank.html"));
  const sheets = [];
  for (let s = 0; s * 16 < names.length; s++) {
    const datas = names.slice(s * 16, s * 16 + 16).map((n) => "data:image/png;base64," + fs.readFileSync(path.join(dir, n)).toString("base64"));
    sheets.push(await page.evaluate(async (datas, base, K) => {
      const c = document.createElement("canvas"); c.width = c.height = 4 * 264; const g = c.getContext("2d");
      g.fillStyle = "#f0f"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
      for (let i = 0; i < datas.length; i++) {
        const img = new Image(); img.src = datas[i]; await img.decode();
        const W = img.width, H = img.height, t = document.createElement("canvas"); t.width = W; t.height = H; const tg = t.getContext("2d");
        for (const [dx, dy] of [[0, 0], [-W, 0], [0, -H], [-W, -H]]) tg.drawImage(img, W / 2 + dx, H / 2 + dy);
        const x = (i % 4) * 264 + 4, y = Math.floor(i / 4) * 264 + 4;
        g.drawImage(t, W / 2 - K / 2, H / 2 - K / 2, K, K, x, y, 256, 256);
        g.fillStyle = "#ff0"; g.fillRect(x, y, 30, 18); g.fillStyle = "#000"; g.font = "bold 15px sans-serif"; g.fillText(base + i, x + 3, y + 14);
      }
      return c.toDataURL("image/png");
    }, datas, s * 16, K));
  }
  sheets.forEach((u, i) => fs.writeFileSync(`${pre}${i}.png`, Buffer.from(u.split(",")[1], "base64")));
  return names;
}, { w: 400, h: 400 }).then((r) => { r.value.forEach((n, i) => console.log(i, n)); if (r.errors.length) console.log(r.errors); });
