/**
 * Iterative in-place radix-2 FFT. No dependencies - small enough to ship
 * in the key-detection worker.
 */
export function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length
  if (n !== imag.length || n === 0 || (n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of two')
  }

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) {
      j ^= bit
    }
    j ^= bit
    if (i < j) {
      const tempReal = real[i]
      real[i] = real[j]
      real[j] = tempReal
      const tempImag = imag[i]
      imag[i] = imag[j]
      imag[j] = tempImag
    }
  }

  // Butterfly passes
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const rootReal = Math.cos(angle)
    const rootImag = Math.sin(angle)
    for (let start = 0; start < n; start += len) {
      let twiddleReal = 1
      let twiddleImag = 0
      const half = len >> 1
      for (let k = 0; k < half; k += 1) {
        const evenReal = real[start + k]
        const evenImag = imag[start + k]
        const oddReal = real[start + k + half] * twiddleReal - imag[start + k + half] * twiddleImag
        const oddImag = real[start + k + half] * twiddleImag + imag[start + k + half] * twiddleReal
        real[start + k] = evenReal + oddReal
        imag[start + k] = evenImag + oddImag
        real[start + k + half] = evenReal - oddReal
        imag[start + k + half] = evenImag - oddImag
        const nextReal = twiddleReal * rootReal - twiddleImag * rootImag
        twiddleImag = twiddleReal * rootImag + twiddleImag * rootReal
        twiddleReal = nextReal
      }
    }
  }
}

/** Magnitudes of the first n/2 bins (the real-signal half spectrum). */
export function magnitudeSpectrum(real: Float64Array, imag: Float64Array): Float64Array {
  const half = real.length >> 1
  const magnitudes = new Float64Array(half)
  for (let bin = 0; bin < half; bin += 1) {
    magnitudes[bin] = Math.hypot(real[bin], imag[bin])
  }
  return magnitudes
}
