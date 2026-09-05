// 🎬 동작 영상 만들기 — 구글 플로우에 넣을 질문을 여기서 짜 맞춘다.
// 여섯 줄만 적으면 프롬프트 전문이 완성되고, 통째로 복사해 플로우에 붙여넣으면 된다.
import { useMemo, useState } from 'react';
import { INK, SUB, LINE, BG, ACCENT, box, input, area, label, btn } from './theme';
import { parseFlow, FLOW_TOOLS, toolPhrase } from './pasteFlow';

const GOLD = '#B08635', WARN = '#B23B36';

const GENDERS = [['female', '여자'], ['male', '남자']];
const ANGLES = [
  ['front view', '정면', '옆으로 벌리거나 좌우로 기울이는 동작'],
  ['side view', '측면', '앞뒤로 굽히거나 젖히는 동작'],
  ['back view', '뒷면', '어깨뼈·등을 모으는 동작'],
];


// 여섯 줄 — 이 순서와 예시는 문서와 같다.
const LINES = [
  { k: 'a', n: '①', t: '시작 자세', h: '서서 / 앉아서 / 누워서 + 발 너비 + 팔 위치 + 시선',
    ex: '발을 골반 너비로 벌리고 서서, 팔은 몸 옆에, 정면을 봅니다.' },
  { k: 'b', n: '②', t: '무엇이 움직이나', h: '어느 관절이 어느 방향으로',
    ex: '발목만 움직여 발뒤꿈치를 위로 들어 올립니다.' },
  { k: 'c', n: '③', t: '얼마나', h: '각도 말고, 눈에 보이는 기준으로',
    ex: '발뒤꿈치가 바닥에서 주먹 하나 높이만큼 올라갑니다.' },
  { k: 'd', n: '④', t: '끝 자세', h: '멈추는 지점',
    ex: '발끝으로만 서서 멈춥니다.' },
  { k: 'e', n: '⑤', t: '되돌아오기', h: '같은 길, 같은 속도로',
    ex: '같은 속도로 발뒤꿈치를 바닥에 내려놓습니다.' },
  { k: 'f', n: '⑥', t: '움직이지 않는 곳', h: '★ 제일 중요 — 안 적으면 온몸이 흔들립니다',
    ex: '무릎은 계속 펴진 채, 상체와 팔은 전혀 움직이지 않습니다.' },
];

// 쓰면 안 되는 말 — 적어 넣으면 그 자리에서 알려 준다.
const BANNED = [
  { re: /스트레칭|풀어\s*줍|풀어줍|이완/, why: '어느 관절이 어느 방향으로 가는지로 바꿔 주세요' },
  { re: /시원|부드럽|편안|기분\s*좋/, why: '느낌은 그림으로 안 나옵니다. 빼세요' },
  { re: /\d+\s*도(?![구])/, why: "각도 대신 '어깨 높이까지', '주먹 하나 높이'처럼 보이는 기준으로" },
  { re: /반복|여러\s*번|\d+\s*회|\d+\s*번씩/, why: '8초에 한 번만 합니다. 반복은 적지 마세요' },
  { re: /힘을\s*주|버팁|버텨|짜냅/, why: '겉으로 안 보입니다. 자세로 적어 주세요' },
  { re: /천천히|빠르게|속도/, why: '속도는 프롬프트에 이미 있습니다. 빼도 됩니다', soft: true },
];

function checkWords(text) {
  const t = String(text || '');
  return BANNED.filter((b) => b.re.test(t));
}

// ── 프롬프트 전문 ─────────────────────────────────────────────
// 플로우 '프레임' 칸에 넣을 시작 그림 — 동영상이 아니라 정지 그림 한 장을 뽑는다.
function buildStartImage({ gender, angle, tools, move }) {
  const g = gender === 'male' ? 'male' : 'female';
  const equip = toolPhrase(tools);
  const pose = (move.a || '').trim();
  return `Create a single still image, not a video.

CHARACTER — match the attached reference images exactly
A friendly 3D-animated Pixar-style character, ${g}.
Plain black short-sleeve t-shirt, plain black shorts, bare feet.
Same face, same hair, same body proportions, same skin tone as the reference.
Calm, gently smiling expression.

BACKGROUND
Pure solid black (#000000). Completely empty. No floor line, no shadow on the wall,
no furniture, no gradient, no particles. Only a soft contact shadow directly under the body.

CAMERA
Camera angle: ${angle}
Framing: full body, head to feet, vertical 9:16 frame.
Keep the entire body inside the middle 70% of the frame height.
The top 15% and the bottom 15% of the frame must contain only empty black background.

THE POSE — completely at rest
${pose || '[① 시작 자세를 채우면 여기에 들어갑니다]'}
Equipment visible in the shot: ${equip}
The character holds this starting pose still. No motion, no motion blur.

DO NOT
- Do not add text, numbers, logo, or watermark.
- Do not add any prop beyond the listed equipment.
- Do not crop the head or the feet.`;
}

