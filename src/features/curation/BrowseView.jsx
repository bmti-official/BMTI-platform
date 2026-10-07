// 둘러보기 — 읽을거리·바디플리·바디카드를 한자리에서 본다.
//
// '전체'는 가로 셋씩, 4:5 세로 격자에 셋을 섞는다. 섞여 있으니 모서리 표시로 갈래를 알린다.
//   읽을거리 … 몇 장짜리인지(아직 카드뉴스가 아니면 읽는 데 걸리는 시간)
//   바디플리 … 동작이 몇 개 담겼는지
//   바디카드 … 몇 분 걸리는지
// '바디플리' 갈래만 고르면 표지가 큰 가로 둘 격자로 바뀐다(만든 사람·시간까지 보인다).
import { useMemo, useState } from 'react';
import { CurationThumb } from './CurationCard';
import CardFeed from './CardFeed';
import NewsCard from './NewsCard';
import PliGrid from './PliGrid';
import PliFeed from './PliFeed';
import { mmss } from './format';
import PickRow from './PickRow';
import { cardTotalSec } from './cardDefaults';
import { cardCount } from './newsSlides';
import { mixGrid, readMin } from './browseOrder';
import { pliCover } from './pliCover';
import { searchList, inGroup, suggest, GROUP_PILLS } from './search';
import { useSearchLog, logSearchOpen, logSearchGroup } from './useSearchLog';
import NoResult from './NoResult';
import SlideNote from './SlideNote';
import { usePanelTime } from '../../lib/usePanelTime';

const SUB = '#8A8378';

// 격자 위 고르개 — 알약은 아래 네비와 겹쳐 보이니 끝만 둥근 네모로 둔다.
const TABS = [['all', '전체'], ['read', '읽을거리'], ['pli', '바디플리'], ['card', '바디카드']];
// 모서리 표시의 색 — 갈래마다 다르게
const MARK = {
  read: { color: '#8A6A3A', background: '#FDF6DC' },
  pli: { color: '#5B4BA8', background: '#ECE7FA' },
  card: { color: '#1C1A17', background: '#fff' },
};

