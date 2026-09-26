import { CinemaPage } from './presentation/pages/CinemaPage'
import { DatingLifePage } from './presentation/pages/DatingLifePage'
import './presentation/styles/App.css'
import { useEffect, useState } from 'react'

function App() {
  const [page, setPage] = useState(window.location.hash === '#/dating' ? 'dating' : 'cinema')
  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash === '#/dating' ? 'dating' : 'cinema')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return (
    <>
      <nav className="vision-nav" aria-label="Sections du vision board">
        <a href="#/" className={page === 'cinema' ? 'vision-nav__active' : ''}>Cinema</a>
        <a href="#/dating" className={page === 'dating' ? 'vision-nav__active' : ''}>Dating Life 2026</a>
      </nav>
      {page === 'dating' ? <DatingLifePage /> : <CinemaPage />}
    </>
  )
}

export default App
