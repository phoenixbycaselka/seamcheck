# real3: holdout for the F86 tone thresholds (built 2026-11-16)
25 CC0 Poly Haven diffuse textures (1k jpg, published as tileable) NOT in real1/real2, picked with seed 87
from api.polyhaven.com, plus a 60% crop of each. Built with `node gen-real1.js <dir> real3`; PNGs not
committed (7.6 MB); `key.csv` lists the sources so the set can be rebuilt.

Gate written before scoring: PASS iff <=1 published tile has toneRatio >= 1.8 (false "Visible").
Result: PASS, 0/25 >= 1.8 (max 1.60). But 2/25 >= 1.5 (grey_oak_veneer_02 1.60, grey_tiles 1.57), both seamless
to my eye in a half-roll: the 1.5 "Slight" tone line gives ~8% false Slight here (real1/real2 max good was 1.49/1.63).
Crops (not tileable): 6/25 >= 1.8, 9/25 >= 1.5. Not retuned.

F88 full verdict (edge + structure + tone, not tone alone): crops 14 Visible, 8 Slight, 3 clean (22/25 flagged).
Published tiles: 22 clean, 2 Slight, 1 Visible (grey_tiles: structure check fooled by a grout line on the wrap; seamless by eye at 3x).
