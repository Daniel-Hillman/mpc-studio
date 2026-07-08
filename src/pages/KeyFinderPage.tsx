import { useEffect, useReducer, useRef, useState } from 'react'
import { AudioWaveform, Upload } from 'lucide-react'
import { PanelHeader } from '../components/primitives'
import {
  KEY_DETECT_MAX_SECONDS,
  confidenceBand,
  keyLabel,
  preprocessAudio,
  type KeyScore,
} from '../lib/keyDetect'
import { getScaleDefinition } from '../lib/music'
import { useAppState } from '../state/AppStateProvider'

type FinderState =
  | { status: 'idle' }
  | { status: 'decoding'; fileName: string }
  | { status: 'analyzing'; fileName: string; pct: number }
  | {
      status: 'results'
      fileName: string
      ranked: KeyScore[]
      confidence: number
      relativeAmbiguity: boolean
      truncated: boolean
    }
  | { status: 'error'; message: string }

type FinderAction =
  | { type: 'decode'; fileName: string }
  | { type: 'analyze'; fileName: string }
  | { type: 'progress'; pct: number }
  | { type: 'results'; ranked: KeyScore[]; confidence: number; relativeAmbiguity: boolean; truncated: boolean }
  | { type: 'error'; message: string }
  | { type: 'reset' }

function reducer(state: FinderState, action: FinderAction): FinderState {
  switch (action.type) {
    case 'decode':
      return { status: 'decoding', fileName: action.fileName }
    case 'analyze':
      return { status: 'analyzing', fileName: state.status === 'decoding' ? state.fileName : '', pct: 0 }
    case 'progress':
      return state.status === 'analyzing' ? { ...state, pct: action.pct } : state
    case 'results':
      return {
        status: 'results',
        fileName: state.status === 'analyzing' ? state.fileName : '',
        ranked: action.ranked,
        confidence: action.confidence,
        relativeAmbiguity: action.relativeAmbiguity,
        truncated: action.truncated,
      }
    case 'error':
      return { status: 'error', message: action.message }
    case 'reset':
      return { status: 'idle' }
    default:
      return state
  }
}

export function KeyFinderPage() {
  const { scaleType, setTrackKey, setScaleType } = useAppState()
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const truncatedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  async function handleFile(file: File) {
    dispatch({ type: 'decode', fileName: file.name })
    let audio: AudioBuffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      const context = new AudioContext()
      audio = await context.decodeAudioData(arrayBuffer)
      void context.close()
    } catch {
      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'unknown format'
      dispatch({
        type: 'error',
        message: `Couldn't decode this file (${extension}). iOS Safari can't read OGG - WAV, MP3 or M4A work everywhere.`,
      })
      return
    }

    const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index))
    const { samples, sampleRate, truncated } = preprocessAudio(channels, audio.sampleRate)
    truncatedRef.current = truncated

    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/keyDetect.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<{ type: string; pct?: number; ranked?: KeyScore[]; confidence?: number; relativeAmbiguity?: boolean }>) => {
      if (event.data.type === 'progress') {
        dispatch({ type: 'progress', pct: event.data.pct ?? 0 })
      } else if (event.data.type === 'result') {
        dispatch({
          type: 'results',
          ranked: event.data.ranked ?? [],
          confidence: event.data.confidence ?? 0,
          relativeAmbiguity: event.data.relativeAmbiguity ?? false,
          truncated: truncatedRef.current,
        })
        worker.terminate()
        workerRef.current = null
      }
    }
    worker.onerror = () => {
      dispatch({ type: 'error', message: 'Analysis failed unexpectedly. Try a shorter clip or a different file.' })
      worker.terminate()
      workerRef.current = null
    }
    dispatch({ type: 'analyze', fileName: file.name })
    worker.postMessage({ samples, sampleRate }, [samples.buffer])
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const scaleLabel = getScaleDefinition(scaleType).label
  const keepsCurrentScale = scaleType !== 'major' && scaleType !== 'minor'

  return (
    <section className="keyfinder-layout">
      <div className="panel keyfinder-panel">
        <PanelHeader kicker="Detect" title="Find the key of a sample" value="in-browser" />

        {(state.status === 'idle' || state.status === 'error') && (
          <>
            {state.status === 'error' && <div className="result-box warning-box">{state.message}</div>}
            <div
              className={dragOver ? 'drop-zone drag-over' : 'drop-zone'}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <AudioWaveform size={34} />
              <strong>Drop a sample or song here</strong>
              <span>WAV, MP3 or M4A - analyzed locally, nothing is uploaded.</span>
              <button type="button" className="primary-action" onClick={() => inputRef.current?.click()}>
                <Upload size={18} />
                <span>Choose audio file</span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                hidden
                aria-label="Audio file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleFile(file)
                  }
                  event.target.value = ''
                }}
              />
            </div>
          </>
        )}

        {state.status === 'decoding' && (
          <div className="analysis-status">
            <strong>Decoding {state.fileName}...</strong>
          </div>
        )}

        {state.status === 'analyzing' && (
          <div className="analysis-status">
            <strong>Listening for the key of {state.fileName}...</strong>
            <div className="progress-track" role="progressbar" aria-valuenow={state.pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${state.pct}%` }} />
            </div>
            <span>{state.pct}%</span>
          </div>
        )}

        {state.status === 'results' && (
          <div className="keyfinder-results">
            <div className="result-box">
              <strong>Best match: {keyLabel(state.ranked[0])}</strong> · {confidenceBand(state.confidence)} ({Math.round(state.confidence * 100)}% confidence)
              {state.truncated && <> · Analyzed the first {KEY_DETECT_MAX_SECONDS} seconds.</>}
            </div>
            {state.relativeAmbiguity && (
              <div className="result-box">
                This loop fits both {keyLabel(state.ranked[0])} and {keyLabel(state.ranked[1])} - relative keys share the same notes. Pick the one that matches your bass root.
              </div>
            )}
            <div className="keyfinder-ranking">
              {state.ranked.slice(0, 5).map((candidate, index) => (
                <div className="keyfinder-row" key={`${candidate.root}-${candidate.mode}`}>
                  <span className="progression-index">{index + 1}</span>
                  <strong>{keyLabel(candidate)}</strong>
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.round(Math.max(0, Math.min(1, (candidate.score + 1) / 2)) * 100)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    className="secondary-action compact-action"
                    onClick={() => {
                      setTrackKey(candidate.root)
                      setScaleType(candidate.mode)
                    }}
                  >
                    Set as master key
                  </button>
                  {index === 0 && keepsCurrentScale && (
                    <button
                      type="button"
                      className="secondary-action compact-action"
                      onClick={() => setTrackKey(candidate.root)}
                    >
                      Keep {scaleLabel}: use {candidate.root}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="secondary-action" onClick={() => dispatch({ type: 'reset' })}>
              Analyze another file
            </button>
          </div>
        )}

        <p className="panel-note">
          Key detection reads the overall note balance. Heavy drums, chromatic melodies, or key changes can fool it - treat this as a strong suggestion and confirm on a Root pad.
        </p>
      </div>
    </section>
  )
}
