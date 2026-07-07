import { useState } from 'react'
import { Disc3 } from 'lucide-react'
import { PAD_NUMBERS, ROOT_NOTES, midiToNoteName, midiToNoteWithOctave, noteNameToMidi } from '../lib/music'
import type { PadNumber } from '../types'
import { ControlRow } from './primitives'

export function SampleSetupControl({
  sampleRootMidi,
  originalPad,
  onSampleRootChange,
  onOriginalPadChange,
}: {
  sampleRootMidi: number
  originalPad: PadNumber
  onSampleRootChange: (midi: number) => void
  onOriginalPadChange: (pad: PadNumber) => void
}) {
  const [open, setOpen] = useState(false)
  const sampleNote = midiToNoteName(sampleRootMidi)

  return (
    <div className="master-key-wrap">
      <button
        type="button"
        className="master-key-button"
        aria-label={`Sample ${midiToNoteWithOctave(sampleRootMidi)} · Pad ${originalPad}`}
        aria-expanded={open}
        aria-controls="sample-setup-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Disc3 size={17} />
        <span>Sample</span>
        <strong>{midiToNoteWithOctave(sampleRootMidi)} · Pad {originalPad}</strong>
      </button>
      {open && (
        <div id="sample-setup-panel" className="master-key-popover" role="dialog" aria-label="Sample setup">
          <div className="master-key-popover-head">
            <span>Your one-shot on the pads</span>
            <b>{midiToNoteWithOctave(sampleRootMidi)} on Pad {originalPad}</b>
          </div>
          <div className="helper-mini-row master-key-fields">
            <ControlRow label="Sample note">
              <select value={sampleNote} onChange={(event) => onSampleRootChange(noteNameToMidi(event.target.value, 3))}>
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </ControlRow>
            <ControlRow label="Original pad">
              <select value={originalPad} onChange={(event) => onOriginalPadChange(Number(event.target.value) as PadNumber)}>
                {PAD_NUMBERS.map((pad) => (
                  <option key={pad} value={pad}>
                    Pad {pad}
                  </option>
                ))}
              </select>
            </ControlRow>
          </div>
          <p>The one-shot&apos;s own pitch and the pad that plays it untouched. Every page maps from this.</p>
        </div>
      )}
    </div>
  )
}
