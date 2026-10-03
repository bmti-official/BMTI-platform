// 바로플리 — 담긴 플리를 가로 둘씩 격자로 보여 준다.
// 바로카드 격자는 '둘러보기'(BrowseView)가 따로 맡는다.
//
// 위 고르개는 '시간'으로 둔다. 플리를 고를 때 가장 먼저 재는 것이
// "지금 몇 분 있나"이기 때문이다. 부위로 찾는 일은 돋보기가 맡는다.
import { useMemo, useState } from 'react';
import PliGrid from './PliGrid';
import PickRow from './PickRow';
import PliFeed from './PliFeed';
import { routineSummary } from './format';
import { searchList, inGroup, suggest, GROUP_PILLS } from './search';
import { useSearchLog, logSearchOpen, logSearchGroup } from './useSearchLog';
import NoResult from './NoResult';
import SlideNote from './SlideNote';
import { usePanelTime } from '../../lib/usePanelTime';

const INK = '#1C1A17';

const TABS = [['all', '전체'], ['short', '10분 이내'], ['mid', '20분 이내'], ['long', '30분 이상']];
const CAP = { short: 600, mid: 1200 };
const LONG_FROM = 1800;   // 30분 이상

export default function BaroPliView({ routines = [], tone = 'z', bmtiCode }) {
  usePanelTime('baropli');   // 행동 기록 — 이 창에 머문 시간
  const [openPli, setOpenPli] = useState(null);   // 한 편씩 넘겨 보는 창
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');      // 찾기를 열면 나오는 부위 묶음 알약

  // 시간 → 부위 묶음 → 찾는 말 차례로 거른다
  const pool = useMemo(() => {
    const byTime = tab === 'all' ? routines
      : routines.filter((r) => {
        const sec = routineSummary(r.cards || []).durationSec;
        if (tab === 'long') return sec >= LONG_FROM;
        return sec > 0 && sec <= CAP[tab];
      });
    return group === 'all' ? byTime : byTime.filter((r) => inGroup(r, group));
  }, [routines, tab, group]);
  // 플리 이름뿐 아니라 담긴 동작의 부위·도구·종류로도 걸린다. 잘 맞는 것부터 선다.
  const found = useMemo(() => searchList(pool, q, tone), [pool, q, tone]);
  const shown = found.rows;
  const asked = q.trim();
  useSearchLog('pli', q, shown.length, { tab, g: group });
  const hint = useMemo(() => {
    if (!asked || shown.length > 0) return '';
    const w = suggest(asked);
    return w && searchList(pool, w, tone).rows.length > 0 ? w : '';
  }, [asked, shown.length, pool, tone]);

  const filtered = !!asked || group !== 'all';
  const none = tab === 'all' ? '아직 담긴 플리가 없어요.' : '그 시간 안에 끝나는 플리가 아직 없어요.';

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <PickRow tabs={TABS} value={tab} onPick={setTab} q={q} onQ={setQ} findHint="거북목, 폼롤러, 어깨…"
        groups={GROUP_PILLS} group={group} onGroup={(g) => { setGroup(g); logSearchGroup('pli', g); }} />
      <SlideNote show={found.loose && shown.length > 0} text={`‘${asked}’에 꼭 맞는 것은 없어, 비슷한 것을 보여 드려요.`} />
      {filtered && shown.length === 0 ? (
        <NoResult
          text={asked ? `‘${asked}’(으)로 찾은 플리가 없어요.` : '이 부위가 담긴 플리가 아직 없어요.'}
          hint={hint} onPick={setQ} tip="다른 말로 찾거나, 위의 부위 알약을 눌러 보세요." />
      ) : (
        <PliGrid plis={shown} tone={tone} onOpen={(r) => { logSearchOpen('pli', q, 'pli', r.id); setOpenPli(r); }} empty={none} />
      )}

      {openPli && (
        <PliFeed plis={shown} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setOpenPli(null)} />
      )}
    </div>
  );
}
