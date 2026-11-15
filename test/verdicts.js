// node test/verdicts.js img...  - real-browser check: upload each image to index.html, print the verdict line.
// Saves a screenshot of the first image's result to test/out/verdict-first.png. Uses ~/tools/pshot.js.
const os = require("os"), path = require("path"), { withPage } = require(os.homedir() + "/tools/pshot.js");
const files = process.argv.slice(2);
withPage(async (page, go) => {
  await go(process.env.URL || path.join(__dirname, "..", "index.html")); const rows = [];
  for (const [i, f] of files.entries()) {
    await page.evaluate(() => { window.__loaded = false; });
    await (await page.$("#f")).uploadFile(path.resolve(f));
    await page.waitForFunction(() => window.__loaded === true, { timeout: 30000 });
    rows.push(path.basename(f).padEnd(36) + (await page.$eval("#sc", (e) => e.querySelector(".v").innerText + " | hidden-note: " + (e.querySelector(".hid") ? e.querySelector(".hid").innerText.slice(40, 120) : "none") + " | " + [...e.querySelectorAll("b")].map((b) => b.innerText).join(" "))));
    if (i === 0) await page.screenshot({ path: path.join(__dirname, "out", "verdict-first.png"), fullPage: true });
  }
  return rows;
}, { w: 1000, h: 1100 }).then((r) => { console.log(r.value.join("\n")); if (r.errors.length) console.log("ERRORS", r.errors); });
