export const UNKNOWN = 'Non renseigné'

export function cleanCategory(value) {
  const text = String(value ?? '').trim()
  return !text || text.startsWith('#') ? UNKNOWN : text
}

export function watchedYear(value) {
  const text = String(value ?? '').trim()
  if (/^\d{4}$/.test(text)) return text
  const iso = text.match(/^(\d{4})-\d{2}-\d{2}$/)
  const french = text.match(/^\d{2}\/\d{2}\/(\d{4})$/)
  return iso?.[1] ?? french?.[1] ?? null
}

export function groupCounts(records, field) {
  const counts = new Map()
  for (const record of records) {
    const category = cleanCategory(record[field])
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return [...counts].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'))
}

export function summarize(records) {
  const durations = records.filter(r => Number.isFinite(r.duration_minutes) && r.duration_minutes > 0)
  return {
    sessions: records.length,
    films: new Set(records.map(r => `${r.title.trim().toLocaleLowerCase('fr-FR')}::${r.release_year ?? ''}`)).size,
    minutes: durations.reduce((sum, r) => sum + r.duration_minutes, 0),
    knownDurations: durations.length,
    unknownYears: records.filter(r => !watchedYear(r.watched_date)).length,
  }
}
