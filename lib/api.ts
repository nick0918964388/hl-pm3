import type { Project, Task, Turbine } from "./types"
import { addDays, addWeeks } from "date-fns"

// 模擬 API 調用
// 在實際應用中，這些函數將使用 fetch 或 axios 調用後端 API

// 修改模擬專案數據部分
const mockProjects: Project[] = [
  {
    id: "1",
    name: "HAI LONG 2A + 2B",
    description: "海龍風場專案，位於台灣海峽，總裝機容量為1,044 MW",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
  },
  {
    id: "2",
    name: "FORMOSA 2",
    description: "福爾摩沙風場專案，位於苗栗外海，總裝機容量為376 MW",
    startDate: "2023-03-15",
    endDate: "2024-06-30",
  },
  {
    id: "3",
    name: "GREATER CHANGHUA",
    description: "大彰化風場專案，位於彰化外海，總裝機容量為900 MW",
    startDate: "2023-02-01",
    endDate: "2024-01-31",
  },
  {
    id: "4",
    name: "YUNLIN OFFSHORE",
    description: "雲林離岸風場專案，位於雲林外海，總裝機容量為640 MW",
    startDate: "2023-04-01",
    endDate: "2024-03-31",
  },
]

// 為新增的專案添加模擬風機數據
// 在mockTurbines對象中添加新專案的風機數據
const mockTurbines: { [key: string]: Turbine[] } = {
  "1": Array.from({ length: 38 }, (_, i) => {
    const row = Math.floor(i / 9)
    const col = i % 9
    const series = col < 5 ? "HL21" : "HL22"
    const position = String(row + 1).padStart(2, "0") + (col < 5 ? "-A" : "-B")

    return {
      id: `WB${String(i + 30).padStart(3, "0")}`,
      code: `${series}-${position}`,
      name: `風機 ${i + 1}`,
      location: { x: col, y: row },
    }
  }),
  "2": Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5)
    const col = i % 5
    const series = "FM2"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")

    return {
      id: `FM${String(i + 1).padStart(3, "0")}`,
      code: `${series}-${position}`,
      name: `風機 ${i + 1}`,
      location: { x: col, y: row },
    }
  }),
  "3": Array.from({ length: 30 }, (_, i) => {
    const row = Math.floor(i / 6)
    const col = i % 6
    const series = "GC"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")

    return {
      id: `GC${String(i + 1).padStart(3, "0")}`,
      code: `${series}-${position}`,
      name: `風機 ${i + 1}`,
      location: { x: col, y: row },
    }
  }),
  "4": Array.from({ length: 20 }, (_, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    const series = "YL"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")

    return {
      id: `YL${String(i + 1).padStart(3, "0")}`,
      code: `${series}-${position}`,
      name: `風機 ${i + 1}`,
      location: { x: col, y: row },
    }
  }),
}

// 定義每個專案的任務類型
const projectTaskTypes = {
  "1": ["foundation", "piles", "jacket", "wtg", "cables", "operation"], // 海龍 - 6種任務類型
  "2": ["foundation", "piles", "jacket", "cables"], // 福爾摩沙 - 4種任務類型
  "3": ["foundation", "piles", "jacket", "wtg", "cables"], // 大彰化 - 5種任務類型
  "4": ["foundation", "piles", "jacket"], // 雲林 - 3種任務類型
}

