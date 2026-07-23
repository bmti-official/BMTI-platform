// 하루일기 입력 폼(한글 라벨) ↔ 말랑이의 발견 리포트 엔진(mallangReportEngine.js, 영문 key) 간 변환표.
// DiaryWriteFlow(저장할 때 라벨→key)와 DiaryCalendar(미리보기에서 key→라벨)가 같은 표를 써야
// 저장·미리보기·수정 폼 복원이 서로 어긋나지 않는다.

export const SLEEP_LABELS = ["밤을 새웠어요", "뒤척였어요", "그냥 그랬어요", "푹 잤어요"]; // index = engine sleep(0~3)
export const SLEEP_ICON = ["allNighter", "toss", "mehMoon", "sleepWell"]; // index = engine sleep(0~3), DiaryIcons.jsx의 이름과 매칭

export const OVEREXERT_LOAD_KEY = { "오래 앉음": "sit", "오래 선 자세": "stand", "많이 걸음": "walk", "무거운 물건 들기": "lift" };
export const EXERCISE_REASON_KEY = { "바빴어요": "busy", "피곤해요": "tired", "몸이 안 좋아요": "sick", "그냥 쉬고 싶었어요": "rest", "깜빡했어요": "forgot" };
export const PART_KEY = { "머리": "head", "목": "neck", "어깨": "shoulder", "팔꿈치": "elbow", "손목": "wrist", "등": "back", "복부": "abdomen", "허리": "waist", "골반": "pelvis", "무릎": "knee", "발목": "ankle", "기타": "etc" };
export const WHEN_KEY = { "오늘 아침 일어날 때": "morning", "움직일 때": "moving", "오래 앉아있을 때": "sitting", "오래 서있을 때": "standing", "하루 종일": "allday" };
export const EXERCISE_TYPE_KEY = {
  "헬스·PT": "gym", "요가": "yoga", "필라테스": "pilates", "스트레칭": "stretch", "명상·호흡": "meditation", "수영": "swim",
  "걷기/산책": "walk", "러닝·조깅": "run", "자전거": "bike", "등산": "hike",
  "축구": "soccer", "농구": "basketball", "배드민턴": "badminton", "테니스": "tennis", "크로스핏": "crossfit", "댄스": "dance",
};

const invert = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
export const LOAD_TO_OVEREXERT_LABEL = invert(OVEREXERT_LOAD_KEY);
export const REASON_TO_EXERCISE_LABEL = invert(EXERCISE_REASON_KEY);
export const KEY_TO_PART_LABEL = invert(PART_KEY);
export const KEY_TO_WHEN_LABEL = invert(WHEN_KEY);
export const KEY_TO_EXERCISE_TYPE_LABEL = invert(EXERCISE_TYPE_KEY);
