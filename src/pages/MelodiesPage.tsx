import { PadGrid } from '../components/PadGrid'
import { ControlRow, Guide, PanelHeader, StatusStack } from '../components/primitives'
import { buildMelodyPhraseRecipes } from '../lib/melodyPhrases'
import { PAD_NUMBERS, ROOT_NOTES, getScaleDefinition, midiToNoteName, noteNameToMidi } from '../lib/music'
import { useAppState } from '../state/AppStateProvider'
import type { MelodyPadRole, PadNumber } from '../types'

export function MelodiesPage() {
  const {
    keyRoot,
    scaleType,
    sampleRootMidi,
    originalPad,
    surfaceMode,
    selectedShape,
    pitchWindow,
    melodyPads,
    melodyHighlights,
    animatedPads,
    setSampleRootMidi,
    setOriginalPad,
    playSinglePad,
    animatePads,
  } = useAppState()

  const onSampleRootChange = setSampleRootMidi
  const onOriginalPadChange = setOriginalPad
  const onPlayPad = playSinglePad
  const onAnimate = (pads: PadNumber[]) => animatePads(pads, 'melody')

  const sampleNote = midiToNoteName(sampleRootMidi)
  const scaleLabel = getScaleDefinition(scaleType).label
  const phraseRecipes = buildMelodyPhraseRecipes(melodyPads)
  const roleCounts = melodyPads.reduce(
    (counts, pad) => {
      counts[pad.role] += 1
      return counts
    },
    { home: 0, strong: 0, safe: 0, passing: 0, tension: 0 } as Record<MelodyPadRole, number>,
  )

  return (
    <section className="melody-layout">
      <aside className="panel melody-setup">
        <PanelHeader kicker="1. Map" title="Melody setup" value={`${keyRoot} ${scaleLabel}`} />
        <Guide title="Find notes without theory">
          <p>Use home and strong pads for anchors, safe pads for hooks, passing pads for movement, and tension pads only when you want grit.</p>
        </Guide>
        <div className="master-key-readout">
          <span>Master key</span>
          <strong>{keyRoot} {scaleLabel}</strong>
          <small>Melody roles update everywhere from the top bar.</small>
        </div>
        <div className="helper-mini-row">
          <ControlRow label="Sample note">
            <select value={sampleNote} onChange={(event) => onSampleRootChange(noteNameToMidi(event.target.value, 3))}>
              {ROOT_NOTES.map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </ControlRow>
          <ControlRow label="Original pad">
            <select value={originalPad} onChange={(event) => onOriginalPadChange(Number(event.target.value) as PadNumber)}>
              {PAD_NUMBERS.map((pad) => (
                <option key={pad} value={pad}>
                  Pad {pad}
                </option>
              ))}
            </select>
          </ControlRow>
        </div>
        <StatusStack
          items={[
            { label: 'Home', value: `${roleCounts.home} pads` },
            { label: 'Strong', value: `${roleCounts.strong} pads` },
            { label: 'Safe', value: `${roleCounts.safe} pads` },
            { label: 'Passing', value: `${roleCounts.passing} pads` },
          ]}
        />
      </aside>

      <div className="panel melody-pad-panel">
        <PanelHeader kicker={surfaceMode === 'keys' ? '2. Keys' : '2. Pads'} title="Melody notes" value="roles" />
        <PadGrid
          selectedShape={selectedShape}
          pitchWindow={pitchWindow}
          padHighlights={melodyHighlights}
          highlightMode="all"
          surfaceMode={surfaceMode}
          animatedPads={animatedPads}
          onPlayPad={onPlayPad}
        />
        <div className="legend helper-legend">
          <span>Gold = home</span>
          <span>Rose = strong</span>
          <span>Mint = safe</span>
          <span>Paper = passing</span>
        </div>
      </div>

      <aside className="panel melody-phrases">
        <PanelHeader kicker="3. Phrases" title="Try these shapes" value={`${phraseRecipes.length} ideas`} />
        <div className="phrase-list">
          {phraseRecipes.map((phrase) => (
            <button type="button" className="suggestion phrase-card" key={phrase.name} onClick={() => onAnimate(phrase.pads)} disabled={phrase.pads.length === 0}>
              <span>{phrase.name}</span>
              <strong>{phrase.pads.map((pad) => `P${pad}`).join(' -> ') || 'needs more safe pads'}</strong>
              <small>{phrase.hint}</small>
            </button>
          ))}
        </div>
      </aside>
    </section>
  )
}
