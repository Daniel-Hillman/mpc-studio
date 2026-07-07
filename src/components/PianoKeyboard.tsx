import type { CSSProperties } from 'react'
import { midiToNoteName, midiToNoteWithOctave } from '../lib/music'
import {
  BLACK_KEY_PITCH_CLASSES,
  buildKeyboardRange,
  findPreviousWhiteKey,
  keyVisual,
  midiToPadNumber,
  positiveInterval,
  type PadHighlight,
} from '../lib/padHighlights'
import { ROLE_WORDS } from '../lib/vocabulary'
import type { PadNumber, PitchWindow } from '../types'

/**
 * Piano surface where keys keep their real black/white identity.
 * Roles are shown as a colored band on the key front (gold root, rose
 * chord tone, mint in-scale), the MPC bridge is a small P1-P16 chip,
 * and keys with no pad are dimmed context.
 */
export function KeyboardSurface({
  pitchWindow,
  padHighlights,
  highlightMode,
  animatedPads,
  onPlayPad,
}: {
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

  function renderKey(midi: number, placement: 'white' | 'black', style?: CSSProperties) {
    const pad = midiToPadNumber(midi, pitchWindow)
    const highlight = pad ? padHighlights?.[pad] : undefined
    const role = pad ? keyVisual(highlight, highlightMode) : null
    const isC = positiveInterval(midi) === 0
    const classes = [
      'piano-key',
      placement,
      pad ? 'in-window' : 'no-pad',
      role ? `mark-${role}` : '',
      highlight?.isOriginal ? 'original' : '',
      pad && animatedPads.includes(pad) ? 'pulse' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const ariaLabel = pad
      ? `${midiToNoteWithOctave(midi)}, Pad ${pad}${role ? `, ${ROLE_WORDS[role]}` : ''}${highlight?.isOriginal ? ', original pitch' : ''}`
      : `${midiToNoteWithOctave(midi)}, no pad, outside 16 Levels window`

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
        aria-label={ariaLabel}
      >
        {pad && <span className="key-chip">P{pad}</span>}
        {pad && placement === 'white' && (
          <span className="key-label">{isC ? midiToNoteWithOctave(midi) : midiToNoteName(midi)}</span>
        )}
        {role && <span className="key-marker" aria-hidden="true" />}
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
        <span>Dimmed keys have no pad - context only</span>
      </div>
    </div>
  )
}
