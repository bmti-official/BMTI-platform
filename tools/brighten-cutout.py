# -*- coding: utf-8 -*-
"""
특정 유형 누끼의 밝기만 조정한다(투명 유지).
  실행: .venv/bin/python3 tools/brighten-cutout.py OLQM 1.15
"""
import os, sys
from PIL import Image, ImageEnhance

if len(sys.argv) < 3:
    raise SystemExit('사용법: brighten-cutout.py <코드> <배수>  예) OLQM 1.15')
code, factor = sys.argv[1].upper(), float(sys.argv[2])
p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'src', 'assets', '누끼 버전', f'{code} 누끼.png')
im = Image.open(p).convert('RGBA')
alpha = im.getchannel('A')
rgb = ImageEnhance.Brightness(Image.merge('RGB', im.split()[:3])).enhance(factor)
out = rgb.convert('RGBA'); out.putalpha(alpha)
out.save(p, 'PNG', optimize=True)
print(f'{code} 밝기 x{factor} 적용 -> {p}')
