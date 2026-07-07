import { midiToNoteName, padToMidi } from '../lib/music'
import type { PadHighlight } from '../lib/padHighlights'
import type { ChordShape, PadNumber, PitchWindow, SurfaceMode } from '../types'
import { KeyboardSurface } from './PianoKeyboard'

const MPC_PAD_LAYOUT = [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4] as PadNumber[]

interface PadGridProps {
  selectedShape: ChordShape
  pitchWindow: PitchWindow
  padHighlights?: Record<PadNumber, PadHighlight>
  highlightMode?: 'scale' | 'chord' | 'all'
  surfaceMode?: SurfaceMode
  animatedPads?: PadNumber[]
  onPlayPad: (pad: PadNumber) => void
}

export function PadGrid({
  selectedShape,
  pitchWindow,
  padHighlights,
  highlightMode = 'chord',
  surfaceMode = 'pads',
  animatedPads = [],
  onPlayPad,
}: PadGridProps) {
  const activePads = new Map(selectedShape.pads.map((pad) => [pad.pad, pad]))

  if (surfaceMode === 'keys') {
    return (
      <KeyboardSurface
        activePads={activePads}
        pitchWindow={pitchWindow}
        padHighlights={padHighlights}
        highlightMode={highlightMode}
        animatedPads={animatedPads}
        onPlayPad={onPlayPad}
      />
    )
  }

  return (
    <div className="pad-grid">
      {MPC_PAD_LAYOUT.map((pad) => {
        const active = activePads.get(pad)
        const midi = padToMidi(pitchWindow.sampleRootMidi, pitchWindow.originalPitchPad, pad)
        const highlight = padHighlights?.[pad]
        const shouldShowScale = highlightMode === 'scale' || highlightMode === 'all'
        const shouldShowChord = highlightMode === 'chord' || highlightMode === 'all'
        const classes = [
          'mpc-pad',
          active && !padHighlights ? 'active' : '',
          active && !padHighlights ? `interval-${active.interval}` : '',
          highlight?.isOriginal ? 'original' : '',
          shouldShowScale && highlight?.isSafe ? 'safe' : '',
          highlight?.isRoot ? 'root' : '',
          shouldShowChord && highlight?.isChord ? 'chord' : '',
          highlight?.melodyRole ? `melody-${highlight.melodyRole}` : '',
          animatedPads.includes(pad) ? 'pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const offset = midi - pitchWindow.sampleRootMidi
        const meta = pad === pitchWindow.originalPitchPad ? 'Original' : `${offset > 0 ? '+' : ''}${offset} st`
        return (
          <button
            type="button"
            className={classes}
            key={pad}
            onClick={() => onPlayPad(pad)}
          >
            <span className="pad-number">{pad}</span>
            <strong>{midiToNoteName(midi)}</strong>
            <small>{highlight?.chordRole && (shouldShowChord || highlight?.melodyRole) ? highlight.chordRole : meta}</small>
          </button>
        )
      })}
    </div>
  )
}
