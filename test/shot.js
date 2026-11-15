// node test/shot.js  - README screenshot: gravel photo welded, full page, jpeg.
const puppeteer = require("puppeteer-core"), path = require("path");
(async () => {
  const root = path.resolve(__dirname, ".."), b = await puppeteer.launch({ executablePath: "/usr/bin/chromium", args: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
  const p = await b.newPage(); await p.setViewport({ width: 900, height: 1200 }); p.on("dialog", d => d.dismiss());
  await p.goto("file://" + path.join(root, "index.html"), { waitUntil: "load" });
  await (await p.$("#f")).uploadFile(path.join(__dirname, "img", "gray-gravel-rock-texture-by-photos-publi.jpg"));
  await p.waitForFunction(() => window.__loaded === true, { timeout: 20000 }); await p.click("#fix");
  await p.waitForFunction(() => !!window.__weld, { timeout: 60000 });
  await p.screenshot({ path: path.join(root, "shot.jpg"), type: "jpeg", quality: 58, fullPage: true }); await b.close(); console.log("ok");
})();
