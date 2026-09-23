// Live "Helderberg today" data for the homepage: weather + local news.
//
// Weather: MET Norway Locationforecast (free, commercial use allowed as long as
//          we send a descriptive User-Agent, cache responses and credit MET Norway).
// News:    DistrictMail & Helderberg Gazette public RSS feed. Headlines + links only,
//          always attributed and linked back to the original article.
//
// Both sources are cached and fail soft: if one is down the homepage simply hides
// that panel instead of erroring.

export type WxKind = 'sun' | 'moon' | 'partly' | 'cloud' | 'fog' | 'rain' | 'storm'

export type WxDay = {
  date: string // YYYY-MM-DD, South African time
  kind: WxKind
  label: string
  max: number // deg C
  min: number // deg C
  rainMm: number // daytime (06:00-18:00) rainfall
  windMax: number // daytime peak wind, km/h
}

export type Weather = {
  now: { temp: number; wind: number; humidity: number; kind: WxKind; label: string }
  workDay: WxDay // the day the "outdoor work" panel is about
  workDayIsToday: boolean // false once it is late afternoon: we then show tomorrow
  next: WxDay[] // the three days after workDay
}

export type TradeCall = { trade: string; go: boolean; note: string }

export type NewsItem = { title: string; url: string; date: string | null }

// Helderberg centre (Somerset West). Rounded to 2 decimals as MET Norway asks.
const WEATHER_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-34.09&lon=18.84'
const NEWS_FEED = 'https://novanews.co.za/districtmailhelderberg/feed/'
export const NEWS_HOME = 'https://novanews.co.za/districtmailhelderberg/news/'

// MET Norway requires a User-Agent that identifies the site.
const USER_AGENT = 'NGSMS-Website/1.0 (+https://www.nextgensolarmaintenance.co.za)'

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000 // South Africa has no daylight saving

/* ------------------------------------------------------------------ */
/* Weather                                                             */
/* ------------------------------------------------------------------ */

type MetEntry = {
  time: string
  data?: {
    instant?: { details?: { air_temperature?: number; relative_humidity?: number; wind_speed?: number } }
    next_1_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } }
    next_6_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } }
    next_12_hours?: { summary?: { symbol_code?: string } }
  }
}

export function symbolInfo(code: string): { kind: WxKind; label: string } {
  const night = /_night$/.test(code)
  const c = code.replace(/_(day|night|polartwilight)$/, '')
  if (c.includes('thunder')) return { kind: 'storm', label: 'Thunderstorms' }
  if (c.includes('snow')) return { kind: 'rain', label: 'Snow' }
  if (c.includes('sleet')) return { kind: 'rain', label: 'Sleet' }
  if (c.includes('rain')) {
    const showers = c.includes('showers')
    if (c.startsWith('heavy')) return { kind: 'rain', label: showers ? 'Heavy showers' : 'Heavy rain' }
    if (c.startsWith('light')) return { kind: 'rain', label: showers ? 'Light showers' : 'Light rain' }
    return { kind: 'rain', label: showers ? 'Showers' : 'Rain' }
  }
  if (c === 'fog') return { kind: 'fog', label: 'Fog' }
  if (c === 'clearsky') return { kind: night ? 'moon' : 'sun', label: 'Clear' }
  if (c === 'fair') return { kind: night ? 'moon' : 'sun', label: 'Mostly clear' }
  if (c === 'partlycloudy') return { kind: night ? 'cloud' : 'partly', label: 'Partly cloudy' }
  if (c === 'cloudy') return { kind: 'cloud', label: 'Overcast' }
  return { kind: 'cloud', label: 'Cloudy' }
}

