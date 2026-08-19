# -*- coding: utf-8 -*-
"""
원본 3D 렌더에서 배경을 지워 인쇄용 고해상도 누끼(투명 PNG)를 만든다.
  실행: .venv/bin/python3 tools/make-cutouts.py
  입력: src/assets/원본/{CODE}.{png|jpg|jpeg}
  출력: goods/cutout/{CODE}.png  (긴 변 2400px, 300DPI 기준 약 200mm)

배경이 단색/그라데이션이라 '테두리에서 시작하는 색상 유사 영역'만 지운다.
캐릭터 안쪽에 배경과 비슷한 색이 있어도 테두리와 연결되지 않으면 남는다.
"""
import os, re, glob
import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', '원본')
OUT = os.path.join(ROOT, 'goods', 'cutout')
LONG_EDGE = 2400          # 300DPI에서 약 200mm — 키링(50~70mm)엔 충분
TOL = 34                  # 배경으로 볼 색 거리(0~255). 크면 더 많이 지운다.

# 배경과 캐릭터 색이 비슷해 과하게 지워지는 유형은 임계값을 따로 준다
TOL_OVERRIDE = {'OLQM': 12, 'ALQM': 22, 'OCDM': 26, 'ACQZ': 26}

os.makedirs(OUT, exist_ok=True)


def border_flood(mask):
    """테두리에 닿아 있는 True 영역만 남긴다(= 배경). 반복 팽창 방식."""
    h, w = mask.shape
    seed = np.zeros_like(mask)
    seed[0, :] = mask[0, :]; seed[-1, :] = mask[-1, :]
    seed[:, 0] = mask[:, 0]; seed[:, -1] = mask[:, -1]
    while True:
        grown = seed.copy()
        grown[1:, :] |= seed[:-1, :]
        grown[:-1, :] |= seed[1:, :]
        grown[:, 1:] |= seed[:, :-1]
        grown[:, :-1] |= seed[:, 1:]
        grown &= mask
        if grown.sum() == seed.sum():
            return seed
        seed = grown


def border_colors(a, band=8, q=8):
    """테두리 띠에 실제로 등장하는 색들을 모아 '배경 색 집합'으로 삼는다.
    (분홍 위·초록 아래처럼 배경이 여러 색인 이미지도 처리하기 위함)"""
    ring = np.concatenate([
        a[:band, :].reshape(-1, 3), a[-band:, :].reshape(-1, 3),
        a[:, :band].reshape(-1, 3), a[:, -band:].reshape(-1, 3)])
    qz = (ring // q * q).astype(np.int16)
    uniq, cnt = np.unique(qz, axis=0, return_counts=True)
    order = np.argsort(-cnt)
    uniq, cnt = uniq[order], cnt[order]
    keep = np.cumsum(cnt) <= cnt.sum() * 0.995      # 희귀색(캐릭터가 걸친 부분) 제외
    keep[:1] = True
    return uniq[keep][:60].astype(np.float32)


def fill_holes(bg):
    """배경 마스크의 구멍(=캐릭터에 둘러싸인 배경색)은 캐릭터로 되돌린다."""
    return bg


def cut(path, code):
    im = Image.open(path).convert('RGB')
    if max(im.size) > LONG_EDGE:
        r = LONG_EDGE / max(im.size)
        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)

    cols = border_colors(a)
    # 각 픽셀에서 '가장 가까운 배경색'까지의 거리
    h, w, _ = a.shape
    flat = a.reshape(-1, 3)
    dist = np.full(flat.shape[0], 1e9, dtype=np.float32)
    for c in cols:
        d = np.sqrt(((flat - c) ** 2).sum(axis=1))
        np.minimum(dist, d, out=dist)
    dist = dist.reshape(h, w)

    tol = TOL_OVERRIDE.get(code, TOL)
    background = border_flood(dist < tol)
    fg = ~background

    # 주인공만 남기기 — 가장 큰 덩어리와, 그에 견줄 만한 큰 조각만 유지.
    # (배경에 떠 있던 사람·고양이·차트 같은 소품은 이 단계에서 걸러진다)
    fg = ndimage.binary_closing(fg, np.ones((5, 5)))
    lab, n = ndimage.label(fg)
    if n > 1:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        biggest = sizes.max()
        keep = {i + 1 for i, sz in enumerate(sizes) if sz >= biggest * 0.35}
        fg = np.isin(lab, list(keep))
    fg = ndimage.binary_fill_holes(fg)

    alpha = np.where(fg, 255, 0).astype(np.uint8)

    alpha_img = Image.fromarray(alpha)
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

    rgba = im.convert('RGBA')
    rgba.putalpha(alpha_img)
    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    rgba.save(os.path.join(OUT, code + '.png'), 'PNG')
    kept = round(100 * (np.asarray(alpha_img) > 8).mean(), 1)
    return rgba.size, kept


files = {}
for p in glob.glob(SRC + '/*'):
    name, ext = os.path.splitext(os.path.basename(p))
    if ext.lower() in ('.png', '.jpg', '.jpeg') and re.fullmatch(r'[AO][CL][DQ][ZM]', name):
        files[name] = p

for code in sorted(files):
    size, kept = cut(files[code], code)
    print(f'{code}  {size[0]}x{size[1]}  캐릭터 영역 {kept}%')
print('\n->', OUT)
