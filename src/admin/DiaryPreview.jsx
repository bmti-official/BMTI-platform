// 🗓 다이어리 미리보기 — 10월 개편을 손님 화면에 올리기 전에 여기서 먼저 본다.
//
// 아직 진짜 다이어리에는 물려 두지 않았다. 여기서 모양과 셈을 확인하고,
// 괜찮으면 그때 손님 화면으로 옮긴다.
import { useEffect, useMemo, useState } from 'react';
import { INK, SUB, BG, box, btn } from './theme';
import PreviewModal from './PreviewModal';
import DiaryWriteFlow from '../components/DiaryWriteFlow';
import DiaryCalendar from '../components/DiaryCalendar';
import MallangDiscoveryReport from '../components/MallangDiscoveryReport';
import OctFindingSamples from '../components/OctFindingSamples';
import AngleBodyAdmin from './AngleBodyAdmin';
import { getDiaryHistory } from '../lib/diaryHistory';
import { setDiaryDryRun, todayISO } from '../lib/diaryHistory';
import { toView } from '../lib/angleView';
import AngleView from '../features/angle/AngleView';
import AngleCapture from '../features/angle/AngleCapture';
import PushToggle from '../features/angle/PushToggle';
import { DiaryIcon } from '../components/DiaryIcons';
import { TAG_CATEGORIES, strainScore, strainWord } from '../lib/diaryTags';

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
      // 좌우 — 한쪽이 덜 올라가는 모습을 미리보기에서 볼 수 있게 오른팔을 낮춰 둔다
      arm_raise_l: Math.round((148 - i * 1.8) * 10) / 10,
      arm_raise_r: Math.round((128 - i * 2.4) * 10) / 10,
      quality: 82,
    });
  }
  return out;
}

