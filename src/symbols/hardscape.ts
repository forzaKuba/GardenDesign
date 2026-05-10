import type { SymbolDef } from '@/types/symbols'

export const hardscapeSymbols: SymbolDef[] = [
  {
    id: 'stepping-stones',
    label: 'Stepping Stones',
    category: 'path',
    defaultSize: 1.0,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      const stones: Array<[number, number, number, number]> = [
        [-u * 0.55, -u * 0.3, u * 0.5, u * 0.35],
        [u * 0.1, -u * 0.55, u * 0.45, u * 0.3],
        [-u * 0.15, u * 0.2, u * 0.55, u * 0.4],
        [u * 0.5, u * 0.1, u * 0.4, u * 0.35],
      ]
      for (const [sx, sy, sw, sh] of stones) {
        ctx.beginPath()
        ctx.ellipse(sx, sy, sw / 2, sh / 2, Math.random() * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    },
  },
  {
    id: 'gravel-area',
    label: 'Gravel Area',
    category: 'path',
    defaultSize: 2.0,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20

      // Background
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.rect(-u, -u, u * 2, u * 2)
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Stipple dots
      ctx.fillStyle = stroke
      const seed = [0.15, 0.45, 0.75, 0.3, 0.6, 0.9, 0.05, 0.55, 0.82]
      for (let i = 0; i < seed.length; i++) {
        const gx = -u + seed[i] * u * 2
        const gy = -u + seed[(i + 3) % seed.length] * u * 2
        ctx.beginPath()
        ctx.arc(gx, gy, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'retaining-wall',
    label: 'Retaining Wall',
    category: 'structure',
    defaultSize: 1.5,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20

      // Outer rect
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.rect(-u, -u * 0.25, u * 2, u * 0.5)
      ctx.fill()
      ctx.stroke()

      // Brick courses
      ctx.lineWidth = 0.8
      const rows = 3
      for (let r = 0; r < rows; r++) {
        const y = -u * 0.25 + (r * u * 0.5) / rows
        ctx.beginPath()
        ctx.moveTo(-u, y)
        ctx.lineTo(u, y)
        ctx.stroke()
        // Staggered vertical joints
        const offset = r % 2 === 0 ? 0 : u * 0.33
        for (let c = -2; c <= 2; c++) {
          const x = c * u * 0.66 + offset
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + u * 0.5 / rows)
          ctx.stroke()
        }
      }
    },
  },
  {
    id: 'path-border',
    label: 'Path Border',
    category: 'fence',
    defaultSize: 1.0,
    draw(ctx, scale, _fill, stroke) {
      const u = scale * 20

      ctx.strokeStyle = stroke
      ctx.lineWidth = 2
      ctx.setLineDash([u * 0.2, u * 0.1])

      // Two parallel dashed lines
      ctx.beginPath()
      ctx.moveTo(-u, -u * 0.2)
      ctx.lineTo(u, -u * 0.2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-u, u * 0.2)
      ctx.lineTo(u, u * 0.2)
      ctx.stroke()

      ctx.setLineDash([])
    },
  },
]