function buildPrompt({ gender, angle, tools, move }) {
  const g = gender === 'male' ? 'male' : 'female';
  const equip = toolPhrase(tools);
  const body = LINES.map((l) => (move[l.k] || '').trim()).filter(Boolean).join(' ');
  return `Create a seamlessly looping 8-second exercise demonstration video.

CHARACTER — match the attached reference images exactly
A friendly 3D-animated Pixar-style character, ${g}.
Plain black short-sleeve t-shirt, plain black shorts, bare feet.
Same face, same hair, same body proportions, same skin tone as the reference.
Calm, gently smiling expression that does not change through the clip.
No text, no logo, no watermark, no extra props beyond the listed equipment.

BACKGROUND
Pure solid black (#000000). Completely empty. No floor line, no shadow on the wall,
no furniture, no gradient, no particles. Only a soft contact shadow directly under the body.

CAMERA — locked off
A single fixed camera. No pan, no zoom, no dolly, no handheld shake, no cuts.
Camera angle: ${angle}
Framing: full body, head to feet, vertical frame.
Lighting stays identical from the first frame to the last.

CROP-SAFE FRAMING
Keep the entire body inside the middle 70% of the frame height.
The top 15% and the bottom 15% of the frame must contain only empty black background.
The video will be center-cropped to a 4:5 vertical frame, so anything in those
top and bottom bands will be cut off.
Nothing may leave that middle band at any point in the movement.

THE MOVEMENT — exactly one movement, nothing else
${body || '[여섯 줄을 채우면 여기에 들어갑니다]'}
If the movement uses one side of the body, always demonstrate it on the RIGHT side.
Equipment: ${equip}

TIMING — 8 seconds total, one full repetition only
0.0-0.5s  Hold the starting pose completely still.
0.5-3.0s  Move slowly into the end position. Smooth, even speed. No acceleration.
3.0-4.5s  Hold the end position still.
4.5-7.5s  Return slowly to the exact starting pose, at the same even speed.
7.5-8.0s  Hold the starting pose completely still.

SEAMLESS LOOP — the most important requirement
The last frame must be pixel-identical to the first frame:
same body position, same limb angles, same head tilt, same facial expression,
same lighting, same camera framing.
The character must be fully at rest and motionless for the first and last half second.
No breathing motion, no idle sway, no hair movement, no blinking at the start or the end.
The clip will be played on repeat, so any difference between the first and last frame
will show up as a visible jump.

DO NOT
- Do not add a second repetition or a second exercise.
- Do not speed up, ease in, or ease out. Keep one constant slow speed.
- Do not move the camera at any point.
- Do not add text, numbers, counters, captions, or a progress bar.
- Do not add music cues, sparkles, motion trails, or transition effects.
- Do not change the character's clothing, hairstyle, or expression mid-clip.`;
}

// 여섯 줄을 영어로 바꿔 달라고 AI에게 물을 때 쓰는 짧은 글
function buildTranslate(move) {
  const body = LINES.map((l) => (move[l.k] || '').trim()).filter(Boolean).join('\n');
  return `아래 한국어 동작 설명을 영어 한 문단으로 바꿔 주세요.
영상 생성 AI에게 줄 글입니다. 규칙:
- 어느 관절이 어느 방향으로 움직이는지만 남깁니다
- 느낌을 나타내는 말(시원하게, 부드럽게)은 빼 주세요
- 반복 횟수를 넣지 마세요. 한 번만 합니다
- 움직이지 않는 곳은 "... do not move at all" 로 분명히 적어 주세요
- 한쪽만 쓰는 동작이면 오른쪽으로 통일해 주세요

${body}`;
}

function CopyBtn({ text, children }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" disabled={!text}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }).catch(() => {});
      }}
      style={{ ...btn(true), opacity: text ? 1 : 0.45 }}>
      {ok ? '복사했어요 ✓' : children}
    </button>
  );
}

