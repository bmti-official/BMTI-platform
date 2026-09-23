// 🗓 다이어리 미리보기 — 10월 개편을 손님 화면에 올리기 전에 여기서 먼저 본다.
//
// 아직 진짜 다이어리에는 물려 두지 않았다. 여기서 모양과 셈을 확인하고,
// 괜찮으면 그때 손님 화면으로 옮긴다.
import { useMemo, useState } from 'react';
import { INK, SUB, BG, box, btn } from './theme';
import PreviewModal from './PreviewModal';
import DiaryWriteFlow from '../components/DiaryWriteFlow';
import AngleView from '../features/angle/AngleView';
import AngleCapture from '../features/angle/AngleCapture';
import PushToggle from '../features/angle/PushToggle';
import { DiaryIcon } from '../components/DiaryIcons';
import { TAG_CATEGORIES, strainScore, strainWord, tagShare } from '../lib/diaryTags';

const GOLD_INK = '#8A6A3A';

// 각도기록 화면을 보려면 주간 기록이 있어야 한다. 그럴듯한 몇 주를 지어 낸다.
function fakeWeeks(n) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const w = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({
      week: w, measured_at: `${w}T09:00:00Z`,
      neck_bend: Math.round((16 + i * 1.4 + (i % 2 ? 1.1 : -0.6)) * 10) / 10,
      trunk_flex: Math.round((72 - i * 2.2 + (i % 3 ? 1.5 : -1.2)) * 10) / 10,
      arm_raise: Math.round((148 - i * 1.8) * 10) / 10,
      quality: 82,
    });
  }
  return out;
}

// 막대그래프를 보려면 한 달치 기록이 있어야 한다. 그럴듯한 한 달을 지어 낸다.
function fakeMonth(days = 18) {
  const pool = TAG_CATEGORIES.flatMap((c) => c.tags.map((t) => t.label));
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  return [...Array(days)].map(() => {
    const n = 1 + Math.floor(rnd() * 4);
    const tags = [...new Set([...Array(n)].map(() => pool[Math.floor(rnd() * pool.length)]))];
    return { tags };
  });
}

