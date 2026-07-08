import { describe, expect, it } from 'vitest'
import { fft, magnitudeSpectrum } from './fft'
import {
  FRAME_SIZE,
  computeChromagram,
  confidenceBand,
  detectKey,
  hannWindow,
  keyLabel,
  preprocessAudio,
  rankKeys,
  relativeKey,
} from './keyDetect'
import { ROOT_NOTES } from './music'

const RATE = 11025

function sineMix(frequencies: number[], seconds: number, sampleRate = RATE): Float32Array {
  const samples = new Float32Array(Math.floor(seconds * sampleRate))
  for (let index = 0; index < samples.length; index += 1) {
    let value = 0
    for (const frequency of frequencies) {
      value += Math.sin((2 * Math.PI * frequency * index) / sampleRate)
    }
    samples[index] = value / frequencies.length
  }
  return samples
}

describe('fft', () => {
  it('peaks at the right bin for a pure 440 Hz sine', () => {
    const real = new Float64Array(FRAME_SIZE)
    const imag = new Float64Array(FRAME_SIZE)
    const window = hannWindow(FRAME_SIZE)
    for (let index = 0; index < FRAME_SIZE; index += 1) {
      real[index] = Math.sin((2 * Math.PI * 440 * index) / RATE) * window[index]
    }
    fft(real, imag)
    const magnitudes = magnitudeSpectrum(real, imag)
    let peakBin = 0
    for (let bin = 1; bin < magnitudes.length; bin += 1) {
      if (magnitudes[bin] > magnitudes[peakBin]) {
        peakBin = bin
      }
    }
    const expectedBin = Math.round((440 / RATE) * FRAME_SIZE)
    expect(Math.abs(peakBin - expectedBin)).toBeLessThanOrEqual(1)
  })

  it('rejects non power-of-two lengths', () => {
    expect(() => fft(new Float64Array(1000), new Float64Array(1000))).toThrow()
  })
})

describe('chromagram', () => {
  it('peaks on C, E and G for a C major triad', () => {
    const samples = sineMix([261.63, 329.63, 392.0], 2)
    const chroma = computeChromagram(samples, RATE)
    const rankedBins = [...chroma.keys()].sort((a, b) => chroma[b] - chroma[a])
    expect(rankedBins.slice(0, 3).sort((a, b) => a - b)).toEqual([0, 4, 7])
  })

  it('reports progress up to 100', () => {
    const samples = sineMix([220], 3)
    const updates: number[] = []
    computeChromagram(samples, RATE, (pct) => updates.push(pct))
    expect(updates.length).toBeGreaterThan(0)
    expect(updates[updates.length - 1]).toBe(100)
  })
})

describe('key ranking', () => {
  it('ranks C major first for a C major scale mix', () => {
    // C D E F G A B across two octaves, weighted toward the tonic triad
    const samples = sineMix([261.63, 261.63, 293.66, 329.63, 329.63, 349.23, 392.0, 392.0, 440.0, 493.88, 523.25], 3)
    const chroma = computeChromagram(samples, RATE)
    const detection = detectKey(chroma)
    expect(keyLabel(detection.ranked[0])).toBe('C Major')
    const topFive = detection.ranked.slice(0, 5).map(keyLabel)
    expect(topFive).toContain('A Minor')
  })

  it('ranks A minor above A major for an A natural minor mix', () => {
    // A B C D E F G with tonic emphasis
    const samples = sineMix([220, 220, 246.94, 261.63, 293.66, 329.63, 329.63, 349.23, 392.0, 440.0], 3)
    const chroma = computeChromagram(samples, RATE)
    const ranked = rankKeys(chroma)
    const aMinorIndex = ranked.findIndex((key) => key.root === 'A' && key.mode === 'minor')
    const aMajorIndex = ranked.findIndex((key) => key.root === 'A' && key.mode === 'major')
    expect(aMinorIndex).toBeLessThan(aMajorIndex)
    expect(aMinorIndex).toBeLessThanOrEqual(2)
  })

  it('has low confidence on noise', () => {
    const samples = new Float32Array(RATE * 2)
    let seed = 42
    for (let index = 0; index < samples.length; index += 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      samples[index] = seed / 2147483648 - 1
    }
    const chroma = computeChromagram(samples, RATE)
    const detection = detectKey(chroma)
    expect(detection.confidence).toBeLessThan(0.4)
  })
})

describe('helpers', () => {
  it('uses the app root-note spellings', () => {
    const chroma = new Float64Array(12)
    chroma[1] = 1 // C#/Db pitch class
    chroma[5] = 0.8
    chroma[8] = 0.9
    const ranked = rankKeys(chroma)
    for (const key of ranked) {
      expect(ROOT_NOTES).toContain(key.root)
    }
  })

  it('pairs relative keys both ways', () => {
    expect(relativeKey('C', 'major')).toEqual({ root: 'A', mode: 'minor' })
    expect(relativeKey('A', 'minor')).toEqual({ root: 'C', mode: 'major' })
    expect(relativeKey('Eb', 'major')).toEqual({ root: 'C', mode: 'minor' })
  })

  it('bands confidence honestly', () => {
    expect(confidenceBand(0.9)).toBe('Strong match')
    expect(confidenceBand(0.5)).toBe('Likely')
    expect(confidenceBand(0.1)).toBe('Ambiguous')
  })

  it('downmixes, decimates and truncates in preprocess', () => {
    const seconds = 2
    const inputRate = 44100
    const left = new Float32Array(inputRate * seconds).fill(0.5)
    const right = new Float32Array(inputRate * seconds).fill(-0.5)
    const { samples, sampleRate, truncated } = preprocessAudio([left, right], inputRate)
    expect(truncated).toBe(false)
    expect(sampleRate).toBeCloseTo(11025)
    expect(samples.length).toBe(Math.floor((inputRate * seconds) / 4))
    expect(Math.abs(samples[100])).toBeLessThan(1e-6)

    const long = new Float32Array(inputRate * 91)
    const result = preprocessAudio([long], inputRate)
    expect(result.truncated).toBe(true)
    expect(result.samples.length).toBe(Math.floor((inputRate * 90) / 4))
  })
})
