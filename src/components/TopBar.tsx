import { Play, Volume2 } from 'lucide-react'
import { describeChord, midiToNoteWithOctave } from '../lib/music'
import { useAppState } from '../state/AppStateProvider'
import { MasterKeyControl } from './MasterKeyControl'
import { SurfaceModeSwitch } from './primitives'

export function TopBar() {
  const {
    activeView,
    chordRoot,
    chordQuality,
    sampleRootMidi,
    project,
    surfaceMode,
    setSurfaceMode,
    keyRoot,
    scaleType,
    scaleDefinition,
    setTrackKey,
    setScaleType,
    selectedShape,
    auditionShape,
  } = useAppState()

  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">MPC</div>
        <div>
          <h1>MPC Samplex</h1>
          <p>{describeChord(chordRoot, chordQuality)} over {midiToNoteWithOctave(sampleRootMidi)} - {project.tempo} BPM</p>
        </div>
      </div>
      <div className="topbar-actions">
        <SurfaceModeSwitch value={surfaceMode} onChange={setSurfaceMode} />
        <MasterKeyControl
          keyRoot={keyRoot}
          scaleType={scaleType}
          scaleLabel={scaleDefinition.label}
          onTrackKeyChange={setTrackKey}
          onScaleTypeChange={setScaleType}
        />
      </div>
      {activeView !== 'chords' && (
        <div className="transport-strip" aria-label="Transport">
          <button type="button" className="icon-button" onClick={() => auditionShape(selectedShape)} title="Play chord">
            <Play size={20} />
          </button>
          <button type="button" className="icon-button" onClick={() => auditionShape(selectedShape, 34)} title="Strum chord">
            <Volume2 size={20} />
          </button>
        </div>
      )}
    </header>
  )
}