export default function DiaryPreview() {
  const [picked, setPicked] = useState(['진통제', '업무과다', '카페인']);
  const [female, setFemale] = useState(true);
  const [screen, setScreen] = useState('');   // '' | 'tag' | 'report' | 'angle' | 'capture' | 'draft'
  const [weeks, setWeeks] = useState(3);      // 몇 주치가 쌓인 셈 칠지
  const [tone, setTone] = useState('z');      // 미리보기 말투
  const [writing, setWriting] = useState(null);   // 쓰는 중 — { mood, date, entry }
  const [justSaved, setJustSaved] = useState(null); // 방금 적은 것 — 캘린더로 돌아가 팝업을 띄운다
  const [reportTab, setReportTab] = useState('records');
  const [round, setRound] = useState(0);      // 연습을 처음부터 다시 돌릴 때
  const [want, setWant] = useState(['neck', 'trunk', 'arm']);   // 고른 측정 부위
  const checks = useMemo(() => fakeWeeks(weeks), [weeks]);

  // 연습 모드 — 미리보기를 여는 동안만 켠다.
  // 켜 두면 기록이 메모리에만 쌓여, 화면은 진짜처럼 돌면서도 관리자 본인의
  // 오늘 기록을 덮어쓰지 않는다. 창을 닫으면 원래대로 돌아간다.
  // round — '처음부터 다시'를 누르면 올라간다. 연습 기록을 지우고 새로 시작한다.
  useEffect(() => {
    setDiaryDryRun(true, true);
    return () => setDiaryDryRun(false);
  }, [round]);
  const score = strainScore(picked);


  // 손님이 보는 다이어리 그대로 — 화면을 새로 그리지 않고 진짜 것을 띄운다.
  // 여기서 본 모습이 곧 손님이 볼 모습이다.
  //   tagCats   10월 태그 목록으로 갈아 끼운다
  //   dropBlock '오늘 평소보다 무리했나요'를 뺀 모습
  const code = tone === 'm' ? 'OCDM' : 'ACDZ';

  // 손님이 지나는 길을 그대로 따라간다(AiChatHub와 같은 셈).
  //   오늘 쓰기(캘린더) → 기분 고르기 → 상세 기록 → 저장 → 캘린더 위 말랑이 팝업 → 매일 한마디
  // 다른 것은 진짜 부품을 그대로 쓰고, 저장만 하지 않는다.
  const realDiary = writing ? (
    <DiaryWriteFlow
      tagCats={TAG_CATEGORIES}
      dropBlock={['sitting']}
      onAngle={(w) => { setWant(w || ['neck', 'trunk', 'arm']); setScreen('capture'); }}
      initialPhase="form"
      initialDayMood={writing.mood}
      initialEntry={writing.entry}
      targetDate={writing.date}
      gender={female ? 'female' : 'male'}
      isLoggedIn
      onClose={() => setWriting(null)}
      onFinish={(mood, extra) => { setWriting(null); setJustSaved({ mood, ...(extra || {}) }); }}
    />
  ) : (
    <DiaryCalendar
      key={round}
      bmtiCode={code}
      isLoggedIn
      gender={female ? 'female' : 'male'}
      onPickMood={(mood) => setWriting({ mood, date: todayISO(), entry: null })}
      onEditDay={(dateStr, entry) => setWriting({ mood: entry?.mood ?? null, date: dateStr, entry: entry || null })}
      initialStressMood={justSaved ? justSaved.mood : null}
      onStressShown={() => setJustSaved(null)}
    />
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
          <br />아래 <b>📱 다이어리 화면</b>은 손님이 지나는 길을 그대로 따라갑니다.
          <b>오늘 쓰기(캘린더) → 기분 고르기 → 상세 기록 → 저장 → 말랑이 팝업 → 매일 한마디</b>까지 진짜 부품이 그대로 돕니다.
          태그 목록만 10월 것으로 갈아 끼우고 &lsquo;무리했나요&rsquo; 블럭을 뺐습니다.
          <br /><b>연습 모드로 돕니다.</b> 여기서 남긴 기록은 달력에도 보이고 한마디도 나오지만,
          브라우저에도 서버에도 남지 않습니다. 창을 닫으면 사라집니다 — 관리자 본인의 오늘 기록이 덮어써지지 않게 한 것입니다.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { setRound((n) => n + 1); setWriting(null); setJustSaved(null); setScreen('tag'); }}
            style={btn(true)}>📱 다이어리 화면</button>
          <button onClick={() => { setReportTab('records'); setScreen('report'); }} style={btn(false)}>📅 이번달 기록</button>
          <button onClick={() => { setReportTab('discovery'); setScreen('report'); }} style={btn(false)}>📊 이번달 발견</button>
          <button onClick={() => setScreen('angle')} style={btn(false)}>📐 각도기록 화면</button>
          <button onClick={() => setScreen('capture')} style={btn(false)}>📷 각도 재는 화면</button>
          <button onClick={() => setScreen('draft')} style={btn(false)}>🧪 발견 박스 원안</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: SUB }}>
            말투
            <select value={tone} onChange={(e) => setTone(e.target.value)}
              style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '4px 6px', borderRadius: 8 }}>
              <option value="z">Z 담백</option>
              <option value="m">M 다정</option>
            </select>
          </label>
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

      <AngleBodyAdmin />

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

      {screen === 'report' && (
        <>
          {/* 각도 판은 지어낸 것을 그대로 넘긴다. 위 '쌓인 주'를 돌리면 박스가 같이 바뀐다 */}
          <MallangDiscoveryReport oct initialTab={reportTab} bmtiCode={code} isLoggedIn angleRows={checks}
            userData={{ nickname: '회원', kakao_gender: female ? 'female' : 'male' }} onClose={() => setScreen('')} />
          {/* 기록·발견은 제 화면을 통째로 쓴다. 관리자에서 나올 길을 위에 따로 둔다. */}
          <button type="button" onClick={() => setScreen('')}
            style={{ position: 'fixed', top: 14, right: 14, zIndex: 9999, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: '#fff', background: '#1C1A17',
              borderRadius: 999, padding: '9px 16px', boxShadow: '0 3px 14px rgba(0,0,0,0.3)' }}>
            ✕ 미리보기 닫기
          </button>
        </>
      )}

      {screen === 'capture' && (
        <AngleCapture admin want={want} gender={female ? 'female' : 'male'} onClose={() => setScreen('angle')} onDone={() => {}} />
      )}

      {screen && screen !== 'capture' && screen !== 'report' && (
        <PreviewModal navActive={screen === 'angle' ? 'angle' : screen === 'draft' ? 'discover' : screen === 'report' ? 'discover' : 'today'}
          title={screen === 'tag' ? '다이어리 — 10월 모습' : screen === 'draft' ? '이번달 발견 — 원안' : '각도기록'}
          onClose={() => { setScreen(''); setWriting(null); setJustSaved(null); }}>
          {() => (screen === 'tag' ? realDiary
            : screen === 'angle' ? <AngleView rows={checks} onMeasure={() => setScreen('capture')} push={<PushToggle />} />
              // 원안 샘플도 화면용 값(목은 CVA)으로 넘겨야 판정 방향이 맞는다
              : screen === 'draft' ? <OctFindingSamples rows={toView(checks)} entries={getDiaryHistory()} />
                : null)}
        </PreviewModal>
      )}
    </div>
  );
}
