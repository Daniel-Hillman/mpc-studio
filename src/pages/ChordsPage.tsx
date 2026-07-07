import { useState } from 'react'
import { Music, Play, Volume2 } from 'lucide-react'
import { PadGrid } from '../components/PadGrid'
import { RoleLegend } from '../components/RoleLegend'
import { ControlRow, Guide, PanelHeader, StatusStack } from '../components/primitives'
import {
  buildCoachStageSuggestions,
  degreeLabel,
  degreeNumber,
  degreeQuality,
  degreeUse,
  paletteModeLabel,
  type ChordPaletteMode,
} from '../lib/degrees'
import {
  CHORD_DEFINITIONS,
  PAD_NUMBERS,
  ROOT_NOTES,
  analyzeSixteenLevelsChord,
  describeChord,
  getChordDefinition,
  getMelodyPadRoles,
  getScaleDefinition,
  getScaleNotes,
  intervalRoleLabel,
  midiToNoteName,
  midiToNoteWithOctave,
  rankLabel,
} from '../lib/music'
import type { PadHighlight } from '../lib/padHighlights'
import { useAppState } from '../state/AppStateProvider'
import type { ChordQualityId, PadNumber } from '../types'

const QUALITY_OPTIONS = CHORD_DEFINITIONS.map((definition) => ({
  value: definition.id,
  label: definition.label,
}))

function rankClass(rank: string): string {
  return `rank-${rank.toLowerCase().replace(/[^a-z]+/g, '-')}`
}

