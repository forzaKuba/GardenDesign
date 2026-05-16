/**
 * Constrain a point (bx, by) relative to an anchor (ax, ay) so that the
 * resulting angle is a multiple of 45° (0°, 45°, 90°, 135°, 180°, …).
 *
 * Used when Shift is held during line / poly / dimension drawing.
 */
export function applyAngleSnap(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { x: number; y: number } {
  const angle = Math.atan2(by - ay, bx - ax)
  const len = Math.hypot(bx - ax, by - ay)
  // Snap to nearest 45°
  const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return {
    x: ax + len * Math.cos(snapAngle),
    y: ay + len * Math.sin(snapAngle),
  }
}
