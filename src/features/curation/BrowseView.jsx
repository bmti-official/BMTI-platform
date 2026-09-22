// 둘러보기 — 읽을거리와 바로카드를 한 격자에 담는다.
//
// 가로 셋씩, 4:5 세로. 둘이 섞여 있으니 모서리 표시로 갈래를 알린다.
//   읽을거리 … 몇 장짜리인지(아직 카드뉴스가 아니면 읽는 데 걸리는 시간)
//   바로카드 … 몇 분 걸리는지
import { useMemo, useState } from 'react';
import { CurationThumb } from './CurationCard';
import CardFeed from './CardFeed';
import { mmss } from './format';
import { mixGrid, readMin, matches } from './browseOrder';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

// 격자 위 고르개 — 알약은 아래 네비와 겹쳐 보이니 끝만 둥근 네모로 둔다.
const TABS = [['all', '전체'], ['read', '읽을거리'], ['card', '바로카드']];
const pick = (on) => ({
  flex: 1, minWidth: 0, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap',
  background: on ? YELLOW : '#fff', color: on ? GOLD_INK : SUB,
  boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`, transition: 'background .15s, color .15s',
});

export default function BrowseView({ cards = [], reads = [], tone = 'z', bmtiCode, onOpenRead }) {
  const [seed] = useState(() => Math.floor(Math.random() * 2000000) + 1);
  const [tab, setTab] = useState('all');
  const [finding, setFinding] = useState(false);   // 돋보기를 눌렀는가
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);      // 펼쳐 본 바로카드

  const all = useMemo(() => mixGrid(cards, reads, bmtiCode, seed), [cards, reads, bmtiCode, seed]);
  const grid = useMemo(() => {
    const byTab = tab === 'all' ? all : all.filter((x) => (tab === 'read' ? x.kind === 'read' : x.kind === 'card'));
    return q.trim() ? byTab.filter((x) => matches(x.item, q, tone)) : byTab;
  }, [all, tab, q, tone]);

  const head = (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {TABS.map(([k, lb]) => (
          <button key={k} type="button" onClick={() => setTab(k)} style={pick(tab === k)}>{lb}</button>
        ))}
        <button type="button" onClick={() => { setFinding((v) => !v); if (finding) setQ(''); }}
          aria-label="찾기" style={{ ...pick(finding || !!q.trim()), flex: '0 0 44px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
            </svg>
          </span>
        </button>
      </div>
      {finding && (
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="부위·도구·제목으로 찾기 — 목, 폼롤러, 어깨…"
          style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', padding: '10px 12px', borderRadius: 11,
            border: 'none', boxShadow: `inset 0 0 0 1px ${LINE}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: INK }} />
      )}
    </div>
  );

  if (grid.length === 0) {
    return (
      <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
        {head}
        <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '26px 16px', textAlign: 'center',
          fontSize: 13, color: SUB, fontWeight: 600 }}>
          {q.trim() ? `'${q.trim()}'로 찾은 게 없어요.` : '아직 볼 것이 없어요.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {head}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
        {grid.map(({ kind, item }) => {
          const read = kind === 'read';
          // 카드뉴스로 만든 글이면 장수를, 아직 긴 글이면 읽는 시간을 적는다
          const slides = (item.slides || []).length;
          const mark = read ? (slides > 0 ? `${slides}장` : `${readMin(item, tone)}분`)
            : (item.duration_sec > 0 ? mmss(item.duration_sec) : '');
          return (
            <button key={`${kind}-${item.id}`} type="button"
              onClick={() => (read ? onOpenRead && onOpenRead(item) : setOpenId(item.id))}
              style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              <CurationThumb item={item} radius={2} ratio="4 / 5" showRead={false}
                clip={read ? '' : (item.video_url || '')} emptyText="" />
              {/* 오른쪽 아래 — 읽을거리는 장수(또는 시간), 동작은 걸리는 시간 */}
              {mark && (
                <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800,
                  color: read ? '#8A6A3A' : '#1C1A17', background: read ? '#F3EAD8' : '#fff',
                  borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>
                  {mark}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openId != null && (
        <CardFeed cards={cards} startId={openId} tone={tone} bmtiCode={bmtiCode} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
