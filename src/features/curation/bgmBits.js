// 배경음악이 함께 쓰는 값 — 크기 다섯 칸, 곡이 올라와 있는지.
import { voiceKey, BGM_PARTS, bgmN } from './voiceCommon';

// 음악은 멘트를 덮지 않을 만큼만. 처음 크기는 작게 두고 손님이 올릴 수 있게 한다.
export const VOL_STEPS = [0.06, 0.12, 0.18, 0.26, 0.36];
export const VOL_START = 1;                 // 처음은 두 번째 칸

/** 이 곡의 도막이 하나라도 올라와 있는가 */
export const hasSong = (common, n) => BGM_PARTS.some((b) => common[voiceKey('bgm', 'a', bgmN(n, b.p))]);
