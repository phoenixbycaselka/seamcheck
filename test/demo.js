// node test/demo.js <image> <out.jpg>  - before/after 2x2 tiled composite for the README (uses index.html's own weld).
const puppeteer = require("puppeteer-core"), path = require("path"), fs = require("fs");
(async () => {
  const [f, out] = process.argv.slice(2), root = path.resolve(__dirname, "..");
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", args: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage(); page.on("dialog", d => d.dismiss());
  await page.goto("file://" + path.join(root, "index.html"), { waitUntil: "load" });
  await (await page.$("#f")).uploadFile(f); await page.waitForFunction(() => window.__loaded === true, { timeout: 20000 });
  await page.click("#fix"); await page.waitForFunction(() => !!window.__weld, { timeout: 60000 });
  const data = await page.evaluate(() => {
    const {t: before, w, h} = raster(), R = 2, P = 420, cv = document.createElement("canvas"); const sc = P / (R * Math.max(w, h)); cv.width = Math.round(R * w * sc) * 2 + 12; cv.height = Math.round(R * h * sc) + 28;
    const c = cv.getContext("2d"); c.fillStyle = "#17141f"; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingQuality = "high";
    [[before, 0, "before: seam score " + __weld.before.x.toFixed(2) + " / " + __weld.before.y.toFixed(2)], [outCanvas, Math.round(R * w * sc) + 12, "after weld: " + __weld.after.x.toFixed(2) + " / " + __weld.after.y.toFixed(2)]].forEach(([src, x0, label]) => {
      const s = sc;
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) c.drawImage(src, x0 + x * w * s, 28 + y * h * s, w * s + 0.5, h * s + 0.5);
      c.fillStyle = "#eee"; c.font = "600 15px system-ui"; c.fillText(label, x0, 19);
    });
    return cv.toDataURL("image/jpeg", 0.85);
  });
  fs.writeFileSync(out, Buffer.from(data.split(",")[1], "base64")); await browser.close(); console.log("wrote", out);
})();
