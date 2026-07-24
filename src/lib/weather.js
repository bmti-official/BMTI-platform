// 날씨 붙이기 — 위치를 한 번 허용받아, 기록한 날짜의 날씨를 Open-Meteo(무료·키 불필요)에서
// 가져와 일기에 첨부한다. '비/습한 날 유독 불편'처럼 기분·불편함과 겹쳐 보기 위함.
const GEO_KEY = 'bmti_geo';

export function getSavedGeo() {
  try { return JSON.parse(localStorage.getItem(GEO_KEY) || 'null'); } catch { return null; }
}

export function requestGeo() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('geolocation-unsupported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3) };
        try { localStorage.setItem(GEO_KEY, JSON.stringify(g)); } catch {}
        resolve(g);
      },
      (err) => reject(err),
      { timeout: 10000, maximumAge: 3600000 }
    );
  });
}

// 날짜 범위(YYYY-MM-DD)의 일별 날씨 맵을 가져온다. { [date]: {code,tmax,tmin,precip,humidity} }
export async function fetchWeatherRange(lat, lon, startISO, endISO) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&hourly=relative_humidity_2m&timezone=auto&start_date=${startISO}&end_date=${endISO}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather-fetch-failed');
  const j = await res.json();
  const map = {};
  const d = j.daily;
  if (d && d.time) {
    for (let i = 0; i < d.time.length; i++) {
      map[d.time[i]] = {
        code: d.weathercode?.[i] ?? null,
        tmax: d.temperature_2m_max?.[i] ?? null,
        tmin: d.temperature_2m_min?.[i] ?? null,
        precip: d.precipitation_sum?.[i] ?? null,
      };
    }
  }
  const h = j.hourly;
  if (h && h.time && h.relative_humidity_2m) {
    const byDate = {};
    for (let i = 0; i < h.time.length; i++) {
      const date = h.time[i].slice(0, 10);
      (byDate[date] ||= []).push(h.relative_humidity_2m[i]);
    }
    for (const [date, arr] of Object.entries(byDate)) {
      if (map[date] && arr.length) map[date].humidity = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
  }
  return map;
}
