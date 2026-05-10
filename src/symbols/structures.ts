import type { SymbolDef } from '@/types/symbols'

export const structuresSymbols: SymbolDef[] = [
  {
    id: 'bench',
    label: 'Garden Bench',
    category: 'structure',
    defaultSize: 1.0,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20

      // Seat
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.rect(-u, -u * 0.15, u * 2, u * 0.3)
      ctx.fill()
      ctx.stroke()

      // Backrest
      ctx.beginPath()
      ctx.rect(-u, -u * 0.7, u * 2, u * 0.2)
      ctx.fill()
      ctx.stroke()

      // Legs
      for (const lx of [-u * 0.7, u * 0.7]) {
        ctx.beginPath()
        ctx.rect(lx - u * 0.08, -u * 0.15, u * 0.16, u * 0.55)
        ctx.fill()
        ctx.stroke()
      }
    },
  },
  {
    id: 'pergola',
    label: 'Pergola',
    category: 'structure',
    defaultSize: 2.0,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      ctx.strokeStyle = stroke
      ctx.fillStyle = fill
      ctx.lineWidth = 2

      // Outer frame
      ctx.beginPath()
      ctx.rect(-u, -u, u * 2, u * 2)
      ctx.fill()
      ctx.stroke()

      // Grid of slats (horizontal)
      ctx.lineWidth = 1.5
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath()
        ctx.moveTo(-u, (i / 3) * u)
        ctx.lineTo(u, (i / 3) * u)
        ctx.stroke()
      }
      // Vertical slats
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath()
        ctx.moveTo((i / 3) * u, -u)
        ctx.lineTo((i / 3) * u, u)
        ctx.stroke()
      }

      // Corner posts
      for (const [px, py] of [[-u, -u], [u, -u], [u, u], [-u, u]] as Array<[number, number]>) {
        ctx.beginPath()
        ctx.arc(px, py, u * 0.08, 0, Math.PI * 2)
        ctx.fillStyle = stroke
        ctx.fill()
      }
    },
  },
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    category: 'structure',
    defaultSize: 2.0,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      ctx.lineWidth = 1.5

      // Base
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.beginPath()
      ctx.rect(-u, 0, u * 2, u * 0.8)
      ctx.fill()
      ctx.stroke()

      // Roof arch
      ctx.beginPath()
      ctx.moveTo(-u, 0)
      ctx.bezierCurveTo(-u, -u * 0.8, u, -u * 0.8, u, 0)
      ctx.fill()
      ctx.stroke()

      // Ridge line
      ctx.beginPath()
      ctx.moveTo(0, -u * 0.75)
      ctx.lineTo(0, u * 0.8)
      ctx.stroke()

      // Panels
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath()
        ctx.moveTo(i * u * 0.5, 0)
        ctx.lineTo(i * u * 0.5, u * 0.8)
        ctx.stroke()
      }
    },
  },
  {
    id: 'shed',
    label: 'Garden Shed',
    category: 'structure',
    defaultSize: 1.5,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      ctx.lineWidth = 1.5
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke

      // Body
      ctx.beginPath()
      ctx.rect(-u, 0, u * 2, u * 1.2)
      ctx.fill()
      ctx.stroke()

      // Roof (triangle)
      ctx.beginPath()
      ctx.moveTo(-u * 1.1, 0)
      ctx.lineTo(0, -u * 0.7)
      ctx.lineTo(u * 1.1, 0)
      ctx.closePath()
      ctx.fillStyle = stroke
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.stroke()

      // Door
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.rect(-u * 0.2, u * 0.5, u * 0.4, u * 0.7)
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.stroke()
    },
  },
]
