/// <reference lib="webworker" />
import { computeChromagram, detectKey } from '../lib/keyDetect'

export interface KeyDetectRequest {
  samples: Float32Array
  sampleRate: number
}

export type KeyDetectResponse =
  | { type: 'progress'; pct: number }
  | { type: 'result'; ranked: ReturnType<typeof detectKey>['ranked']; confidence: number; relativeAmbiguity: boolean }

self.onmessage = (event: MessageEvent<KeyDetectRequest>) => {
  const { samples, sampleRate } = event.data
  const chroma = computeChromagram(samples, sampleRate, (pct) => {
    self.postMessage({ type: 'progress', pct } satisfies KeyDetectResponse)
  })
  const detection = detectKey(chroma)
  self.postMessage({
    type: 'result',
    ranked: detection.ranked,
    confidence: detection.confidence,
    relativeAmbiguity: detection.relativeAmbiguity,
  } satisfies KeyDetectResponse)
}
