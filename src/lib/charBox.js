// 누끼 캐릭터 그림마다 빈 여백이 달라 같은 상자에 넣으면 크기가 들쭉날쭉하다.
// 그림 파일의 실제 그림 영역(알파 기준)을 미리 재어 두고, 그 영역의 '키'를 맞춰 세운다.
//   ar   = 그림 영역의 가로/세로 비
//   top  · left = 그림 영역이 파일 안에서 시작하는 위치(0~1)
//   size = 그림 영역의 키를 1로 만들 때 그림 파일 전체의 배율
export const CHAR_BOX = {
  ACDM: { ar: 0.982, top: 0.04, left: 0.0475, size: 1.087 },
  ACDZ: { ar: 1.381, top: 0.1675, left: 0.0408, size: 1.5038 },
  ACQM: { ar: 0.743, top: 0.04, left: 0.1592, size: 1.0879 },
  ACQZ: { ar: 1.394, top: 0.17, left: 0.04, size: 1.5152 },
  ALDM: { ar: 1.235, top: 0.1283, left: 0.0408, size: 1.3453 },
  ALDZ: { ar: 0.988, top: 0.0409, left: 0.0464, size: 1.0891 },
  ALQM: { ar: 1.242, top: 0.13, left: 0.04, size: 1.3514 },
  ALQZ: { ar: 0.992, top: 0.04, left: 0.0442, size: 1.0879 },
  OCDM: { ar: 1.173, top: 0.1083, left: 0.04, size: 1.2766 },
  OCDZ: { ar: 1.383, top: 0.1667, left: 0.04, size: 1.5 },
  OCQM: { ar: 0.877, top: 0.04, left: 0.0967, size: 1.087 },
  OCQZ: { ar: 1.35, top: 0.1592, left: 0.0408, size: 1.4706 },
  OLDM: { ar: 1.538, top: 0.2008, left: 0.04, size: 1.6713 },
  OLDZ: { ar: 1.368, top: 0.1642, left: 0.04, size: 1.4888 },
  OLQM: { ar: 0.811, top: 0.0407, left: 0.1274, size: 1.0887 },
  OLQZ: { ar: 0.881, top: 0.0405, left: 0.0954, size: 1.0881 },
};

export const charBox = (code) => CHAR_BOX[String(code || '').toUpperCase()] || null;
