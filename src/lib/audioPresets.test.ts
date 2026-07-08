import { describe, expect, it } from 'vitest'
import { PRESET_DEFINITIONS, PRESET_ORDER } from './audioPresets'
import type { InstrumentPreset } from '../types'

const LEGACY_IDS: InstrumentPreset[] = ['warmKeys', 'lushPad', 'dustyEp', 'softPluck', 'deepBass', 'cleanSine']

describe('audio preset definitions', () => {
  it('keeps every legacy preset id valid (stored settings must load)', () => {
    for (const id of LEGACY_IDS) {
      expect(PRESET_DEFINITIONS[id]).toBeDefined()
      expect(PRESET_DEFINITIONS[id].id).toBe(id)
    }
  })

  it('exposes every defined preset in the UI order exactly once', () => {
    const definedIds = Object.keys(PRESET_DEFINITIONS).sort()
    const orderedIds = [...PRESET_ORDER].sort()
    expect(orderedIds).toEqual(definedIds)
    expect(new Set(PRESET_ORDER).size).toBe(PRESET_ORDER.length)
  })

  it.each(PRESET_ORDER)('%s has a sane rack definition', (id) => {
    const definition = PRESET_DEFINITIONS[id]

    expect(definition.label.length).toBeGreaterThan(0)
    expect(definition.layers.length).toBeGreaterThanOrEqual(1)
    expect(definition.layers.length).toBeLessThanOrEqual(3)
    expect(definition.gainDb).toBeGreaterThanOrEqual(-18)
    expect(definition.gainDb).toBeLessThanOrEqual(3)
    expect(definition.releaseTailSec).toBeGreaterThanOrEqual(0.5)
    expect(definition.filter.frequency).toBeGreaterThanOrEqual(100)
    expect(definition.filter.frequency).toBeLessThanOrEqual(12000)

    for (const layer of definition.layers) {
      expect(['synth', 'fm', 'am']).toContain(layer.kind)
      expect(layer.gainDb).toBeGreaterThanOrEqual(-24)
      expect(layer.gainDb).toBeLessThanOrEqual(3)
      if (layer.octaveShift !== undefined) {
        expect(Math.abs(layer.octaveShift)).toBeLessThanOrEqual(2)
      }
    }

    const wets = [
      definition.fx.distortion?.wet,
      definition.fx.chorus?.wet,
      definition.fx.vibrato?.wet,
      definition.fx.delay?.wet,
      definition.fx.reverb?.wet,
    ].filter((wet): wet is number => wet !== undefined)
    for (const wet of wets) {
      expect(wet).toBeGreaterThanOrEqual(0)
      expect(wet).toBeLessThanOrEqual(1)
    }

    if (definition.fx.reverb) {
      expect(definition.fx.reverb.decay).toBeGreaterThan(0)
      expect(definition.fx.reverb.decay).toBeLessThanOrEqual(8)
    }
    if (definition.fx.delay) {
      expect(definition.fx.delay.feedback).toBeLessThan(0.8)
    }
  })
})
