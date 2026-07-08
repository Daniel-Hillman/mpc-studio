import type { InstrumentPreset } from '../types'

/**
 * Preset definitions for the Tone.js voice racks. Pure data - this module
 * must never import Tone so the UI can read labels without pulling the
 * audio engine into the main bundle.
 */
export type LayerKind = 'synth' | 'fm' | 'am'

export interface PresetLayer {
  /** Which Tone voice class backs this layer: Synth, FMSynth or AMSynth. */
  kind: LayerKind
  /** Constructor options for the voice (oscillator, envelope, ...). */
  options: Record<string, unknown>
  /** Layer trim in dB relative to the rack. */
  gainDb: number
  /** Octave offset applied to incoming notes (e.g. -1 for a sub layer). */
  octaveShift?: number
  /** Static detune in cents for stacked/thickened layers. */
  detuneCents?: number
}

export interface PresetFx {
  distortion?: { amount: number; wet: number }
  chorus?: { frequency: number; delayTime: number; depth: number; wet: number }
  vibrato?: { frequency: number; depth: number; wet: number }
  delay?: { time: string; feedback: number; wet: number }
  reverb?: { decay: number; preDelay: number; wet: number }
}

export interface PresetDefinition {
  id: InstrumentPreset
  label: string
  /** 1-3 stacked voice layers. */
  layers: PresetLayer[]
  /** Lowpass filter into the chord bus. */
  filter: { frequency: number; Q?: number }
  fx: PresetFx
  /** Loudness normalization trim for the whole rack, in dB. */
  gainDb: number
  /** How long to keep a retired rack alive so releases can ring out. */
  releaseTailSec: number
  /** Max simultaneous notes fed to the rack (lowest first) - e.g. 2 keeps a bass mono-ish. */
  noteCap?: number
}

