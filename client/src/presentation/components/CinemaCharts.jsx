import { annualCounts, categorySummary } from './cinemaStats'

const COLORS = ['#826400', '#293b53', '#677a69', '#79647d', '#6e6e6e']
const percent = (value, total) => total ? Math.round(value / total * 100) : 0

function Coverage({ known, total, missing }) {
  return <p className="sheet-caption sheet-coverage">{known} / {total} visionnages renseignés · {missing} sans information</p>
}

function Legend({ groups, known }) {
  return <ul className="sheet-legend">{groups.map(({ label, count }, index) =>
    <li key={label}><span className="sheet-swatch" style={{ background: COLORS[index % COLORS.length] }} aria-hidden="true" /><span>{label}</span><strong>{count} <small>{percent(count, known)} %</small></strong></li>
  )}</ul>
}

function ChartCard({ eyebrow, title, children, className = '' }) {
  return <article className={`sheet-chart ${className}`}><p className="sheet-chart-eyebrow">{eyebrow}</p><h3>{title}</h3>{children}</article>
}

function ModeDonut({ records }) {
  const data = categorySummary(records, 'viewing_mode')
  const stops = data.groups.map(({ count }, i) => {
    const start = data.groups.slice(0, i).reduce((sum, group) => sum + group.count, 0) / data.known * 100
    const end = start + count / data.known * 100
    return `${COLORS[i % COLORS.length]} ${start}% ${end}%`
  })
  return <ChartCard eyebrow="01 / Supports" title="Grand écran ou canapé ?">
    {data.known ? <div className="sheet-donut-layout">
      <div className="sheet-donut" style={{ background: `conic-gradient(${stops.join(',')})` }} aria-hidden="true"><div><strong>{data.known}</strong><span>séances connues</span></div></div>
      <Legend {...data} />
    </div> : <p className="sheet-empty">Aucun support renseigné pour cette sélection.</p>}
    <Coverage {...data} />
  </ChartCard>
}

function CompanySplit({ records }) {
  const data = categorySummary(records, 'company')
  return <ChartCard eyebrow="02 / Compagnie" title="Le cinéma, ça se partage">
    {data.known ? <>
      <div className="sheet-split" aria-hidden="true">{data.groups.map(({ label, count }, i) => <span key={label} style={{ width: `${count / data.known * 100}%`, background: COLORS[i % COLORS.length] }}>{count / data.known >= .12 ? `${percent(count, data.known)} %` : ''}</span>)}</div>
      <Legend {...data} />
    </> : <p className="sheet-empty">Aucun accompagnement renseigné.</p>}
    <Coverage {...data} />
  </ChartCard>
}

function YearColumns({ records, year, onYearChange }) {
  const groups = annualCounts(records)
  const maximum = Math.max(1, ...groups.map(group => group.count))
  const known = groups.reduce((sum, group) => sum + group.count, 0)
  return <ChartCard eyebrow="Au fil du temps" title="Mes années de cinéma" className="sheet-chart--timeline">
    <p className="sheet-caption">Nombre de visionnages par année · touche une colonne pour filtrer le dashboard.</p>
    {groups.length ? <div className="sheet-columns-scroll"><div className="sheet-columns" style={{ '--column-count': groups.length }}>
      <div className="sheet-axis" aria-hidden="true"><span>{maximum}</span><span>{Math.round(maximum / 2)}</span><span>0</span></div>
      {groups.map(({ label, count }) => <button type="button" className="sheet-column" key={label} aria-pressed={year === label} onClick={() => onYearChange(year === label ? 'all' : label)} aria-label={`${label} : ${count} visionnages. Filtrer cette année.`}>
        <span className="sheet-column-plot"><span className="sheet-column-fill" style={{ height: `${count / maximum * 100}%` }}><strong>{count}</strong></span></span><span className="sheet-column-label">{label}</span>
      </button>)}
    </div></div> : <p className="sheet-empty">Aucune année de visionnage renseignée.</p>}
    <p className="sheet-caption">Vue d’ensemble de toutes les années · {known} séances datées, {records.length - known} sans année. Année en cours potentiellement incomplète.</p>
  </ChartCard>
}

function PlatformRanking({ records }) {
  const streaming = records.filter(record => record.viewing_mode === 'Streaming')
  const data = categorySummary(streaming, 'platform')
  const maximum = Math.max(1, ...data.groups.map(group => group.count))
  return <ChartCard eyebrow="03 / Streaming" title="Mes plateformes préférées">
    {data.known ? <ol className="sheet-ranking">{data.groups.map(({ label, count }, i) => <li key={label}>
      <span className="sheet-rank">{String(i + 1).padStart(2, '0')}</span><div><div className="sheet-rank-label"><span>{label}</span><strong>{count}</strong></div><div className="sheet-bar-track" aria-hidden="true"><span style={{ width: `${count / maximum * 100}%` }} /></div></div>
    </li>)}</ol> : <p className="sheet-empty">Aucune plateforme renseignée pour les séances en streaming.</p>}
    <p className="sheet-caption">Nombre de visionnages en streaming · échelle à partir de zéro.</p><Coverage {...data} />
  </ChartCard>
}

function PremiumSummary({ records }) {
  const cinema = records.filter(record => record.viewing_mode === 'Cinéma')
  const data = categorySummary(cinema, 'premium')
  const premium = data.groups.find(group => group.label === 'Premium')?.count ?? 0
  const share = percent(premium, data.known)
  return <ChartCard eyebrow="04 / Expérience" title="Une séance qui sort du quotidien" className="sheet-chart--premium">
    <div className="sheet-premium-number"><strong>{data.known ? `${share} %` : '—'}</strong><span>de séances premium<br />parmi les séances renseignées</span></div>
    <div className="sheet-premium-meter" aria-hidden="true"><span style={{ width: `${share}%` }} /></div>
    <p>{premium} premium · {data.known - premium} standard</p>
    <Coverage {...data} />
  </ChartCard>
}

export function CinemaCharts({ records, selected, year, onYearChange }) {
  return <div className="sheet-charts">
    <YearColumns records={records} year={year} onYearChange={onYearChange} />
    <ModeDonut records={selected} />
    <CompanySplit records={selected} />
    <PlatformRanking records={selected} />
    <PremiumSummary records={selected} />
  </div>
}
