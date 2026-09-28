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
import { matches } from './browseOrder';
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

  const shown = useMemo(() => {
    const byTime = tab === 'all' ? routines
      : routines.filter((r) => {
        const sec = routineSummary(r.cards || []).durationSec;
        if (tab === 'long') return sec >= LONG_FROM;
        return sec > 0 && sec <= CAP[tab];
      });
    if (!q.trim()) return byTime;
    // 플리 자체의 이름뿐 아니라 담긴 동작의 부위·도구로도 걸리게 한다
    return byTime.filter((r) => matches(r, q, tone) || (r.cards || []).some((c) => matches(c, q, tone)));
  }, [routines, tab, q, tone]);

  const none = q.trim() ? `'${q.trim()}'로 찾은 플리가 없어요.`
    : tab === 'all' ? '아직 담긴 플리가 없어요.' : '그 시간 안에 끝나는 플리가 아직 없어요.';

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <PickRow tabs={TABS} value={tab} onPick={setTab} q={q} onQ={setQ} findHint="목, 폼롤러, 아침…" />
      <PliGrid plis={shown} tone={tone} onOpen={(r) => setOpenPli(r)} empty={none} />

      {openPli && (
        <PliFeed plis={shown} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setOpenPli(null)} />
      )}
    </div>
  );
}
