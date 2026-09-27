// 최종 배치에서 새로 더한 카드 셋.
//
//   📸 옆모습 견주기        숫자만으로는 스스로 판단이 안 된다. 그림이 필요하다.
//   🌙 무리한 날, 그 다음 날  인과는 못 말해도 **순서**는 말할 수 있다.
//   🔄 주기와 함께           여성 이용자에게 가장 현실적인 물음. 재료는 태그에 이미 있다.
import { DiscoveryIcon } from './DiscoveryIcons';
import { sideShapes, dayAfterHeavy } from '../lib/octFindings';
import { getTypeAccent } from '../lib/typeAccent';

const C = { ink: '#1C1A17', sub: '#9B9489', card: '#FFFFFF' };


const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';

function Card({ icon, title, sub, children }) {
  const t = getTypeAccent();
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: t.accentSoft, color: t.accentDeep, fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: C.ink }}>{title}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 14, lineHeight: 1.65, wordBreak: 'keep-all' }}>{sub}</div>}
      {children}
    </div>
  );
}
function Big({ value, unit, note }) {
  const t = getTypeAccent();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 12px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 38, fontWeight: 900, color: t.accentDeep, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: t.accentDeep }}>{unit}</span>
      {note && <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginLeft: 4 }}>{note}</span>}
    </div>
  );
}

// ── 옆모습 그리기 ──────────────────────────────────────────
// MediaPipe 점 번호. 옆모습이라 한쪽만 쓴다.
const P = { ear: 7, shoulder: 11, hip: 23, knee: 25, ankle: 27, nose: 0 };
const CHAIN = [P.ear, P.shoulder, P.hip, P.knee, P.ankle];

/** 어깨와 엉덩이 사이 길이(몸통)로 키를 맞춰 그린다.
 *  카메라에서 한 걸음 물러난 것이 '자세가 달라진 것'으로 보이면 안 된다.
 *  두 그림이 **같은 배율**을 써야 겹쳐 보는 뜻이 산다 — 그래서 각자 칸에 맞추지 않고
 *  몸통 길이만으로 배율을 정한다. 사람 몸 비율은 대체로 일정해서 이러면 늘 칸 안에 든다. */
function Silhouette({ pose, color, w = 120, h = 190, dashed = false }) {
  const pt = (i) => pose?.[i];
  const sh = pt(P.shoulder), hip = pt(P.hip);
  if (!sh || !hip) return null;
  const torso = Math.abs(hip.y - sh.y) || 0.25;
  // 귀에서 발목까지가 몸통의 약 2.9배다. 0.28을 쓰면 세로 8할쯤을 차지한다.
  const scale = (h * 0.28) / torso;
  const cx = w / 2, cy = h * 0.28;
  const at = (i) => {
    const q = pt(i);
    if (!q) return null;
    return [cx + (q.x - sh.x) * scale, cy + (q.y - sh.y) * scale];
  };
  const pts = CHAIN.map(at).filter(Boolean);
  if (pts.length < 3) return null;
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  const ear = at(P.ear) || at(P.nose);
  const r = Math.max(7, torso * scale * 0.34);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={d} stroke={color} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray={dashed ? '4 6' : undefined} opacity={dashed ? 0.6 : 1} />
      {ear && <circle cx={ear[0]} cy={ear[1] - r * 0.5} r={r} fill={color} opacity={dashed ? 0.45 : 1} />}
    </svg>
  );
}