export const PRESET_DEFINITIONS: Record<InstrumentPreset, PresetDefinition> = {
  warmKeys: {
    id: 'warmKeys',
    label: 'Warm Keys',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.022, decay: 0.18, sustain: 0.5, release: 1.05 },
        },
        gainDb: 0,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.03, decay: 0.25, sustain: 0.4, release: 1.2 },
        },
        gainDb: -14,
        octaveShift: 1,
      },
    ],
    filter: { frequency: 4200 },
    fx: {
      distortion: { amount: 0.05, wet: 0.03 },
      chorus: { frequency: 1.2, delayTime: 2.5, depth: 0.18, wet: 0.18 },
      delay: { time: '8n', feedback: 0.18, wet: 0.05 },
      reverb: { decay: 2.6, preDelay: 0.02, wet: 0.18 },
    },
    gainDb: -2,
    releaseTailSec: 1.5,
  },
  lushPad: {
    id: 'lushPad',
    label: 'Lush Pad',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
          envelope: { attack: 0.35, decay: 0.4, sustain: 0.75, release: 2.8 },
        },
        gainDb: 0,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'fatsine', count: 2, spread: 12 },
          envelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 3 },
        },
        gainDb: -6,
        detuneCents: -7,
      },
    ],
    filter: { frequency: 2800, Q: 0.5 },
    fx: {
      chorus: { frequency: 0.6, delayTime: 3.5, depth: 0.5, wet: 0.3 },
      delay: { time: '4n', feedback: 0.25, wet: 0.12 },
      reverb: { decay: 4.5, preDelay: 0.03, wet: 0.4 },
    },
    gainDb: -6,
    releaseTailSec: 3,
  },
  dustyEp: {
    id: 'dustyEp',
    label: 'Dusty EP',
    layers: [
      {
        kind: 'fm',
        options: {
          harmonicity: 3.01,
          modulationIndex: 8,
          oscillator: { type: 'sine' },
          modulation: { type: 'sine' },
          envelope: { attack: 0.008, decay: 0.6, sustain: 0.25, release: 1.2 },
          modulationEnvelope: { attack: 0.006, decay: 0.4, sustain: 0.15, release: 0.8 },
        },
        gainDb: 0,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.15, release: 0.9 },
        },
        gainDb: -16,
      },
    ],
    filter: { frequency: 3400 },
    fx: {
      distortion: { amount: 0.15, wet: 0.18 },
      vibrato: { frequency: 5.2, depth: 0.12, wet: 0.35 },
      delay: { time: '8n', feedback: 0.15, wet: 0.06 },
      reverb: { decay: 2.2, preDelay: 0.02, wet: 0.2 },
    },
    gainDb: -3,
    releaseTailSec: 1.5,
  },
  softPluck: {
    id: 'softPluck',
    label: 'Soft Pluck',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.004, decay: 0.16, sustain: 0.08, release: 0.5 },
        },
        gainDb: 0,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.004, decay: 0.1, sustain: 0.02, release: 0.3 },
        },
        gainDb: -18,
        octaveShift: 1,
      },
    ],
    filter: { frequency: 5200 },
    fx: {
      chorus: { frequency: 1.5, delayTime: 2, depth: 0.2, wet: 0.06 },
      delay: { time: '8n.', feedback: 0.28, wet: 0.22 },
      reverb: { decay: 1.8, preDelay: 0.01, wet: 0.14 },
    },
    gainDb: -2,
    releaseTailSec: 1,
  },
  deepBass: {
    id: 'deepBass',
    label: 'Deep Bass',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.008, decay: 0.18, sustain: 0.6, release: 0.5 },
        },
        gainDb: 0,
        octaveShift: -1,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'square' },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.45, release: 0.4 },
        },
        gainDb: -10,
      },
    ],
    filter: { frequency: 700, Q: 0.8 },
    fx: {
      distortion: { amount: 0.2, wet: 0.25 },
      reverb: { decay: 1.2, preDelay: 0.01, wet: 0.03 },
    },
    gainDb: 0,
    releaseTailSec: 0.8,
    noteCap: 2,
  },
  cleanSine: {
    id: 'cleanSine',
    label: 'Clean Sine',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.018, decay: 0.12, sustain: 0.44, release: 0.86 },
        },
        gainDb: 0,
      },
    ],
    filter: { frequency: 6500 },
    fx: {
      delay: { time: '8n', feedback: 0.12, wet: 0.03 },
      reverb: { decay: 1.6, preDelay: 0.02, wet: 0.1 },
    },
    gainDb: -1,
    releaseTailSec: 1,
  },
  glassBells: {
    id: 'glassBells',
    label: 'Glass Bells',
    layers: [
      {
        kind: 'am',
        options: {
          harmonicity: 2.5,
          oscillator: { type: 'sine' },
          modulation: { type: 'square' },
          envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 2.2 },
        },
        gainDb: 0,
      },
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.002, decay: 1, sustain: 0, release: 1.8 },
        },
        gainDb: -12,
        octaveShift: 1,
      },
    ],
    filter: { frequency: 6000 },
    fx: {
      chorus: { frequency: 0.8, delayTime: 3, depth: 0.3, wet: 0.12 },
      delay: { time: '4n', feedback: 0.35, wet: 0.28 },
      reverb: { decay: 5, preDelay: 0.03, wet: 0.35 },
    },
    gainDb: -4,
    releaseTailSec: 3,
  },
  warmBrass: {
    id: 'warmBrass',
    label: 'Warm Brass',
    layers: [
      {
        kind: 'synth',
        options: {
          oscillator: { type: 'fatsawtooth', count: 2, spread: 12 },
          envelope: { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.6 },
        },
        gainDb: 0,
      },
    ],
    filter: { frequency: 2200, Q: 1 },
    fx: {
      distortion: { amount: 0.1, wet: 0.12 },
      chorus: { frequency: 1, delayTime: 2.5, depth: 0.25, wet: 0.12 },
      reverb: { decay: 1.8, preDelay: 0.02, wet: 0.12 },
    },
    gainDb: -3,
    releaseTailSec: 1,
  },
}

export const PRESET_ORDER: InstrumentPreset[] = [
  'warmKeys',
  'lushPad',
  'dustyEp',
  'softPluck',
  'deepBass',
  'cleanSine',
  'glassBells',
  'warmBrass',
]
