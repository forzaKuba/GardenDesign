import type { GardenElement } from '@/types/elements'
import type { ViewState } from '@/types/tools'
import { CATEGORIES } from '@/constants/categories'
import { getBbox } from './hitTest'

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  elements: GardenElement[],
  view: ViewState,
  canvasW: number,
  canvasH: number,
  mmX: number,
  mmY: number,
  mmW: number,
  mmH: number
): void {
  if (!elements.length) return

  // Compute world bounding box
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity
  for (const el of elements) {
    if (!el.visible) continue
    const b = getBbox(el)
    mnx = Math.min(mnx, b.x)
    mny = Math.min(mny, b.y)
    mxx = Math.max(mxx, b.x + b.w)
    mxy = Math.max(mxy, b.y + b.h)
  }
  if (!isFinite(mnx)) return

  const pad = 2 // metres padding
  mnx -= pad; mny -= pad; mxx += pad; mxy += pad
  const worldW = mxx - mnx
  const worldH = mxy - mny
  const scale = Math.min(mmW / worldW, mmH / worldH)
  const offsetX = mmX + (mmW - worldW * scale) / 2
  const offsetY = mmY + (mmH - worldH * scale) / 2

  function toMM(wx: number, wy: number) {
    return { x: offsetX + (wx - mnx) * scale, y: offsetY + (wy - mny) * scale }
  }

  ctx.save()

  // Background
  ctx.fillStyle = 'rgba(16,20,16,0.82)'
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(mmX, mmY, mmW, mmH)
  ctx.fill()
  ctx.stroke()

  // Draw elements simplified
  for (const el of elements) {
    if (!el.visible) continue
    const cat = CATEGORIES[el.category]
    ctx.fillStyle = el.fillColor ?? cat.fill
    ctx.strokeStyle = el.strokeColor ?? cat.stroke
    ctx.lineWidth = 0.8

    const b = getBbox(el)
    const p1 = toMM(b.x, b.y)
    const p2 = toMM(b.x + b.w, b.y + b.h)
    const bw = p2.x - p1.x, bh = p2.y - p1.y

    if (el.type === 'circle' || el.type === 'symbol') {
      const pc = toMM(b.x + b.w / 2, b.y + b.h / 2)
      ctx.beginPath()
      ctx.arc(pc.x, pc.y, Math.max(1.5, Math.min(bw, bh) / 2), 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.rect(p1.x, p1.y, Math.max(1, bw), Math.max(1, bh))
      ctx.fill()
      ctx.stroke()
    }
  }

  // Viewport indicator
  const vpTL = toMM(-view.panX / view.zoom, -view.panY / view.zoom)
  const vpBR = toMM((canvasW - view.panX) / view.zoom, (canvasH - view.panY) / view.zoom)
  ctx.strokeStyle = 'rgba(26,111,224,0.85)'
  ctx.fillStyle = 'rgba(26,111,224,0.08)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(vpTL.x, vpTL.y, vpBR.x - vpTL.x, vpBR.y - vpTL.y)
  ctx.fill()
  ctx.stroke()

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(mmX, mmY, mmW, mmH)

  ctx.restore()
}
