// node test/live.js [image...]  - drives index.html in headless Chromium, welds each test/img photo,
// prints before/after seam ratios, saves result PNGs + page screenshots to test/out/.
// Expects index.html to expose window.__weld = {before, after, worst, S, ms} after a weld, an <input id=file>,
// a button #fix, and a result canvas #resc (see fable-plan.md). Lesson F26: handle dialogs, time out.
const puppeteer = require("puppeteer-core"), path = require("path"), fs = require("fs");
const root = path.resolve(__dirname, ".."), imgs = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(path.join(__dirname, "img")).filter(f => /\.(jpe?g|png)$/i.test(f)).map(f => path.join(__dirname, "img", f));
(async () => {
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", args: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 1400 });
  const errors = []; page.on("pageerror", e => errors.push(String(e))); page.on("console", m => m.type() === "error" && errors.push(m.text()));
  page.on("dialog", d => { errors.push("dialog: " + d.message()); d.dismiss(); });
  await page.goto("file://" + path.join(root, "index.html"), { waitUntil: "load" });
  const rows = [];
  for (const f of imgs) {
    const name = path.basename(f, path.extname(f));
    try {
      const input = await page.$("#f"); await input.uploadFile(f);
      await page.waitForFunction(() => window.__loaded === true, { timeout: 20000 });
      await page.evaluate(() => { window.__weld = null; window.__loaded = false; });
      await page.click("#fix");
      await page.waitForFunction(() => !!window.__weld, { timeout: 60000 });
      const r = await page.evaluate(() => window.__weld);
      const png = await page.evaluate(() => document.getElementById("resc").toDataURL("image/png"));
      fs.writeFileSync(path.join(__dirname, "out", name + "-welded.png"), Buffer.from(png.split(",")[1], "base64"));
      await page.screenshot({ path: path.join(__dirname, "out", name + "-page.png") });
      rows.push({ name: name.slice(0, 28), S: r.S, ms: r.ms, bx: r.before.x.toFixed(2), by: r.before.y.toFixed(2), ax: r.after.x.toFixed(2), ay: r.after.y.toFixed(2), wx: r.worst.x.ratio.toFixed(2), wy: r.worst.y.ratio.toFixed(2), cx: r.cut.x.toFixed(2), cy: r.cut.y.toFixed(2) });
    } catch (e) { rows.push({ name: name.slice(0, 28), error: String(e).slice(0, 80) }); }
  }
  console.table(rows); if (errors.length) console.log("page errors/dialogs:", errors);
  await browser.close();
})();
