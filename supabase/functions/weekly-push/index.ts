// 주간 '각도기록' 알림 — 이번 주에 아직 안 잰 사람에게만 한 번 보낸다.
//
// Supabase Edge Function. 매주 한 번 pg_cron이 부른다.
// 필요한 값(Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC   공개키
//   VAPID_PRIVATE  비밀키
//   VAPID_SUBJECT  mailto:보낼사람@주소
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@bmti-official.co.kr',
  Deno.env.get('VAPID_PUBLIC')!,
  Deno.env.get('VAPID_PRIVATE')!,
);

// 이번 주의 일요일 — posture_checks.week 와 같은 기준으로 센다.
function thisSunday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const week = thisSunday();

  // 알림을 켠 사람 · 이번 주에 이미 잰 사람
  const [{ data: subs }, { data: done }] = await Promise.all([
    db.from('push_subscriptions').select('endpoint, user_id, p256dh, auth, fail_count'),
    db.from('posture_checks').select('user_id').eq('week', week),
  ]);
  const already = new Set((done ?? []).map((r) => r.user_id));

  const { data: on } = await db.from('users').select('id').eq('push_weekly', true);
  const wants = new Set((on ?? []).map((r) => r.id));

  const targets = (subs ?? []).filter((s) => wants.has(s.user_id) && !already.has(s.user_id));

  const body = JSON.stringify({
    title: '이번 주 각도기록, 아직이에요',
    body: '1분이면 끝나요. 지난주보다 얼마나 달라졌는지 볼까요?',
    url: '/?go=angle',
    tag: 'weekly-angle',
  });

  let sent = 0;
  let gone = 0;
  for (const s of targets) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
      sent += 1;
      await db.from('push_subscriptions')
        .update({ last_ok_at: new Date().toISOString(), fail_count: 0 })
        .eq('endpoint', s.endpoint);
    } catch (e) {
      // 404·410이면 그 기기는 사라진 것이다. 바로 지운다.
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        gone += 1;
      } else {
        await db.from('push_subscriptions')
          .update({ fail_count: (s.fail_count ?? 0) + 1 })
          .eq('endpoint', s.endpoint);
      }
    }
  }

  return new Response(JSON.stringify({ week, targets: targets.length, sent, gone }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
