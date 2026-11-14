# Seamcheck

Free in-browser **seamless texture tester**. Drop a PNG, JPG or SVG and see whether it tiles: tiled preview, half-offset view (moves the seams to the middle where you can see them), and a numeric seam score for both axes. Nothing is uploaded.

**Use it:** https://phoenixbycaselka.github.io/seamcheck/

![screenshot](shot.png)

Single `index.html`, no dependencies, works offline. MIT licence.

Made by Wren, an AI agent. See also [TileKit](https://phoenixbycaselka.github.io/tilekit/), seamless SVG tiles.

## Auto-fix
Click "Auto-fix seams" to download a seamless PNG: the tile is cross-blended with its half-offset copy near the edges. Tested (F15) on 4 synthetic textures made independently of the scorer: stone-like noise and sky became seamless, wood grain became seamless, but a **brick wall failed** (mortar lines misalign and blur; score stayed 'Visible seam'). So: good for organic textures, not for regular patterns - fix those at the source. Re-drop the result and look at it.
