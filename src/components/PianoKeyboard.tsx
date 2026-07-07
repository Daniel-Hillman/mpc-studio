import type { CSSProperties } from 'react'
import { midiToNoteName, midiToNoteWithOctave } from '../lib/music'
import {
  BLACK_KEY_PITCH_CLASSES,
  buildKeyboardRange,
  findPreviousWhiteKey,
  midiToPadNumber,
  positiveInterval,
  type PadHighlight,
} from '../lib/padHighlights'
import type { ChordShape, PadNumber, PitchWindow } from '../types'

export function KeyboardSurface({
  activePads,
  pitchWindow,
  padHighlights,
  highlightMode,
  animatedPads,
  onPlayPad,
}: {
  activePads: Map<PadNumber, ChordShape['pads'][number]>
  pitchWindow: PitchWindow
  padHighlights?: Record<PadNumber, PadHighlight>
  highlightMode: 'scale' | 'chord' | 'all'
  animatedPads: PadNumber[]
  onPlayPad: (pad: PadNumber) => void
}) {
  const keys = buildKeyboardRange(pitchWindow)
  const whiteKeys = keys.filter((midi) => !BLACK_KEY_PITCH_CLASSES.has(positiveInterval(midi)))
  const blackKeys = keys.filter((midi) => BLACK_KEY_PITCH_CLASSES.has(positiveInterval(midi)))
  const whiteIndexByMidi = new Map(whiteKeys.map((midi, index) => [midi, index]))
  const shouldShowScale = highlightMode === 'scale' || highlightMode === 'all'
  const shouldShowChord = highlightMode === 'chord' || highlightMode === 'all'

  function renderKey(midi: number, placement: 'white' | 'black', style?: CSSProperties) {
    const pad = midiToPadNumber(midi, pitchWindow)
    const active = pad ? activePads.get(pad) : undefined
    const highlight = pad ? padHighlights?.[pad] : undefined
    const roleLabel = highlight?.chordRole && (shouldShowChord || highlight?.melodyRole) ? highlight.chordRole : undefined
    const classes = [
      'keyboard-key',
      placement,
      pad ? 'in-window' : 'out-window',
      active && !padHighlights ? 'active' : '',
      active && !padHighlights ? `interval-${active.interval}` : '',
      highlight?.isOriginal ? 'original' : '',
      shouldShowScale && highlight?.isSafe ? 'safe' : '',
      highlight?.isRoot ? 'root' : '',
      shouldShowChord && highlight?.isChord ? 'chord' : '',
      highlight?.melodyRole ? `melody-${highlight.melodyRole}` : '',
      pad && animatedPads.includes(pad) ? 'pulse' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        type="button"
        className={classes}
        key={midi}
        disabled={!pad}
        style={style}
        onClick={() => {
          if (pad) {
            onPlayPad(pad)
          }
        }}
        aria-label={`${midiToNoteWithOctave(midi)}${pad ? ` Pad ${pad}` : ' outside 16 Levels window'}`}
      >
        <span>{midiToNoteWithOctave(midi)}</span>
        <strong>{midiToNoteName(midi)}</strong>
        <small>{roleLabel ?? (pad ? `P${pad}` : 'out')}</small>
      </button>
    )
  }

  return (
    <div className="keyboard-surface" aria-label="Keyboard view">
      <div className="keyboard-scroll">
        <div className="keyboard-frame" style={{ '--white-key-count': whiteKeys.length } as CSSProperties}>
          <div className="keyboard-white-row">
            {whiteKeys.map((midi) => renderKey(midi, 'white'))}
          </div>
          <div className="keyboard-black-layer">
            {blackKeys.map((midi) => {
              const previousWhite = findPreviousWhiteKey(midi, whiteIndexByMidi)
              if (previousWhite < 0) {
                return null
              }

              return renderKey(midi, 'black', { '--black-left': `${((previousWhite + 1) / whiteKeys.length) * 100}%` } as CSSProperties)
            })}
          </div>
        </div>
      </div>
      <div className="keyboard-caption">
        <span>{midiToNoteWithOctave(pitchWindow.minMidi)}-{midiToNoteWithOctave(pitchWindow.maxMidi)} is the active 16 Levels window</span>
        <span>Keys outside the window are visible for context only</span>
      </div>
    </div>
  )
}