export function ChordsPage() {
  const {
    chordRoot,
    chordQuality,
    keyRoot,
    scaleType,
    sampleRootMidi,
    originalPad,
    surfaceMode,
    diatonicChords,
    selectedShape,
    progressionShapes,
    nextChordSuggestions,
    selectedBassRecipes: bassRecipes,
    progressionPlaybook: playbook,
    pitchWindow,
    padHighlights,
    chordShapeHighlights,
    animatedPads,
    setChordRoot,
    setChordQuality,
    addChordToProgression,
    moveChordInProgression,
    removeChordFromProgression,
    clearProgression,
    animatePads,
    playSinglePad,
    auditionChord,
  } = useAppState()

  const onAddChord = addChordToProgression
  const onMoveChord = moveChordInProgression
  const onRemoveChord = removeChordFromProgression
  const onClearProgression = clearProgression
  const onAnimate = () => animatePads(selectedShape.pads.map((pad) => pad.pad), 'chord')
  const onPlayPad = playSinglePad

  const [paletteMode, setPaletteMode] = useState<ChordPaletteMode>('sevenths')
  const sampleNote = midiToNoteName(sampleRootMidi)
  const scaleLabel = getScaleDefinition(scaleType).label
  const degreeChords = diatonicChords.map((step, index) => ({
    ...step,
    quality: degreeQuality(index, scaleType, paletteMode),
  }))
  const playablePads = selectedShape.pads.slice().sort((a, b) => a.pad - b.pad)
  const padRecipe = playablePads.map((pad) => `P${pad.pad}`).join(' + ')
  const missingEssentials = selectedShape.missing.filter((tone) => getChordDefinition(chordQuality).coreIntervals.includes(tone.interval))
  const coachStages = buildCoachStageSuggestions(diatonicChords, scaleType, paletteMode, sampleRootMidi, originalPad)
  const selectedMelodyPads = getMelodyPadRoles(getScaleNotes(keyRoot, scaleType), selectedShape, pitchWindow)
    .filter((pad) => pad.role === 'home' || pad.role === 'strong' || pad.role === 'safe')
    .slice(0, 5)
  const mpcRecipeRows =
    playbook.length > 0
      ? playbook
      : [
          {
            id: 'selected-chord-recipe',
            chordName: describeChord(chordRoot, chordQuality),
            chordPads: playablePads.map((pad) => pad.pad),
            bass: bassRecipes[0],
            melodyPads: selectedMelodyPads,
          },
        ]

  // Chord-shape pads (rose/gold) layered over scale truth (mint) so the
  // keyboard shows in-scale context around the chord tones.
  const chordSurfaceHighlights = PAD_NUMBERS.reduce(
    (map, pad) => {
      map[pad] = { ...chordShapeHighlights[pad], isSafe: padHighlights[pad].isSafe }
      return map
    },
    {} as Record<PadNumber, PadHighlight>,
  )

  function selectChord(root: string, quality: ChordQualityId) {
    setChordRoot(root)
    setChordQuality(quality)
  }

  function pickChord(root: string, quality: ChordQualityId) {
    selectChord(root, quality)
    void auditionChord(root, quality, 20)
  }

  function addStarterLoop() {
    coachStages.forEach((stage) => onAddChord(stage.root, stage.quality))
    const first = coachStages[0]
    if (first) {
      selectChord(first.root, first.quality)
    }
  }

  return (
    <section className="chord-finder-layout">
      <div className="panel chord-finder-palette">
        <PanelHeader kicker="1. Pick a chord" title={`Chords in ${keyRoot} ${scaleLabel}`} value={paletteModeLabel(paletteMode)} />
        <Guide title="Pick a degree, then add it">
          <p>The 1st is home, 4th opens the loop, 5th pulls back home, and 6th is often the emotional move. Tap a chord to hear it and see its pads. Tap + to add it to your loop.</p>
        </Guide>
        <div className="mode-strip" aria-label="Chord type">
          {(['triads', 'sevenths', 'colors'] as ChordPaletteMode[]).map((mode) => (
            <button
              type="button"
              key={mode}
              className={paletteMode === mode ? 'mode-button active' : 'mode-button'}
              onClick={() => setPaletteMode(mode)}
            >
              {paletteModeLabel(mode)}
            </button>
          ))}
        </div>
        <div className="chord-palette chord-degree-grid">
          {degreeChords.map((step, index) => {
            const active = step.root === chordRoot && step.quality === chordQuality
            return (
              <div className="chord-chip-row" key={step.id}>
                <button
                  type="button"
                  className={active ? 'chord-chip active' : 'chord-chip'}
                  onClick={() => pickChord(step.root, step.quality)}
                >
                  <span>{degreeNumber(index)} / {degreeLabel(index, step.quality)}</span>
                  <strong>{describeChord(step.root, step.quality)}</strong>
                  <small>{degreeUse(index)}</small>
                </button>
                <button
                  type="button"
                  className="chip-add"
                  aria-label={`Add ${describeChord(step.root, step.quality)} to progression`}
                  onClick={() => onAddChord(step.root, step.quality)}
                >
                  +
                </button>
              </div>
            )
          })}
        </div>
        <details className="guide-panel custom-chord">
          <summary>Custom chord</summary>
          <div>
            <ControlRow label="Root">
              <select value={chordRoot} onChange={(event) => setChordRoot(event.target.value)}>
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </ControlRow>
            <ControlRow label="Quality">
              <select value={chordQuality} onChange={(event) => setChordQuality(event.target.value as ChordQualityId)}>
                {QUALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ControlRow>
          </div>
        </details>
      </div>

      <div className="panel chord-finder-pads">
        <PanelHeader
          kicker={surfaceMode === 'keys' ? '2. Play it on the keys' : '2. Play it on your pads'}
          title={padRecipe || 'No playable recipe'}
          value={rankLabel(selectedShape.rank)}
        />
        <PadGrid
          selectedShape={selectedShape}
          pitchWindow={pitchWindow}
          padHighlights={chordSurfaceHighlights}
          highlightMode="chord"
          surfaceMode={surfaceMode}
          animatedPads={animatedPads}
          onPlayPad={onPlayPad}
        />
        <div className="pad-actions">
          <button type="button" className="primary-action" onClick={() => auditionChord(chordRoot, chordQuality)} disabled={playablePads.length === 0}>
            <Play size={18} />
            <span>Hear chord</span>
          </button>
          <button type="button" className="secondary-action" onClick={() => auditionChord(chordRoot, chordQuality, 34)} disabled={playablePads.length === 0}>
            <Volume2 size={18} />
            <span>Strum</span>
          </button>
          <button type="button" className="secondary-action" onClick={onAnimate} disabled={playablePads.length === 0}>
            <Music size={18} />
            <span>Flash pads</span>
          </button>
          <button type="button" className="secondary-action" onClick={() => onAddChord(chordRoot, chordQuality)} disabled={playablePads.length === 0}>
            <span>Add to progression</span>
          </button>
        </div>
        <div className="result-box">
          <strong>{describeChord(chordRoot, chordQuality)}:</strong> {padRecipe ? `press ${padRecipe}` : 'No pads fit this chord in the current 16 Levels window.'}
          {padRecipe && (
            <>
              {' '}· {selectedShape.inversion} · {rankLabel(selectedShape.rank)}
            </>
          )}
        </div>
        {missingEssentials.length > 0 && (
          <div className="result-box warning-box">
            <strong>Missing:</strong> {missingEssentials.map((tone) => `${tone.noteName} ${intervalRoleLabel(tone.interval)}`).join(', ')}. Try another original pad from the Sample control up top.
          </div>
        )}
        <RoleLegend mode="chord" surface={surfaceMode} />
      </div>

      <div className="panel chord-finder-progression">
        <PanelHeader kicker="3. Build the loop" title="Your progression" value={`${progressionShapes.length} chords`} />
        {progressionShapes.length === 0 ? (
          <div className="empty-state">
            Tap + on a chord above to start your loop, or use the starter loop below.
          </div>
        ) : (
          <div className="progression-flow" aria-label="Progression map">
            {progressionShapes.map(({ step, shape }, index) => (
              <div className={`progression-block ${rankClass(shape.rank)}`} key={step.id}>
                <div className="progression-info">
                  <span className="progression-index">{index + 1}</span>
                  <strong>{describeChord(step.root, step.quality)}</strong>
                  <small>{shape.inversion}</small>
                </div>
                <div className="progression-pad-recipe">
                  <span>Chord pads</span>
                  <b>{shape.pads.length ? shape.pads.map((pad) => `P${pad.pad}`).join(' + ') : 'retune'}</b>
                  <small>{rankLabel(shape.rank)}</small>
                </div>
                <div className="progression-actions">
                  <button
                    type="button"
                    className="secondary-action compact-action"
                    aria-label={`Play ${describeChord(step.root, step.quality)}`}
                    onClick={() => auditionChord(step.root, step.quality)}
                  >
                    Play
                  </button>
                  <button type="button" className="secondary-action compact-action" onClick={() => onMoveChord(step.id, -1)} disabled={index === 0}>
                    Up
                  </button>
                  <button type="button" className="secondary-action compact-action" onClick={() => onMoveChord(step.id, 1)} disabled={index === progressionShapes.length - 1}>
                    Down
                  </button>
                  <button type="button" className="secondary-action compact-action" onClick={() => onRemoveChord(step.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="progression-tools">
          <button type="button" className="secondary-action" onClick={addStarterLoop}>
            Add starter loop
          </button>
          {progressionShapes.length > 0 && (
            <button type="button" className="secondary-action" onClick={onClearProgression}>
              Clear progression
            </button>
          )}
        </div>

        <h3 className="mini-heading">What next?</h3>
        <div className="next-chord-grid">
          {nextChordSuggestions.map((suggestion) => {
            const shape = analyzeSixteenLevelsChord(suggestion.root, suggestion.quality, sampleRootMidi, originalPad).shapes[0]
            const pads = shape.pads.map((pad) => `P${pad.pad}`).join(' + ')
            return (
              <button
                type="button"
                className="suggestion next-card"
                key={suggestion.id}
                onClick={() => {
                  selectChord(suggestion.root, suggestion.quality)
                  void auditionChord(suggestion.root, suggestion.quality, 20)
                  onAddChord(suggestion.root, suggestion.quality)
                }}
                disabled={shape.pads.length === 0}
              >
                <span>{suggestion.category} / {suggestion.degree.number}</span>
                <strong>{describeChord(suggestion.root, suggestion.quality)}</strong>
                <small>{suggestion.reason}</small>
                <b>{pads || 'retune'}</b>
              </button>
            )
          })}
        </div>

        <details className="guide-panel play-sheet">
          <summary>MPC play sheet - bass, melody and step-by-step</summary>
          <div>
            <div className="mpc-setup-strip">
              <div className="recipe-card">
                <strong>1. Set 16 Levels</strong>
                <span>Sample {sampleNote} / original Pad {originalPad}</span>
                <b>{midiToNoteWithOctave(pitchWindow.minMidi)} to {midiToNoteWithOctave(pitchWindow.maxMidi)}</b>
              </div>
              <div className="recipe-card">
                <strong>2. Chord order</strong>
                <span>{progressionShapes.length ? 'Play each block left to right.' : 'Previewing the selected chord.'}</span>
                <b>{mpcRecipeRows.length} step{mpcRecipeRows.length === 1 ? '' : 's'}</b>
              </div>
              <div className="recipe-card">
                <strong>3. Add movement</strong>
                <span>Use bass first, then try 3-5 melody pads.</span>
                <b>{scaleLabel}</b>
              </div>
            </div>
            <div className="mpc-recipe-list">
              {mpcRecipeRows.map((step, index) => (
                <div className="mpc-recipe-step" key={step.id}>
                  <span className="progression-index">{index + 1}</span>
                  <strong>{step.chordName}</strong>
                  <small>Chord: {step.chordPads.length ? step.chordPads.map((pad) => `P${pad}`).join(' + ') : 'retune or change original pad'}</small>
                  <small>Bass: {step.bass?.pads.length ? step.bass.pads.map((pad) => `P${pad}`).join(' -> ') : (step.bass?.instruction ?? 'use the root pad')}</small>
                  <small>Melody: {step.melodyPads.map((pad) => `P${pad.pad}`).join(' -> ') || 'open Melodies for safe notes'}</small>
                </div>
              ))}
            </div>

            <h3 className="mini-heading">Bass options</h3>
            <div className="recipe-grid">
              {bassRecipes.map((recipe) => (
                <div className={`recipe-card ${recipe.status}`} key={recipe.id}>
                  <strong>{recipe.label}</strong>
                  <span>{recipe.instruction}</span>
                  <b>{recipe.pads.length ? recipe.pads.map((pad) => `P${pad}`).join(' -> ') : recipe.status}</b>
                </div>
              ))}
            </div>

            <h3 className="mini-heading">Playbook</h3>
            {playbook.length === 0 ? (
              <div className="empty-state">Add a few chords and this becomes a step-by-step chord, bass, and melody recipe.</div>
            ) : (
              <div className="playbook-list">
                {playbook.map((step, index) => (
                  <div className="playbook-card" key={step.id}>
                    <span className="progression-index">{index + 1}</span>
                    <strong>{step.chordName}</strong>
                    <small>Chord: {step.chordPads.length ? step.chordPads.map((pad) => `P${pad}`).join(' + ') : 'retune'}</small>
                    <small>Bass: {step.bass.instruction}</small>
                    <small>Melody: {step.melodyPads.map((pad) => `P${pad.pad}`).join(' -> ') || 'try the Melodies page'}</small>
                  </div>
                ))}
              </div>
            )}

            <StatusStack
              items={[
                { label: 'Window', value: `${midiToNoteWithOctave(pitchWindow.minMidi)} to ${midiToNoteWithOctave(pitchWindow.maxMidi)}` },
                { label: 'Original', value: `${sampleNote} on Pad ${originalPad}` },
              ]}
            />
          </div>
        </details>
      </div>
    </section>
  )
}