export default function DiaryPreview() {
  const [picked, setPicked] = useState(['진통제', '업무과다', '카페인']);
  const [female, setFemale] = useState(true);
  const [screen, setScreen] = useState('');   // '' | 'tag' | 'chart' | 'angle' | 'capture'
  const [weeks, setWeeks] = useState(3);      // 몇 주치가 쌓인 셈 칠지
  const month = useMemo(() => fakeMonth(18), []);
  const checks = useMemo(() => fakeWeeks(weeks), [weeks]);
  const share = useMemo(() => tagShare(month), [month]);
  const score = strainScore(picked);


  // 손님이 보는 다이어리 그대로 — 화면을 새로 그리지 않고 진짜 것을 띄운다.
  // 여기서 본 모습이 곧 손님이 볼 모습이다.
  //   tagCats   10월 태그 목록으로 갈아 끼운다
  //   dropBlock '오늘 평소보다 무리했나요'를 뺀 모습
  const realDiary = (
    <DiaryWriteFlow
      tagCats={TAG_CATEGORIES}
      dropBlock={['sitting']}
      gender={female ? 'female' : 'male'}
      isLoggedIn
      onClose={() => setScreen('')}
      onFinish={() => setScreen('')}
    />
  );

  // 리포트에 들어갈 막대그래프
  const chart = (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3 }}>이번 달 태그</div>
      <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600, marginBottom: 16 }}>
        기록한 {month.length}일 가운데 며칠에 나왔는지예요.
      </div>
      {share.map((c) => (
        <div key={c.id} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 9 }}>{c.title}</div>
          {c.rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <DiaryIcon name={r.icon} size={20} />
              <span style={{ flex: '0 0 82px', fontSize: 11.5, fontWeight: 700, wordBreak: 'keep-all' }}>{r.label}</span>
              <span style={{ flex: 1, height: 9, borderRadius: 999, background: '#F3F1EC', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${r.pct}%`, borderRadius: 999,
                  background: r.strain >= 2 ? '#D9A24B' : r.strain === 1 ? '#E8CB8E' : '#CFCFC7' }} />
              </span>
              <span style={{ flex: '0 0 52px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: SUB,
                fontVariantNumeric: 'tabular-nums' }}>{r.days}일 {r.pct}%</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>다이어리 미리보기</div>
        <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
          10월 개편을 손님 화면에 올리기 전에 여기서 먼저 봅니다. <b>아직 진짜 다이어리에는 물려 두지 않았습니다.</b>
          <br />&lsquo;오늘 평소보다 무리했나요&rsquo; 질문을 없애고 그 자리를 태그가 맡습니다.
          예전 무리한 이유 넷(오래 앉음·오래 선 자세·많이 걸음·무거운 물건 들기)이 <b>활동·환경</b>으로 들어왔고 <b>업무과다</b>가 새로 생겼습니다.
          <br />부담인지 아닌지는 갈래가 아니라 <b>태그마다</b> 정해 둡니다. 갈래로 묶으면 나중에 항목을 더할 때 저도 모르게 부담이 됩니다.
          <br /><b>음식 섭취는 부담 점수에서 뺍니다.</b> 막대그래프에는 그대로 나옵니다.
          <br />아래 <b>📱 다이어리 화면</b>은 손님이 쓰는 그 화면을 그대로 띄웁니다. 태그 목록만 10월 것으로 갈아 끼우고
          &lsquo;무리했나요&rsquo; 블럭을 뺐습니다. <b>여기서 저장해도 기록은 남지 않습니다.</b>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setScreen('tag')} style={btn(true)}>📱 다이어리 화면</button>
          <button onClick={() => setScreen('chart')} style={btn(false)}>📊 이번 달 태그 막대</button>
          <button onClick={() => setScreen('angle')} style={btn(false)}>📐 각도기록 화면</button>
          <button onClick={() => setScreen('capture')} style={btn(false)}>📷 각도 재는 화면</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: SUB }}>
            쌓인 주
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
              style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '4px 6px', borderRadius: 8 }}>
              {[0, 1, 2, 3, 5, 8].map((n) => <option key={n} value={n}>{n}주</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: SUB, cursor: 'pointer' }}>
            <input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} />
            여성 회원으로 보기
          </label>
        </div>
      </div>

      {/* 고른 태그로 부담이 얼마나 되는지 바로 보여 준다 */}
      <div style={{ ...box, background: BG, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>
          부담 점수 <span style={{ fontWeight: 700, color: SUB }}>— 고른 태그의 무게를 더한 값</span>
        </div>
        {/* 태그를 켜 보며 점수가 어떻게 움직이는지 본다 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {TAG_CATEGORIES.flatMap((c) => c.tags).filter((t) => !t.femaleOnly || female).map((t) => {
            const on = picked.includes(t.label);
            return (
              <button key={t.label} type="button"
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== t.label) : [...p, t.label]))}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800,
                  background: on ? '#FDF6DC' : '#fff', color: on ? GOLD_INK : SUB,
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px #EDE9E2' }}>
                <DiaryIcon name={t.icon} size={15} />{t.label}
                <span style={{ opacity: 0.6 }}>{t.scored === false ? '·0' : `·${t.strain}`}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: GOLD_INK, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{strainWord(score)}</span>
          <span style={{ fontSize: 11.5, color: SUB, fontWeight: 600 }}>
            {picked.length === 0 ? '아래 화면에서 태그를 골라 보세요.' : picked.join(' · ')}
          </span>
        </div>
        <div style={{ fontSize: 11, color: SUB, fontWeight: 600, marginTop: 10, lineHeight: 1.7 }}>
          무게 2 — 진통제 · 방전됨 · 무거운 짐 · 무거운 물건 들기 · 업무과다
          <br />무게 1 — 나머지 부담 태그 · 무게 0 — 수분 보충 · 영양제
          <br /><b>생리 중</b>은 점수에 들어가지만 문구에 &lsquo;무리했다&rsquo;는 말을 붙이지 않습니다. 고를 수 있는 일이 아니니까요.
        </div>
      </div>

      {screen === 'capture' && (
        <AngleCapture onClose={() => setScreen('angle')} onDone={() => {}} />
      )}

      {screen && screen !== 'capture' && (
        <PreviewModal navActive={screen === 'angle' ? 'angle' : 'today'}
          title={screen === 'tag' ? '다이어리 — 10월 모습' : screen === 'chart' ? '이번 달 태그 막대' : '각도기록'}
          onClose={() => setScreen('')}>
          {() => (screen === 'tag' ? realDiary
            : screen === 'chart' ? chart
              : <AngleView rows={checks} onMeasure={() => setScreen('capture')} push={<PushToggle />} />)}
        </PreviewModal>
      )}
    </div>
  );
}
