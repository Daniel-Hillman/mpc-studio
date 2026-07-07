import {
  PAD_NUMBERS,
  getChordDefinition,
  intervalRoleLabel,
  midiToNoteName,
  noteNameToMidi,
  padToMidi,
  pitchClass,
} from './music'
import { MELODY_ROLE_TO_KEY, melodyRoleFaceWord, type NoteRoleKey } from './vocabulary'
import type { ChordQualityId, ChordShape, MelodyPad, MelodyPadRole, PadNumber, PitchWindow } from '../types'

export type PadHighlight = {
  isSafe: boolean
  isRoot: boolean
  isChord: boolean
  isOriginal: boolean
  chordRole?: string
  melodyRole?: MelodyPadRole
}

export const BLACK_KEY_PITCH_CLASSES = new Set([1, 3, 6, 8, 10])

export function positiveInterval(interval: number): number {
  return ((interval % 12) + 12) % 12
}

export type KeyRole = NoteRoleKey | null

/**
 * Resolves the single visual role a keyboard key should show.
 * Priority: melody role (in "all" mode) > root > chord tone > in scale.
 * In chord mode, non-chord scale notes still show the scale marker for context.
 */
export function keyVisual(highlight: PadHighlight | undefined, mode: 'scale' | 'chord' | 'all'): KeyRole {
  if (!highlight) {
    return null
  }
  if (mode === 'all' && highlight.melodyRole) {
    return MELODY_ROLE_TO_KEY[highlight.melodyRole]
  }
  if (highlight.isRoot) {
    return 'root'
  }
  if (mode === 'chord' && highlight.isChord) {
    return 'chord'
  }
  if (highlight.isSafe && (mode === 'scale' || mode === 'chord')) {
    return 'scale'
  }
  return null
}

export function buildChordToneRoles(chordRoot: string, chordQuality: ChordQualityId): Map<number, string> {
  const definition = getChordDefinition(chordQuality)
  const intervals = [...definition.coreIntervals, ...definition.colorIntervals]
  const rootMidi = noteNameToMidi(chordRoot, 3)
  return new Map(intervals.map((interval) => [pitchClass(midiToNoteName(rootMidi + interval)), intervalRoleLabel(interval)]))
}

export function buildPadHighlights(
  scaleNotes: string[],
  keyRoot: string,
  chordToneRoles: Map<number, string>,
  sampleRootMidi: number,
  originalPad: PadNumber,
): Record<PadNumber, PadHighlight> {
  const safePitchClasses = new Set(scaleNotes.map(pitchClass))
  const rootPitch = pitchClass(keyRoot)

  return PAD_NUMBERS.reduce(
    (map, pad) => {
      const midi = padToMidi(sampleRootMidi, originalPad, pad)
      const note = midiToNoteName(midi)
      const notePitch = pitchClass(note)
      map[pad] = {
        isSafe: safePitchClasses.has(notePitch),
        isRoot: notePitch === rootPitch,
        isChord: chordToneRoles.has(notePitch),
        isOriginal: pad === originalPad,
        chordRole: chordToneRoles.get(notePitch),
      }
      return map
    },
    {} as Record<PadNumber, PadHighlight>,
  )
}

export function buildChordShapeHighlights(selectedShape: ChordShape, originalPad: PadNumber): Record<PadNumber, PadHighlight> {
  const activePads = new Map(selectedShape.pads.map((pad) => [pad.pad, pad]))
  return PAD_NUMBERS.reduce(
    (map, pad) => {
      const active = activePads.get(pad)
      map[pad] = {
        isSafe: false,
        isRoot: Boolean(active && positiveInterval(active.interval) === 0),
        isChord: Boolean(active),
        isOriginal: pad === originalPad,
        chordRole: active ? intervalRoleLabel(active.interval) : undefined,
      }
      return map
    },
    {} as Record<PadNumber, PadHighlight>,
  )
}

export function buildMelodyHighlights(melodyPads: MelodyPad[], originalPad: PadNumber): Record<PadNumber, PadHighlight> {
  return melodyPads.reduce(
    (map, pad) => {
      map[pad.pad] = {
        isSafe: pad.role === 'safe' || pad.role === 'passing',
        isRoot: pad.role === 'home',
        isChord: pad.role === 'strong',
        isOriginal: pad.pad === originalPad,
        chordRole: melodyRoleFaceWord(pad.role),
        melodyRole: pad.role,
      }
      return map
    },
    {} as Record<PadNumber, PadHighlight>,
  )
}

export function buildKeyboardRange(pitchWindow: PitchWindow): number[] {
  let firstMidi = pitchWindow.minMidi
  while (BLACK_KEY_PITCH_CLASSES.has(positiveInterval(firstMidi))) {
    firstMidi -= 1
  }

  let lastMidi = pitchWindow.maxMidi
  if (lastMidi - firstMidi < 24) {
    lastMidi = firstMidi + 24
  }

  return Array.from({ length: lastMidi - firstMidi + 1 }, (_, index) => firstMidi + index)
}

export function findPreviousWhiteKey(midi: number, whiteIndexByMidi: Map<number, number>): number {
  for (let candidate = midi - 1; candidate >= midi - 2; candidate -= 1) {
    const index = whiteIndexByMidi.get(candidate)
    if (index !== undefined) {
      return index
    }
  }

  return -1
}

export function midiToPadNumber(midi: number, pitchWindow: PitchWindow): PadNumber | null {
  const pad = midi - pitchWindow.sampleRootMidi + pitchWindow.originalPitchPad
  return PAD_NUMBERS.includes(pad as PadNumber) ? (pad as PadNumber) : null
}
