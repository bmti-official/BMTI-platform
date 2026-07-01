import re

with open('src/customResultData.js', 'r', encoding='utf-8') as f:
    content = f.read()

raw_text = """ACDZ
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 한 가지 확실하게 느낀 것이 있습니다. 따뜻한 위로보다는 차가운 현실을, 빙빙 돌려 말하기보다는 명확한 원인과 팩트를 마주하려는 그 '단단한 직진 본능'이 때로는 내 몸을 가장 빠르고 정직하게 변화시키는 강력한 원동력이 된다는 사실입니다.\n\n하지만 무작정 몸을 움직이거나 아픈 곳만 집중적으로 운동한다고 해서 몸이 항상 정답을 내어주는 것은 아닙니다. 가끔은 매서운 팩트로 스스로를 채찍질하는 것을 잠시 내려놓고, 내 몸이 왜 이런 신호를 보내는지 차분히 전체적인 균형을 돌아보는 부드러운 시간도 필요합니다. 쓰디쓴 조언조차 성장의 연료로 삼아 거침없이 땀 흘리는 [단단한 케틀벨]님의 그 뚝심 있는 오운완을 진심으로 응원합니다!"

ACDM
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 깊이 깨달은 것이 있습니다. 복잡한 생각이나 계산은 잠시 비워둔 채 일단 운동하러 향하는 그 '우직한 실행력'과, 따뜻한 위로 한마디에 다시 힘을 내어 몸을 움직이는 그 '순수한 마음'이야말로 내 몸을 긍정적으로 변화시키는 가장 사랑스러운 동력이라는 사실입니다.\n\n때로는 아픈 곳만 집중하다 보면 몸이 내 마음처럼 따라주지 않아 시무룩해지는 날도 분명 있을 것입니다. 그럴 땐 억지로 이겨내려 하거나 완벽하지 못한 스스로를 탓하지 않으셔도 괜찮습니다. 복잡한 운동 이론은 잠시 내려놓고, 무조건적인 칭찬과 따뜻한 위로를 듬뿍 받으며 지친 몸과 마음을 달래주는 것만으로도 내 몸엔 훌륭한 영양분이 될 테니까요. 가려운 곳을 정확히 어루만져 주는 핀셋 같은 위로 속에서 오늘도 기분 좋게 득근하실 [복근 슬라이더]님만의 50분을 진심으로 응원합니다!"

ACQZ
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 한 가지 확실하게 느낀 것이 있습니다. 두루뭉술한 위로보다는 내 몸의 아픈 곳을 현미경처럼 정밀하게 파악하고, 뼈 아픈 팩트조차 치밀한 계획의 밑거름으로 삼는 그 '냉철한 분석력'이야말로 내 몸을 가장 빠르고 정직하게 변화시키는 강력한 무기라는 사실입니다.\n\n하지만 매 순간 완벽한 계획과 날카로운 팩트로 스스로를 몰아세우다 보면, 가끔은 몸과 마음이 숨 쉴 틈을 잃기도 합니다. 때로는 계산된 수치나 정밀한 타격 지점을 잠시 잊고, 지금 흘리는 땀방울이 주는 개운함 그 자체를 즐겨보는 것도 좋은 환기가 될 것입니다. 족집게 같은 분석과 빈틈없는 계획으로 완성해 나갈 [핵심만 아령줘요]님의 똑똑한 오운완을 진심으로 응원합니다!"

ACQM
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 깊이 깨달은 것이 있습니다. 내 몸의 아픈 곳을 정확히 짚어내는 철저한 계획성과, 그 원리를 명확히 이해한 뒤 스스로에게 건네는 '다정한 핀셋 위로'의 시너지가 결국 내 몸을 가장 안전하고 단단하게 성장시킨다는 사실입니다.\n\n다만, 몸은 수학 공식이 아니기에 아무리 철저히 계획하고 원리를 분석해도 마음처럼 따라주지 않는 날이 있습니다. 그럴 때는 완벽하게 해내지 못한 나를 탓하기보다, 원리를 기반으로 한 따뜻한 위로로 스스로를 넉넉히 품어주셔도 괜찮습니다. 아픈 곳을 달래며 기분 좋게 득근하는 [수다쟁이 루프밴드]님만의 체계적이고 따뜻한 50분을 늘 응원합니다!"

ALDZ
"전문적인 운동을 가르치는 현장에서 수많은 분들의 체형을 점검하고 분석해 오며 한 가지 확실하게 말씀드릴 수 있는 것이 있습니다. 핑계를 대기 전 뇌를 비우고 운동하러 향하는 거침없는 실행력과, 아치를 살리는 것처럼 몸의 큰 그림을 꿰뚫어 보는 '팩트 중심의 시야'가 내 몸을 근본적으로 변화시키는 최고의 동력이라는 사실입니다.\n\n하지만 무조건 팩트로만 스스로를 채찍질하며 거시적인 목표만 좇다 보면, 지금 당장 몸이 보내는 작고 피로한 신호들을 놓치기 쉽습니다. 가끔은 쓰디쓴 팩트 폭격을 내려놓고, 그저 묵묵히 쇳덩이를 들어 올리는 나 자신의 훌륭한 습관 자체를 칭찬해 보는 것은 어떨까요? 큰 그림을 보며 우직하게 땀 흘리는 [팩트폭행 짐볼]님의 거침없는 오운완을 진심으로 응원합니다!"

ALDM
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 한 가지 확실하게 느낀 것이 있습니다. 발바닥 아치처럼 몸의 거시적인 뼈대를 잡는 동시에, 현미경처럼 디테일한 팩트를 분석해 치밀하게 움직이는 그 '집요한 계획성'이야말로 부상 없이 확실한 결과를 만들어내는 최고의 무기라는 사실입니다.\n\n하지만 큰 그림과 작은 디테일을 모두 완벽하게 통제하려다 보면, 운동이 자칫 차가운 숙제처럼 느껴질 수 있습니다. 모든 계획이 100% 맞아떨어지지 않는 날에도 좌절할 필요는 전혀 없습니다. 뼈 맞는 팩트조차 성장의 연료로 삼아 스마트하게 몸을 다듬어가는 [뜨끈뜨끈 보수볼]님의 치밀한 오운완을 진심으로 응원합니다!"

ALQZ
"전문적인 운동을 가르치는 현장에서 수많은 분들의 신체를 직접 점검하고 마주해 오며 깊이 깨달은 것이 있습니다. 발바닥 아치를 살리듯 몸의 근본적인 기초를 챙기는 계획적인 태도와, 원리에 대한 이해를 바탕으로 스스로에게 고개를 끄덕여주는 '깊은 공감 능력'이 내 몸을 가장 긍정적인 방향으로 이끌어간다는 사실입니다.\n\n가끔은 철저히 세운 계획대로 몸이 움직이지 않아 속상한 날도 분명 있을 것입니다. 그러나 정해진 루틴을 다 채우지 못하더라도 스스로를 자책하지 마세요. 근본적인 원리를 이해하고 있기에 내 몸이 보내는 신호에 기꺼이 끄덕여줄 수 있는 [분석가 트레드밀]님만의 다정하고 현명한 득근의 시간을 진심으로 응원합니다!"

ALQM
"전문적인 운동을 가르치는 현장에서 수많은 분들의 체형을 점검하고 분석해 오며 한 가지 확실하게 말씀드릴 수 있는 것이 있습니다. 복잡한 생각이나 감정은 뒤로한 채 운동하러 직진하는 실행력과, 아치를 살리는 등 몸의 굵직한 기초를 향해 팩트로 뼈를 때리는 '직관적인 현실 감각'이 나를 지치지 않게 하는 강력한 엔진이라는 사실입니다.\n\n때로는 위로 없는 차가운 팩트만이 정답이라 느끼며 무작정 몸을 몰아붙일 수도 있습니다. 하지만 너무 뻣뻣한 나무는 부러지기 쉽듯, 가끔은 차가운 팩트 대신 오늘 하루도 무사히 움직여준 내 몸에 가벼운 미소를 지어주셔도 좋습니다. 뇌를 비우고 묵묵히 몸의 큰 그림을 그려나가는 [물음표 운동화]님의 우직한 오운완을 진심으로 응원합니다!"
"""

