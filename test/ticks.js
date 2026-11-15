// node test/ticks.js img  - F61 gate: for a seamless image the preview canvas must be identical with "highlight seams" on and off
// (no debris ticks on clean boundaries). Prints the number of differing pixels in #a.
const os = require("os"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const f = process.argv[2];
withPage(async (page, go) => {
  await go(path.join(__dirname, "..", "index.html"));
  await page.evaluate(() => { window.__loaded = false; });
  await (await page.$("#f")).uploadFile(path.resolve(f));
  await page.waitForFunction(() => window.__loaded === true, { timeout: 30000 });
  await page.evaluate(() => { const a = document.getElementById("a"); window.__on = a.getContext("2d").getImageData(0, 0, a.width, a.height).data; });
  await page.click("#hl"); await new Promise((r) => setTimeout(r, 1500));
  const n = await page.evaluate(() => { const a = document.getElementById("a"), off = a.getContext("2d").getImageData(0, 0, a.width, a.height).data, on = window.__on; let n = 0;
    for (let i = 0; i < on.length; i += 4) if (on[i] !== off[i] || on[i + 1] !== off[i + 1] || on[i + 2] !== off[i + 2]) n++; return n; });
  return { diffPixels: n, zoomHeading: await page.$eval("#zm", (z) => z.innerText.split("\n")[0]).catch(() => "") };
}, { w: 1000, h: 1100 }).then((r) => console.log(JSON.stringify(r.value), r.errors.length ? r.errors : ""));
