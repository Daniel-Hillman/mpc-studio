import { analyzeSixteenLevelsChord, type ScaleType } from './music'
import type { ChordQualityId, PadNumber } from '../types'

export type ChordPaletteMode = 'triads' | 'sevenths' | 'colors'

export function degreeLabel(index: number, quality: ChordQualityId): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  const base = numerals[index] ?? `${index + 1}`
  if (quality === 'dim') return `${base.toLowerCase()}dim`
  if (quality.includes('min')) return base.toLowerCase()
  return base
}

export function degreeNumber(index: number): string {
  return ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][index] ?? `${index + 1}th`
}

export function degreeUse(index: number): string {
  return ['home', 'passing', 'color', 'fourth', 'fifth', 'relative', 'turnaround'][index] ?? 'color'
}

export function paletteModeLabel(mode: ChordPaletteMode): string {
  if (mode === 'triads') return 'Triads'
  if (mode === 'colors') return 'Color chords'
  return '7ths'
}

export function degreeQuality(index: number, scaleType: ScaleType, mode: ChordPaletteMode): ChordQualityId {
  const minorishScales: ScaleType[] = ['minor', 'minorPent', 'blues', 'dorian', 'phrygian']
  const isMinorish = minorishScales.includes(scaleType)

  if (mode === 'triads') {
    const majorTriads: ChordQualityId[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
    const minorTriads: ChordQualityId[] = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
    return (isMinorish ? minorTriads : majorTriads)[index] ?? 'maj'
  }

  if (mode === 'colors') {
    const majorColors: ChordQualityId[] = ['maj9', 'min7', 'min7', 'maj9', 'dom13', 'min9', 'dim']
    const minorColors: ChordQualityId[] = ['min9', 'dim', 'maj7', 'min11', 'min7', 'maj9', 'dom9']
    return (isMinorish ? minorColors : majorColors)[index] ?? 'maj7'
  }

  const majorSevenths: ChordQualityId[] = ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'dim']
  const minorSevenths: ChordQualityId[] = ['min7', 'dim', 'maj7', 'min7', 'min7', 'maj7', 'dom7']
  return (isMinorish ? minorSevenths : majorSevenths)[index] ?? 'maj7'
}

export function buildCoachStageSuggestions(
  diatonicChords: { root: string; quality: ChordQualityId }[],
  scaleType: ScaleType,
  paletteMode: ChordPaletteMode,
  sampleRootMidi: number,
  originalPad: PadNumber,
) {
  return [
    { stage: 'Start', degreeIndex: 0, label: 'home' },
    { stage: 'Add movement', degreeIndex: 5, label: 'emotional' },
    { stage: 'Add tension', degreeIndex: 4, label: 'pull home' },
    { stage: 'Resolve/loop', degreeIndex: 3, label: 'lift' },
  ].map((item) => {
    const chord = diatonicChords[item.degreeIndex] ?? diatonicChords[0]
    const quality = degreeQuality(item.degreeIndex, scaleType, paletteMode)
    const shape = analyzeSixteenLevelsChord(chord.root, quality, sampleRootMidi, originalPad).shapes[0]
    return {
      id: `${item.stage}-${chord.root}-${quality}`,
      stage: item.stage,
      label: item.label,
      root: chord.root,
      quality,
      shape,
      pads: shape.pads.length ? shape.pads.map((pad) => `P${pad.pad}`).join(' + ') : 'retune',
    }
  })
}
