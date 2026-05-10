import type { GardenProject } from '@/types/project'

export function exportProjectJson(project: GardenProject): void {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.garden.json`
  a.href = url
  a.click()
  URL.revokeObjectURL(url)
}

export function importProjectJson(jsonString: string): GardenProject {
  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON file')
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    !('id' in data) ||
    !('elements' in data) ||
    !('layers' in data)
  ) {
    throw new Error('Not a valid Garden Planner file')
  }
  return data as GardenProject
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}
