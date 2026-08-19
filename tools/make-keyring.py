# -*- coding: utf-8 -*-
"""
아크릴 키링 인쇄용 조판 만들기.
  실행: .venv/bin/python3 tools/make-keyring.py
  입력: goods/cutout/{CODE}.png (make-cutouts.py 결과)
  출력: goods/qr/bmti-qr.png          메인 페이지 QR
        goods/print/front/{CODE}.png  앞면(캐릭터 + 별명 + 코드)
        goods/print/back/{CODE}.png   뒷면(QR + 로고 + 주소)
        goods/print/preview.png       16종 앞/뒤 한눈에 보기

규격: 60×60mm + 사방 3mm 재단여백 = 66×66mm, 300DPI → 780×780px
      점선 = 재단선(60mm). 업체 양식에 맞춰 SIZE_MM/BLEED_MM만 바꾸면 된다.
"""
import io, os, re
import segno
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(ROOT, 'goods', 'cutout')
QR_DIR, PRINT = os.path.join(ROOT, 'goods', 'qr'), os.path.join(ROOT, 'goods', 'print')

SITE = 'https://bmti-official.co.kr'
DPI = 300
SIZE_MM, BLEED_MM = 60, 3
mm = lambda v: round(v / 25.4 * DPI)
CUT_PX, FULL = mm(SIZE_MM), mm(SIZE_MM + BLEED_MM * 2)
OFF = (FULL - CUT_PX) // 2                       # 재단선 시작 위치

FONT = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
BOLD, SEMI = 6, 4
INK, SUB, VIOLET, GOLD = '#1C1A17', '#8E887D', '#8B7BD8', '#C9975A'
BG_FRONT, BG_BACK = '#FFFFFF', '#FDF6DC'

for d in (QR_DIR, os.path.join(PRINT, 'front'), os.path.join(PRINT, 'back')):
    os.makedirs(d, exist_ok=True)

# ── 유형 데이터 (코드 → 한글명, 별명) ─────────────────────────────
data = io.open(os.path.join(ROOT, 'src', 'data.js'), encoding='utf-8').read()
res = io.open(os.path.join(ROOT, 'src', 'bmti_results.js'), encoding='utf-8').read()
CODE_KO = dict(re.findall(r"(\b[AO][CL][DQ][ZM]\b):\s*'([^']+)'",
                          re.search(r'export const CODE_KO = \{(.*?)\n\};', data, re.S).group(1)))
NICK = {m.group(1): m.group(2).replace('\\n', ' ')
        for m in re.finditer(r'"([AO][CL][DQ][ZM])":\s*\{.*?"nickname":\s*"((?:[^"\\]|\\.)*)"', res, re.S)}

# ── 메인 페이지 QR ────────────────────────────────────────────────
qr_path = os.path.join(QR_DIR, 'bmti-qr.png')
segno.make(SITE, error='h').save(qr_path, scale=40, border=2, dark=INK, light='white')
qr_img = Image.open(qr_path).convert('RGB')
print('QR', SITE, qr_img.size)


def base_card(bg):
    im = Image.new('RGB', (FULL, FULL), bg)
    return im, ImageDraw.Draw(im)


def cutline(d):
    """재단선 안내(실제 인쇄 전 삭제하거나, 업체 요청대로 별색 처리)"""
    d.rounded_rectangle([OFF, OFF, OFF + CUT_PX, OFF + CUT_PX], radius=mm(6),
                        outline='#FF3B30', width=3)


def fit(text, font_path, idx, max_w, start, min_size=30):
    size = start
    while size > min_size:
        f = ImageFont.truetype(font_path, size, index=idx)
        if ImageDraw.Draw(Image.new('RGB', (10, 10))).textlength(text, font=f) <= max_w:
            return f
        size -= 4
    return ImageFont.truetype(font_path, min_size, index=idx)


made = []
for code in sorted(CODE_KO):
    src = os.path.join(CUT, code + '.png')
    if not os.path.exists(src):
        print('skip', code); continue
    nick = NICK.get(code, code)
    ko = CODE_KO[code]

    # ── 앞면 ──
    im, d = base_card(BG_FRONT)
    ch = Image.open(src).convert('RGBA')
    box = (int(CUT_PX * 0.78), int(CUT_PX * 0.60))
    ch.thumbnail(box, Image.LANCZOS)
    im.paste(ch, ((FULL - ch.width) // 2, OFF + mm(6) + (box[1] - ch.height) // 2), ch)

    ty = OFF + mm(6) + box[1] + mm(3)
    f_nick = fit(nick, FONT, BOLD, CUT_PX * 0.88, 62)
    d.text((FULL // 2, ty), nick, font=f_nick, fill=INK, anchor='ma')
    f_code = ImageFont.truetype(FONT, 40, index=SEMI)
    d.text((FULL // 2, ty + 76), f'{code} {ko}', font=f_code, fill=VIOLET, anchor='ma')
    cutline(d)
    im.save(os.path.join(PRINT, 'front', code + '.png'), dpi=(DPI, DPI))

    # ── 뒷면 ──
    im2, d2 = base_card(BG_BACK)
    qs = int(CUT_PX * 0.45)
    q = qr_img.resize((qs, qs), Image.NEAREST)
    qpad = Image.new('RGB', (qs + mm(4), qs + mm(4)), 'white')
    qpad.paste(q, (mm(2), mm(2)))
    qtop = OFF + mm(7)
    im2.paste(qpad, ((FULL - qpad.width) // 2, qtop))

    by = qtop + qpad.height + mm(3)
    d2.text((FULL // 2, by), 'BMTI', font=ImageFont.truetype(FONT, 58, index=BOLD), fill=INK, anchor='ma')
    d2.text((FULL // 2, by + 66), '움직임 성향 테스트', font=ImageFont.truetype(FONT, 34, index=SEMI), fill=SUB, anchor='ma')
    d2.text((FULL // 2, by + 110), 'bmti-official.co.kr', font=ImageFont.truetype(FONT, 30, index=SEMI), fill=GOLD, anchor='ma')
    cutline(d2)
    im2.save(os.path.join(PRINT, 'back', code + '.png'), dpi=(DPI, DPI))
    made.append(code)

# ── 검수용 미리보기 시트 ──
cellw = 300
sheet = Image.new('RGB', (cellw * 8, cellw * 4 + 60), 'white')
sd = ImageDraw.Draw(sheet)
for i, code in enumerate(made):
    for j, side in enumerate(('front', 'back')):
        c = Image.open(os.path.join(PRINT, side, code + '.png')).convert('RGB')
        c.thumbnail((cellw - 16, cellw - 16), Image.LANCZOS)
        x = (i % 4) * cellw * 2 + j * cellw
        y = (i // 4) * cellw + 50
        sheet.paste(c, (x + 8, y + 8))
sd.text((16, 14), f'BMTI 키링 인쇄 조판 · {SIZE_MM}x{SIZE_MM}mm(+{BLEED_MM}mm 재단여백) · {DPI}DPI · 빨간선=재단선',
        font=ImageFont.truetype(FONT, 26, index=SEMI), fill='#333')
sheet.save(os.path.join(PRINT, 'preview.png'))
print('made', len(made), 'types ->', PRINT)
