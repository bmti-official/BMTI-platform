// 이번달 발견 카드 제목 옆 아이콘 — 다이어리 아이콘(DiaryIcons)과 같은 계열의
// 부드러운 색·둥근 모양. 기기마다 다르게 보이는 이모지 대신 쓴다.
// '부담이 몰린 주'는 다이어리의 stress 아이콘을 그대로 쓴다.

// 불편함이 몰린 날·주·요일 — 막대 셋, 가장 높은 막대에 빨간 점
function SoreBars({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="18" width="6" height="9" rx="2" fill="#E8C9A0" />
      <rect x="13" y="9" width="6" height="18" rx="2" fill="#E89A8E" />
      <rect x="21" y="14" width="6" height="13" rx="2" fill="#E8C9A0" />
      <circle cx="16" cy="5.5" r="2.6" fill="#E0554F" />
    </svg>
  );
}

// 무리한 날, 그 다음 날 — 달력 두 장과 화살표
function DayAfter({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="9" width="11" height="14" rx="2.6" fill="#DCC08A" />
      <rect x="3" y="9" width="11" height="4" rx="2" fill="#C8A96E" />
      <rect x="18" y="9" width="11" height="14" rx="2.6" fill="#F0C0A0" />
      <rect x="18" y="9" width="11" height="4" rx="2" fill="#E09A7E" />
      <path d="M13.5 16.5h4.5m-1.8-2.2 2.2 2.2-2.2 2.2" stroke="#8A5A3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 밤 — 초승달과 별
function Night({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M20.5 5.5a10.5 10.5 0 1 0 6 18.8A9 9 0 0 1 20.5 5.5Z" fill="#F4D58A" />
      <path d="M8 7.5l.9 1.9 1.9.9-1.9.9L8 13.1l-.9-1.9-1.9-.9 1.9-.9z" fill="#FFE9B0" />
      <circle cx="12" cy="4.5" r="1.1" fill="#FFE9B0" />
    </svg>
  );
}

// 마법의 D-day — 달력에 동그라미 친 날
function Dday({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="7" width="22" height="20" rx="3.5" fill="#F6E1E1" />
      <rect x="5" y="7" width="22" height="6" rx="3" fill="#E89A9A" />
      <rect x="10" y="4" width="2.4" height="6" rx="1.2" fill="#B96A6A" />
      <rect x="19.6" y="4" width="2.4" height="6" rx="1.2" fill="#B96A6A" />
      <circle cx="16" cy="20" r="4.4" stroke="#E0554F" strokeWidth="2" fill="none" />
      <circle cx="16" cy="20" r="1.5" fill="#E0554F" />
    </svg>
  );
}

// 기록을 남긴 정성 — 공책과 연필
function Effort({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="5" width="16" height="22" rx="3" fill="#EFD9A8" />
      <path d="M10 11h8M10 15h8M10 19h5" stroke="#B89660" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.5 24.5l1.2-4.6 6.3-6.3a1.8 1.8 0 0 1 2.6 2.6l-6.3 6.3z" fill="#E8A87C" />
      <path d="M20.5 24.5l1.2-4.6 3.4 3.4z" fill="#8A5A3B" />
    </svg>
  );
}

// 주로 기록을 남긴 시간대 — 시계와 작은 해
function Clock({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="15" cy="17" r="11" fill="#F0D9B5" />
      <circle cx="15" cy="17" r="8.4" fill="#FFF8EA" />
      <path d="M15 12v5l3.4 2.2" stroke="#8A5A3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="6" r="3.2" fill="#F4C25A" />
    </svg>
  );
}

// 날씨와 겹쳐 본 기록 — 해와 구름
function Weather({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="12" cy="11" r="6" fill="#F4C25A" />
      <path d="M12 2.5v2M12 17.5v2M3.5 11h2M18.5 11h2M6 5l1.4 1.4M16.6 15.6 18 17M6 17l1.4-1.4" stroke="#F4C25A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 27h13a5 5 0 0 0 .5-10 6.5 6.5 0 0 0-12.4 1.5A4.3 4.3 0 0 0 11 27Z" fill="#DCE6F2" />
    </svg>
  );
}

// 편지 — 하트 봉인이 붙은 봉투
function Letter({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="8" width="24" height="17" rx="3" fill="#F6E7C8" />
      <path d="M5 9.5l11 8.5 11-8.5" stroke="#D9BE8C" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M16 22.2s-4-2.4-4-5.1a2.2 2.2 0 0 1 4-1.3 2.2 2.2 0 0 1 4 1.3c0 2.7-4 5.1-4 5.1Z" fill="#E0554F" />
    </svg>
  );
}

const ICONS = { soreBars: SoreBars, dayAfter: DayAfter, night: Night, dday: Dday, effort: Effort, clock: Clock, weather: Weather, letter: Letter };

export function DiscoveryIcon({ name, size = 20 }) {
  const Icon = ICONS[name];
  return Icon ? <Icon size={size} /> : null;
}

/** 제목 옆 아이콘 자리 — '부담이 몰린 주' 카드와 같은 연한 네모 */
export function IconBox({ name, bg, size = 32 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: bg }}>
      <DiscoveryIcon name={name} size={Math.round(size * 0.6)} />
    </span>
  );
}
