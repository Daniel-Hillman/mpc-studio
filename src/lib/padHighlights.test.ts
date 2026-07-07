import { describe, expect, it } from 'vitest'
import { PAD_NUMBERS, createPitchWindow, padToMidi } from './music'
import {
  BLACK_KEY_PITCH_CLASSES,
  buildKeyboardRange,
  keyVisual,
  midiToPadNumber,
  positiveInterval,
  type PadHighlight,
} from './padHighlights'

const base: PadHighlight = { isSafe: false, isRoot: false, isChord: false, isOriginal: false }

describe('keyVisual', () => {
  it('returns null without a highlight', () => {
    expect(keyVisual(undefined, 'scale')).toBeNull()
    expect(keyVisual(undefined, 'chord')).toBeNull()
    expect(keyVisual(undefined, 'all')).toBeNull()
  })

  it('maps melody roles onto the unified role keys in all mode', () => {
    expect(keyVisual({ ...base, melodyRole: 'home' }, 'all')).toBe('root')
    expect(keyVisual({ ...base, melodyRole: 'strong' }, 'all')).toBe('chord')
    expect(keyVisual({ ...base, melodyRole: 'safe' }, 'all')).toBe('scale')
    expect(keyVisual({ ...base, melodyRole: 'passing' }, 'all')).toBe('passing')
    expect(keyVisual({ ...base, melodyRole: 'tension' }, 'all')).toBe('outside')
  })

  it('prioritizes root over chord over scale in chord mode', () => {
    expect(keyVisual({ ...base, isRoot: true, isChord: true, isSafe: true }, 'chord')).toBe('root')
    expect(keyVisual({ ...base, isChord: true, isSafe: true }, 'chord')).toBe('chord')
    expect(keyVisual({ ...base, isSafe: true }, 'chord')).toBe('scale')
  })

  it('shows scale context but never chord tones in scale mode', () => {
    expect(keyVisual({ ...base, isChord: true }, 'scale')).toBeNull()
    expect(keyVisual({ ...base, isSafe: true, isChord: true }, 'scale')).toBe('scale')
    expect(keyVisual({ ...base, isRoot: true }, 'scale')).toBe('root')
  })

  it('returns null for in-window notes with no role', () => {
    expect(keyVisual(base, 'scale')).toBeNull()
    expect(keyVisual(base, 'chord')).toBeNull()
    expect(keyVisual(base, 'all')).toBeNull()
  })
})

describe('keyboard range and pad mapping', () => {
  const window = createPitchWindow(48, 4)

  it('starts on a white key and spans at least two octaves', () => {
    const keys = buildKeyboardRange(window)
    expect(BLACK_KEY_PITCH_CLASSES.has(positiveInterval(keys[0]))).toBe(false)
    expect(keys[keys.length - 1] - keys[0]).toBeGreaterThanOrEqual(24)
  })

  it('round-trips every pad through midiToPadNumber', () => {
    for (const pad of PAD_NUMBERS) {
      const midi = padToMidi(window.sampleRootMidi, window.originalPitchPad, pad)
      expect(midiToPadNumber(midi, window)).toBe(pad)
    }
  })

  it('returns null for notes outside the window', () => {
    expect(midiToPadNumber(window.minMidi - 1, window)).toBeNull()
    expect(midiToPadNumber(window.maxMidi + 1, window)).toBeNull()
  })
})
