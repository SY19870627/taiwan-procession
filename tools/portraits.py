"""立繪處理：白底去背 → 同一角色用同一個裁切框 → 置入 420x560 透明畫布（底部對齊）→ webp。"""
import sys, glob, os, collections, numpy as np
from PIL import Image
from scipy import ndimage
SRC, OUT = sys.argv[1], sys.argv[2]
FLIP = {'axiu'}  # 臉朝左的角色翻成朝右
CW, CH = 420, 560

def cut(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    mn = a.min(2)
    lab, _ = ndimage.label(mn > 200)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    bg = ndimage.binary_dilation(bg, iterations=2) & (mn > 150)
    alpha = np.where(bg, np.clip((255 - mn) / 255 * 1.6, 0, 1), 1.0)
    alpha = ndimage.gaussian_filter(alpha, 0.7)
    s = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(bg[..., None], np.clip((a - 255 * (1 - s)) / s, 0, 255), a)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')

groups = collections.defaultdict(list)
for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):
    cid, expr = os.path.basename(f)[:-4].rsplit('_', 1)
    groups[cid].append((expr, f))
os.makedirs(OUT, exist_ok=True)
manifest = {}
for cid, items in groups.items():
    ims = [(e, cut(f)) for e, f in items]
    box = None
    for _, im in ims:
        b = Image.fromarray((np.asarray(im)[..., 3] > 24).astype(np.uint8) * 255).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    for e, im in ims:
        c = im.crop(box)
        if cid in FLIP: c = c.transpose(Image.FLIP_LEFT_RIGHT)
        sc = min((CH - 10) / c.height, CW / c.width)
        c = c.resize((round(c.width * sc), round(c.height * sc)), Image.LANCZOS)
        canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
        canvas.paste(c, ((CW - c.width) // 2, CH - c.height))
        canvas.save(os.path.join(OUT, f'{cid}_{e}.webp'), 'WEBP', quality=70, alpha_quality=50, method=4)
    manifest[cid] = sorted(e for e, _ in items)
print(manifest)
