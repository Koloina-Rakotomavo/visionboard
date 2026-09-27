import { CinemaPage } from './presentation/pages/CinemaPage'
import { DatingLifePage } from './presentation/pages/DatingLifePage'
import './presentation/styles/App.css'
import { useEffect, useState } from 'react'

const getPageFromHash = () => {
  if (window.location.hash === '#/dating') return 'dating'
  return 'cinema'
}

function App() {
  const [page, setPage] = useState(getPageFromHash)
  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return (
    <>
      <nav className="vision-nav" aria-label="Sections du vision board">
        <div className="vision-nav__scroller">
          <a href="#/" className={page === 'cinema' ? 'vision-nav__active' : ''}>Cinema</a>
          <a href="#cinema-letterboxd">Letterboxd</a>
          <a href="#/dating" className={page === 'dating' ? 'vision-nav__active' : ''}>Dating Life 2026</a>
        </div>
      </nav>
      {page === 'dating' ? <DatingLifePage /> : <CinemaPage />}
    </>
  )
}

export default App
