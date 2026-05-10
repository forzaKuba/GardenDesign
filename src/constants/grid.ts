/** Pixels per metre at zoom = 1 */
export const PX_PER_M = 40

/** Snap threshold in world metres — pointer within this distance snaps to element edges */
export const EDGE_SNAP_THRESHOLD = 0.3

/** Minimum / maximum zoom (pixels per metre) */
export const MIN_ZOOM = 5
export const MAX_ZOOM = 500

/** Available grid step sizes in metres */
export const GRID_STEPS = [0.5, 1, 2] as const

/** Handle hit radius in screen pixels */
export const HANDLE_RADIUS = 5

/** Rotation handle offset above element top edge in metres */
export const ROTATION_HANDLE_OFFSET_M = 0.6
