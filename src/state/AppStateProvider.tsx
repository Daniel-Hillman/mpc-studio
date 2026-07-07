import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createInitialProject } from '../data'
import type { StudioAudio } from '../lib/audio'
import {
  BAR_TICKS,
  PAD_NUMBERS,
  ROOT_NOTES,
  SCALE_DEFINITIONS,
  type ScaleType,
  analyzeSixteenLevelsChord,
  buildProgressionPlaybook,
  createPitchWindow,
  getBassPadRecipe,
  getDiatonicChords,
  getMelodyPadRoles,
  getScaleDefinition,
  getScaleNotes,
  noteNameToMidi,
  padToMidi,
  shortestPitchShift,
  suggestNextChords,
} from '../lib/music'
import {
  buildChordShapeHighlights,
  buildChordToneRoles,
  buildMelodyHighlights,
  buildPadHighlights,
  type PadHighlight,
} from '../lib/padHighlights'
import type {
  AudioFeel,
  BassRecipe,
  ChordQualityId,
  ChordShape,
  ChordStep,
  InstrumentPreset,
  MelodyPad,
  NextChordSuggestion,
  PadNumber,
  PitchWindow,
  ProgressionPlaybookStep,
  SixteenLevelsAnalysis,
  StudioProject,
  SurfaceMode,
} from '../types'

export type ViewId = 'studio' | 'chords' | 'melodies' | 'levels'

export interface AppState {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
  project: StudioProject
  chordRoot: string
  setChordRoot: (root: string) => void
  chordQuality: ChordQualityId
  setChordQuality: (quality: ChordQualityId) => void
  keyRoot: string
  scaleType: ScaleType
  setScaleType: (scale: ScaleType) => void
  sampleRootMidi: number
  setSampleRootMidi: (midi: number) => void
  originalPad: PadNumber
  setOriginalPad: (pad: PadNumber) => void
  otherSampleNote: string
  setOtherSampleNote: (note: string) => void
  targetNote: string
  setTargetNote: (note: string) => void
  highlightMode: 'scale' | 'chord' | 'all'
  setHighlightMode: (mode: 'scale' | 'chord' | 'all') => void
  animatedPads: PadNumber[]
  previewEnabled: boolean
  togglePreview: () => void
  audioReady: boolean
  instrumentPreset: InstrumentPreset
  setInstrumentPreset: (preset: InstrumentPreset) => void
  audioFeel: AudioFeel
  setAudioFeel: (feel: AudioFeel) => void
  surfaceMode: SurfaceMode
  setSurfaceMode: (mode: SurfaceMode) => void
  analysis: SixteenLevelsAnalysis
  selectedShape: ChordShape
  diatonicChords: ChordStep[]
  progressionShapes: { step: ChordStep; shape: ChordShape }[]
  pitchWindow: PitchWindow
  scaleNotes: string[]
  scaleDefinition: ReturnType<typeof getScaleDefinition>
  melodyPads: MelodyPad[]
  melodyHighlights: Record<PadNumber, PadHighlight>
  nextChordSuggestions: NextChordSuggestion[]
  selectedBassRecipes: BassRecipe[]
  progressionPlaybook: ProgressionPlaybookStep[]
  padHighlights: Record<PadNumber, PadHighlight>
  chordShapeHighlights: Record<PadNumber, PadHighlight>
  safePads: PadNumber[]
  rootPads: PadNumber[]
  chordPads: PadNumber[]
  repitchShift: number
  setTrackKey: (root: string) => void
  animatePads: (pads: PadNumber[], mode: 'scale' | 'chord' | 'melody') => void
  applyJunglePreset: () => void
  addChordToProgression: (root: string, quality: ChordQualityId) => void
  moveChordInProgression: (stepId: string, direction: -1 | 1) => void
  removeChordFromProgression: (stepId: string) => void
  clearProgression: () => void
  auditionShape: (shape: ChordShape, strumMs?: number) => Promise<void>
  auditionChord: (root: string, quality: ChordQualityId, strumMs?: number) => Promise<void>
  playSinglePad: (pad: PadNumber) => Promise<void>
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ViewId>('studio')
  const [project, setProject] = useState<StudioProject>(() => createInitialProject())
  const [chordRoot, setChordRoot] = useState('C')
  const [chordQuality, setChordQuality] = useState<ChordQualityId>('min9')
  const [keyRoot, setKeyRoot] = useState('C')
  const [scaleType, setScaleType] = useState<ScaleType>('minor')
  const [sampleRootMidi, setSampleRootMidi] = useState(noteNameToMidi('C', 3))
  const [originalPad, setOriginalPad] = useState<PadNumber>(4)
  const [otherSampleNote, setOtherSampleNote] = useState('C')
  const [targetNote, setTargetNote] = useState('C')
  const [highlightMode, setHighlightMode] = useState<'scale' | 'chord' | 'all'>('scale')
  const [animatedPads, setAnimatedPads] = useState<PadNumber[]>([])
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [audioReady, setAudioReady] = useState(false)
  const [instrumentPreset, setInstrumentPreset] = useState<InstrumentPreset>('warmKeys')
  const [audioFeel, setAudioFeel] = useState<AudioFeel>('natural')
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('pads')
  const audioRef = useRef<StudioAudio | null>(null)
  const storageLoadedRef = useRef(false)

