# -*- coding: utf-8 -*-
"""
앱스토어 미리보기 이미지 합성.
  실행: .venv/bin/python3 tools/build-appstore.py
  입력: appstore/raw/*.png (capture-appstore.cjs 결과, 1320x2868)
  출력: appstore/*.png     (1320x2868, iPhone 6.9")
문구만 바꾸려면 아래 SLIDES 를 고치면 된다.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1320, 2868
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW, OUT = os.path.join(ROOT, 'appstore', 'raw'), os.path.join(ROOT, 'appstore')

FONT = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
BOLD, SEMI = 6, 4                      # ttc index (Bold / SemiBold)
INK, SUB = '#1C1A17', '#8E887D'
YELLOW, PURPLE, PINK = '#FDF6DC', '#EDE8F9', '#FBE9F0'
GOLD, VIOLET, ROSE = '#C9975A', '#8B7BD8', '#D6486D'

# (파일, 배경, 아이브로우, [(문구, 색)] 제목 줄들)
SLIDES = [
    ('1-result-top', YELLOW, '2분이면 끝나는 움직임 성향 검사',
     [[('16가지 ', VIOLET), ('BMTI 유형', INK)], [('나는 어떤 유형일까?', INK)]]),
    ('2-tendency', PURPLE, '나도 몰랐던 내 몸의 취향',
     [[('4가지 축', VIOLET), ('으로 보는', INK)], [('움직임 성향', INK)]]),
    ('3-diary-mood', YELLOW, '탭 몇 번이면 충분해요',
     [[('10초', GOLD), ('로 남기는', INK)], [('오늘의 기록', INK)]]),
    ('4-diary-body', PINK, '어디가 불편했는지도 콕 집어서',
     [[('몸까지', ROSE), (' 기록하는', INK)], [('건강 다이어리', INK)]]),
    ('5-awards', PURPLE, '한 달이 쌓이면 보이는 것',
     [[('기분 달력', VIOLET), ('과', INK)], [('말랑이 어워즈', INK)]]),
    ('6-trend', YELLOW, '기분·통증·수면을 한눈에',
     [[('그래프', GOLD), ('로 보는', INK)], [('나의 한 달', INK)]]),
    ('7-relation', PINK, '내 유형과 잘 맞는 사람은?',
     [[('16유형 ', ROSE), ('관계도', INK)], [('친구랑 같이 보는 재미', INK)]]),
    ('8-share', PURPLE, '카카오톡 · 인스타 · X',
     [[('내 결과', VIOLET), ('를', INK)], [('친구에게 자랑하기', INK)]]),
]

f_eyebrow = ImageFont.truetype(FONT, 46, index=SEMI)
f_title = ImageFont.truetype(FONT, 96, index=BOLD)


def rounded_shadow(size, radius, blur, spread, color=(0, 0, 0, 70)):
    w, h = size
    lay = Image.new('RGBA', (w + blur * 4, h + blur * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([blur * 2 - spread, blur * 2 - spread, blur * 2 + w + spread, blur * 2 + h + spread],
                        radius=radius + spread, fill=color)
    return lay.filter(ImageFilter.GaussianBlur(blur))


def draw_center_line(draw, segs, font, y, cx):
    total = sum(draw.textlength(t, font=font) for t, _ in segs)
    x = cx - total / 2
    for t, c in segs:
        draw.text((x, y), t, font=font, fill=c)
        x += draw.textlength(t, font=font)


os.makedirs(OUT, exist_ok=True)
made = 0
for name, bg, eyebrow, title_lines in SLIDES:
    src_path = os.path.join(RAW, name + '.png')
    if not os.path.exists(src_path):
        print('skip (no raw):', name); continue

    canvas = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(canvas)
    cx = W // 2

    # 문구 — 아이브로우 + 2줄 제목
    d.text((cx, 176), eyebrow, font=f_eyebrow, fill=SUB, anchor='ma')
    y = 264
    for segs in title_lines:
        draw_center_line(d, segs, f_title, y, cx)
        y += 126

    # 스크린샷 — 둥근 모서리 + 그림자, 아래로 흘려보내 기기 느낌
    shot = Image.open(src_path).convert('RGB')
    sw = 1060
    sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    radius, top = 56, 596

    sh_lay = rounded_shadow((sw, sh), radius, 34, 6)
    canvas.paste(Image.new('RGB', sh_lay.size, bg), ((W - sw) // 2 - 68, top - 68), sh_lay)

    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw, sh], radius=radius, fill=255)
    canvas.paste(shot, ((W - sw) // 2, top), mask)

    canvas.save(os.path.join(OUT, name + '.png'), 'PNG')
    made += 1
    print('built', name)
print('done:', made, 'slides ->', OUT)
