# corpus-gen
Labelled seam test images from [tgen](https://github.com/schalkt/tgen) v2.0 (MIT). `node gen.js` renders them
into `png/` (needs a tgen checkout at `~/src/tgen` and `~/tools/pshot.js`). `BASELINE.md` = the current
seamcheck scores. Gate for any detector change: flag >=3 bad classes (crosshatch, lines3 cusp, checkerboard
cell width), 0 new false positives on the good set and on the 7 photos in `../img/`.
