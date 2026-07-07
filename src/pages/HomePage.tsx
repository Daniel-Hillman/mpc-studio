import { Music, Play, Volume2 } from 'lucide-react'
import { PadGrid } from '../components/PadGrid'
import { RoleLegend } from '../components/RoleLegend'
import { ControlRow, PanelHeader, StatusStack } from '../components/primitives'
import {
  ROOT_NOTES,
  describeChord,
  formatSemitoneShift,
  midiToNoteName,
  midiToNoteWithOctave,
  padToMidi,
} from '../lib/music'
import { useAppState } from '../state/AppStateProvider'
import type { AudioFeel, InstrumentPreset } from '../types'

const AUDIO_PRESETS: { value: InstrumentPreset; label: string }[] = [
  { value: 'warmKeys', label: 'Warm Keys' },
  { value: 'lushPad', label: 'Lush Pad' },
  { value: 'dustyEp', label: 'Dusty EP' },
  { value: 'softPluck', label: 'Soft Pluck' },
  { value: 'deepBass', label: 'Deep Bass' },
  { value: 'cleanSine', label: 'Clean Sine' },
]

const AUDIO_FEELS: { value: AudioFeel; label: string }[] = [
  { value: 'tight', label: 'Tight' },
  { value: 'natural', label: 'Natural' },
  { value: 'loose', label: 'Loose' },
]

function audioPresetLabel(preset: InstrumentPreset): string {
  return AUDIO_PRESETS.find((option) => option.value === preset)?.label ?? 'Warm Keys'
}

function audioFeelLabel(feel: AudioFeel): string {
  return AUDIO_FEELS.find((option) => option.value === feel)?.label ?? 'Natural'
}