// 生成任務數據，按照時間順序分配任務
const generateTasksWithTimeProgression = (projectId: string, turbines: Turbine[]) => {
  const tasks: Task[] = []
  const baseDate = new Date("2023-01-01")

  // 獲取該專案的任務類型
  const taskTypes = projectTaskTypes[projectId as keyof typeof projectTaskTypes] || ["foundation", "piles", "jacket"]

  // 計算每個任務類型的時間間隔
  const totalWeeks = 52 // 一年的週數
  const weeksPerTaskType = Math.floor(totalWeeks / taskTypes.length)

  // 為每種任務類型生成任務
  taskTypes.forEach((taskType, typeIndex) => {
    // 計算該任務類型的開始週和結束週
    const startWeek = typeIndex * weeksPerTaskType
    const endWeek = (typeIndex + 1) * weeksPerTaskType - 1

    // 每週完成的風機數量
    const turbinesPerWeek = Math.ceil(turbines.length / (endWeek - startWeek + 1))

    // 為每個風機生成該類型的任務
    turbines.forEach((turbine, turbineIndex) => {
      // 計算該風機任務的週偏移量
      const weekOffset = startWeek + Math.floor(turbineIndex / turbinesPerWeek)
      const startDate = addWeeks(baseDate, weekOffset)
      const endDate = addDays(startDate, 6) // 一週後完成

      // 根據時間確定任務狀態
      const status = weekOffset < 20 ? "completed" : weekOffset < 30 ? "in-progress" : "pending"

      tasks.push({
        id: `task-${taskType}-${turbine.id}`,
        projectId,
        name: `${getTaskTypeName(taskType)} ${turbine.id}`,
        description: `${getTaskTypeDescription(taskType)}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        type: taskType,
        turbineIds: [turbine.id],
      })
    })
  })

  return tasks
}

// 獲取任務類型的中文名稱
const getTaskTypeName = (taskType: string): string => {
  const taskTypeNames: { [key: string]: string } = {
    foundation: "海床整平",
    piles: "樁基礎安裝",
    jacket: "套管安裝",
    wtg: "風機安裝",
    cables: "電纜鋪設",
    operation: "運營維護",
  }
  return taskTypeNames[taskType] || taskType
}

// 獲取任務類型的描述
const getTaskTypeDescription = (taskType: string): string => {
  const taskTypeDescriptions: { [key: string]: string } = {
    foundation: "風機基礎海床整平工作",
    piles: "風機樁基礎安裝工作",
    jacket: "風機套管安裝工作",
    wtg: "風機本體安裝工作",
    cables: "風機電纜鋪設工作",
    operation: "風機運營維護工作",
  }
  return taskTypeDescriptions[taskType] || "風機相關工作"
}

// 為新增的專案生成任務數據
// 在mockTasks對象中添加新專案的任務數據
const mockTasks: { [key: string]: Task[] } = {
  "1": generateTasksWithTimeProgression("1", mockTurbines["1"]),
  "2": generateTasksWithTimeProgression("2", mockTurbines["2"]),
  "3": generateTasksWithTimeProgression("3", mockTurbines["3"]),
  "4": generateTasksWithTimeProgression("4", mockTurbines["4"]),
}

// API 函數 - 專案管理
export async function fetchProjects(): Promise<Project[]> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockProjects
}

export async function createProject(project: Project): Promise<Project> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  mockProjects.push(project)
  return project
}

export async function updateProject(project: Project): Promise<Project> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  const index = mockProjects.findIndex((p) => p.id === project.id)
  if (index !== -1) {
    mockProjects[index] = project
  }
  return project
}

export async function deleteProject(projectId: string): Promise<void> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockProjects.findIndex((p) => p.id === projectId)
  if (index !== -1) {
    mockProjects.splice(index, 1)
  }
}

// API 函數 - 風機管理
export async function fetchTurbines(projectId: string): Promise<Turbine[]> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  return mockTurbines[projectId] || []
}

export async function createTurbine(projectId: string, turbine: Turbine): Promise<Turbine> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (!mockTurbines[projectId]) {
    mockTurbines[projectId] = []
  }
  mockTurbines[projectId].push(turbine)
  return turbine
}

export async function updateTurbine(projectId: string, turbine: Turbine): Promise<Turbine> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  const turbines = mockTurbines[projectId] || []
  const index = turbines.findIndex((t) => t.id === turbine.id)
  if (index !== -1) {
    turbines[index] = turbine
  }
  return turbine
}

export async function deleteTurbine(projectId: string, turbineId: string): Promise<void> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  const turbines = mockTurbines[projectId] || []
  const index = turbines.findIndex((t) => t.id === turbineId)
  if (index !== -1) {
    turbines.splice(index, 1)
  }
}

// API 函數 - 任務管理
export async function fetchTasks(projectId: string): Promise<Task[]> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  return mockTasks[projectId] || []
}

export async function createTask(task: Task): Promise<Task> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (!mockTasks[task.projectId]) {
    mockTasks[task.projectId] = []
  }
  mockTasks[task.projectId].push(task)
  return task
}

export async function updateTask(task: Task): Promise<Task> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  const tasks = mockTasks[task.projectId] || []
  const index = tasks.findIndex((t) => t.id === task.id)
  if (index !== -1) {
    tasks[index] = task
  }
  return task
}

export async function deleteTask(taskId: string): Promise<void> {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  Object.keys(mockTasks).forEach((projectId) => {
    const tasks = mockTasks[projectId]
    const index = tasks.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      tasks.splice(index, 1)
    }
  })
}
