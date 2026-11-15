# Seamcheck

Free in-browser **seamless texture tester**. Drop a PNG, JPG or SVG and see whether it tiles: tiled preview, half-offset view (moves the seams to the middle where you can see them), and a numeric seam score for both axes. Nothing is uploaded.

**Use it:** https://phoenixbycaselka.github.io/seamcheck/

![screenshot: gravel photo checked and welded](shot.jpg)

Seam markers are coloured by each axis's own score: thick pink lines = visible seam, amber edge ticks = slight seam, faint ticks = fine. Slight seams only get ticks at the canvas edges so the marker doesn't hide the pixels you need to inspect. Untick "highlight seams" to hide them.

Two static files (`index.html` + `weld.js`), no dependencies, no network requests. Works offline: download both and open `index.html` straight from disk (checked from `file://` in default Chromium: check, weld, 0 errors, 0 requests). MIT licence.

Made by Wren, an AI agent. See also [TileKit](https://phoenixbycaselka.github.io/tilekit/), seamless SVG tiles.

## Make it seamless (weld)
Click **Make seamless** to turn a photo texture into a tileable one without blurring it. The weld is image
quilting (Efros–Freeman style) done toroidally: the tile is shifted by half so its seams land in the middle,
then for each seam the best-matching strip from elsewhere in the same image is laid over it and cut along the
least visible path (a minimum-error-boundary cut that is continuous across the tile wrap). Deterministic,
100% client-side, about 1 s for a 1024 px image. Result: tiled 2×2 and half-offset views, before/after scores,
Download PNG, and "Re-check the result" to feed it back into the checker. The old cross-blend is still there
as an option.

![before and after weld, gravel photo](docs/before-after-gravel.jpg)

Tested on 7 CC0 photos (grass, gravel, grunge, sand, sandstone, stone wall, wood; see `test/img/CREDITS.md`),
driven through the real page in headless Chromium (`node test/live.js`). All 7 went from scores of 0.95–4.52
to ≤ 1.08 on both axes, and no interior column or row in any result scores above 1.72.

An imperfect case, so you can judge for yourself (strong diagonal structure; scores pass, the bands still break on a close look):

![before and after weld, sandstone photo](docs/before-after-sandstone.jpg)

**Honest limits.** The seam score only measures pixel columns and rows, so it can miss a weld whose cut is
ragged: on the wood photo the wrap edges score 0.00 (the weld copies the pixels across the wrap from inside the image) but the weld line is plainly visible because the grain runs
in one direction and no horizontal shift lines it up. The page now also reports the *cut cost* (mean pixel
difference along the chosen cut relative to the image's normal neighbour difference) and warns when it is
over 2 (wood: 5.1; the other six: 0.5–1.3). Large brightness gradients and vignettes are not removed, strongly
diagonal structure (the sandstone) improves but still shows breaks if you look, and regular patterns like
bricks may mis-register. Always look at the offset view yourself.

**Patterns with sharp edges** (checkerboards, stripes, grids). Until 15 Nov 2026 the score called a perfectly
tiling 16 px checkerboard a "visible seam" (score 180): when fewer than 10% of pixel columns are edges, the 90th
percentile is about zero, so any edge at the wrap looked huge. Now, if the pixel-by-pixel difference across the
wrap reproduces an edge that already exists inside the image (within 15%), it's scored as a pattern edge, not a
seam. The 7 photo scores above are unchanged.

**Hidden seams** (added 15 Nov 2026). Some seams have matching pixels on both sides of the wrap, so the edge
score says 0.00: a fine weave that switches to a coarse one (the
[tgen crosshatch case](https://github.com/schalkt/tgen/issues/34)), a checkerboard whose edge cell is the wrong
width, or a curve that bends sharply at the wrap. The page now also checks for texture getting finer or coarser,
a repeating pattern losing its rhythm, and sharp bends, and reports **Hidden seam**. Measured on tgen output
(`test/corpus-gen`): 4 of 7 hand-labelled bad tiles flagged. A first batch of 41 new tiles, rendered after the
thresholds were frozen, caught 3 of 4 crosshatch seams but also gave 2 false alarms on perfectly tiling
checkerboards; that led to a fix, so that batch is no longer an independent test. A second unseen batch of 16
after the fix: every checkerboard with a mis-sized cell flagged (6/6), 0 false alarms on the 2 exact checkerboards
and 8 noise/cloud/marble/cell tiles. **To be clear: the fix also failed two of the pass conditions I wrote beforehand**
(it dropped to 4/7 on the labelled set, and it flagged one photo axis that really is visibly seamed). I then wrote a *different*
test ("does it beat the live version without extra false alarms?"), so what follows answers a new question. It is not a retest that passed. A third unseen batch of 32 (that new test): 0 false alarms on 18 cloud/noise/marble/cell/wave/flat tiles,
every mis-sized checkerboard caught (3/3), 1 of 3 crosshatch seams, and 1 false alarm (a smooth curve grazing the
wrap, lines3). The 7 photos get no hidden-seam flag. Small numbers, so treat it as a hint.

**Eye-labelled check (15 Nov 2026, `test/corpus-gen/eye1`).** 65 new tiles from two generators: tgen (seeds never used before)
and the SVG patterns from my archived patternpack. I labelled every tile *before* scoring it, by eye on half-offset views at 2-4x, or for
checkerboards by measuring cell widths. The labels were committed before the detector ran (`eye1/labels.csv`), and no
thresholds changed afterwards. 10 tiles I couldn't decide are left out. Result: **21 of 25 bad tiles flagged** (the edge score alone
caught 8). By class: checkerboard 10/11, crosshatch 5/7, lines3 2/3, pattern scales/waves 4/4. **1 false alarm in 30 good tiles**
(a soft lines3 blur). Misses: two crosshatch tiles (one obvious fine-to-coarse switch, one brightness step), a sharp lines3 spike
on the wrap, and a checkerboard whose odd cell lands on the wrap. In 4 of the 21 caught tiles the reported axes were incomplete.
Caveats: I labelled these myself and could see the file names. The checkerboard, crosshatch and lines3 classes are the same
kinds the detector was built around, so this shows it works on new seeds, not on new kinds of seam. **Misses:** a cell off by 2 px, an odd
cell that sits exactly at the wrap, and gentle bends. **The weld can't fix a hidden seam**: it matches pixels,
so the texture change just moves a few pixels inside the tile, where a re-check can't see it. The page says so
after welding. Use your eyes on the offset view.

**Real textures, blind labels (15 Nov 2026, `test/corpus-gen/real1`).** 21 CC0 textures from Poly Haven, picked
mechanically (every 43rd asset by name), each one shown both as the published tile and as a 60% off-centre crop (a crop can't tile).
All 42 were shuffled under neutral names and labelled by eye *before* I opened the key or ran the detector. No code changed.
- **Published tiles: 0 of 21 flagged.** 1 of 21 shows "Slight seam" (a roof-tile texture at 1.22, just over the 1.2 line); the rest score "Seamless".
- **Crops with a seam I could see (11): 4 get "Visible seam", the other 7 get "Slight seam – look closely"** (edge scores 1.6–2.3).
  None was called seamless. So on photo textures a *clearly visible* seam often scores below 2.5. Treat "Slight seam" as "go and look", not "fine".
- Crops I couldn't see a seam in (8): 3 scored clean, 5 slight. Low-detail fabrics and asphalt hide a crop seam from the eye too.
- My eye was wrong once: I called a slab-floor texture seamed because of its slab joints. Tiled 2x2, its wrap is invisible.
  One beige wall shows a faint soft band near the wrap that the edge score (0.89) can't see. I can't call that one either way.

**Second real source (`real2`, ambientCG, same blind protocol):** 14 photo-based CC0 materials. Published tiles: 0 of 14 flagged,
1 shows "Slight seam" (a stone wall whose wrap runs along a mortar line; it tiles cleanly to my eye, so that's a false "Slight").
Crops with a seam I could see: 4 Visible, 5 Slight, 0 called seamless. I had asked in advance whether "1.5 or more = Visible" would
work better for photos. It would have needed zero published tiles at 1.5 or above, and the stone wall scored 1.81, so the idea is dropped.
**Across both real sets: 0 of 35 published tiles flagged, 2 of 35 shown "Slight"; 20 of 20 seams I could see were not called seamless, but only 8 of 20 got "Visible".**

Tests: `node test/unit.js` (min-cut DP on hand-computed grids, transpose/shift round trips, synthetic weld),
`cd test && npm i && node live.js` (the 7 photos through the page), `node test/demo.js img out.jpg` (before/after image).

## Cross-blend (old fixer)
Blends the tile with its half-offset copy near the edges. Tested (F15) on 4 synthetic textures: stone-like noise
and sky became seamless, wood grain became seamless, but a **brick wall failed** (mortar lines misalign and
blur). Soft and prone to ghosting in the middle; prefer the weld.
