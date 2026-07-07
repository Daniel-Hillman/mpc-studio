import { PadGrid } from '../components/PadGrid'
import { RoleLegend } from '../components/RoleLegend'
import { ControlRow, Guide, PanelHeader, StatusStack } from '../components/primitives'
import {
  PAD_NUMBERS,
  ROOT_NOTES,
  formatSemitoneShift,
  getScaleDefinition,
  midiToNoteName,
  midiToNoteWithOctave,
  padToMidi,
} from '../lib/music'
import { useAppState } from '../state/AppStateProvider'

export function LevelsPage() {
  const {
    keyRoot,
    scaleType,
    sampleRootMidi,
    originalPad,
    surfaceMode,
    selectedShape,
    pitchWindow,
    scaleNotes,
    safePads,
    rootPads,
    padHighlights,
    otherSampleNote,
    targetNote,
    repitchShift,
    setOtherSampleNote,
    setTargetNote,
    playSinglePad,
  } = useAppState()

  const onOtherSampleNoteChange = setOtherSampleNote
  const onTargetNoteChange = setTargetNote
  const onSetTargetToKey = () => setTargetNote(keyRoot)
  const onPlayPad = playSinglePad

  const sampleNote = midiToNoteName(sampleRootMidi)
  const scaleLabel = getScaleDefinition(scaleType).label
  const nearestShift = `${repitchShift > 0 ? '+' : ''}${repitchShift} st`
  const scalePadRows = scaleNotes.map((note) => {
    const pads = PAD_NUMBERS.filter((pad) => midiToNoteName(padToMidi(sampleRootMidi, originalPad, pad)) === note)
    return { note, pads }
  })

  return (
    <section className="levels-layout">
      <aside className="panel levels-setup">
        <PanelHeader kicker="16 Levels / Scales" title="Scale setup" value={`${keyRoot} ${scaleLabel}`} />
        <Guide title="Map a scale onto 16 Levels">
          <p>The master key and sample live in the top bar. This page maps that scale onto your 16 Levels pads.</p>
        </Guide>
        <StatusStack
          items={[
            { label: 'Key', value: `${keyRoot} ${scaleLabel}` },
            { label: 'Window', value: `${midiToNoteWithOctave(pitchWindow.minMidi)} to ${midiToNoteWithOctave(pitchWindow.maxMidi)}` },
            { label: 'Original', value: `${sampleNote} on Pad ${originalPad}` },
            { label: 'Root pads', value: rootPads.length ? rootPads.map((pad) => `P${pad}`).join(', ') : 'not visible' },
          ]}
        />
        <p className="panel-note">The highlighted pads below come from this key.</p>
      </aside>

      <div className="panel levels-pad-panel">
        <PanelHeader
          kicker={surfaceMode === 'keys' ? 'Scale keys' : 'Scale pads'}
          title={surfaceMode === 'keys' ? 'Highlighted keyboard' : 'Highlighted 16 Levels'}
          value={surfaceMode === 'keys' ? `${safePads.length} safe` : `${safePads.length} pads`}
        />
        <PadGrid
          selectedShape={selectedShape}
          pitchWindow={pitchWindow}
          padHighlights={padHighlights}
          highlightMode="scale"
          surfaceMode={surfaceMode}
          onPlayPad={onPlayPad}
        />
        <RoleLegend mode="scale" surface={surfaceMode} />
      </div>

      <aside className="panel levels-notes">
        <PanelHeader kicker="Notes" title={`${scaleNotes.length} notes in scale`} value={`${safePads.length} pads`} />
        <div className="scale-note-list">
          {scalePadRows.map((row) => (
            <div className={row.pads.length ? 'scale-note-card visible' : 'scale-note-card missing'} key={row.note}>
              <strong>{row.note}</strong>
              <span>{row.pads.length ? row.pads.map((pad) => `P${pad}`).join(', ') : 'not in window'}</span>
            </div>
          ))}
        </div>
        <div className="result-box">
          <strong>Quick use:</strong> Start on a gold root pad, make phrases with mint pads, and ignore dark pads unless you want outside tension.
        </div>
      </aside>

      <section className="panel levels-retune">
        <PanelHeader kicker="Retune" title="Repitch another one-shot" value={nearestShift} />
        <div className="retune-grid">
          <div className="result-box">
            <strong>{`${otherSampleNote} -> ${targetNote}`}</strong>
            <br />
            {formatSemitoneShift(repitchShift)}. Use this as a starting point, then fine-tune by ear on the MPC.
          </div>
          <div className="helper-mini-row">
            <ControlRow label="Detected note">
              <select value={otherSampleNote} onChange={(event) => onOtherSampleNoteChange(event.target.value)}>
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </ControlRow>
            <ControlRow label="Target note">
              <select value={targetNote} onChange={(event) => onTargetNoteChange(event.target.value)}>
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </ControlRow>
          </div>
          <div className="pitch-list">
            {[
              ['Nearest shift', repitchShift],
              ['Same note one octave up', repitchShift + 12],
              ['Same note one octave down', repitchShift - 12],
            ].map(([label, shift]) => (
              <div className="pitch-row" key={label}>
                <span>{label}</span>
                <span className="pill">{Number(shift) > 0 ? '+' : ''}{shift} st</span>
              </div>
            ))}
          </div>
          <button type="button" className="secondary-action" onClick={onSetTargetToKey}>
            Set target to track key
          </button>
        </div>
      </section>
    </section>
  )
}
