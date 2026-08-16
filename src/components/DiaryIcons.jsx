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
      {/* 등받이 */}
      <rect x="8" y="4" width="16" height="15" rx="3.5" fill="#B58956" />
      {/* 등받이 쿠션 */}
      <rect x="10.5" y="6.5" width="11" height="9" rx="2.2" fill="#C89A66" />
      {/* 좌판 */}
      <rect x="7" y="17.5" width="18" height="4" rx="2" fill="#8A5A3B" />
      {/* 다리 */}
      <rect x="8.6" y="21" width="3" height="8" rx="1.4" fill="#5B4636" />
      <rect x="20.4" y="21" width="3" height="8" rx="1.4" fill="#5B4636" />
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

function IconCaffeine({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="12" width="16" height="14" rx="3" fill="#D4A76A" />
      <path d="M22 15 h3 a3 3 0 0 1 0 6 h-3" stroke="#B58956" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="6" y="26" width="16" height="2.5" rx="1.2" fill="#B58956" />
      <path d="M11 8 q1.5-4 3 0 M15 6 q1.5-4 3 0" stroke="#C9A860" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconAlcohol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="7" y="8" width="14" height="18" rx="3.5" fill="#F2C94C" />
      <rect x="7" y="14" width="14" height="12" rx="3.5" fill="#E8A830" />
      <ellipse cx="14" cy="14" rx="7" ry="1.5" fill="#F2D06B" />
      <path d="M21 13 h4 a3 3 0 0 1 0 6 h-4" stroke="#C9A227" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.5" fill="#F2D06B" opacity="0.6" />
      <circle cx="16" cy="21" r="1" fill="#F2D06B" opacity="0.5" />
    </svg>
  );
}

