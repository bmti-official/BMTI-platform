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

function IconAllNighter({ size = 28 }) {
  // 밤을 새웠어요 — 눈이 새까만 사람 표정 (탈진, 동공이 커진 느낌)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13.5" fill="#ADA6C4" />
      <circle cx="11.2" cy="15.3" r="3.3" fill="#2B2A3A" />
      <circle cx="20.8" cy="15.3" r="3.3" fill="#2B2A3A" />
      <path d="M10.8 22.6 q5.2 -2.6 10.4 0" stroke="#544E6B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function IconToss({ size = 28 }) {
  // 뒤척였어요 — 눈이 째진(가늘게 뜬) 표정
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13.5" fill="#9BB8D9" />
      <path d="M8.3 15.2 q2.9 -2.2 5.8 0" stroke="#3E5C80" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M17.9 15.2 q2.9 -2.2 5.8 0" stroke="#3E5C80" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M11.8 23 q4.2 -2 8.4 0" stroke="#3E5C80" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function IconMehMoon({ size = 28 }) {
  // 그냥 그랬어요 — 눈이 동그란 표정
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13.5" fill="#C9C4BC" />
      <circle cx="11.2" cy="15.3" r="2" fill="#5B5650" />
      <circle cx="20.8" cy="15.3" r="2" fill="#5B5650" />
      <line x1="11.8" y1="22.6" x2="20.2" y2="22.6" stroke="#5B5650" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconSleepWell({ size = 28 }) {
  // 푹 잤어요 — 아주 개운한 표정
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13.5" fill="#FFD873" />
      <path d="M9.4 14.4 q1.9 -3.2 3.8 0" stroke="#8A6A1E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M18.8 14.4 q1.9 -3.2 3.8 0" stroke="#8A6A1E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M10 20.4 q6 6.4 12 0" stroke="#8A6A1E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M5 8 l1.6 1.6M27 8 l-1.6 1.6" stroke="#F2C94C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRestNo({ size = 28 }) {
  // 아니요! — 직관적인 X
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M9.5 9.5 L22.5 22.5 M22.5 9.5 L9.5 22.5" stroke="#E0645C" strokeWidth="4.4" strokeLinecap="round" />
    </svg>
  );
}

function IconFlex({ size = 28 }) {
  // 맞아요! — 직관적인 O
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="9.6" stroke="#4CAF6E" strokeWidth="4.4" fill="none" />
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
  // 몸이 안 좋아요 — 누구나 알아보는 클래식 반창고 모양
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g transform="rotate(-32 16 16)">
        <rect x="4" y="11" width="24" height="10" rx="5" fill="#F0DCC0" stroke="#D9C2A0" strokeWidth="1" />
        <rect x="12.5" y="11" width="7" height="10" fill="#FBF6EE" stroke="#D9C2A0" strokeWidth="1" />
        <circle cx="15" cy="14.4" r="0.9" fill="#C9B48C" />
        <circle cx="17.3" cy="14.4" r="0.9" fill="#C9B48C" />
        <circle cx="15" cy="17.6" r="0.9" fill="#C9B48C" />
        <circle cx="17.3" cy="17.6" r="0.9" fill="#C9B48C" />
      </g>
    </svg>
  );
}

function IconStanding({ size = 28 }) {
  // 오래 선 자세 — 다리를 가지런히 모으고 서 있는 사람
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="7" r="4" fill="#E8B77D" />
      <path d="M16 11 v9 M12.6 13.4 v7.5 M19.4 13.4 v7.5 M14.3 20.5 l-1 7.5 M17.7 20.5 l1 7.5"
        stroke="#8A5A3B" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconHeavyLift({ size = 28 }) {
  // 무거운 물건 들기 — 바벨(덤벨) 아이콘
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2.5" y="10" width="6.5" height="12" rx="2.4" fill="#8A5A3B" />
      <rect x="23" y="10" width="6.5" height="12" rx="2.4" fill="#8A5A3B" />
      <rect x="9" y="14.5" width="14" height="3.4" rx="1.7" fill="#B58956" />
    </svg>
  );
}

function IconEditPencil({ size = 28 }) {
  // 기타(직접 입력) — 연필
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 24.5 L9.6 18.3 L20.6 7.3 L24.7 11.4 L13.7 22.4 Z" fill="#F2D06B" stroke="#C9A227" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M18.6 9.3 L22.7 13.4" stroke="#C9A227" strokeWidth="1.6" />
      <path d="M8 24.5 L9.6 18.3 L13.7 22.4 Z" fill="#8A6A46" />
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

function IconWarn({ size = 28 }) {
  // 평소보다 무리했어요 — 경고 삼각형
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4.5 L29 26.5 H3 Z" fill="#F2D06B" stroke="#C9A227" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="14.6" y="13" width="2.8" height="7.4" rx="1.4" fill="#8A6A1E" />
      <circle cx="16" cy="23" r="1.6" fill="#8A6A1E" />
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
  allNighter: IconAllNighter, toss: IconToss, mehMoon: IconMehMoon, sleepWell: IconSleepWell,
  restNo: IconRestNo, flex: IconFlex,
  clock: IconClock, yawn: IconYawn, bandage: IconBandage, blanket: IconBlanket, forgot: IconForgot,
  standing: IconStanding, heavyLift: IconHeavyLift, editPencil: IconEditPencil,
  gear: IconGear, warn: IconWarn,
};

export function DiaryIcon({ name, size = 28 }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}
