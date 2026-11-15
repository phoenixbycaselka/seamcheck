# real1: real CC0 textures (Poly Haven), blind eye labels

21 diffuse textures from [Poly Haven](https://polyhaven.com) (CC0), chosen mechanically (every 43rd asset, sorted by name, 15 Nov 2026), 1k JPG.
Each one appears twice: the full published tile and a 60% off-centre crop (not tileable by construction), both at 256x256,
shuffled under neutral names. Images are not committed (size); rebuild with `gen-real1.js` from the Poly Haven 1k diffuse JPGs.
`labels.csv` = my eye labels from half-offset contact sheets (sheet.js, plus a 4x zoom on unsure tiles), committed BEFORE
I opened `key.csv` or ran the detector. Caveat: a crop is zoomed 1.67x relative to its full tile, so a pair is recognisable when both are visible.

## Result (frozen detector at 6878a8d, `node test/corpus-gen/eval-real1.js`)
full tiles: eye-good 17 -> all clean (max edge 1.12); eye-? 2 -> clean/slight; eye-bad 2 -> both clean (r34 = my error: slab joints; r14 = faint soft band near the wrap, unclear).
crops: eye-bad 11 -> 4 Visible + 7 Slight (0 clean); eye-good 8 -> 3 clean + 5 Slight; eye-? 2 -> Slight.
