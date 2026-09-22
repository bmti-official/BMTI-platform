// 🗓 다이어리 미리보기 — 10월 개편을 손님 화면에 올리기 전에 여기서 먼저 본다.
//
// 아직 진짜 다이어리에는 물려 두지 않았다. 여기서 모양과 셈을 확인하고,
// 괜찮으면 그때 손님 화면으로 옮긴다.
import { useMemo, useState } from 'react';
import { INK, SUB, LINE, BG, box, btn } from './theme';
import PreviewModal from './PreviewModal';
import { DiaryIcon } from '../components/DiaryIcons';
import { TAG_CATEGORIES, strainScore, strainWord, tagShare } from '../lib/diaryTags';

const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

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
  const [picked, setPicked] = useState([]);
  const [female, setFemale] = useState(true);
  const [screen, setScreen] = useState('');   // '' | 'tag' | 'chart'
  const month = useMemo(() => fakeMonth(18), []);
  const share = useMemo(() => tagShare(month), [month]);
  const score = strainScore(picked);

  const toggle = (lb) => setPicked((p) => (p.includes(lb) ? p.filter((x) => x !== lb) : [...p, lb]));

  // 손님이 보는 태그 고르개
  const tagPicker = (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3 }}>오늘의 태그</div>
      <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600, marginBottom: 14 }}>
        오늘 있었던 일을 골라 주세요. 여러 개 골라도 괜찮아요.
      </div>
      {TAG_CATEGORIES.map((c) => (
        <div key={c.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 8 }}>{c.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {c.tags.filter((t) => !t.femaleOnly || female).map((t) => {
              const on = picked.includes(t.label);
              return (
                <button key={t.label} type="button" onClick={() => toggle(t.label)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 66,
                    padding: '9px 2px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: on ? YELLOW : '#fff', boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                  <DiaryIcon name={t.icon} size={26} />
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: on ? GOLD_INK : SUB, lineHeight: 1.25,
                    wordBreak: 'keep-all', textAlign: 'center' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setScreen('tag')} style={btn(true)}>📱 태그 고르는 화면</button>
          <button onClick={() => setScreen('chart')} style={btn(false)}>📊 이번 달 태그 막대</button>
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

      {screen && (
        <PreviewModal navActive="today" title={screen === 'tag' ? '오늘의 태그' : '이번 달 태그 막대'}
          onClose={() => setScreen('')}>
          {() => (screen === 'tag' ? tagPicker : chart)}
        </PreviewModal>
      )}
    </div>
  );
}
