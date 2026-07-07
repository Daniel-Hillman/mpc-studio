import { Music, SlidersHorizontal, Square } from 'lucide-react'
import './App.css'
import { TopBar } from './components/TopBar'
import { ChordsPage } from './pages/ChordsPage'
import { HomePage } from './pages/HomePage'
import { LevelsPage } from './pages/LevelsPage'
import { MelodiesPage } from './pages/MelodiesPage'
import { AppStateProvider, useAppState, type ViewId } from './state/AppStateProvider'

const VIEW_ITEMS: { id: ViewId; label: string; icon: typeof Music }[] = [
  { id: 'studio', label: 'Home', icon: Music },
  { id: 'chords', label: 'Chords', icon: SlidersHorizontal },
  { id: 'melodies', label: 'Melodies', icon: Music },
  { id: 'levels', label: '16 Levels / Scales', icon: Square },
]

function Shell() {
  const { activeView, setActiveView } = useAppState()

  return (
    <div className="app-shell">
      <TopBar />

      <nav className="view-tabs" aria-label="Samplex sections">
        {VIEW_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <main>
        {activeView === 'studio' && <HomePage />}
        {activeView === 'chords' && <ChordsPage />}
        {activeView === 'melodies' && <MelodiesPage />}
        {activeView === 'levels' && <LevelsPage />}
      </main>
    </div>
  )
}

function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  )
}

export default App