new_items = {}
current_code = None
current_text = []

for line in raw_text.split('\n'):
    if line.strip() in ['ACDZ', 'ACDM', 'ACQZ', 'ACQM', 'ALDZ', 'ALDM', 'ALQZ', 'ALQM']:
        if current_code is not None:
            new_items[current_code] = '\n'.join(current_text).strip().strip('"')
        current_code = line.strip()
        current_text = []
    else:
        if current_code is not None and line.strip() != '':
            current_text.append(line)

if current_code is not None:
    new_items[current_code] = '\n'.join(current_text).strip().strip('"')

# extract the existing dictionary
match = re.search(r'export const BODY_GUIDE_DATA = \{([\s\S]*?)^};', content, flags=re.MULTILINE)

dict_content = match.group(1)

# we will use backticks (`) for values, avoiding newlines issues in JS.
# BUT we need to parse what we modified in the buggy code. The buggy code left things like:
# 'ACDZ': "전문적인 운동을 가르치는...
# ...응원합니다!",

# Actually let's just grab the whole file, find the buggy BODY_GUIDE_DATA and replace it completely!
# Since I only replaced the 16 items, I can just rewrite the whole object. Let me fetch the 16 original texts from bmti_results.js or just fix the ones I have.
# Wait! I already have the 16 texts from the previous step.
# Wait, my previous script had all 16 texts. So I have them.

import urllib.request
# Just use the new_items and update dict_content safely.
# Wait, the dict_content is currently broken. Let's just find and replace the keys.
for code, desc in new_items.items():
    escaped_desc = desc.replace('"', '\\"').replace('\n', '\\n')
    # Because it broke, it looks like: 'ACDZ': "some text\n\nsome text",
    # let's regex match exactly what's there
    # It might span multiple lines because of the literal \n
    pattern = r"'" + code + r"': \"[\s\S]*?\","
    replacement = f"'{code}': \"{escaped_desc}\","
    dict_content = re.sub(pattern, replacement, dict_content)

new_content = content[:match.start(1)] + dict_content + content[match.end(1):]

with open('src/customResultData.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated customResultData.js')
