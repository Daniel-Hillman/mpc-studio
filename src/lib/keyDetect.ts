import { fft, magnitudeSpectrum } from './fft'
import { ROOT_NOTES } from './music'

/**
 * In-browser musical key detection.
 * Pipeline: downmix + decimate -> Hann-windowed FFT frames -> 12-bin
 * chromagram (55-2000 Hz) -> correlation against Krumhansl-Kessler and
 * Temperley key profiles (averaged) -> ranked keys with an honest
 * confidence derived from the margin between the top two candidates.
 */

export const KEY_DETECT_TARGET_RATE = 11025
export const KEY_DETECT_MAX_SECONDS = 90
export const FRAME_SIZE = 4096
export const HOP_SIZE = 2048
const MIN_FREQ = 55
const MAX_FREQ = 2000

export type KeyMode = 'major' | 'minor'

export interface KeyScore {
  root: string
  mode: KeyMode
  score: number
}

export interface KeyDetection {
  ranked: KeyScore[]
  /** 0..1 margin-based confidence in the top candidate. */
  confidence: number
  /** True when the top two keys are a relative major/minor pair within a small margin. */
  relativeAmbiguity: boolean
}

const KRUMHANSL_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KRUMHANSL_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
const TEMPERLEY_MAJOR = [5, 2, 3.5, 2, 4.5, 4, 2, 4.5, 2, 3.5, 1.5, 4]
const TEMPERLEY_MINOR = [5, 2, 3.5, 4.5, 2, 4, 2, 4.5, 3.5, 2, 1.5, 4]

/** Downmix to mono and decimate to ~11 kHz; caps at the first 90 seconds. */
export function preprocessAudio(
  channels: Float32Array[],
  sampleRate: number,
): { samples: Float32Array; sampleRate: number; truncated: boolean } {
  const maxInputSamples = Math.min(channels[0].length, Math.floor(sampleRate * KEY_DETECT_MAX_SECONDS))
  const truncated = channels[0].length > maxInputSamples
  const factor = Math.max(1, Math.round(sampleRate / KEY_DETECT_TARGET_RATE))
  const outRate = sampleRate / factor
  const outLength = Math.floor(maxInputSamples / factor)
  const samples = new Float32Array(outLength)

  for (let outIndex = 0; outIndex < outLength; outIndex += 1) {
    const start = outIndex * factor
    let sum = 0
    for (let offset = 0; offset < factor; offset += 1) {
      for (const channel of channels) {
        sum += channel[start + offset]
      }
    }
    samples[outIndex] = sum / (factor * channels.length)
  }

  return { samples, sampleRate: outRate, truncated }
}

export function hannWindow(size: number): Float64Array {
  const window = new Float64Array(size)
  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)))
  }
  return window
}

/** 12-bin chromagram normalized so the strongest bin is 1. */
export function computeChromagram(
  samples: Float32Array,
  sampleRate: number,
  onProgress?: (pct: number) => void,
): Float64Array {
  const chroma = new Float64Array(12)
  if (samples.length < FRAME_SIZE) {
    return chroma
  }

  const window = hannWindow(FRAME_SIZE)
  const real = new Float64Array(FRAME_SIZE)
  const imag = new Float64Array(FRAME_SIZE)
  const frameCount = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  const binHz = sampleRate / FRAME_SIZE
  const minBin = Math.max(1, Math.ceil(MIN_FREQ / binHz))
  const maxBin = Math.min(FRAME_SIZE >> 1, Math.floor(MAX_FREQ / binHz))

  for (let frame = 0; frame < frameCount; frame += 1) {
    const offset = frame * HOP_SIZE
    for (let index = 0; index < FRAME_SIZE; index += 1) {
      real[index] = samples[offset + index] * window[index]
      imag[index] = 0
    }
    fft(real, imag)
    const magnitudes = magnitudeSpectrum(real, imag)

    for (let bin = minBin; bin <= maxBin; bin += 1) {
      const frequency = bin * binHz
      const midi = Math.round(12 * Math.log2(frequency / 440) + 69)
      const pitchClass = ((midi % 12) + 12) % 12
      chroma[pitchClass] += magnitudes[bin]
    }

    if (onProgress && frame % 32 === 0) {
      onProgress(Math.round((frame / frameCount) * 100))
    }
  }

  const peak = Math.max(...chroma)
  if (peak > 0) {
    for (let index = 0; index < 12; index += 1) {
      chroma[index] /= peak
    }
  }
  onProgress?.(100)
  return chroma
}

