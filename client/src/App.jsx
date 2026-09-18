import { useEffect, useState } from 'react'
import { headerThemes } from './content/visionboardContent'
import { AppleMusicAuthPage } from './presentation/pages/AppleMusicAuthPage'
import { BiblePage } from './presentation/pages/BiblePage'
import { CalendarPage } from './presentation/pages/CalendarPage'
import { CinemaPage } from './presentation/pages/CinemaPage'
import { HomePage } from './presentation/pages/HomePage'
import { StudiesPage } from './presentation/pages/StudiesPage'
import { VisionBoardEditorPage } from './presentation/pages/VisionBoardEditorPage'
import { WorkInProgressPage } from './presentation/pages/WorkInProgressPage'
import './presentation/styles/App.part1.css'
import './presentation/styles/App.part2.css'
import './presentation/styles/App.part3.css'
import './presentation/styles/App.part4.css'
import './presentation/styles/App.part5.css'
import { getCurrentRoute, toRouteSlug } from './utils/routes'

function App() {
  const [currentPage, setCurrentPage] = useState(getCurrentRoute)

  useEffect(() => {
    const syncRoute = () => setCurrentPage(getCurrentRoute())

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const activeTheme = headerThemes.find((theme) => toRouteSlug(theme) === currentPage)

  return (
    <div className="page-shell">
      <div className="orb orb-sunrise" aria-hidden="true" />
      <div className="orb orb-ocean" aria-hidden="true" />

      {activeTheme ? (
        activeTheme === 'Vision Board' ? (
          <VisionBoardEditorPage />
        ) : activeTheme === 'Calendrier' ? (
          <CalendarPage />
        ) : activeTheme === 'Cinema' ? (
          <CinemaPage />
        ) : activeTheme === 'Musique' ? (
          <AppleMusicAuthPage />
        ) : activeTheme === 'Bible' ? (
          <BiblePage />
        ) : activeTheme === 'Etudes' ? (
          <StudiesPage />
        ) : (
          <WorkInProgressPage theme={activeTheme} />
        )
      ) : (
        <HomePage />
      )}
    </div>
  )
}

export default App
