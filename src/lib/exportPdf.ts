import type { GardenProject } from '@/types/project'

export type PageSize = 'a4'
export type PageOrientation = 'portrait' | 'landscape'

export async function exportPdf(
  canvas: HTMLCanvasElement,
  project: GardenProject,
  orientation: PageOrientation = 'landscape'
): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  const titleH = 12
  const footerH = 18

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(project.name, margin, margin + 6)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(
    `Garden Planner  ·  ${new Date(project.updatedAt).toLocaleDateString()}`,
    margin,
    margin + 11
  )
  doc.setTextColor(0)

  // Canvas image
  const imgX = margin
  const imgY = margin + titleH
  const imgW = pageW - margin * 2
  const imgH = pageH - margin * 2 - titleH - footerH

  const dataUrl = canvas.toDataURL('image/png')
  doc.addImage(dataUrl, 'PNG', imgX, imgY, imgW, imgH)

  // Scale bar (bottom-left of image area)
  const barY = imgY + imgH + 6
  const barLen = 30 // mm in the PDF
  doc.setLineWidth(0.5)
  doc.setDrawColor(0)
  // bar
  doc.rect(margin, barY, barLen, 3, 'F')
  doc.setFillColor(255, 255, 255)
  doc.rect(margin + barLen / 2, barY, barLen / 2, 3, 'F')
  doc.rect(margin, barY, barLen, 3, 'S')
  doc.setFontSize(7)
  doc.text('0', margin - 1, barY + 7)
  doc.text('5m', margin + barLen - 2, barY + 7)

  // Compass (bottom-right of image area)
  const cx = pageW - margin - 12
  const cy = barY + 4
  const r = 6
  // N arrow
  doc.setFillColor(180, 40, 40)
  doc.triangle(cx, cy - r, cx - 3, cy + 1, cx + 3, cy + 1, 'F')
  // S arrow
  doc.setFillColor(180, 180, 180)
  doc.triangle(cx, cy + r, cx - 3, cy - 1, cx + 3, cy - 1, 'F')
  doc.setFontSize(8)
  doc.setTextColor(60)
  doc.text('N', cx - 2, cy - r - 2)
  doc.setTextColor(0)

  doc.save(`${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}
