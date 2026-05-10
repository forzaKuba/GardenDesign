export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number // lower = rendered first (bottom)
}
