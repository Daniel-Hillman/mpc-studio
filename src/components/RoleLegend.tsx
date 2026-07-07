import { ROLE_WORDS, type RoleKey } from '../lib/vocabulary'
import type { SurfaceMode } from '../types'

export type LegendMode = 'scale' | 'chord' | 'melody'

const LEGEND_KEYS: Record<LegendMode, RoleKey[]> = {
  scale: ['root', 'scale', 'outside', 'original'],
  chord: ['root', 'chord', 'original'],
  melody: ['root', 'chord', 'scale', 'passing', 'outside', 'original'],
}

export function RoleLegend({ mode, surface }: { mode: LegendMode; surface: SurfaceMode }) {
  const keys: RoleKey[] = surface === 'keys' ? [...LEGEND_KEYS[mode], 'noPad'] : LEGEND_KEYS[mode]

  return (
    <div className="legend helper-legend" role="list" aria-label="Color legend">
      {keys.map((key) => (
        <span className="legend-item" role="listitem" key={key}>
          <i className={`legend-swatch swatch-${key}`} aria-hidden="true" />
          {ROLE_WORDS[key]}
        </span>
      ))}
    </div>
  )
}
