/**
 * Centralized measurement formatting for the garden design canvas.
 *
 * Internal unit: metres (source of truth throughout the app).
 * Display rules:
 *   < 0.005 m  →  "0 cm"      (essentially zero — avoid noisy near-zero)
 *   < 0.1 m    →  "N cm"      (integer centimetres for small values)
 *   ≥ 0.1 m    →  "N,NN m"    (two decimal places metres, comma separator)
 *
 * Rounding is done at the two-decimal level to prevent floating-point
 * noise from producing values like "14.400000000001 m".
 */

/** Format a distance in metres for human display. */
export function formatDistance(metres: number): string {
  if (metres < 0.005) return '0 cm'
  if (metres < 0.1) {
    // Round to nearest centimetre
    return `${Math.round(metres * 100)} cm`
  }
  // Round to two decimal places before formatting to avoid fp noise
  const rounded = Math.round(metres * 100) / 100
  return `${rounded.toFixed(2).replace('.', ',')} m`
}

/** Format an area in square metres for human display. */
export function formatArea(sqMetres: number): string {
  // 1 m² = 10 000 cm²
  if (sqMetres < 0.01) return `${Math.round(sqMetres * 10_000)} cm²`
  return `${sqMetres.toFixed(2).replace('.', ',')} m²`
}
