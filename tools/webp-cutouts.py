# -*- coding: utf-8 -*-
"""
누끼 PNG를 웹 배포용 WebP로 변환한다(투명 유지).
  실행: .venv/bin/python3 tools/webp-cutouts.py

PNG 원본(고화질)은 그대로 두고, 사이트는 가벼운 .webp 를 import 한다.
화면에서 가장 크게 쓰이는 곳이 홈 모달(384px @3x ≈ 1152px)이라 1200px 이면 충분하다.
"""
import os, glob
from PIL import Image

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'src', 'assets', '누끼 버전')
MAX_SIDE, QUALITY = 1200, 88

tot_png = tot_webp = 0
for p in sorted(glob.glob(SRC + '/*.png')):
    im = Image.open(p).convert('RGBA')
    if max(im.size) > MAX_SIDE:
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    out = p[:-4] + '.webp'
    im.save(out, 'WEBP', quality=QUALITY, method=6)
    a, b = os.path.getsize(p), os.path.getsize(out)
    tot_png += a; tot_webp += b
    print(f'{os.path.basename(p).split()[0]:<6}{a//1024:>6}KB -> {b//1024:>4}KB')
print(f'\n합계 {tot_png/1048576:.1f}MB -> {tot_webp/1048576:.2f}MB  ({100 - tot_webp*100//tot_png}% 절감)')