function IconSnacking({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="14" width="20" height="12" rx="4" fill="#E8C87D" />
      <path d="M6 18 h20" stroke="#D4A76A" strokeWidth="1.5" />
      <path d="M10 8 q0 6 3 6 M16 6 q0 8 3 8 M22 8 q0 6 -3 6" stroke="#C9A860" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconWater({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4 Q8 18 8 22 a8 8 0 0 0 16 0 Q24 18 16 4Z" fill="#7EC8E3" />
      <path d="M12 22 a5 5 0 0 0 8 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IconPhone({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="9" y="3" width="14" height="26" rx="3.5" fill="#9BB8D9" stroke="#6A8EB5" strokeWidth="1.2" />
      <rect x="11" y="6" width="10" height="17" rx="1.5" fill="#D6E6F5" />
      <circle cx="16" cy="26" r="1.5" fill="#6A8EB5" />
    </svg>
  );
}

function IconDriving({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="14" width="26" height="10" rx="4" fill="#8FC9A9" />
      <rect x="5" y="10" width="22" height="6" rx="3" fill="#6AAF88" />
      <rect x="6" y="16" width="6" height="4" rx="1" fill="#D6F0E2" />
      <rect x="20" y="16" width="6" height="4" rx="1" fill="#D6F0E2" />
      <circle cx="9" cy="25" r="2.5" fill="#5B4636" />
      <circle cx="23" cy="25" r="2.5" fill="#5B4636" />
    </svg>
  );
}

function IconShoes({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 20 Q5 14 10 12 L18 12 Q26 14 28 18 L28 22 Q28 24 26 24 L7 24 Q5 24 5 22 Z" fill="#9BB8D9" />
      <path d="M10 12 L18 12" stroke="#6A8EB5" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="18" r="1" fill="#D6E6F5" />
      <circle cx="17" cy="18" r="1" fill="#D6E6F5" />
      <circle cx="21" cy="19" r="1" fill="#D6E6F5" />
    </svg>
  );
}

function IconHeavyBag({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="8" y="12" width="16" height="16" rx="3.5" fill="#D98E8E" />
      <path d="M12 12 V8 a4 4 0 0 1 8 0 V12" stroke="#B56E6E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="14" y="17" width="4" height="5" rx="1.5" fill="#B56E6E" />
    </svg>
  );
}

function IconColdAir({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="3" x2="16" y2="29" stroke="#7EC8E3" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="3" y1="16" x2="29" y2="16" stroke="#7EC8E3" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6.8" y1="6.8" x2="25.2" y2="25.2" stroke="#7EC8E3" strokeWidth="2" strokeLinecap="round" />
      <line x1="25.2" y1="6.8" x2="6.8" y2="25.2" stroke="#7EC8E3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="#B5E4F0" />
    </svg>
  );
}

function IconStress({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="#F0C0A0" />
      <path d="M9.5 13 l5 3 M22.5 13 l-5 3" stroke="#8A5A3B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 22 q5 -4 10 0" stroke="#8A5A3B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M8 7 l2 2 M24 7 l-2 2" stroke="#E05C5C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconNervous({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="#F0D9B5" />
      <circle cx="11.5" cy="14" r="2.2" fill="#5B4636" />
      <circle cx="20.5" cy="14" r="2.2" fill="#5B4636" />
      <path d="M10 21 l2.5 1.5 L15 21 l2.5 1.5 L20 21 l2 1.5" stroke="#8A6A46" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDrained({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="8" y="5" width="16" height="24" rx="3" fill="#C9C4BC" stroke="#9B9489" strokeWidth="1.2" />
      <rect x="12" y="2" width="8" height="3" rx="1.5" fill="#9B9489" />
      <rect x="10.5" y="18" width="11" height="8" rx="1.5" fill="#E05C5C" />
    </svg>
  );
}

// 맵거나 짠 음식 — 빨간 고추
function IconSpicy({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M11 9 Q13 6 16 7 Q15 10 12 11" fill="#5FA85A" />
      <path d="M11.5 8.5 Q10 5 13 4" stroke="#4C8F48" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M12 10 Q22 12 23 22 Q23 28 17 27 Q9 25 9 15 Q9 11 12 10Z" fill="#E23B2E" />
      <path d="M14 14 Q19 16 20 22" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

// 달달 디저트 — 케이크 한 조각
function IconDessert({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M7 15 L16 7 L25 15 L21 26 L11 26 Z" fill="#F6D6A8" />
      <path d="M7 15 L16 18 L25 15 L21 26 L11 26 Z" fill="#F2C48A" />
      <path d="M7 15 L16 7 L25 15 L16 18 Z" fill="#E79ABF" />
      <circle cx="16" cy="5" r="2.2" fill="#E2554F" />
      <path d="M16 7 L16 10" stroke="#C7413C" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 소화 불량 — 초록빛으로 힘들어하는 얼굴
function IconIndigestion({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" fill="#8FCB9B" />
      <path d="M10 13 q1.5 2 3 0 M19 13 q1.5 2 3 0" stroke="#3F7A50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M11 21 q5 -3 10 0" stroke="#3F7A50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M23 9 q3 1 2 4" stroke="#6FB37F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// 생리함 — 생리 기록 달력에 빨간 물방울
function IconMenstrual({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="7" width="20" height="19" rx="4" fill="#F6DBE2" />
      <rect x="6" y="7" width="20" height="6" rx="4" fill="#E0607E" />
      <rect x="10" y="4.5" width="2.4" height="4" rx="1.2" fill="#C74C6B" />
      <rect x="19.6" y="4.5" width="2.4" height="4" rx="1.2" fill="#C74C6B" />
      <path d="M16 14 Q12 19.5 12 22 a4 4 0 0 0 8 0 Q20 19.5 16 14Z" fill="#DA3A5A" />
      <path d="M14 21.5 a2.5 2.5 0 0 0 4 0" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

// 영양제 — 초록 영양제 통에 흰 십자
function IconSupplement({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="11" y="3.5" width="10" height="4.2" rx="1.6" fill="#5E8A54" />
      <rect x="9" y="7.5" width="14" height="21" rx="4.5" fill="#8FCB78" />
      <rect x="9" y="12" width="14" height="16.5" rx="0" fill="#7BBB63" style={{ clipPath: "inset(0 0 0 0 round 0 0 4.5px 4.5px)" }} />
      <path d="M16 15 v6.5 M12.75 18.25 h6.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPeriod({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 5 Q9 16 9 21 a7 7 0 0 0 14 0 Q23 16 16 5Z" fill="#E88A8A" />
      <path d="M13 20 a4 4 0 0 0 6 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function IconMedicine({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="10" width="20" height="12" rx="6" fill="#ADA6C4" />
      <rect x="16" y="10" width="10" height="12" rx="0" fill="#8A7FB0" style={{ clipPath: "inset(0 0 0 0 round 0 6px 6px 0)" }} />
      <line x1="16" y1="10" x2="16" y2="22" stroke="#7A6FA0" strokeWidth="1.5" />
      <line x1="10" y1="14" x2="10" y2="18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <line x1="8" y1="16" x2="12" y2="16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
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
  caffeine: IconCaffeine, alcohol: IconAlcohol, snacking: IconSnacking, water: IconWater,
  spicy: IconSpicy, dessert: IconDessert, indigestion: IconIndigestion, supplement: IconSupplement,
  phone: IconPhone, driving: IconDriving, shoes: IconShoes, heavyBag: IconHeavyBag,
  coldAir: IconColdAir, stress: IconStress, nervous: IconNervous, drained: IconDrained,
  period: IconPeriod, menstrual: IconMenstrual, medicine: IconMedicine,
};

export function DiaryIcon({ name, size = 28, color }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} {...(color ? { color } : {})} />;
}
