import type { SymbolDef } from '@/types/symbols'

export const treesSymbols: SymbolDef[] = [
  {
    id: 'deciduous-tree',
    label: 'Deciduous Tree',
    category: 'tree',
    defaultSize: 1.5,
    draw(ctx, scale, fill, stroke) {
      const r = scale * 20 // crown radius in px (caller sets scale via transform)
      const trunkW = r * 0.18
      const trunkH = r * 0.4

      // Crown
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Inner highlight circle
      ctx.beginPath()
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fill()

      // Trunk
      ctx.fillStyle = stroke
      ctx.fillRect(-trunkW / 2, r * 0.75, trunkW, trunkH)
    },
  },
  {
    id: 'conifer',
    label: 'Conifer / Pine',
    category: 'tree',
    defaultSize: 1.2,
    draw(ctx, scale, fill, stroke) {
      const h = scale * 38
      const w = scale * 22

      // Three overlapping triangles for layered look
      for (let layer = 0; layer < 3; layer++) {
        const lh = h * (0.5 + layer * 0.15)
        const lw = w * (0.7 + layer * 0.15)
        const topY = -h / 2 + layer * (h * 0.22)
        ctx.beginPath()
        ctx.moveTo(0, topY - lh * 0.5)
        ctx.lineTo(-lw / 2, topY + lh * 0.5)
        ctx.lineTo(lw / 2, topY + lh * 0.5)
        ctx.closePath()
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Trunk
      ctx.fillStyle = stroke
      ctx.fillRect(-2, h * 0.2, 4, h * 0.15)
    },
  },
  {
    id: 'palm',
    label: 'Palm Tree',
    category: 'tree',
    defaultSize: 1.5,
    draw(ctx, scale, fill, stroke) {
      const r = scale * 18

      // Trunk
      ctx.beginPath()
      ctx.moveTo(-2, r * 0.9)
      ctx.quadraticCurveTo(4, 0, 0, -r * 0.5)
      ctx.lineWidth = 4
      ctx.strokeStyle = '#8B5E3C'
      ctx.stroke()

      // Fronds (5 arcs around the top)
      const frondCount = 6
      for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2
        const fx = Math.cos(angle) * r
        const fy = -r * 0.5 + Math.sin(angle) * r * 0.6
        ctx.beginPath()
        ctx.moveTo(0, -r * 0.5)
        ctx.quadraticCurveTo(fx * 0.5, fy * 0.5, fx, fy)
        ctx.lineWidth = 2.5
        ctx.strokeStyle = fill
        ctx.stroke()
      }

      // Center knob
      ctx.beginPath()
      ctx.arc(0, -r * 0.5, 3, 0, Math.PI * 2)
      ctx.fillStyle = stroke
      ctx.fill()
    },
  },
  {
    id: 'shrub',
    label: 'Shrub / Bush',
    category: 'tree',
    defaultSize: 0.8,
    draw(ctx, scale, fill, stroke) {
      const r = scale * 18
      // Three overlapping blobs
      const blobs: Array<[number, number, number]> = [
        [0, 0, r],
        [-r * 0.55, r * 0.2, r * 0.7],
        [r * 0.55, r * 0.2, r * 0.7],
      ]
      for (const [bx, by, br] of blobs) {
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1
        ctx.stroke()
      }
    },
  },
]
