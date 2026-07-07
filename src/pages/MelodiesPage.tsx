import { PadGrid } from '../components/PadGrid'
import { RoleLegend } from '../components/RoleLegend'
import { Guide, PanelHeader, StatusStack } from '../components/primitives'
import { buildMelodyPhraseRecipes } from '../lib/melodyPhrases'
import { getScaleDefinition, midiToNoteWithOctave } from '../lib/music'
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
    playSinglePad,
    playPadSequence,
    animatePads,
  } = useAppState()

  const onPlayPad = playSinglePad
  const onAnimate = (pads: PadNumber[]) => {
    animatePads(pads, 'melody')
    void playPadSequence(pads)
  }

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
          <p>Anchor on Root and Chord-tone pads, build hooks with In-scale pads, move through Passing pads quickly, and save Outside-scale pads for grit.</p>
        </Guide>
        <StatusStack
          items={[
            { label: 'Key', value: `${keyRoot} ${scaleLabel}` },
            { label: 'Sample', value: `${midiToNoteWithOctave(sampleRootMidi)} on Pad ${originalPad}` },
            { label: 'Root', value: `${roleCounts.home} pads` },
            { label: 'Chord tone', value: `${roleCounts.strong} pads` },
            { label: 'In scale', value: `${roleCounts.safe} pads` },
            { label: 'Passing', value: `${roleCounts.passing} pads` },
          ]}
        />
        <p className="panel-note">Melody roles follow the master key in the top bar.</p>
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
        <RoleLegend mode="melody" surface={surfaceMode} />
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
