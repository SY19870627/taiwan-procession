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
thumb = {}
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
    # 小頭像裁切起點：用 normal（沒有就用第一張）找臉的位置
    ref = os.path.join(OUT, f"{cid}_{'normal' if 'normal' in manifest[cid] else manifest[cid][0]}.webp")
    a = np.asarray(Image.open(ref))[..., 3] > 200
    h, w = a.shape
    rows = np.where(a[:, int(w * .25):int(w * .75)].any(1))[0]
    top = rows[0] if len(rows) else 0
    band = a[top:top + int(h * .18)]
    cx = np.nonzero(band)[1].mean() if band.any() else w / 2
    size = w * 0.6
    thumb[cid] = [round(min(max(0, (cx - size / 2) / w), 0.4), 3), round(min(max(0, top - h * .02) / h, 0.5), 3)]

# 產生 src/art/portraits.data.ts
lines = ['/** 由 tools/portraits.py 產生，請勿手動修改 */', "import type { Expr } from './portraits';", '',
         '/** 已經有圖的角色與表情 */', 'export const SETS: Record<string, Expr[]> = {']
for cid in sorted(manifest):
    lines.append(f"  {cid}: [{', '.join(repr(e) for e in manifest[cid])}],")
lines += ['};', '', '/** 小頭像的裁切起點（相對立繪寬、高的比例） */', 'export const THUMB: Record<string, [number, number]> = {']
for cid in sorted(thumb):
    lines.append(f"  {cid}: [{thumb[cid][0]}, {thumb[cid][1]}],")
lines += ['};', '']
if len(sys.argv) > 3:
    open(sys.argv[3], 'w', encoding='utf-8').write('\n'.join(lines))
print(len(manifest), 'characters')