  const progression = project.progressions[0]
  const analysis = useMemo(
    () => analyzeSixteenLevelsChord(chordRoot, chordQuality, sampleRootMidi, originalPad),
    [chordRoot, chordQuality, sampleRootMidi, originalPad],
  )
  const selectedShape = analysis.shapes[0]
  const diatonicChords = useMemo(() => getDiatonicChords(keyRoot, scaleType), [keyRoot, scaleType])
  const progressionShapes = useMemo(
    () =>
      progression.steps.map((step) => ({
        step,
        shape: analyzeSixteenLevelsChord(step.root, step.quality, sampleRootMidi, originalPad).shapes[0],
      })),
    [originalPad, progression.steps, sampleRootMidi],
  )
  const pitchWindow = useMemo(() => createPitchWindow(sampleRootMidi, originalPad), [sampleRootMidi, originalPad])
  const scaleNotes = useMemo(() => getScaleNotes(keyRoot, scaleType), [keyRoot, scaleType])
  const scaleDefinition = useMemo(() => getScaleDefinition(scaleType), [scaleType])
  const melodyPads = useMemo(() => getMelodyPadRoles(scaleNotes, selectedShape, pitchWindow), [pitchWindow, scaleNotes, selectedShape])
  const melodyHighlights = useMemo(() => buildMelodyHighlights(melodyPads, originalPad), [melodyPads, originalPad])
  const nextChordSuggestions = useMemo(
    () => suggestNextChords(progression.steps[progression.steps.length - 1] ?? null, keyRoot, scaleType),
    [keyRoot, progression.steps, scaleType],
  )
  const selectedBassRecipes = useMemo(
    () => getBassPadRecipe({ id: 'selected', root: chordRoot, quality: chordQuality, durationTicks: BAR_TICKS }, null, pitchWindow),
    [chordQuality, chordRoot, pitchWindow],
  )
  const progressionPlaybook = useMemo(() => buildProgressionPlaybook(progressionShapes, scaleNotes, pitchWindow), [pitchWindow, progressionShapes, scaleNotes])
  const chordToneRoles = useMemo(() => buildChordToneRoles(chordRoot, chordQuality), [chordQuality, chordRoot])
  const padHighlights = useMemo(
    () => buildPadHighlights(scaleNotes, keyRoot, chordToneRoles, sampleRootMidi, originalPad),
    [chordToneRoles, keyRoot, originalPad, sampleRootMidi, scaleNotes],
  )
  const chordShapeHighlights = useMemo(() => buildChordShapeHighlights(selectedShape, originalPad), [originalPad, selectedShape])
  const safePads = PAD_NUMBERS.filter((pad) => padHighlights[pad].isSafe)
  const rootPads = PAD_NUMBERS.filter((pad) => padHighlights[pad].isRoot)
  const chordPads = PAD_NUMBERS.filter((pad) => padHighlights[pad].isChord)
  const repitchShift = shortestPitchShift(otherSampleNote, targetNote)

