import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('MPC Samplex shell', () => {
  it('renders the touch-first studio surface with browser audio preview', () => {
    const { container } = render(<App />)

    expect(screen.getByRole('heading', { name: 'MPC Samplex' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '16 Levels / Scales' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Melodies' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Master key C Minor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sample C3 · Pad 4/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chord Pads' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Groove' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument()
    expect(screen.getByText('What are you making?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Find in-scale notes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Build chords/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make a melody/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Audition chord/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Sound' })).toHaveValue('warmKeys')
    expect(screen.getByRole('button', { name: 'Natural' })).toBeInTheDocument()
    expect(screen.getByText('Play this now')).toBeInTheDocument()
    expect(screen.getByText(/In-scale pads:/i)).toBeInTheDocument()
    const padNumbers = [...container.querySelectorAll('.pad-grid .pad-number')].slice(0, 16).map((pad) => pad.textContent)
    expect(padNumbers).toEqual(['13', '14', '15', '16', '9', '10', '11', '12', '5', '6', '7', '8', '1', '2', '3', '4'])
  })

  it('uses one master key across the pages', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Master key C Minor/i }))
    const masterKeyPanel = screen.getByRole('dialog', { name: 'Master key' })

    fireEvent.change(within(masterKeyPanel).getByRole('combobox', { name: 'Song key' }), {
      target: { value: 'A' },
    })
    fireEvent.change(within(masterKeyPanel).getByRole('combobox', { name: 'Scale' }), {
      target: { value: 'major' },
    })

    expect(screen.getByRole('button', { name: /Master key A Major/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Master key A Major/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }))

    expect(screen.getAllByText(/A Major/).length).toBeGreaterThan(1)
    expect(screen.queryByRole('combobox', { name: 'Track key' })).not.toBeInTheDocument()
  })

  it('switches from MPC pads to keyboard view across pages', () => {
    const { container } = render(<App />)

    expect(screen.getByRole('group', { name: 'Theory surface' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keys' }))

    expect(screen.getByText('Keys to try now')).toBeInTheDocument()
    expect(screen.queryByText('Pads to try now')).not.toBeInTheDocument()
    expect(container.querySelector('.keyboard-surface')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /C3, Pad 4, Root, original pitch/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.piano-key.black').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.piano-key .key-chip').length).toBe(16)
    expect(screen.getByText(/active 16 Levels window/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Chords' }))

    expect(container.querySelector('.keyboard-surface')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pads' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Keys' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows simple in-key chords and pad recipes on the chord page', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Chords' }))

    expect(screen.getByText('Chords in C Minor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Color chords' })).toBeInTheDocument()
    expect(screen.getByText('Your progression')).toBeInTheDocument()
    expect(screen.getByText(/Tap \+ on a chord above/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hear chord' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add starter loop' })).toBeInTheDocument()
    expect(screen.getByText('What next?')).toBeInTheDocument()
    expect(screen.getByText('fourth')).toBeInTheDocument()
    expect(screen.getByText(/MPC play sheet/)).toBeInTheDocument()
    expect(screen.getByText('Bass options')).toBeInTheDocument()
    expect(screen.getByText('Playbook')).toBeInTheDocument()
    expect(screen.getByText('Custom chord')).toBeInTheDocument()
    expect(screen.queryByText('Scale and sample')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Transport')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add Cm7 to progression/i }))
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Play Cm7/i })).toBeInTheDocument()
    expect(screen.getByText('Chord pads')).toBeInTheDocument()
    expect(screen.getAllByText(/P4 \+ P7/).length).toBeGreaterThan(1)
  })

  it('shows melody role pads and phrase recipes on the melodies page', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Melodies' }))

    expect(screen.getByText('Melody setup')).toBeInTheDocument()
    expect(screen.getByText('Melody notes')).toBeInTheDocument()
    expect(screen.getByText('Try these shapes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Simple hook/i })).toBeInTheDocument()
    expect(screen.getAllByText('Chord tone').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Passing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In scale').length).toBeGreaterThan(0)
  })

  it('keeps the 16 Levels page focused on scales and retuning', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '16 Levels / Scales' }))

    expect(screen.getByText('Scale setup')).toBeInTheDocument()
    expect(screen.getByText('Highlighted 16 Levels')).toBeInTheDocument()
    expect(screen.getByText('7 notes in scale')).toBeInTheDocument()
    expect(screen.getByText('Repitch another one-shot')).toBeInTheDocument()
    expect(screen.getByText('Outside scale')).toBeInTheDocument()
    expect(screen.queryByText('Best shapes')).not.toBeInTheDocument()
    expect(screen.queryByText('Chord')).not.toBeInTheDocument()
  })

  it('offers the Key Finder with a local-analysis drop zone', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Key Finder' }))

    expect(screen.getByText('Find the key of a sample')).toBeInTheDocument()
    expect(screen.getByText(/Drop a sample or song here/)).toBeInTheDocument()
    expect(screen.getByText(/analyzed locally, nothing is uploaded/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose audio file/i })).toBeInTheDocument()
    expect(screen.getByText(/treat this as a strong suggestion/)).toBeInTheDocument()
  })

  it('drives every page from the global sample control', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Sample C3 · Pad 4/i }))
    const samplePanel = screen.getByRole('dialog', { name: 'Sample setup' })

    fireEvent.change(within(samplePanel).getByRole('combobox', { name: 'Original pad' }), {
      target: { value: '1' },
    })

    expect(screen.getByRole('button', { name: /Sample C3 · Pad 1/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '16 Levels / Scales' }))
    expect(screen.getByText('C3 to Eb4')).toBeInTheDocument()
  })
})
