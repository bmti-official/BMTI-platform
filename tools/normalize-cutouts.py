# -*- coding: utf-8 -*-
"""
누끼 이미지를 '정사각 캔버스 + 일정한 여백'으로 정규화한다.
  실행: .venv/bin/python3 tools/normalize-cutouts.py

왜 필요한가:
  누끼마다 캐릭터가 캔버스에서 차지하는 비율이 39%~96%로 제각각이라,
  사이트의 정사각 영역(마퀴 원형·갤러리 타일 등)에 object-contain 으로 넣으면
  어떤 캐릭터는 크고 어떤 캐릭터는 작게 보인다.
  → 투명 여백을 잘라내고, 긴 변이 항상 캔버스의 FILL 비율이 되도록 정사각으로 다시 앉힌다.
  → 유형별 scale-[1.25] 같은 보정이 필요 없어진다.
"""
import os, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', '누끼 버전')
FILL = 0.92        # 긴 변이 캔버스에서 차지할 비율
MAX_SIDE = 1600    # 웹 표시용으로 충분한 크기(용량 절감)

for p in sorted(glob.glob(SRC + '/*.png')):
    im = Image.open(p).convert('RGBA')
    bbox = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bbox:
        print('skip(내용 없음)', os.path.basename(p)); continue
    ch = im.crop(bbox)

    side = round(max(ch.size) / FILL)
    if side > MAX_SIDE:                      # 큰 원본은 줄여서 저장
        r = MAX_SIDE / side
        ch = ch.resize((max(1, round(ch.width * r)), max(1, round(ch.height * r))), Image.LANCZOS)
        side = MAX_SIDE

    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(ch, ((side - ch.width) // 2, (side - ch.height) // 2), ch)
    canvas.save(p, 'PNG', optimize=True)
    print(f'{os.path.basename(p)[:12]:<14}-> {side}x{side}  (내용 {ch.width}x{ch.height})')
