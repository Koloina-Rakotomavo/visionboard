import { useMemo, useState } from 'react'

const initialDates = [
  { name: 'Un café, une vraie conversation', status: 'À venir', mood: 'Curiosité', color: '#ffd6e5' },
  { name: 'Une rencontre qui m’a fait sourire', status: 'Souvenir', mood: 'Joie', color: '#d7efff' },
  { name: 'Une limite que j’ai posée', status: 'Victoire', mood: 'Fierté', color: '#ffe29a' },
]

export function DatingLifePage() {
  const [dates, setDates] = useState(initialDates)
  const [newName, setNewName] = useState('')
  const [filter, setFilter] = useState('Tous')
  const visibleDates = useMemo(() => filter === 'Tous' ? dates : dates.filter((date) => date.status === filter), [dates, filter])
  const addDate = (event) => {
    event.preventDefault()
    if (!newName.trim()) return
    setDates((current) => [{ name: newName.trim(), status: 'À venir', mood: 'À découvrir', color: '#e4dcff' }, ...current])
    setNewName('')
  }
  return (
    <main className="work-page dating-page">
      <section className="work-card work-card--wide">
        <p className="work-card__eyebrow">My year in connection</p>
        <h1>Dating Life 2026</h1>
        <p className="work-card__text">Un espace doux pour garder une trace des rencontres, des émotions, des limites et des connexions qui comptent.</p>
        <section className="dating-hero">
          <div>
            <p className="dating-hero__eyebrow">Chapter 01 · Me first</p>
            <h2>Je choisis des connexions qui me ressemblent.</h2>
            <p>Cette année, je prends le temps de découvrir, de ressentir et de rester alignée avec moi-même.</p>
          </div>
          <div className="dating-hero__sticker" aria-hidden="true">♡</div>
        </section>
        <section className="dating-stats">
          <article><strong>{dates.length}</strong><span>moments enregistrés</span></article>
          <article><strong>{dates.filter((date) => date.status === 'Victoire').length}</strong><span>petites victoires</span></article>
          <article><strong>∞</strong><span>possibilités</span></article>
        </section>
        <section className="dating-panel">
          <div className="dating-panel__header">
            <div><p className="work-card__eyebrow">My dating diary</p><h2>Les moments de 2026</h2></div>
            <div className="filter-chips" role="tablist" aria-label="Filtrer les moments">
              {['Tous', 'À venir', 'Souvenir', 'Victoire'].map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}
            </div>
          </div>
          <div className="dating-grid">
            {visibleDates.map((date, index) => (
              <article className="dating-card" key={date.name + index} style={{ '--card-color': date.color }}>
                <span className="dating-card__heart">♡</span><p className="dating-card__status">{date.status}</p><h3>{date.name}</h3><p className="dating-card__mood">Énergie : {date.mood}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="dating-panel dating-panel--add">
          <p className="work-card__eyebrow">Add a chapter</p><h2>Qu’est-ce que tu veux garder de cette année ?</h2>
          <form className="dating-add" onSubmit={addDate}><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Une rencontre, une leçon, une envie..." /><button type="submit">Ajouter le moment</button></form>
        </section>
        <a className="work-card__back" href="#/">Retour au vision board cinéma</a>
      </section>
    </main>
  )
}