// ── 1) 옆모습 견주기 ───────────────────────────────────────
export function SideShapeCard({ rows }) {
  const d = sideShapes(rows);
  const t = getTypeAccent();
  if (!d) {
    return (
      <Card icon="📸" title="옆모습 견주기" sub="잰 자세를 선으로 남겨 두었다가 나란히 놓고 봅니다.">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.75, background: '#FAF7F0',
          borderRadius: 12, padding: '14px 15px', wordBreak: 'keep-all' }}>
          다음에 각도를 재는 날부터 옆모습이 쌓입니다. 두 번 재고 나면 여기서 겹쳐 볼 수 있어요.
          <br /><span style={{ color: C.sub, fontWeight: 700, fontSize: 12 }}>사진이 아니라 관절 자리만 담습니다. 얼굴도 방 안 모습도 남지 않아요.</span>
        </div>
      </Card>
    );
  }
  if (d.only) {
    return (
      <Card icon="📸" title="옆모습 견주기" sub={`${d.now.when}에 남긴 옆모습이에요. 한 번 더 재면 겹쳐서 보여 드릴게요.`}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <Silhouette pose={d.now.pose} color={t.accentDeep} />
        </div>
      </Card>
    );
  }
  return (
    <Card icon="📸" title="옆모습 견주기" sub={`${d.first.when}과 ${d.now.when}을 나란히 놓았어요.`}>
      {d.diff != null && (
        <Big value={`${d.diff > 0 ? '+' : ''}${d.diff}`} unit="°"
          note={`목 숙임 ${d.first.neck}° → ${d.now.neck}°`} />
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {[['처음', d.first, true], ['지금', d.now, false]].map(([lb, v, old]) => (
          <div key={lb} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', background: '#FAF7F0', borderRadius: 14, display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <Silhouette pose={v.pose} color={old ? '#C6BFB2' : t.accentDeep} dashed={old} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: old ? C.sub : C.ink }}>
              {lb} · {v.when}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 2) 무리한 날, 그 다음 날 ───────────────────────────────
// 비율만 적어 두면 결국 '무리해서 아팠다'로 읽힌다.
// 날짜를 왼쪽·오른쪽에 나란히 놓고 화살표로 이어야 **순서**로 읽힌다.
export function DayAfterCard({ entries }) {
  const d = dayAfterHeavy(entries);
  if (!d) return null;
  const t = getTypeAccent();
  return (
    <Card icon={<DiscoveryIcon name="dayAfter" size={20} />} title="무리한 날, 그 다음 날"
      sub="부담이 컸던 날과 바로 다음 날을 나란히 놓았어요. 앞뒤 순서일 뿐, 무엇이 원인인지는 알 수 없어요.">
      <Big value={`${d.withSore}`} unit={`/ ${d.n}번`} note={`다음 날 불편한 곳을 적으셨어요 (${d.pct}%)`} />

      {/* 머리글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2 }}>
        <span style={{ flex: '0 0 40%', fontSize: 11, fontWeight: 900, color: C.sub }}>무리한 날</span>
        <span style={{ flex: '0 0 18px' }} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 900, color: C.sub }}>다음 날</span>
      </div>

      {d.lines.map((x) => (
        <div key={x.from} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', borderTop: '1px solid #F3F1EC' }}>
          {/* 왼쪽 — 무리한 날 */}
          <div style={{ flex: '0 0 40%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.accentDeep, flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 900, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{x.from}</span>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {x.tags.length ? x.tags.join(' · ') : `부담 ${x.load}점`}
              </span>
            </span>
          </div>
          {/* 화살표 — 순서를 눈으로 보여 주는 자리 */}
          <span aria-hidden style={{ flex: '0 0 18px', textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#D6CFC1' }}>→</span>
          {/* 오른쪽 — 그 다음 날 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: x.parts.length ? '#C9807A' : '#E7E2D8' }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 900, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{x.to}</span>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: x.parts.length ? '#B23B36' : C.sub }}>
                {x.parts.length ? x.parts.join(' · ') : '적은 곳 없음'}
              </span>
            </span>
          </div>
        </div>
      ))}

      {d.calmPct != null && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F1EC' }}>
          {[['무리한 날 다음', d.pct, true], ['그 밖의 날 다음', d.calmPct, false]].map(([lb, pct, on]) => (
            <div key={lb} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, marginBottom: 5 }}>{lb}</div>
              <div style={{ height: 10, borderRadius: 999, background: '#F3F1EC', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: on ? t.accentDeep : '#DCD6C9' }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 900, color: on ? t.accentDeep : C.sub, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// 주기와 함께(CycleCard)는 걷어냈다.
// 여성 전용 상자 하나를 두는 대신, '이번 달 태그'에서 아무 태그나 눌러 그 날들을
// 달력으로 보는 쪽으로 옮겼다 — 생리 중이든 카페인이든 같은 방식으로 보인다.
