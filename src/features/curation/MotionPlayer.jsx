// 동작 데이터를 막대인간으로 반복 재생한다.
// 캐릭터 파츠가 준비되면 이 부품 안쪽만 그림으로 바꾸면 된다.
import { useEffect, useRef, useState } from 'react';
import { poseAt, LINKS, fitMotion } from '../../lib/motionPose';
import { checkMotion } from '../../lib/motionPose';

export default function MotionPlayer({ motion, size = 320, bg = '#F6F4EF', color = '#9C6F26', head = '#D9B96A', playing = true }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!motion || !playing) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % motion.frames), 1000 / (motion.fps || 12));
    return () => clearInterval(id);
  }, [motion, playing]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !motion) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    const fit = fitMotion(motion, c.width, c.height);
    const p = poseAt(motion, Math.min(i, motion.frames - 1));
    const T = (q) => [fit.ox + q.x * fit.s, fit.oy + q.y * fit.s];
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(4, fit.s * 0.11); ctx.lineCap = 'round';
    for (const [a, b] of LINKS) { ctx.beginPath(); ctx.moveTo(...T(p[a])); ctx.lineTo(...T(p[b])); ctx.stroke(); }
    const [hx, hy] = T(p.head);
    ctx.fillStyle = head; ctx.beginPath(); ctx.arc(hx, hy, Math.max(9, fit.s * 0.26), 0, 7); ctx.fill();
  }, [motion, i, bg, color, head]);

  if (!motion) return null;
  return <canvas ref={ref} width={size} height={size} style={{ width: '100%', maxWidth: size, aspectRatio: '1 / 1', display: 'block', borderRadius: 12 }} />;
}

/**
 * 동작 데이터 주소만 주면 읽어 와서 돌려 준다.
 * 읽지 못하면 아무것도 그리지 않는다(글은 그대로 보인다).
 */
export function MotionFromUrl({ url, ...rest }) {
  const [motion, setMotion] = useState(null);
  useEffect(() => {
    let alive = true;
    (url ? fetch(url) : Promise.reject(new Error('없음')))
      .then((r) => r.json())
      .then((m) => { if (alive) setMotion(checkMotion(m) ? null : m); })
      .catch(() => { if (alive) setMotion(null); });
    return () => { alive = false; };
  }, [url]);
  if (!motion) return null;
  return <MotionPlayer motion={motion} {...rest} />;
}
