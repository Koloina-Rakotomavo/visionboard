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

export function normalizeRecord(record) {
  const mode = cleanCategory(record.viewing_mode)
  const key = mode.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const company = cleanCategory(record.company)
  const platform = cleanCategory(record.platform)
  return {
    ...record,
    viewing_mode: ({ cinema: 'Cinéma', streaming: 'Streaming', television: 'Télévision', autre: 'Autre' })[key] ?? mode,
    company: ({ seule: 'Seule', ensemble: 'Accompagnée', date: 'En date', 'seule/ensemble': 'Mixte' })[company.toLowerCase()] ?? company,
    platform: /^(amazon|amazone) prime$/i.test(platform) ? 'Amazon Prime' : platform,
    premium: ({ oui: 'Premium', non: 'Standard' })[cleanCategory(record.premium).toLowerCase()] ?? UNKNOWN,
  }
}

export function categorySummary(records, field) {
  const groups = groupCounts(records, field).filter(group => group.label !== UNKNOWN)
  const known = groups.reduce((sum, group) => sum + group.count, 0)
  return { groups, known, missing: records.length - known, total: records.length }
}

export function annualCounts(records) {
  const known = records.map(record => ({ year: watchedYear(record.watched_date) })).filter(record => record.year)
  return groupCounts(known, 'year').sort((a, b) => a.label.localeCompare(b.label))
}