export default function BrowseView({ cards = [], reads = [], routines = [], tone = 'z', bmtiCode, onOpenRead, initialTab = 'all' }) {
  usePanelTime('browse');   // 행동 기록 — 이 창에 머문 시간
  const [openRead, setOpenRead] = useState(null);   // 펼쳐 본 읽을거리
  const [seed] = useState(() => Math.floor(Math.random() * 2000000) + 1);
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');       // 찾기를 열면 나오는 부위 묶음 버튼
  const [openId, setOpenId] = useState(null);      // 펼쳐 본 바디카드
  const [openPli, setOpenPli] = useState(null);    // 펼쳐 본 바디플리

  // 비공개(published가 false)는 격자에 넣지 않는다 — 관리자 미리보기에서도 손님이 보는 그대로
  const pubCards = useMemo(() => cards.filter((c) => c.published !== false), [cards]);
  const pubReads = useMemo(() => reads.filter((r) => r.published !== false), [reads]);
  const all = useMemo(() => mixGrid(pubCards, pubReads, bmtiCode, seed, routines), [pubCards, pubReads, bmtiCode, seed, routines]);
  // 갈래 → 부위 묶음 → 찾는 말 차례로 거른다. 찾는 말이 있으면 잘 맞는 것부터 선다.
  const pool = useMemo(() => {
    const byTab = tab === 'all' ? all : all.filter((x) => x.kind === tab);
    return group === 'all' ? byTab : byTab.filter((x) => inGroup(x.item, group));
  }, [all, tab, group]);
  const found = useMemo(() => searchList(pool, q, tone, (x) => x.item), [pool, q, tone]);
  const grid = found.rows;
  const asked = q.trim();
  useSearchLog('browse', q, grid.length, { tab, g: group });
  // 못 찾았을 때 권할 말 — 그 말로 찾으면 실제로 나오는 것만 권한다
  const hint = useMemo(() => {
    if (!asked || grid.length > 0) return '';
    const w = suggest(asked);
    return w && searchList(pool, w, tone, (x) => x.item).rows.length > 0 ? w : '';
  }, [asked, grid.length, pool, tone]);
  // 못 찾았을 때 대신 보여 줄 것 — 많이 본 동작
  const popular = useMemo(() => [...pubCards].sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0)).slice(0, 6), [pubCards]);
  // 지금 걸러진 플리들 — 한 편씩 넘겨 보는 창이 이 차례를 따른다
  const shownPlis = useMemo(() => grid.filter((x) => x.kind === 'pli').map((x) => x.item), [grid]);

  const head = (
    <PickRow tabs={TABS} value={tab} onPick={setTab} q={q} onQ={setQ}
      groups={GROUP_PILLS} group={group} onGroup={(g) => { setGroup(g); logSearchGroup('browse', g); }} />
  );
  const feeds = (
    <>
      {openId != null && (
        <CardFeed cards={pubCards} startId={openId} tone={tone} bmtiCode={bmtiCode} onClose={() => setOpenId(null)} />
      )}
      {openRead && (
        <NewsCard item={openRead} tone={tone} onClose={() => setOpenRead(null)}
          slides={(tone === 'm' ? openRead.slides_m : openRead.slides_z) || []} />
      )}
      {openPli && (
        <PliFeed plis={shownPlis.length ? shownPlis : routines} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setOpenPli(null)} />
      )}
    </>
  );
  const open = (kind, item) => {
    logSearchOpen('browse', q, kind, item.id);
    if (kind === 'card') { setOpenId(item.id); return; }
    if (kind === 'pli') { setOpenPli(item); return; }
    // 카드뉴스로 만든 글이면 옆으로 넘겨 보고, 아직 긴 글이면 바깥에 넘긴다
    const g = (tone === 'm' ? item.slides_m : item.slides_z) || [];
    if (g.length) setOpenRead(item); else if (onOpenRead) onOpenRead(item);
  };

  if (grid.length === 0) {
    const filtered = !!asked || group !== 'all';
    const none = tab === 'pli' ? '아직 올라온 바디플리가 없어요.' : tab === 'read' ? '아직 올라온 읽을거리가 없어요.' : '아직 볼 것이 없어요.';
    return (
      <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
        {head}
        <NoResult
          text={asked ? `‘${asked}’(으)로 찾은 게 없어요.` : filtered ? '이 부위로 분류된 것이 아직 없어요.' : none}
          hint={hint} onPick={setQ}
          tip={filtered ? '다른 말로 찾거나, 위의 갈래·부위 버튼을 바꿔 보세요.' : ''} />
        {filtered && popular.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: SUB, margin: '16px 2px 7px' }}>대신 많이 본 동작이에요</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {popular.map((item) => (
                <button key={item.id} type="button" onClick={() => setOpenId(item.id)}
                  style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <CurationThumb item={item} radius={2} ratio="4 / 5" showRead={false}
                    clip={item.video_url || ''} still={item.poster_url || ''} emptyText="" />
                </button>
              ))}
            </div>
          </>
        )}
        {feeds}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {head}
      <SlideNote show={found.loose} text={`‘${asked}’에 꼭 맞는 것은 없어, 비슷한 것을 보여 드려요.`} />
      {tab === 'pli' ? (
        // 바디플리만 볼 때 — 표지가 큰 격자. 만든 사람과 걸리는 시간까지 보인다.
        <PliGrid plis={shownPlis} tone={tone} onOpen={(r) => open('pli', r)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {grid.map(({ kind, item }) => {
            const cover = kind === 'pli' ? pliCover(item)
              : { item, clip: kind === 'read' ? '' : (item.video_url || ''), still: kind === 'read' ? '' : (item.poster_url || '') };
            // 카드뉴스로 만든 글이면 장수를, 아직 긴 글이면 읽는 시간을 적는다
            const slides = cardCount((tone === 'm' ? item.slides_m : item.slides_z) || []);
            const mark = kind === 'read' ? (slides > 0 ? `${slides}장` : `${readMin(item, tone)}분`)
              : kind === 'pli' ? `플리 · 동작 ${(item.cards || []).length}개`
                : (cardTotalSec(item) > 0 ? mmss(cardTotalSec(item)) : '');
            return (
              <button key={`${kind}-${item.id}`} type="button" onClick={() => open(kind, item)}
                style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                <CurationThumb item={cover.item} radius={2} ratio="4 / 5" showRead={false}
                  clip={cover.clip} still={cover.still} emptyText="" />
                {/* 오른쪽 아래 — 읽을거리는 장수(또는 시간), 플리는 담긴 동작 수, 동작은 걸리는 시간 */}
                {mark && (
                  <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800,
                    ...MARK[kind], borderRadius: 6, padding: '2px 5px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {mark}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {feeds}
    </div>
  );
}
