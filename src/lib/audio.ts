import * as Tone from 'tone'
import { ticksToSeconds } from './music'
import { PRESET_DEFINITIONS, type PresetDefinition, type PresetLayer } from './audioPresets'
import type { AudioFeel, InstrumentPreset, Pattern } from '../types'

type DrumLane = 'kick' | 'snare' | 'hat' | 'ghost'

export interface PlayMidiOptions {
  duration?: string
  velocity?: number
  strumMs?: number
  randomizeOrder?: boolean
}

interface HumanizedNoteEvent {
  midi: number
  timeOffsetMs: number
  velocity: number
}

const FEEL_SETTINGS: Record<AudioFeel, { timingMs: number; velocityRange: number; spreadMinMs: number; spreadMaxMs: number; randomizeOrder: boolean }> = {
  tight: { timingMs: 0, velocityRange: 0, spreadMinMs: 0, spreadMaxMs: 0, randomizeOrder: false },
  natural: { timingMs: 14, velocityRange: 0.08, spreadMinMs: 18, spreadMaxMs: 42, randomizeOrder: false },
  loose: { timingMs: 26, velocityRange: 0.16, spreadMinMs: 28, spreadMaxMs: 62, randomizeOrder: true },
}

interface RackLayer {
  poly: Tone.PolySynth
  octaveShift: number
  detuneCents: number
}

interface VoiceRack {
  id: InstrumentPreset
  layers: RackLayer[]
  nodes: { dispose: () => void }[]
  disposed: boolean
}

export class StudioAudio {
  private rack: VoiceRack | null = null
  private chordBus: Tone.Volume | null = null
  private kick: Tone.MembraneSynth | null = null
  private snare: Tone.NoiseSynth | null = null
  private hat: Tone.NoiseSynth | null = null
  private limiter: Tone.Limiter | null = null
  private master: Tone.Volume | null = null
  private preset: InstrumentPreset = 'warmKeys'
  private feel: AudioFeel = 'natural'
  private started = false

