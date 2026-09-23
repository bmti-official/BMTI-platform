// 주간 '각도기록' 알림 — 이번 주에 아직 안 잰 사람에게만 한 번 보낸다.
//
// Supabase Edge Function. 매주 한 번 pg_cron이 부른다.
// 필요한 값(Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC · VAPID_PRIVATE · VAPID_SUBJECT
//
// web-push 는 Node용이라 esm.sh 로 받으면 Deno에서 터진다.
// npm: 로 받아야 Supabase가 Node 흉내를 내 준다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// 이번 주의 일요일 — posture_checks.week 와 같은 기준으로 센다.
function thisSunday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  // 무슨 일이 있어도 까닭을 글로 돌려준다. 그래야 밖에서 원인을 알 수 있다.
  const out = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const pub = Deno.env.get('VAPID_PUBLIC');
    const priv = Deno.env.get('VAPID_PRIVATE');
    const subj = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@bmti-official.co.kr';
    const missing = [!pub && 'VAPID_PUBLIC', !priv && 'VAPID_PRIVATE'].filter(Boolean);
    if (missing.length) return out({ error: '비밀값이 없습니다', missing }, 500);

    webpush.setVapidDetails(subj, pub!, priv!);

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const week = thisSunday();
    const [subs, done, on] = await Promise.all([
      db.from('push_subscriptions').select('endpoint, user_id, p256dh, auth, fail_count'),
      db.from('posture_checks').select('user_id').eq('week', week),
      db.from('users').select('id').eq('push_weekly', true),
    ]);
    const bad = [subs.error, done.error, on.error].filter(Boolean)[0];
    if (bad) return out({ error: '표를 읽지 못했습니다', detail: bad.message }, 500);

    const already = new Set((done.data ?? []).map((r) => r.user_id));
    const wants = new Set((on.data ?? []).map((r) => r.id));
    const targets = (subs.data ?? []).filter((s) => wants.has(s.user_id) && !already.has(s.user_id));

    const body = JSON.stringify({
      title: '이번 주 각도기록, 아직이에요',
      body: '1분이면 끝나요. 지난주보다 얼마나 달라졌는지 볼까요?',
      url: '/?go=angle',
      tag: 'weekly-angle',
    });

    let sent = 0;
    let gone = 0;
    const fails: string[] = [];
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
          fails.push(String((e as Error)?.message ?? e).slice(0, 120));
          await db.from('push_subscriptions')
            .update({ fail_count: (s.fail_count ?? 0) + 1 })
            .eq('endpoint', s.endpoint);
        }
      }
    }
    return out({ ok: true, week, targets: targets.length, sent, gone, fails });
  } catch (e) {
    return out({ error: '함수가 터졌습니다', detail: String((e as Error)?.message ?? e) }, 500);
  }
});