// ── 1. 설정값 ─────────────────────────────────────────────────
const STEPS = [
  ['만드는 것', '동영상', ''],
  ['넣는 방식', '프레임', '시작 그림과 끝 그림에 같은 그림을 넣습니다'],
  ['화면 비율', '9:16', '4:5가 없습니다. 가운데만 잘라 씁니다'],
  ['길이', '8초', '10초는 잘 안 나오고 6초는 너무 빠릅니다'],
  ['먼저 시험', '360p · x2', '자세와 이음매만 봅니다'],
  ['최종 추출', '720p · x1', '마음에 드는 게 나온 뒤 같은 프롬프트로 한 번'],
];

export default function FlowStudio() {
  const [gender, setGender] = useState('female');
  const [angle, setAngle] = useState('front view');
  const [tools, setTools] = useState(['none']);
  const [name, setName] = useState('');
  const [move, setMove] = useState({ a: '', b: '', c: '', d: '', e: '', f: '' });
  const setLine = (k) => (v) => setMove((p) => ({ ...p, [k]: v }));
  // '없음'을 고르면 나머지가 풀리고, 다른 걸 고르면 '없음'이 풀린다.
  const toggleTool = (k) => setTools((prev) => {
    if (k === 'none') return ['none'];
    const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev.filter((x) => x !== 'none'), k];
    return next.length ? next : ['none'];
  });

  // 📋 원고 붙여넣기
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteNote, setPasteNote] = useState('');
  const applyPaste = () => {
    const { fields, report, count } = parseFlow(pasteText);
    if (!count) {
      setPasteNote('형식을 알아보지 못했습니다. \u2018① 시작 자세: …\u2019 처럼 번호나 이름 뒤에 쌍점이 있는지 확인해 주세요.');
      return;
    }
    if (fields.gender) setGender(fields.gender);
    if (fields.angle) setAngle(fields.angle);
    if (fields.tools) setTools(fields.tools);
    if (fields.name) setName(fields.name);
    if (fields.move) setMove((p) => ({ ...p, ...fields.move }));
    setPasteNote(`${report.join(' · ')} — 채웠습니다. 아래에서 확인하고 프롬프트를 복사하세요.`);
  };

  const filled = LINES.filter((l) => (move[l.k] || '').trim()).length;
  const prompt = useMemo(() => buildPrompt({ gender, angle, tools, move }), [gender, angle, tools, move]);
  const startImg = useMemo(() => buildStartImage({ gender, angle, tools, move }), [gender, angle, tools, move]);
  const needOwnStart = tools.some((t) => t !== 'none');
  const translate = useMemo(() => buildTranslate(move), [move]);
  const warns = useMemo(() => {
    const all = LINES.flatMap((l) => checkWords(move[l.k]).map((b) => ({ ...b, at: `${l.n} ${l.t}` })));
    const seen = new Set();
    return all.filter((w) => (seen.has(w.why) ? false : seen.add(w.why)));
  }, [move]);

  const pick = (on) => ({
    padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap',
    background: on ? ACCENT : '#fff', color: on ? '#fff' : SUB, boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`,
  });

  return (
    <div>
      {/* 1. 설정값 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>1. 플로우 설정값</div>
        <div style={{ fontSize: 12, color: SUB, marginBottom: 12 }}>영상을 뽑기 전에 이대로 맞춰 두세요.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8 }}>
          {STEPS.map(([k, v, why]) => (
            <div key={k} style={{ background: BG, borderRadius: 11, padding: '11px 13px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: SUB }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: ACCENT, margin: '2px 0 3px' }}>{v}</div>
              {why && <div style={{ fontSize: 11, color: SUB, lineHeight: 1.5 }}>{why}</div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: SUB, marginTop: 11, lineHeight: 1.7, background: '#FBF4DE', borderRadius: 10, padding: '10px 12px' }}>
          <b style={{ color: GOLD }}>시작 그림</b>은 <b>동작마다 한 장</b> 필요합니다(아래 4번에서 프롬프트를 만들어 줍니다).
          도구가 없는 동작끼리는 자세 계열로 돌려 쓸 수 있지만, <b>도구를 쓰는 동작은 그 동작 전용</b>으로 만들어야 합니다 —
          매트나 밴드가 그림 안에 보여야 하니까요.
          <br /><b style={{ color: GOLD }}>좌우가 나뉘는 동작</b>은 <b>오른쪽만</b> 찍으세요. 손님이 왼쪽을 고르면 화면이 알아서 좌우를 뒤집어 보여 줍니다.
        </div>
      </div>

      {/* 원고 붙여넣기 창 */}
      {pasteOpen && (
        <div onClick={() => setPasteOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(23,21,15,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, padding: 18, width: '100%', maxWidth: 760, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>원고 붙여넣기</div>
            <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.6 }}>
              AI에게 받은 글을 통째로 붙여넣고 &lsquo;칸 채우기&rsquo;를 누르세요. 캐릭터·각도·도구·동작 이름과 여섯 줄이 각 칸으로 들어갑니다.
            </div>
            <textarea autoFocus value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder={'캐릭터: 여자\n카메라 각도: 정면\n도구: 요가매트, 밴드\n동작 이름: 클램쉘\n\n① 시작 자세: …\n② 무엇이 움직이나: …'}
              style={{ ...area, flex: 1, minHeight: 300, fontSize: 12.5, lineHeight: 1.6 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={applyPaste} disabled={!pasteText.trim()} style={{ ...btn(true), opacity: pasteText.trim() ? 1 : 0.45 }}>칸 채우기</button>
              <button onClick={() => setPasteOpen(false)} style={btn(false)}>닫기</button>
              <span style={{ fontSize: 11.5, color: SUB, alignSelf: 'center', marginLeft: 'auto' }}>이미 적은 칸은 새 내용으로 바뀝니다</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 이번 동작 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>2. 이번 동작</div>
          <button type="button" onClick={() => { setPasteNote(''); setPasteOpen(true); }} style={{ ...btn(false), marginLeft: 'auto' }}>
            📋 원고 붙여넣기
          </button>
        </div>
        {pasteNote && (
          <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: BG, borderRadius: 10, padding: '10px 12px', marginBottom: 12, lineHeight: 1.6 }}>
            {pasteNote}
          </div>
        )}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <span style={label}>캐릭터</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {GENDERS.map(([k, lb]) => <button key={k} type="button" onClick={() => setGender(k)} style={pick(gender === k)}>{lb}</button>)}
            </div>
          </div>
          <div>
            <span style={label}>카메라 각도</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {ANGLES.map(([k, lb, why]) => <button key={k} type="button" title={why} onClick={() => setAngle(k)} style={pick(angle === k)}>{lb}</button>)}
            </div>
            <div style={{ fontSize: 11, color: SUB, marginTop: 5 }}>{ANGLES.find(([k]) => k === angle)?.[2]}</div>
          </div>
          <div>
            <span style={label}>도구 <span style={{ fontWeight: 600 }}>— 여러 개 고를 수 있어요</span></span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FLOW_TOOLS.map(([k, lb]) => (
                <button key={k} type="button" onClick={() => toggleTool(k)} style={pick(tools.includes(k))}>{lb}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <span style={label}>동작 이름 <span style={{ fontWeight: 600 }}>— 내가 알아보려고 적는 메모입니다</span></span>
          <input style={{ ...input, maxWidth: 320 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="뒤꿈치 들기" />
        </div>
      </div>

      {/* 3. 동작 설명 여섯 줄 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>3. 동작 설명 여섯 줄</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: filled === 6 ? '#1F9D55' : SUB }}>{filled}/6</div>
        </div>
        <div style={{ fontSize: 12, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          옷·배경·카메라·속도는 프롬프트에 이미 들어 있습니다. <b>몸이 어떻게 움직이는지만</b> 적으세요.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LINES.map((l) => (
            <div key={l.k}>
              <span style={label}>
                {l.n} {l.t} <span style={{ fontWeight: 600, color: l.k === 'f' ? WARN : SUB }}>— {l.h}</span>
              </span>
              <textarea style={{ ...area, minHeight: 46, fontSize: 12.5 }} value={move[l.k]}
                onChange={(e) => setLine(l.k)(e.target.value)} placeholder={l.ex} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setMove(Object.fromEntries(LINES.map((l) => [l.k, l.ex])))}
          style={{ marginTop: 10, padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit',
            fontSize: 11.5, fontWeight: 700, color: SUB, cursor: 'pointer', textDecoration: 'underline' }}>
          예시(뒤꿈치 들기)로 채워 보기
        </button>

        {warns.length > 0 && (
          <div style={{ marginTop: 12, background: '#FDF0EE', borderRadius: 11, padding: '11px 13px' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: WARN, marginBottom: 6 }}>이런 말은 빼는 게 좋아요</div>
            {warns.map((w, i) => (
              <div key={i} style={{ fontSize: 11.5, color: '#7A3B36', fontWeight: 600, lineHeight: 1.7 }}>· {w.why}</div>
            ))}
          </div>
        )}
      </div>

      {/* 4. 시작 그림 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>4. 시작 그림 만들기</div>
          <span style={{ marginLeft: 'auto' }}><CopyBtn text={startImg}>시작 그림 프롬프트 복사</CopyBtn></span>
        </div>
        <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.8 }}>
          플로우 <b>프레임</b> 칸에는 그림 한 장이 필요합니다. 이걸로 먼저 <b>정지 그림</b>을 뽑고,
          그 그림을 <b>시작 프레임과 끝 프레임에 똑같이</b> 넣으세요.
          <br />플로우 <b>이미지</b> 모드에 캐릭터 참고 그림과 함께 넣으면 됩니다.
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.8, borderRadius: 10, padding: '11px 13px',
          background: needOwnStart ? '#FDF0EE' : '#FBF4DE', color: needOwnStart ? '#7A3B36' : '#6E5A1C', marginBottom: 12 }}>
          {needOwnStart
            ? '이 동작은 도구를 씁니다. 도구가 놓인 모습이 그림에 들어가야 하니, 이 동작 전용 시작 그림을 새로 만들어야 합니다.'
            : '도구가 없는 동작입니다. 같은 자세 계열(선 자세 · 앉은 자세 · 옆으로 누운 자세 · 바로 누운 자세)로 남녀 한 장씩 만들어 두면 다른 카드에도 돌려 쓸 수 있습니다.'}
        </div>
        <textarea readOnly value={startImg} style={{ ...area, minHeight: 200, fontSize: 11.5, lineHeight: 1.65, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
      </div>

      {/* 5. 완성된 프롬프트 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>5. 플로우에 붙여넣을 동영상 프롬프트</div>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
            <CopyBtn text={prompt}>프롬프트 복사</CopyBtn>
          </span>
        </div>
        <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.7 }}>
          여섯 줄을 한국어로 적어도 대체로 알아듣습니다. 잘 안 나오면 아래 &lsquo;영어로 바꾸기&rsquo;를 거치세요.
        </div>
        <textarea readOnly value={prompt} style={{ ...area, minHeight: 300, fontSize: 11.5, lineHeight: 1.65, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
      </div>

      {/* 5. 영어로 바꾸기 */}
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>6. 여섯 줄을 영어로 바꾸기 <span style={{ fontSize: 12, fontWeight: 600, color: SUB }}>— 선택</span></div>
          <span style={{ marginLeft: 'auto' }}><CopyBtn text={filled ? translate : ''}>번역 요청문 복사</CopyBtn></span>
        </div>
        <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.7 }}>
          이걸 복사해 AI에게 물어보고, 돌아온 영어 문단을 위 프롬프트의 <b>THE MOVEMENT</b> 자리에 갈아 끼우면 됩니다.
        </div>
        <textarea readOnly value={filled ? translate : '여섯 줄을 채우면 여기에 만들어집니다.'}
          style={{ ...area, minHeight: 150, fontSize: 12, lineHeight: 1.65 }} />
      </div>

      {/* 6. 받은 뒤 */}
      <div style={{ ...box }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 10 }}>7. 영상을 받은 뒤</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: INK, fontWeight: 600, lineHeight: 2 }}>
          <li><b>첫 프레임과 마지막 프레임을 나란히 놓고 봅니다.</b> 다르면 다시 뽑으세요. 화면에서 계속 툭툭 튑니다.</li>
          <li><b>0~5초 안에 동작이 한눈에 보이는지</b> 봅니다. 그 구간이 그대로 표지가 됩니다.</li>
          <li>머리나 발이 잘리지 않았는지 봅니다. 잘리면 <code>CROP-SAFE FRAMING</code>을 프롬프트 맨 앞으로 옮기고 다시 뽑으세요.</li>
          <li><b>소리는 지웁니다.</b> 손님 화면에서 영상 소리는 늘 꺼집니다.</li>
          <li>9:16 그대로 <b>⚡ 바로카드 → 동작 영상</b> 칸에 올립니다(mp4 · webm, 20MB 이하).</li>
        </ol>
        <div style={{ fontSize: 11.5, color: SUB, marginTop: 12, lineHeight: 1.8, background: BG, borderRadius: 10, padding: '11px 13px' }}>
          <b>잘 안 나올 때</b>
          <br />· 한 바퀴마다 툭 튄다 → 시작 그림을 끝 그림 칸에도 넣었는지 확인
          <br />· 동작을 두 번 한다 → <code>one full repetition only</code>를 프롬프트 맨 앞으로
          <br />· 온몸이 같이 흔들린다 → <b>⑥ 움직이지 않는 곳</b>을 더 자세히
          <br />· 얼굴이 참고 그림과 다르다 → 참고 그림을 정면 한 장만 넣고 다시
          <br />· 배경에 바닥선·가구가 생긴다 → <code>Completely empty</code>를 한 번 더 적기
        </div>
      </div>
    </div>
  );
}
