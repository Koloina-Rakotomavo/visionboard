import { useRef, useState } from 'react'
import { PersonPortrait } from './CinemaInsights'
import { formatDays, formatHours } from './cinemaAnalytics'

const CHAPTERS = ['Le générique', 'Tes genres', 'Ton acteur', 'Derrière la caméra', 'Tes habitudes', 'Le temps du cinéma', 'Ton affiche']
const duration = minutes => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`

export function FilmPoster({ film, className = '', eager = false }) {
  const [broken, setBroken] = useState(false)
  return <div className={`recap-poster ${className}`}>
    {film?.metadata?.poster_url && !broken ? <img src={film.metadata.poster_url} alt={`Affiche de ${film.title}`} loading={eager ? 'eager' : 'lazy'} onError={() => setBroken(true)} /> : <span>{film?.title ?? 'À découvrir'}</span>}
  </div>
}

function Chevron({ back = false }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={back ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
}

function Intro({ stats, edition }) {
  return <div className="recap-intro">
    <div className="recap-intro-copy"><p className="recap-kicker">Le récap de Koloina · {edition}</p><h2>La vie.<br />En version<br />cinéma.</h2><p className="recap-intro-stat"><strong>{stats.sessions}</strong> visionnages, autant d’histoires.</p></div>
    <div className="recap-fan" aria-label="Quelques films de cette sélection">{stats.posters.slice(0, 4).map((film, i) => <FilmPoster film={film} eager className={`recap-fan-${i}`} key={film.id} />)}{!stats.posters.length && <div className="recap-type-art" aria-hidden="true">CINÉ<br />MA.</div>}</div>
  </div>
}

function Genres({ stats }) {
  const first = stats.genres[0]
  return <div className="recap-genres">
    <div><p className="recap-kicker">Ton genre le plus vu</p><h2>{first?.name ?? 'Ton prochain univers'}</h2><p className="recap-lede">{first ? `${first.count} visionnage${first.count > 1 ? 's' : ''} avec ce genre. Une vraie tendance dans ta sélection.` : 'Les genres apparaîtront dès que tes films seront reconnus par TMDb.'}</p>
      <ol className="recap-genre-ranking">{stats.genres.slice(0, 4).map((genre, i) => <li key={genre.id}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{genre.name}</strong><div className="recap-genre-track"><span style={{ width: `${genre.count / first.count * 100}%` }} /></div></div><b>{genre.count}</b></li>)}</ol>
    </div>
    <div className="recap-genre-posters">{stats.posters.filter(film => film.metadata.genres.some(genre => genre.id === first?.id)).slice(0, 3).map(film => <FilmPoster film={film} key={film.id} />)}</div>
    <p className="recap-footnote">{stats.matched} / {stats.sessions} visionnages reconnus. Un film peut appartenir à plusieurs genres. Les nombres comptent les visionnages, pas tes notes.</p>
  </div>
}

function Actors({ stats }) {
  const data = stats.analytics?.actors
  const first = data?.ranking[0]
  const film = first && stats.posters.find(item => first.filmIds.includes(item.metadata.tmdb_id))
  return <div className="recap-actors"><div><p className="recap-kicker">Le casting qui revient</p><h2>{first?.name ?? (stats.castLoading ? 'Le casting arrive.' : 'À découvrir.')}</h2>{first && <p className="recap-lede"><strong>{first.count} visionnages</strong>, dans {first.filmCount} films distincts de cette sélection.</p>}{data?.leaders.length > 1 && <p className="recap-actor-ties">Ex æquo avec {data.leaders.slice(1, 3).map(person => person.name).join(', ')}{data.leaders.length > 3 ? ` et ${data.leaders.length - 3} autres` : ''}.</p>}<ul className="recap-actor-ranking">{data?.ranking.slice(0, 3).map(person => <li key={person.id}><span>{person.name}</span><strong>{person.count} visionnages</strong></li>)}</ul></div><div className="recap-actor-art">{first && <PersonPortrait person={first} />}{film && <FilmPoster film={film} />}</div><p className="recap-footnote">Castings disponibles pour {data?.covered ?? 0} / {stats.sessions} visionnages. Une présence par visionnage, voix comprises. Le classement annuel et à vie est détaillé sous le récap.</p></div>
}

function Directors({ stats }) {
  const top = stats.directors.slice(0, 3)
  const tied = top.length > 1 && top[0].count === top[1].count
  return <div className="recap-directors"><p className="recap-kicker">Derrière tes films</p><h2>{top.length ? (tied ? 'Des regards qui se croisent.' : 'Une signature qui revient.') : 'Les visages derrière les histoires.'}</h2>
    <div className="recap-director-list">{top.map(person => <div className="recap-director" key={person.id}>{person.profile_url ? <img src={person.profile_url} alt={person.name} loading="lazy" /> : <div className="recap-person-initial" aria-hidden="true">{person.name.slice(0, 1)}</div>}<div><h3>{person.name}</h3><p>{person.count} visionnage{person.count > 1 ? 's' : ''}</p></div></div>)}</div>
    {!top.length && <p>Les réalisateurs s’affichent après la connexion des films à TMDb.</p>}
    <p className="recap-footnote">Réalisateurs des {stats.matched} films reconnus.{tied ? ' Ex æquo classés par ordre alphabétique.' : ''}</p>
  </div>
}

function Rituals({ stats }) {
  const known = stats.modes.known
  const cinemaShare = known ? Math.round(stats.cinema / known * 100) : null
  return <div className="recap-rituals"><div><p className="recap-kicker">Ton rituel cinéma</p><h2>Une place.<br />Des émotions.</h2><div className="recap-habit-number"><strong>{cinemaShare === null ? '—' : `${cinemaShare}%`}</strong><span>sur grand écran<br />parmi les supports renseignés</span></div></div>
    <div className="recap-ticket"><div className="recap-ticket-top"><span>Ton billet récap</span><span>{stats.cinema} séances</span></div><h3>Admit one.<br />Ou plusieurs.</h3><dl><div><dt>Au cinéma</dt><dd>{stats.cinema}</dd></div><div><dt>Accompagnée ou en date</dt><dd>{stats.company.known ? stats.accompanied : '—'}</dd></div><div><dt>En salle premium</dt><dd>{stats.premium.known ? (stats.premium.groups.find(g => g.label === 'Premium')?.count ?? 0) : '—'}</dd></div></dl><div className="recap-ticket-barcode" aria-hidden="true" /><p>{stats.company.known} séances avec accompagnement renseigné.</p></div>
    <p className="recap-footnote">Support connu pour {known} / {stats.sessions} séances. Premium renseigné pour {stats.premium.known} / {stats.cinema} séances au cinéma. Les champs vides restent inconnus.</p>
  </div>
}

function TimeSpent({ stats }) {
  const time = stats.analytics?.cinemaTime
  const minutes = time?.minutes ?? stats.minutes
  const known = time?.known ?? stats.knownDurations
  return <div className="recap-time"><div><p className="recap-kicker">Le temps du grand écran</p><h2>{known ? `${time?.estimated ? '≈ ' : ''}${duration(minutes)}` : 'À compléter'}</h2><p className="recap-lede">{known ? <>en salle. Soit <strong>{formatDays(minutes)} journées de 24 h</strong> à regarder d’autres vies.</> : 'Les durées de tes séances au cinéma apparaîtront ici.'}</p><p className="recap-footnote">{time ? <>{time.confirmed} durées renseignées{time.estimated ? ` + ${time.estimated} complétées par TMDb` : ''}, sur {time.total} séances. {stats.analytics.totalTime.known ? `Tous supports : ${stats.analytics.totalTime.estimated ? '≈ ' : ''}${formatHours(stats.analytics.totalTime.minutes)} de films.` : ''}</> : `${stats.knownDurations} durées renseignées.`}</p></div>
    {stats.longest && <div className="recap-longest"><FilmPoster film={stats.longest} /><div><span>Ta séance renseignée la plus longue</span><h3>{stats.longest.title}</h3><strong>{stats.longest.duration_minutes} min</strong></div></div>}
  </div>
}

function Finale({ stats, edition, onCollection }) {
  return <div className="recap-finale"><div><p className="recap-kicker">Ton affiche · {edition}</p><h2>Le cinéma<br />te va bien.</h2><p className="recap-lede">{stats.filmCount} films distincts. {stats.genres.length} genres explorés.</p><button className="recap-primary" type="button" onClick={onCollection}>Retrouver mes films</button></div><div className="recap-mosaic">{stats.posters.slice(0, 9).map(film => <FilmPoster film={film} key={film.id} />)}</div><p className="recap-footnote">Genres calculés sur {stats.matched} / {stats.sessions} visionnages reconnus par TMDb.</p></div>
}

export function CinemaRecapChapter({ chapter, stats, edition, onCollection }) {
  const content = [<Intro stats={stats} edition={edition} />, <Genres stats={stats} />, <Actors stats={stats} />, <Directors stats={stats} />, <Rituals stats={stats} />, <TimeSpent stats={stats} />, <Finale stats={stats} edition={edition} onCollection={onCollection} />]
  return content[chapter] ?? content[0]
}

export function CinemaRecap({ stats, edition, onCollection }) {
  const [chapter, setChapter] = useState(0)
  const touch = useRef(null)
  const change = step => setChapter(current => Math.max(0, Math.min(CHAPTERS.length - 1, current + step)))
  return <section className="recap-player" aria-label="Ton récap cinéma">
    <div className="recap-chapters" aria-label="Chapitres du récap">{CHAPTERS.map((name, i) => <button type="button" key={name} onClick={() => setChapter(i)} aria-label={`${i + 1}. ${name}`} aria-current={chapter === i ? 'step' : undefined} className={i <= chapter ? 'recap-step--seen' : ''}><span /></button>)}</div>
    <div className={`recap-stage recap-stage--${chapter}`} onTouchStart={event => { touch.current = [event.touches[0].clientX, event.touches[0].clientY] }} onTouchEnd={event => { if (!touch.current) return; const dx = event.changedTouches[0].clientX - touch.current[0], dy = event.changedTouches[0].clientY - touch.current[1]; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) change(dx < 0 ? 1 : -1); touch.current = null }} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight') { event.preventDefault(); change(1) } if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) } }} tabIndex={0} role="group" aria-roledescription="diaporama" aria-label={`${chapter + 1} sur ${CHAPTERS.length} : ${CHAPTERS[chapter]}`}>
      <div className="recap-scene" key={chapter}><CinemaRecapChapter chapter={chapter} stats={stats} edition={edition} onCollection={onCollection} /></div>
    </div>
    <div className="recap-controls"><span aria-live="polite">{String(chapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}<span className="recap-chapter-name">{CHAPTERS[chapter]}</span></span><div><button type="button" onClick={() => change(-1)} disabled={chapter === 0} aria-label="Chapitre précédent"><Chevron back /></button><button className="recap-next" type="button" onClick={() => chapter === CHAPTERS.length - 1 ? setChapter(0) : change(1)} aria-label={chapter === CHAPTERS.length - 1 ? 'Revoir le récap' : 'Chapitre suivant'}>{chapter === CHAPTERS.length - 1 ? 'Revoir' : 'Suivant'}<Chevron /></button></div></div>
  </section>
}
