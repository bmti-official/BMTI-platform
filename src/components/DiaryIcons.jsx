// BMTI 하루일기 입력창 전용 2D 플랫 아이콘 세트 — 말랑이와 같은 계열의
// 부드러운 색·둥근 형태로 그려서, 기기마다 다르게 보이는 유니코드 이모지 대신 쓴다.

function IconWalk({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="18" cy="7" r="4" fill="#E8B77D" />
      <path d="M18 11 v7 M18 18 l-6 9 M18 18 l7 6 M18 13 l-7 3 M18 13 l7-2"
        stroke="#8A5A3B" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconChair({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="9" y="4" width="14" height="4" rx="2" fill="#B58956" />
      <rect x="9" y="8" width="4" height="14" rx="2" fill="#B58956" />
      <rect x="9" y="20" width="14" height="4" rx="2" fill="#8A5A3B" />
      <rect x="10" y="24" width="3" height="6" rx="1.3" fill="#5B4636" />
      <rect x="19" y="24" width="3" height="6" rx="1.3" fill="#5B4636" />
    </svg>
  );
}

function IconSofa({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="14" width="22" height="10" rx="4" fill="#D98E8E" />
      <rect x="5" y="9" width="6" height="9" rx="3" fill="#C97575" />
      <rect x="21" y="9" width="6" height="9" rx="3" fill="#C97575" />
      <rect x="9" y="11" width="14" height="7" rx="3" fill="#E8ABAB" />
      <rect x="6" y="24" width="3" height="4" rx="1.3" fill="#8A5A3B" />
      <rect x="23" y="24" width="3" height="4" rx="1.3" fill="#8A5A3B" />
    </svg>
  );
}

function IconSlump({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 26 Q6 14 16 12 Q26 14 26 26" stroke="#8A5A3B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M11 8 q2 -3 4 0 M17 8 q2 -3 4 0" stroke="#B58956" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <line x1="6" y1="26" x2="26" y2="26" stroke="#5B4636" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconToss({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="18" width="24" height="9" rx="4" fill="#9BB8D9" />
      <rect x="4" y="14" width="8" height="7" rx="3.2" fill="#C7D9EC" />
      <path d="M14 9 q2 -4 4 0 q2 -4 4 0" stroke="#5B7CA3" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function IconMehMoon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M20 5 A11 11 0 1 0 20 27 A8.5 8.5 0 1 1 20 5Z" fill="#C9C4BC" />
      <circle cx="15" cy="15" r="1.6" fill="#5B5650" />
      <circle cx="21" cy="15" r="1.6" fill="#5B5650" />
      <line x1="16" y1="20" x2="20" y2="20" stroke="#5B5650" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSleepWell({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="14" cy="17" r="10" fill="#FFD873" />
      <path d="M11 15 q2 -2.4 4 0 M15 15 q2 -2.4 4 0" stroke="#8A6A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M11 20 q3 2.4 6 0" stroke="#8A6A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="22" y="11" fontSize="7" fontWeight="700" fill="#C9A227">z</text>
      <text x="26" y="7" fontSize="5" fontWeight="700" fill="#C9A227">z</text>
    </svg>
  );
}

function IconRestNo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 20 Q4 12 16 12 Q28 12 28 20 L28 24 Q16 28 4 24 Z" fill="#D9C7A8" />
      <path d="M4 20 Q16 24 28 20" stroke="#B39A72" strokeWidth="2" fill="none" />
    </svg>
  );
}

function IconFlex({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 22 Q6 12 14 10 Q22 8 24 16 Q26 22 20 24 L14 25 Q9 25 8 22 Z" fill="#E8A857" />
      <circle cx="16" cy="14" r="3.4" fill="#F6D9B0" />
    </svg>
  );
}

function IconClock({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="17" r="11" fill="#F2D06B" stroke="#C9A227" strokeWidth="1.6" />
      <path d="M16 10 v7 l5 3" stroke="#5B4636" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <rect x="12" y="3" width="8" height="3" rx="1.5" fill="#C9A227" />
    </svg>
  );
}

function IconYawn({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" fill="#F0D9B5" />
      <path d="M10 14 q2 -3 4 0 M18 14 q2 -3 4 0" stroke="#8A6A46" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="21" rx="3.4" ry="4.4" fill="#8A6A46" />
    </svg>
  );
}

function IconBandage({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g transform="rotate(-18 16 17)">
        <rect x="5" y="13" width="22" height="8" rx="4" fill="#F0DCC0" />
        <circle cx="11" cy="14.6" r="1.3" fill="#C97575" />
        <circle cx="14" cy="16.4" r="1.3" fill="#C97575" />
        <circle cx="20" cy="15.5" r="1.3" fill="#C97575" />
      </g>
    </svg>
  );
}

function IconBlanket({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="16" width="24" height="10" rx="5" fill="#B9CFE8" />
      <rect x="5" y="12" width="9" height="7" rx="3.2" fill="#E9F0F8" />
    </svg>
  );
}

function IconForgot({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="14" r="8" fill="#DCD6C8" />
      <rect x="13" y="21" width="6" height="4" rx="1.6" fill="#B7B2A9" />
      <path d="M11 9 l10 10 M21 9 l-10 10" stroke="#8A8378" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGear({ size = 20, color = "#5F8A76" }) {
  // 사용자가 준 레퍼런스(8개 톱니 + 큰 가운데 구멍)와 같은 실루엣, 색만 사이트 톤으로.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <g fill={color}>
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="13.6" y="1.4" width="4.8" height="10.5" rx="1.8" transform={`rotate(${i * 45} 16 16)`} />
        ))}
      </g>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M16 5.4a10.6 10.6 0 1 0 0 21.2 10.6 10.6 0 0 0 0-21.2Zm0 5.8a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z"
        fill={color} />
    </svg>
  );
}

const ICONS = {
  walk: IconWalk, chair: IconChair, sofa: IconSofa, slump: IconSlump,
  toss: IconToss, mehMoon: IconMehMoon, sleepWell: IconSleepWell,
  restNo: IconRestNo, flex: IconFlex,
  clock: IconClock, yawn: IconYawn, bandage: IconBandage, blanket: IconBlanket, forgot: IconForgot,
  gear: IconGear,
};

export function DiaryIcon({ name, size = 28 }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}