export function HomePage() {
  const {
    audioReady,
    selectedShape,
    previewEnabled,
    instrumentPreset,
    audioFeel,
    pitchWindow,
    sampleRootMidi,
    originalPad,
    surfaceMode,
    keyRoot,
    chordRoot,
    chordQuality,
    otherSampleNote,
    targetNote,
    highlightMode,
    padHighlights,
    safePads,
    rootPads,
    chordPads,
    scaleDefinition,
    scaleNotes,
    repitchShift,
    animatedPads,
    setOtherSampleNote,
    setTargetNote,
    setHighlightMode,
    animatePads,
    applyJunglePreset,
    togglePreview,
    setInstrumentPreset,
    setAudioFeel,
    auditionShape,
    playSinglePad,
    setActiveView,
  } = useAppState()

  const scaleDefinitionLabel = scaleDefinition.label
  const onOtherSampleNoteChange = setOtherSampleNote
  const onTargetNoteChange = setTargetNote
  const onSetTargetToKey = () => setTargetNote(keyRoot)
  const onHighlightModeChange = setHighlightMode
  const onAnimateSafePads = () => animatePads(safePads, 'scale')
  const onAnimateChordPads = () => animatePads(chordPads, 'chord')
  const onPresetJungle = applyJunglePreset
  const onTogglePreview = togglePreview
  const onInstrumentPresetChange = setInstrumentPreset
  const onAudioFeelChange = setAudioFeel
  const onAudition = () => auditionShape(selectedShape)
  const onPlayPad = playSinglePad
  const onNavigate = setActiveView

  const sampleNote = midiToNoteName(sampleRootMidi)
  const chordPadDetails = chordPads.map((pad) => {
    const midi = padToMidi(sampleRootMidi, originalPad, pad)
    const role = padHighlights[pad].chordRole ?? 'tone'
    return `P${pad} ${midiToNoteName(midi)} ${role}`
  })
  const easyChord = chordPads.slice(0, 4).map((pad) => `P${pad}`).join(' -> ')
  const fifthPad = chordPads.find((pad) => padHighlights[pad].chordRole === '5')
  const nearestShift = `${repitchShift > 0 ? '+' : ''}${repitchShift} st`
  const litScaleNoteSet = new Set(safePads.map((pad) => midiToNoteName(padToMidi(sampleRootMidi, originalPad, pad))))
  const missingScaleNotes = scaleNotes.filter((note) => !litScaleNoteSet.has(note))

  return (
    <section className="home-layout">
      <section className="panel home-start">
        <PanelHeader kicker="Start" title="What are you making?" value={`${keyRoot} ${scaleDefinitionLabel}`} />
        <div className="home-action-grid">
          <button
            type="button"
            className="home-action-card"
            onClick={() => {
              onHighlightModeChange('scale')
              onAnimateSafePads()
            }}
          >
            <span>1</span>
            <strong>Find safe notes</strong>
            <small>{safePads.length ? safePads.map((pad) => `P${pad}`).join(', ') : 'Move the original pad or sample note'}</small>
          </button>
          <button type="button" className="home-action-card" onClick={() => onNavigate('chords')}>
            <span>2</span>
            <strong>Build chords</strong>
            <small>{describeChord(chordRoot, chordQuality)} / {easyChord || 'choose a playable shape'}</small>
          </button>
          <button type="button" className="home-action-card" onClick={() => onNavigate('melodies')}>
            <span>3</span>
            <strong>Make a melody</strong>
            <small>Home pads, strong pads, passing notes</small>
          </button>
          <button type="button" className="home-action-card quiet" onClick={() => onNavigate('levels')}>
            <span>4</span>
            <strong>Fix the window</strong>
            <small>{midiToNoteWithOctave(pitchWindow.minMidi)} to {midiToNoteWithOctave(pitchWindow.maxMidi)}</small>
          </button>
        </div>
      </section>

      <aside className="panel home-setup">
        <PanelHeader kicker="Now" title="Current setup" value={`${sampleNote} on Pad ${originalPad}`} />
        <StatusStack
          items={[
            { label: 'Key', value: `${keyRoot} ${scaleDefinitionLabel}` },
            { label: 'Sample', value: `${midiToNoteWithOctave(sampleRootMidi)} on Pad ${originalPad}` },
            { label: 'Window', value: `${midiToNoteWithOctave(pitchWindow.minMidi)} to ${midiToNoteWithOctave(pitchWindow.maxMidi)}` },
          ]}
        />
        <p className="panel-note">Change the key and sample once from the top bar - every page follows.</p>
        <div className="home-mode-grid">
          <button type="button" className={highlightMode === 'scale' ? 'primary-action' : 'secondary-action'} onClick={() => onHighlightModeChange('scale')}>
            Safe pads
          </button>
          <button type="button" className={highlightMode === 'chord' ? 'primary-action' : 'secondary-action'} onClick={() => onHighlightModeChange('chord')}>
            Chord pads
          </button>
          <button type="button" className="secondary-action" onClick={onPresetJungle}>
            A minor preset
          </button>
        </div>
      </aside>

      <div className="panel main-surface home-pad-panel">
        <PanelHeader
          kicker={surfaceMode === 'keys' ? 'Keyboard' : '16 Levels'}
          title={surfaceMode === 'keys' ? 'Keys to try now' : 'Pads to try now'}
          value={`${safePads.length} safe`}
        />
        <PadGrid
          selectedShape={selectedShape}
          pitchWindow={pitchWindow}
          padHighlights={padHighlights}
          highlightMode={highlightMode}
          surfaceMode={surfaceMode}
          animatedPads={animatedPads}
          onPlayPad={onPlayPad}
        />
        <div className="helper-pad-actions">
          <button type="button" className="secondary-action" onClick={onAnimateSafePads} disabled={safePads.length === 0}>
            <Play size={18} />
            <span>Flash safe notes</span>
          </button>
          <button type="button" className="secondary-action" onClick={onAnimateChordPads} disabled={chordPads.length === 0}>
            <Music size={18} />
            <span>Flash chord</span>
          </button>
          <button type="button" className="primary-action" onClick={onAudition}>
            <Volume2 size={18} />
            <span>Audition chord</span>
          </button>
        </div>
        <RoleLegend mode={highlightMode === 'chord' ? 'chord' : 'scale'} surface={surfaceMode} />
      </div>

      <aside className="panel home-sound">
        <PanelHeader kicker="Sound" title="Preview feel" value={audioReady ? 'Ready' : 'Tap play'} />
        <div className="toggle-stack">
          <button type="button" className={previewEnabled ? 'toggle active' : 'toggle'} onClick={onTogglePreview}>
            <Volume2 size={18} />
            <span>Browser audio</span>
          </button>
        </div>
        <ControlRow label="Sound">
          <select value={instrumentPreset} onChange={(event) => onInstrumentPresetChange(event.target.value as InstrumentPreset)}>
            {AUDIO_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </ControlRow>
        <ControlRow label="Audio feel">
          <div className="mode-strip">
            {AUDIO_FEELS.map((feel) => (
              <button
                type="button"
                key={feel.value}
                className={audioFeel === feel.value ? 'mode-button active' : 'mode-button'}
                onClick={() => onAudioFeelChange(feel.value)}
              >
                {feel.label}
              </button>
            ))}
          </div>
        </ControlRow>
        <StatusStack
          items={[
            { label: 'Window', value: `${midiToNoteWithOctave(pitchWindow.minMidi)} to ${midiToNoteWithOctave(pitchWindow.maxMidi)}` },
            { label: 'Sound', value: audioPresetLabel(instrumentPreset) },
            { label: 'Feel', value: audioFeelLabel(audioFeel) },
          ]}
        />
      </aside>

      <section className="panel home-now">
        <PanelHeader kicker="Recipe" title="Play this now" value={rootPads[0] ? `P${rootPads[0]} home` : 'Set key'} />
        <div className="home-recipe-grid">
          <div className="result-box">
            <strong>Scale:</strong> {scaleNotes.join(', ')}
            <br />
            <strong>Safe pads:</strong> {safePads.length ? safePads.map((pad) => `P${pad}`).join(', ') : 'none in this window'}
            <br />
            <strong>Root pads:</strong> {rootPads.length ? rootPads.map((pad) => `P${pad}`).join(', ') : 'none in this window'}
            {missingScaleNotes.length > 0 && (
              <>
                <br />
                <strong>Missing:</strong> {missingScaleNotes.join(', ')}
              </>
            )}
          </div>
          <div className="result-box">
            <strong>Chord stab:</strong> {easyChord || 'open Chords and pick a shape'}
            <br />
            <strong>Chord tones:</strong> {chordPadDetails.length ? chordPadDetails.join(', ') : 'none in this window'}
            {rootPads[0] && fifthPad && (
              <>
                <br />
                <strong>Bass:</strong> {`P${rootPads[0]} -> P${fifthPad} -> P${rootPads[0]}`}
              </>
            )}
          </div>
          <div className="result-box home-repitch-box">
            <strong>Repitch one-shot:</strong> {`${otherSampleNote} -> ${targetNote}`}
            <div className="helper-mini-row">
              <ControlRow label="Detected">
                <select value={otherSampleNote} onChange={(event) => onOtherSampleNoteChange(event.target.value)}>
                  {ROOT_NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </ControlRow>
              <ControlRow label="Target">
                <select value={targetNote} onChange={(event) => onTargetNoteChange(event.target.value)}>
                  {ROOT_NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </ControlRow>
            </div>
            <div className="pitch-row">
              <span>{formatSemitoneShift(repitchShift)}</span>
              <span className="pill">{nearestShift}</span>
            </div>
            <button type="button" className="secondary-action" onClick={onSetTargetToKey}>
              Target track key
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}