  useEffect(() => {
    let alive = true
    const storageTimer = window.setTimeout(() => {
      import('../lib/storage')
        .then(({ db, ensureDefaultRecords }) => ensureDefaultRecords().then(() => Promise.all([db.projects.get('local-main'), db.settings.get('settings')])))
        .then(([storedProject, storedSettings]) => {
          if (!alive) {
            return
          }

          if (storedProject) {
            setProject(storedProject)
            const setup = storedProject.sixteenLevelsSetups[0]
            setSampleRootMidi(setup.sampleRootMidi)
            setOriginalPad(setup.originalPitchPad)
          }

          if (storedSettings) {
            setPreviewEnabled(storedSettings.previewEnabled)
            setInstrumentPreset(storedSettings.instrumentPreset ?? 'warmKeys')
            setAudioFeel(storedSettings.audioFeel ?? 'natural')
            if (isRootNote(storedSettings.keyRoot)) {
              setTrackKey(storedSettings.keyRoot)
            }
            if (isScaleType(storedSettings.scaleType)) {
              setScaleType(storedSettings.scaleType)
            }
            if (isSurfaceMode(storedSettings.surfaceMode)) {
              setSurfaceMode(storedSettings.surfaceMode)
            }
          }
          storageLoadedRef.current = true
        })
        .catch(() => {
          storageLoadedRef.current = false
        })
    }, 0)

    const audioWarmTimer = window.setTimeout(() => {
      void import('../lib/audio')
    }, 250)

    window.__MPC_STUDIO_READY__ = true
    return () => {
      alive = false
      window.clearTimeout(storageTimer)
      window.clearTimeout(audioWarmTimer)
    }
  }, [])

