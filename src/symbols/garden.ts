import type { SymbolDef } from '@/types/symbols'

export const gardenSymbols: SymbolDef[] = [
  {
    id: 'raised-bed',
    label: 'Raised Bed',
    category: 'vegetable',
    defaultSize: 1.5,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      ctx.lineWidth = 2

      // Outer frame
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.beginPath()
      ctx.rect(-u, -u * 0.6, u * 2, u * 1.2)
      ctx.fill()
      ctx.stroke()

      // Inner soil
      ctx.fillStyle = 'rgba(120,80,40,0.35)'
      ctx.beginPath()
      ctx.rect(-u * 0.85, -u * 0.45, u * 1.7, u * 0.9)
      ctx.fill()

      // Row lines
      ctx.strokeStyle = 'rgba(80,50,20,0.5)'
      ctx.lineWidth = 1
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath()
        ctx.moveTo(-u * 0.85, (i / 2.5) * u * 0.45)
        ctx.lineTo(u * 0.85, (i / 2.5) * u * 0.45)
        ctx.stroke()
      }
    },
  },
  {
    id: 'compost-bin',
    label: 'Compost Bin',
    category: 'boundary',
    defaultSize: 0.8,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20

      // Octagon
      const sides = 8
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 8
        const x = Math.cos(angle) * u
        const y = Math.sin(angle) * u
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.setLineDash([4, 3])
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])

      // Label cross
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-u * 0.4, 0)
      ctx.lineTo(u * 0.4, 0)
      ctx.moveTo(0, -u * 0.4)
      ctx.lineTo(0, u * 0.4)
      ctx.stroke()
    },
  },
  {
    id: 'water-tap',
    label: 'Water Tap',
    category: 'water',
    defaultSize: 0.5,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20
      ctx.lineWidth = 2
      ctx.strokeStyle = stroke
      ctx.fillStyle = fill

      // Pipe vertical
      ctx.beginPath()
      ctx.rect(-u * 0.12, -u, u * 0.24, u * 0.7)
      ctx.fill()
      ctx.stroke()

      // Elbow / bend
      ctx.beginPath()
      ctx.arc(-u * 0.12, -u * 0.3, u * 0.24, Math.PI, 0)
      ctx.fill()
      ctx.stroke()

      // Horizontal spout
      ctx.beginPath()
      ctx.rect(u * 0.12, -u * 0.54, u * 0.5, u * 0.2)
      ctx.fill()
      ctx.stroke()

      // Handle
      ctx.beginPath()
      ctx.rect(-u * 0.3, -u * 1.15, u * 0.6, u * 0.15)
      ctx.fill()
      ctx.stroke()

      // Water drop
      ctx.fillStyle = '#4a9edd'
      ctx.beginPath()
      ctx.arc(u * 0.62, -u * 0.12, u * 0.1, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'pond',
    label: 'Garden Pond',
    category: 'water',
    defaultSize: 1.8,
    draw(ctx, scale, fill, stroke) {
      const u = scale * 20

      // Water body (ellipse)
      ctx.beginPath()
      ctx.ellipse(0, 0, u, u * 0.65, 0, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Wave lines
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      for (let row = -1; row <= 1; row++) {
        ctx.beginPath()
        const y = row * u * 0.22
        for (let i = -2; i <= 2; i++) {
          const x = i * u * 0.35
          if (i === -2) ctx.moveTo(x, y)
          else ctx.quadraticCurveTo(x - u * 0.175, y - u * 0.08, x, y)
        }
        ctx.stroke()
      }
    },
  },
]
