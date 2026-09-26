// 각도 재는 화면의 참고 그림 — 휴대폰 두는 법, 자세 준비 그림, 동작 짧은 영상.
//
// 글만으로는 '어디에 두고, 어떻게 서고, 무엇을 하라는지'가 잘 안 그려진다. 각도별 그림 모음과
// 같은 3D 인물로 바른 자세만 보여 준다(나쁜 자세를 보여 주면 따라 한다).
// app_assets 한 칸에 하나씩(url). 휴대폰 두는 법만 성별 공통.
export const REF_ITEMS = [
  { name: 'phone', label: '휴대폰 두는 법', where: '첫 화면 (4:3 영상)', common: true, video: true },
  { name: 'side', label: '옆으로 서기', where: '옆모습 단계 설명 옆' },
  { name: 'sit', label: '옆으로 앉기', where: '목만 잴 때 단계 설명 옆' },
  { name: 'front', label: '정면 서기', where: '앞모습 단계 설명 옆' },
  { name: 'trunk', label: '허리 굽혔다 펴기', where: '허리 잴 때 카메라 화면 구석', video: true },
  { name: 'arm', label: '두 팔 올렸다 내리기', where: '팔 잴 때 카메라 화면 구석', video: true },
];
export const refKey = (name, gender) => (REF_ITEMS.find((x) => x.name === name)?.common
  ? `angle_ref_${name}` : `angle_ref_${name}_${gender}`);
export const allRefKeys = () => REF_ITEMS.flatMap((x) => (x.common
  ? [refKey(x.name)] : ['female', 'male'].map((g) => refKey(x.name, g))));
/** 불러온 칸들에서 주소 하나 */
export const refUrl = (assets, name, gender) => assets?.[refKey(name, gender)]?.url || null;