function toLocal(iso: string): { date: string; hour: number } | null {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const d = new Date(t + SAST_OFFSET_MS)
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() }
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Turns MET Norway's hourly/6-hourly series into "now" + per-day summaries.
export function buildWeather(series: MetEntry[]): Weather | null {
  if (!Array.isArray(series) || series.length === 0) return null

  const first = series[0]
  const d0 = first?.data?.instant?.details
  const nowLocal = toLocal(first?.time)
  if (!d0 || typeof d0.air_temperature !== 'number' || !nowLocal) return null

  const nowInfo = symbolInfo(
    first.data?.next_1_hours?.summary?.symbol_code ?? first.data?.next_6_hours?.summary?.symbol_code ?? 'cloudy',
  )

  const byDate = new Map<string, { entry: MetEntry; hour: number }[]>()
  series.forEach((entry) => {
    const l = toLocal(entry?.time)
    if (!l) return
    const list = byDate.get(l.date)
    if (list) list.push({ entry, hour: l.hour })
    else byDate.set(l.date, [{ entry, hour: l.hour }])
  })

  const days: WxDay[] = []
  byDate.forEach((list, date) => {
    let max = -Infinity
    let min = Infinity
    let rain = 0
    let wind = 0
    let symbol: string | undefined
    let symbolDistance = Infinity

    list.forEach(({ entry, hour }) => {
      const det = entry.data?.instant?.details
      if (typeof det?.air_temperature === 'number') {
        max = Math.max(max, det.air_temperature)
        min = Math.min(min, det.air_temperature)
      }
      // Work happens in daylight: only count 06:00-17:59 for rain and wind.
      if (hour >= 6 && hour <= 17) {
        // Hourly steps early in the forecast, 6-hourly steps later on.
        const mm = entry.data?.next_1_hours?.details?.precipitation_amount ?? entry.data?.next_6_hours?.details?.precipitation_amount
        if (typeof mm === 'number') rain += mm
        if (typeof det?.wind_speed === 'number') wind = Math.max(wind, det.wind_speed * 3.6)
      }
      // Day summary icon: the 12-hour outlook closest to 08:00.
      const s = entry.data?.next_12_hours?.summary?.symbol_code
      if (s && Math.abs(hour - 8) < symbolDistance) {
        symbol = s
        symbolDistance = Math.abs(hour - 8)
      }
    })

    if (!Number.isFinite(max) || !Number.isFinite(min)) return
    const info = symbolInfo(symbol ?? 'cloudy')
    days.push({
      date,
      kind: info.kind,
      label: info.label,
      max: Math.round(max),
      min: Math.round(min),
      rainMm: round1(rain),
      windMax: Math.round(wind),
    })
  })

  // After 15:00 the rest of "today" is not much use for planning: show tomorrow.
  const workIdx = nowLocal.hour >= 15 ? 1 : 0
  const workDay = days[workIdx]
  if (!workDay) return null

  return {
    now: {
      temp: Math.round(d0.air_temperature),
      wind: Math.round((d0.wind_speed ?? 0) * 3.6),
      humidity: Math.round(d0.relative_humidity ?? 0),
      kind: nowInfo.kind,
      label: nowInfo.label,
    },
    workDay,
    workDayIsToday: workIdx === 0,
    next: days.slice(workIdx + 1, workIdx + 4),
  }
}

// Can the crew work outside on this day? Rough rules of thumb for Cape weather.
export function tradeConditions(d: WxDay): TradeCall[] {
  const wet = d.rainMm >= 1
  const stormy = d.kind === 'storm'

  const paint: TradeCall = wet || stormy
    ? { trade: 'Painting', go: false, note: 'Rain risk' }
    : d.windMax >= 45
      ? { trade: 'Painting', go: false, note: 'Too windy' }
      : { trade: 'Painting', go: true, note: 'Dry and workable' }

  const wp: TradeCall = wet || stormy
    ? { trade: 'Waterproofing', go: false, note: 'Rain risk' }
    : { trade: 'Waterproofing', go: true, note: 'Dry' }

  const paving: TradeCall = wet || stormy
    ? { trade: 'Paving', go: false, note: 'Rain risk' }
    : { trade: 'Paving', go: true, note: 'Dry' }

  const solar: TradeCall = stormy
    ? { trade: 'Solar panel cleaning', go: false, note: 'Storm risk' }
    : d.windMax >= 40
      ? { trade: 'Solar panel cleaning', go: false, note: 'Too windy' }
      : d.rainMm >= 3
        ? { trade: 'Solar panel cleaning', go: false, note: 'Wet roofs' }
        : { trade: 'Solar panel cleaning', go: true, note: 'Good conditions' }

  return [solar, paint, wp, paving]
}

export async function getWeather(): Promise<Weather | null> {
  try {
    const res = await fetch(WEATHER_URL, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return buildWeather(json?.properties?.timeseries)
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* News                                                                */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function fromCode(n: number, fallback: string): string {
  try {
    return String.fromCodePoint(n)
  } catch {
    return fallback
  }
}

function decodeXml(s: string): string {
  return s
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (m, h: string) => fromCode(parseInt(h, 16), m))
    .replace(/&#(\d+);/g, (m, d: string) => fromCode(parseInt(d, 10), m))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_m, n: string) => ENTITIES[n])
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>'))
  return m ? decodeXml(m[1]) : ''
}

function safeHttps(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

export function parseFeed(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const block = m[1]
    const title = tag(block, 'title')
    const url = safeHttps(tag(block, 'link'))
    if (!title || !url) continue
    const t = Date.parse(tag(block, 'pubDate'))
    items.push({ title, url, date: Number.isNaN(t) ? null : new Date(t).toISOString() })
  }
  return items
}

// This is a business homepage: keep the feed to community / everyday news and
// leave out crime, deaths and court stories.
const HIDE_HEADLINE =
  /\b(murder\w*|kill\w*|shot|shoot\w*|stab\w*|rape\w*|assault\w*|dead|deaths?|dies|died|fatal\w*|crash\w*|gang|robber\w*|hijack\w*|burglar\w*|arrest\w*|abduct\w*|kidnap\w*|missing|suicide|abus\w*|court|charged|sentenc\w*|drown\w*|victims?|moord\w*|vermoor\w*|doodgeskiet|geskiet|oorlede|inbraak|gearresteer\w*|verkrag\w*|ongeluk\w*)\b|body found|bodies found|found dead|found alive|baby found/i

export function filterNews(items: NewsItem[], limit: number): NewsItem[] {
  return items.filter((n) => !HIDE_HEADLINE.test(n.title)).slice(0, limit)
}

export async function getNews(limit = 4): Promise<NewsItem[]> {
  try {
    const res = await fetch(NEWS_FEED, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    return filterNews(parseFeed(await res.text()), limit)
  } catch {
    return []
  }
}
