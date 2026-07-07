import type { MelodyPadRole } from '../types'

/**
 * The single vocabulary for note roles across every page and surface.
 * Colors stay the same everywhere: gold = root, rose = chord tone,
 * mint = in scale, paper = passing, dark = outside scale.
 */
export const ROLE_WORDS = {
  root: 'Root',
  chord: 'Chord tone',
  scale: 'In scale',
  passing: 'Passing',
  outside: 'Outside scale',
  original: 'Original pitch',
  noPad: 'No pad (context)',
} as const

export type RoleKey = keyof typeof ROLE_WORDS

/** Short forms for tight surfaces like pad faces. */
export const COMPACT_ROLE_WORDS: Record<RoleKey, string> = {
  root: 'Root',
  chord: 'Chord',
  scale: 'Scale',
  passing: 'Passing',
  outside: 'Outside',
  original: 'Original',
  noPad: 'No pad',
}

export const MELODY_ROLE_TO_KEY: Record<MelodyPadRole, RoleKey> = {
  home: 'root',
  strong: 'chord',
  safe: 'scale',
  passing: 'passing',
  tension: 'outside',
}

export function melodyRoleWord(role: MelodyPadRole): string {
  return ROLE_WORDS[MELODY_ROLE_TO_KEY[role]]
}

export function melodyRoleFaceWord(role: MelodyPadRole): string {
  return COMPACT_ROLE_WORDS[MELODY_ROLE_TO_KEY[role]]
}
