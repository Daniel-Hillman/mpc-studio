import type { ReactNode } from 'react'
import { Info, Piano, Square } from 'lucide-react'
import type { SurfaceMode } from '../types'

export function PanelHeader({ kicker, title, value }: { kicker: string; title: string; value: string }) {
  return (
    <div className="panel-header">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <b>{value}</b>
    </div>
  )
}

export function Guide({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="guide-panel">
      <summary title={title} aria-label={title}>
        <Info size={16} />
        <span>Guide</span>
      </summary>
      <div>{children}</div>
    </details>
  )
}

export function SurfaceModeSwitch({ value, onChange }: { value: SurfaceMode; onChange: (mode: SurfaceMode) => void }) {
  return (
    <div className="surface-switch" role="group" aria-label="Theory surface">
      <button type="button" className={value === 'pads' ? 'active' : ''} aria-pressed={value === 'pads'} onClick={() => onChange('pads')}>
        <Square size={16} />
        <span>Pads</span>
      </button>
      <button type="button" className={value === 'keys' ? 'active' : ''} aria-pressed={value === 'keys'} onClick={() => onChange('keys')}>
        <Piano size={16} />
        <span>Keys</span>
      </button>
    </div>
  )
}

export function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  )
}

export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button type="button" key={option} className={option === value ? 'active' : ''} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  )
}

export function StatusStack({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="status-stack">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
