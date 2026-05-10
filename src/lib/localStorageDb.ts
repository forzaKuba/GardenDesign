import type { GardenProject, ProjectMeta } from '@/types/project'

const PREFIX = 'garden-planner:'
const INDEX_KEY = `${PREFIX}index`

function indexKey(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function saveIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids))
}

export function listProjects(): ProjectMeta[] {
  return indexKey()
    .map((id) => {
      try {
        const raw = localStorage.getItem(`${PREFIX}${id}`)
        if (!raw) return null
        const p = JSON.parse(raw) as GardenProject
        return {
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
          elementCount: p.elements.length,
        }
      } catch {
        return null
      }
    })
    .filter((m): m is ProjectMeta => m !== null)
}

export function saveProject(project: GardenProject): void {
  const ids = indexKey()
  if (!ids.includes(project.id)) {
    ids.push(project.id)
    saveIndex(ids)
  }
  localStorage.setItem(`${PREFIX}${project.id}`, JSON.stringify(project))
}

export function loadProject(id: string): GardenProject | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw) as GardenProject
  } catch {
    return null
  }
}

export function deleteProject(id: string): void {
  const ids = indexKey().filter((i) => i !== id)
  saveIndex(ids)
  localStorage.removeItem(`${PREFIX}${id}`)
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(`${PREFIX}onboarded`) === 'true'
}

export function setOnboardingComplete(): void {
  localStorage.setItem(`${PREFIX}onboarded`, 'true')
}