function pearson(chroma: ArrayLike<number>, profile: number[], rotation: number): number {
  const n = 12
  let chromaMean = 0
  let profileMean = 0
  for (let index = 0; index < n; index += 1) {
    chromaMean += chroma[index]
    profileMean += profile[index]
  }
  chromaMean /= n
  profileMean /= n

  let covariance = 0
  let chromaVariance = 0
  let profileVariance = 0
  for (let index = 0; index < n; index += 1) {
    const chromaDelta = chroma[(index + rotation) % 12] - chromaMean
    const profileDelta = profile[index] - profileMean
    covariance += chromaDelta * profileDelta
    chromaVariance += chromaDelta * chromaDelta
    profileVariance += profileDelta * profileDelta
  }

  const denominator = Math.sqrt(chromaVariance * profileVariance)
  return denominator === 0 ? 0 : covariance / denominator
}

/** All 24 keys ranked by averaged Krumhansl + Temperley correlation. */
export function rankKeys(chroma: ArrayLike<number>): KeyScore[] {
  const scores: KeyScore[] = []
  for (let rotation = 0; rotation < 12; rotation += 1) {
    const majorScore = (pearson(chroma, KRUMHANSL_MAJOR, rotation) + pearson(chroma, TEMPERLEY_MAJOR, rotation)) / 2
    const minorScore = (pearson(chroma, KRUMHANSL_MINOR, rotation) + pearson(chroma, TEMPERLEY_MINOR, rotation)) / 2
    scores.push({ root: ROOT_NOTES[rotation], mode: 'major', score: majorScore })
    scores.push({ root: ROOT_NOTES[rotation], mode: 'minor', score: minorScore })
  }
  return scores.sort((a, b) => b.score - a.score)
}

export function relativeKey(root: string, mode: KeyMode): { root: string; mode: KeyMode } {
  const pitchClass = ROOT_NOTES.indexOf(root)
  if (mode === 'major') {
    return { root: ROOT_NOTES[(pitchClass + 9) % 12], mode: 'minor' }
  }
  return { root: ROOT_NOTES[(pitchClass + 3) % 12], mode: 'major' }
}

export function detectKey(chroma: ArrayLike<number>): KeyDetection {
  const ranked = rankKeys(chroma)
  const margin = ranked[0].score - ranked[1].score
  // Margin says how clearly the winner beats the runner-up; the absolute
  // correlation says whether the audio resembles any key at all (noise
  // and drums score low across the board and must not look confident).
  const marginFactor = Math.max(0, Math.min(1, margin / 0.08))
  const qualityFactor = Math.max(0, Math.min(1, ranked[0].score / 0.6))
  const confidence = marginFactor * qualityFactor
  const relative = relativeKey(ranked[0].root, ranked[0].mode)
  const relativeAmbiguity =
    ranked[1].root === relative.root && ranked[1].mode === relative.mode && margin < 0.05
  return { ranked, confidence, relativeAmbiguity }
}

export function confidenceBand(confidence: number): 'Strong match' | 'Likely' | 'Ambiguous' {
  if (confidence >= 0.7) {
    return 'Strong match'
  }
  if (confidence >= 0.4) {
    return 'Likely'
  }
  return 'Ambiguous'
}

export function keyLabel(key: { root: string; mode: KeyMode }): string {
  return `${key.root} ${key.mode === 'major' ? 'Major' : 'Minor'}`
}