  useEffect(() => {
    audioRef.current?.setInstrumentPreset(instrumentPreset)
    audioRef.current?.setAudioFeel(audioFeel)
  }, [audioFeel, instrumentPreset])

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return
    }

    const saveTimer = window.setTimeout(() => {
      const nextProject = {
        ...project,
        sixteenLevelsSetups: [{ sampleRootMidi, originalPitchPad: originalPad, targetKey: `${keyRoot} ${scaleType}` }],
        updatedAt: new Date().toISOString(),
      }

      void import('../lib/storage')
        .then(({ saveProject, saveSettings }) =>
          Promise.all([
            saveProject(nextProject),
            saveSettings({
              id: 'settings',
              previewEnabled,
              lastPadMapId: nextProject.padMapId,
              instrumentPreset,
              audioFeel,
              keyRoot,
              scaleType,
              surfaceMode,
              updatedAt: new Date().toISOString(),
            }),
          ]),
        )
        .catch(() => {
          storageLoadedRef.current = false
        })
    }, 450)

    return () => window.clearTimeout(saveTimer)
  }, [audioFeel, instrumentPreset, keyRoot, originalPad, previewEnabled, project, sampleRootMidi, scaleType, surfaceMode])

  async function ensureAudio() {
    if (!audioRef.current) {
      const { createStudioAudio } = await import('../lib/audio')
      audioRef.current = createStudioAudio()
    }

    await audioRef.current.start()
    audioRef.current.setInstrumentPreset(instrumentPreset)
    audioRef.current.setAudioFeel(audioFeel)
    setAudioReady(true)
    return audioRef.current
  }

  async function auditionShape(shape: ChordShape, strumMs = 0) {
    const notes = shape.pads.map((pad) => pad.midi)
    if (notes.length === 0) {
      return
    }

    if (previewEnabled) {
      const audio = await ensureAudio()
      audio.playMidiNotes(notes, { duration: '2n', velocity: 0.78, strumMs })
    }
  }

  async function auditionChord(root: string, quality: ChordQualityId, strumMs = 0) {
    const shape = analyzeSixteenLevelsChord(root, quality, sampleRootMidi, originalPad).shapes[0]
    await auditionShape(shape, strumMs)
  }

  async function playSinglePad(pad: PadNumber) {
    const midi = padToMidi(sampleRootMidi, originalPad, pad)
    if (previewEnabled) {
      const audio = await ensureAudio()
      audio.playMidiNotes([midi], { duration: '8n', velocity: 0.72, strumMs: 0 })
    }
  }

  function setTrackKey(root: string) {
    setKeyRoot(root)
    setTargetNote(root)
  }

  function animatePads(pads: PadNumber[], mode: 'scale' | 'chord' | 'melody') {
    if (mode !== 'melody') {
      setHighlightMode(mode)
    }
    setAnimatedPads([])
    pads.forEach((pad, index) => {
      window.setTimeout(() => setAnimatedPads([pad]), index * 170)
    })
    window.setTimeout(() => setAnimatedPads([]), pads.length * 170 + 460)
  }

  function applyJunglePreset() {
    setSampleRootMidi(noteNameToMidi('A', 3))
    setOriginalPad(4)
    setTrackKey('A')
    setScaleType('minor')
    setChordRoot('A')
    setChordQuality('min7')
    setOtherSampleNote('C')
    setTargetNote('A')
    setHighlightMode('scale')
  }

  function addChordToProgression(root: string, quality: ChordQualityId) {
    setProject((current) => {
      const currentProgression = current.progressions[0]
      const nextProgression = {
        ...currentProgression,
        steps: [
          ...currentProgression.steps,
          {
            id: `step-${Date.now()}-${currentProgression.steps.length}`,
            root,
            quality,
            durationTicks: BAR_TICKS,
          },
        ],
      }

      return {
        ...current,
        progressions: [nextProgression],
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function moveChordInProgression(stepId: string, direction: -1 | 1) {
    setProject((current) => {
      const currentProgression = current.progressions[0]
      const steps = [...currentProgression.steps]
      const fromIndex = steps.findIndex((step) => step.id === stepId)
      const toIndex = fromIndex + direction

      if (fromIndex < 0 || toIndex < 0 || toIndex >= steps.length) {
        return current
      }

      const [step] = steps.splice(fromIndex, 1)
      steps.splice(toIndex, 0, step)

      return {
        ...current,
        progressions: [{ ...currentProgression, steps }],
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function removeChordFromProgression(stepId: string) {
    setProject((current) => {
      const currentProgression = current.progressions[0]
      return {
        ...current,
        progressions: [
          {
            ...currentProgression,
            steps: currentProgression.steps.filter((step) => step.id !== stepId),
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function clearProgression() {
    setProject((current) => {
      const currentProgression = current.progressions[0]
      return {
        ...current,
        progressions: [{ ...currentProgression, steps: [] }],
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const value: AppState = {
    activeView,
    setActiveView,
    project,
    chordRoot,
    setChordRoot,
    chordQuality,
    setChordQuality,
    keyRoot,
    scaleType,
    setScaleType,
    sampleRootMidi,
    setSampleRootMidi,
    originalPad,
    setOriginalPad,
    otherSampleNote,
    setOtherSampleNote,
    targetNote,
    setTargetNote,
    highlightMode,
    setHighlightMode,
    animatedPads,
    previewEnabled,
    togglePreview: () => setPreviewEnabled((current) => !current),
    audioReady,
    instrumentPreset,
    setInstrumentPreset,
    audioFeel,
    setAudioFeel,
    surfaceMode,
    setSurfaceMode,
    analysis,
    selectedShape,
    diatonicChords,
    progressionShapes,
    pitchWindow,
    scaleNotes,
    scaleDefinition,
    melodyPads,
    melodyHighlights,
    nextChordSuggestions,
    selectedBassRecipes,
    progressionPlaybook,
    padHighlights,
    chordShapeHighlights,
    safePads,
    rootPads,
    chordPads,
    repitchShift,
    setTrackKey,
    animatePads,
    applyJunglePreset,
    addChordToProgression,
    moveChordInProgression,
    removeChordFromProgression,
    clearProgression,
    auditionShape,
    auditionChord,
    playSinglePad,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppState {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}

function isRootNote(value: unknown): value is string {
  return typeof value === 'string' && ROOT_NOTES.includes(value)
}

function isScaleType(value: unknown): value is ScaleType {
  return typeof value === 'string' && SCALE_DEFINITIONS.some((scale) => scale.id === value)
}

function isSurfaceMode(value: unknown): value is SurfaceMode {
  return value === 'pads' || value === 'keys'
}
