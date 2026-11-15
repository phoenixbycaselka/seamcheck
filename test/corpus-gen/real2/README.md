# real2: real CC0 textures (ambientCG), blind eye labels

14 non-procedural (photogrammetry / multi-angle / approximated) materials from [ambientCG](https://ambientcg.com) (CC0):
every 7th in the API's top-250 "Popular" list on 15 Nov 2026 after dropping procedural ones (`*_1K-JPG_Color.jpg`).
Same protocol as real1: full tile + 60% off-centre crop, 256x256, shuffled; `labels.csv` committed BEFORE `key.csv` was read
or the detector ran. Rebuild: `node gen-real1.js <dir-of-color-jpgs> real2`.
