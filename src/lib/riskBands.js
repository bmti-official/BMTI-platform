// 초록 → 노랑 → 빨강. 기분·불편함 추이에서 쓰던 규칙을 한 곳에 모았다.
// 같은 뜻의 색이 화면마다 달라지면 읽는 사람이 매번 다시 배워야 한다.
export const RISK_BANDS = [
  { upto: 0.34, from: '#C7E7C3', to: '#A5D6A0', text: '#5E9463' },
  { upto: 0.67, from: '#F7D879', to: '#E9BC44', text: '#9A7A16' },
  { upto: 1.01, from: '#F0917C', to: '#E0554F', text: '#B23B36' },
];
export const riskBand = (ratio) => RISK_BANDS.find((b) => (Number(ratio) || 0) <= b.upto) || RISK_BANDS[2];
export const riskFill = (ratio) => { const b = riskBand(ratio); return `linear-gradient(180deg,${b.from},${b.to})`; };
