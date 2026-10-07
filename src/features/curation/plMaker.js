// 회원이 올린 바디플리의 만든 사람 — 유형 캐릭터와(고른 사람만) 닉네임.
//
// 올릴 때 서버가 author_code·author_nick을 적어 둔다(52_my_pli.sql).
// 공식 플리에는 둘 다 없으니 아무것도 붙이지 않는다.
import { CHARACTERS } from '../../data';
import { axisOf } from './typeTint';

const NICK_MAX = 8;

/** { img, nick } 또는 null */
export function plMaker(r = {}) {
  if (!r.author_code) return null;
  const img = CHARACTERS.find((c) => c.id === axisOf(r.author_code))?.image || '';
  const n = String(r.author_nick || '').trim();
  const nick = n.length > NICK_MAX ? `${n.slice(0, NICK_MAX)}…` : n;
  return img || nick ? { img, nick } : null;
}
