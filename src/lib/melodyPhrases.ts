import type { MelodyPad, PadNumber } from '../types'

export function buildMelodyPhraseRecipes(melodyPads: MelodyPad[]): { name: string; pads: PadNumber[]; hint: string }[] {
  const home = melodyPads.find((pad) => pad.role === 'home')
  const strong = melodyPads.filter((pad) => pad.role === 'strong')
  const safe = melodyPads.filter((pad) => pad.role === 'safe')
  const passing = melodyPads.filter((pad) => pad.role === 'passing')
  const pick = (...groups: MelodyPad[][]) => groups.flat().filter(Boolean)

  return [
    {
      name: 'Simple hook',
      pads: pick(home ? [home] : [], strong, safe).slice(0, 4).map((pad) => pad.pad),
      hint: 'Start home, touch a strong note, then come back simple.',
    },
    {
      name: 'Call and response',
      pads: pick(strong.slice(0, 2), safe.slice(0, 2)).map((pad) => pad.pad),
      hint: 'Play the first two pads, pause, then answer with the next two.',
    },
    {
      name: 'Dark turn',
      pads: pick(passing.slice(0, 1), strong.slice(0, 2), home ? [home] : []).map((pad) => pad.pad),
      hint: 'Use the passing note quickly, then land on something stable.',
    },
    {
      name: 'Resolve home',
      pads: pick(safe.slice(0, 2), strong.slice(0, 1), home ? [home] : []).map((pad) => pad.pad),
      hint: 'A small phrase that clearly lands back home.',
    },
  ]
}
