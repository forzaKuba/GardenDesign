export function exportPng(canvas: HTMLCanvasElement, filename = 'garden-plan.png'): void {
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.download = filename
  a.href = dataUrl
  a.click()
}
