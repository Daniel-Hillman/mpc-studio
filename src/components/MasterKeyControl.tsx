import { useState } from 'react'
import { Music } from 'lucide-react'
import { ROOT_NOTES, SCALE_DEFINITIONS, type ScaleType } from '../lib/music'
import { ControlRow } from './primitives'

export function MasterKeyControl({
  keyRoot,
  scaleType,
  scaleLabel,
  onTrackKeyChange,
  onScaleTypeChange,
}: {
  keyRoot: string
  scaleType: ScaleType
  scaleLabel: string
  onTrackKeyChange: (root: string) => void
  onScaleTypeChange: (scale: ScaleType) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="master-key-wrap">
      <button
        type="button"
        className="master-key-button"
        aria-label={`Master key ${keyRoot} ${scaleLabel}`}
        aria-expanded={open}
        aria-controls="master-key-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Music size={17} />
        <span>Master key</span>
        <strong>{keyRoot} {scaleLabel}</strong>
      </button>
      {open && (
        <div id="master-key-panel" className="master-key-popover" role="dialog" aria-label="Master key">
          <div className="master-key-popover-head">
            <span>Song key for the whole app</span>
            <b>{keyRoot} {scaleLabel}</b>
          </div>
          <div className="helper-mini-row master-key-fields">
            <ControlRow label="Song key">
              <select value={keyRoot} onChange={(event) => onTrackKeyChange(event.target.value)}>
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </ControlRow>
            <ControlRow label="Scale">
              <select value={scaleType} onChange={(event) => onScaleTypeChange(event.target.value as ScaleType)}>
                {SCALE_DEFINITIONS.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.label}
                  </option>
                ))}
              </select>
            </ControlRow>
          </div>
          <p>Chords, Melodies, 16 Levels and retune targets follow this key.</p>
        </div>
      )}
    </div>
  )
}
