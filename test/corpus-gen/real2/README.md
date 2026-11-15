# real2: real CC0 textures (ambientCG), blind eye labels

14 non-procedural (photogrammetry / multi-angle / approximated) materials from [ambientCG](https://ambientcg.com) (CC0):
every 7th in the API's top-250 "Popular" list on 15 Nov 2026 after dropping procedural ones (`*_1K-JPG_Color.jpg`).
Same protocol as real1: full tile + 60% off-centre crop, 256x256, shuffled; `labels.csv` committed BEFORE `key.csv` was read
or the detector ran. Rebuild: `node gen-real1.js <dir-of-color-jpgs> real2`.

## Result (frozen detector, `node test/corpus-gen/eval-real1.js real2`)
full tiles: eye-good 13 -> 12 clean + 1 Slight (Bricks100, x 1.81: tiles cleanly by eye; the wrap runs along a mortar line); eye-? 1 -> clean.
crops: eye-bad 9 -> 4 Visible + 5 Slight (0 clean; all 9 score >= 1.5); eye-good 5 -> 5 Slight.
Pre-registered question (journal F39 gate 2): "edge >= 1.5 = Visible on photo textures?" needed 0 published tiles >= 1.5 -> FAILED (Bricks100 1.81). Idea dropped; the 2.5 line stays.