  async start() {
    await Tone.start()
    Tone.getContext().lookAhead = 0.02

    if (this.started) {
      return
    }
    this.started = true

    this.limiter = new Tone.Limiter(-3).toDestination()
    const compressor = new Tone.Compressor({
      threshold: -18,
      ratio: 2.5,
      attack: 0.006,
      release: 0.16,
    }).connect(this.limiter)
    this.master = new Tone.Volume(-11).connect(compressor)
    this.chordBus = new Tone.Volume(-8).connect(this.master)
    const drumBus = new Tone.Volume(-8).connect(this.master)
    const hatFilter = new Tone.Filter(7200, 'highpass').connect(drumBus)

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.036,
      octaves: 7,
      envelope: { attack: 0.002, decay: 0.42, sustain: 0.02, release: 0.1 },
      volume: -8,
    }).connect(drumBus)

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0.02, release: 0.09 },
      volume: -13,
    }).connect(drumBus)

    this.hat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.018 },
      volume: -20,
    }).connect(hatFilter)

    this.rack = this.buildRack(PRESET_DEFINITIONS[this.preset])
  }

  setInstrumentPreset(preset: InstrumentPreset) {
    if (preset === this.preset && this.rack) {
      return
    }

    this.preset = preset
    if (!this.started || !this.chordBus) {
      return
    }

    const previous = this.rack
    this.rack = this.buildRack(PRESET_DEFINITIONS[preset])
    if (previous) {
      this.retireRack(previous)
    }
  }

  setAudioFeel(feel: AudioFeel) {
    this.feel = feel
  }

  playMidiNotes(midiNotes: number[], durationOrOptions: string | PlayMidiOptions = '2n', velocity = 0.78, strumMs = 0) {
    const rack = this.rack
    if (!rack) {
      return
    }

    const options = typeof durationOrOptions === 'string' ? { duration: durationOrOptions, velocity, strumMs } : durationOrOptions
    const duration = options.duration ?? '2n'
    const requestedVelocity = options.velocity ?? velocity
    const noteCap = PRESET_DEFINITIONS[rack.id].noteCap
    const notes = noteCap && midiNotes.length > noteCap ? [...midiNotes].sort((a, b) => a - b).slice(0, noteCap) : midiNotes
    const safeVelocity = Math.min(0.62, requestedVelocity / Math.sqrt(Math.max(1, notes.length / 2)))
    const feel = FEEL_SETTINGS[this.feel]
    const spreadMs = options.strumMs ?? spreadForChord(notes.length, feel.spreadMinMs, feel.spreadMaxMs)
    const events = humanizeNoteEvents(notes, feel.timingMs, feel.velocityRange, spreadMs, safeVelocity, options.randomizeOrder ?? feel.randomizeOrder)
    const now = Tone.now() + 0.05
    events.forEach((event) => {
      rack.layers.forEach((layer) => {
        const midi = event.midi + layer.octaveShift * 12
        const hz = Tone.Frequency(midi, 'midi').toFrequency() * Math.pow(2, layer.detuneCents / 1200)
        layer.poly.triggerAttackRelease(hz, duration, now + event.timeOffsetMs / 1000, event.velocity)
      })
    })
  }

  playDrum(lane: DrumLane, time = Tone.now(), velocity = 0.85) {
    if (lane === 'kick') {
      this.kick?.triggerAttackRelease('C1', '8n', time, Math.min(0.78, velocity))
    } else if (lane === 'snare' || lane === 'ghost') {
      this.snare?.triggerAttackRelease('16n', time, lane === 'ghost' ? velocity * 0.34 : Math.min(0.68, velocity))
    } else {
      this.hat?.triggerAttackRelease('32n', time, velocity * 0.32)
    }
  }

  playPattern(pattern: Pattern, bpm: number) {
    const now = Tone.now() + 0.06

    pattern.events.forEach((event) => {
      const lane = event.laneId as DrumLane
      const repeats = event.ratchet ?? 1
      const slice = ticksToSeconds(event.durationTicks, bpm) / repeats

      for (let index = 0; index < repeats; index += 1) {
        this.playDrum(lane, now + ticksToSeconds(event.tick, bpm) + slice * index, event.velocity)
      }
    })
  }

  /** Builds a fresh self-contained voice rack: layers -> per-layer trim -> FX chain -> rack trim -> chord bus. */
  private buildRack(definition: PresetDefinition): VoiceRack {
    const nodes: { dispose: () => void }[] = []
    const output = new Tone.Gain(Tone.dbToGain(definition.gainDb)).connect(this.chordBus as Tone.Volume)
    nodes.push(output)

    const filter = new Tone.Filter({
      frequency: definition.filter.frequency,
      type: 'lowpass',
      Q: definition.filter.Q ?? 1,
    }).connect(output)
    nodes.push(filter)

    let entry: Tone.ToneAudioNode = filter
    const fx = definition.fx
    if (fx.reverb) {
      const reverb = new Tone.Reverb({ decay: fx.reverb.decay, preDelay: fx.reverb.preDelay, wet: fx.reverb.wet }).connect(entry)
      nodes.push(reverb)
      entry = reverb
    }
    if (fx.delay) {
      const delay = new Tone.FeedbackDelay({ delayTime: fx.delay.time, feedback: fx.delay.feedback, wet: fx.delay.wet }).connect(entry)
      nodes.push(delay)
      entry = delay
    }
    if (fx.vibrato) {
      const vibrato = new Tone.Vibrato({ frequency: fx.vibrato.frequency, depth: fx.vibrato.depth, wet: fx.vibrato.wet }).connect(entry)
      nodes.push(vibrato)
      entry = vibrato
    }
    if (fx.chorus) {
      const chorus = new Tone.Chorus({
        frequency: fx.chorus.frequency,
        delayTime: fx.chorus.delayTime,
        depth: fx.chorus.depth,
        wet: fx.chorus.wet,
      })
        .connect(entry)
        .start()
      nodes.push(chorus)
      entry = chorus
    }
    if (fx.distortion) {
      const distortion = new Tone.Distortion({ distortion: fx.distortion.amount, wet: fx.distortion.wet }).connect(entry)
      nodes.push(distortion)
      entry = distortion
    }

    const layers: RackLayer[] = definition.layers.map((layer) => {
      const gain = new Tone.Gain(Tone.dbToGain(layer.gainDb)).connect(entry)
      const poly = createLayerVoice(layer)
      // Generous headroom so overlapping auditions never drop notes;
      // musical note limits are enforced up front via noteCap.
      poly.maxPolyphony = 16
      poly.connect(gain)
      nodes.push(gain, poly)
      return { poly, octaveShift: layer.octaveShift ?? 0, detuneCents: layer.detuneCents ?? 0 }
    })

    return { id: definition.id, layers, nodes, disposed: false }
  }

  /** Lets the retired rack ring out (release + reverb tail), then disposes every node exactly once. */
  private retireRack(rack: VoiceRack) {
    rack.layers.forEach((layer) => layer.poly.releaseAll())
    const definition = PRESET_DEFINITIONS[rack.id]
    const tailMs = (definition.releaseTailSec + (definition.fx.reverb?.decay ?? 0)) * 1000 + 250
    window.setTimeout(() => {
      if (rack.disposed) {
        return
      }
      rack.disposed = true
      rack.nodes.forEach((node) => {
        try {
          node.dispose()
        } catch {
          // node already disposed - safe to ignore
        }
      })
    }, tailMs)
  }
}

function createLayerVoice(layer: PresetLayer): Tone.PolySynth {
  // The options shapes are validated by audioPresets.test.ts; Tone's
  // constructor typing is too strict for a data-driven record.
  if (layer.kind === 'fm') {
    return new Tone.PolySynth(Tone.FMSynth, layer.options as never)
  }
  if (layer.kind === 'am') {
    return new Tone.PolySynth(Tone.AMSynth, layer.options as never)
  }
  return new Tone.PolySynth(Tone.Synth, layer.options as never)
}

export function createStudioAudio(): StudioAudio {
  return new StudioAudio()
}

export function humanizeNoteEvents(
  midiNotes: number[],
  timingRangeMs: number,
  velocityRange: number,
  chordSpreadMs: number,
  baseVelocity = 0.78,
  randomizeOrder = false,
): HumanizedNoteEvent[] {
  const orderedNotes = randomizeOrder ? shuffle(midiNotes) : [...midiNotes]
  return orderedNotes.map((midi, index) => {
    const timingJitter = timingRangeMs === 0 ? 0 : randomBetween(-timingRangeMs, timingRangeMs)
    const velocityJitter = velocityRange === 0 ? 0 : randomBetween(-velocityRange, velocityRange)
    return {
      midi,
      timeOffsetMs: Math.max(-timingRangeMs, index * chordSpreadMs + timingJitter),
      velocity: clamp(baseVelocity * (1 + velocityJitter), 0.05, 0.85),
    }
  })
}

function spreadForChord(noteCount: number, minMs: number, maxMs: number): number {
  if (noteCount <= 1 || maxMs === 0) {
    return 0
  }
  return clamp(minMs + noteCount * 4, minMs, maxMs)
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function shuffle(values: number[]): number[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}
