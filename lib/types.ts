export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: "pending" | "in-progress" | "completed"
  type: "foundation" | "piles" | "jacket" | "wtg" | "cables" | "operation"
  turbineIds: string[]
}

export interface Turbine {
  id: string
  code: string // 例如 HL21-A01-A
  name: string
  location: {
    x: number
    y: number
  }
}
