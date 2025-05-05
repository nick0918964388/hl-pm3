import type { Project, Task, Turbine } from "./types"
import { addDays, addWeeks } from "date-fns"

// API配置
export const API_CONFIG = {
  useMaximoAPI: process.env.NEXT_PUBLIC_USE_MAXIMO_API === "true" || false, // 從環境變量讀取
  baseURL: process.env.NEXT_PUBLIC_MAXIMO_API_BASE_URL || "http://hl.webtw.xyz/maximo/oslc/script/",
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"), // 毫秒
  maxauth: process.env.NEXT_PUBLIC_MAXIMO_AUTH || "bWF4YWRtaW46emFxMXhzVzI=" // Maximo授權token
}

// Maximo API 端點
const API_ENDPOINTS = {
  // 專案相關端點
  getProjects: "GET_PROJECTS",
  createProject: "CREATE_PROJECT",
  updateProject: "UPDATE_PROJECT",
  deleteProject: "DELETE_PROJECT",
  
  // 風機相關端點
  getTurbines: "GET_TURBINES",
  createTurbine: "CREATE_TURBINE",
  updateTurbine: "UPDATE_TURBINE",
  deleteTurbine: "DELETE_TURBINE",
  
  // 任務相關端點
  getTasks: "GET_TASKS",
  createTask: "CREATE_TASK",
  updateTask: "UPDATE_TASK",
  deleteTask: "DELETE_TASK"
}

// Maximo API 調用函數
async function callMaximoAPI<T>(endpoint: string, data: any = {}): Promise<T> {
  try {
    const url = `${API_CONFIG.baseURL}${endpoint}`
    
    // 從data對象中移除maxauth，不再在請求體中發送
    const requestData = { ...data }
    
    const options: RequestInit = {
      method: "POST", // 統一使用POST方法
      headers: {
        "Content-Type": "application/json",
        "maxauth": API_CONFIG.maxauth, // 直接在header中設置maxauth
      },
      body: JSON.stringify(requestData)
    }

    // 使用AbortController實現請求超時
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    options.signal = controller.signal

    try {
      const response = await fetch(url, options)
      clearTimeout(timeoutId) // 清除超時計時器
      
      if (!response.ok) {
        throw new Error(`API請求失敗: ${response.status} ${response.statusText}`)
      }
      
      return await response.json() as T
    } catch (error) {
      clearTimeout(timeoutId) // 確保清除超時計時器
      throw error
    }
  } catch (error) {
    console.error("Maximo API調用失敗:", error)
    throw error
  }
}

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
    const code = `${series}-${position}`

    return {
      id: `WB${String(i + 30).padStart(3, "0")}`,
      code: code,
      name: `風機 ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
    }
  }),
  "2": Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5)
    const col = i % 5
    const series = "FM2"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`

    return {
      id: `FM${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `風機 ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
    }
  }),
  "3": Array.from({ length: 30 }, (_, i) => {
    const row = Math.floor(i / 6)
    const col = i % 6
    const series = "GC"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`

    return {
      id: `GC${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `風機 ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
    }
  }),
  "4": Array.from({ length: 20 }, (_, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    const series = "YL"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`

    return {
      id: `YL${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `風機 ${i + 1}`,
      displayName: code,
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

      // 確保taskType是有效的Task.type類型
      const validTaskType = taskType as "foundation" | "piles" | "jacket" | "wtg" | "cables" | "operation"

      tasks.push({
        id: `task-${taskType}-${turbine.id}`,
        projectId,
        name: `${getTaskTypeName(taskType)} ${turbine.id}`,
        description: `${getTaskTypeDescription(taskType)}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        type: validTaskType,
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

// 格式化日期為yyyy-MM-dd
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // 從ISO格式中取出yyyy-MM-dd部分
}

// API 函數 - 專案管理
export async function fetchProjects(): Promise<Project[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Project[]>(API_ENDPOINTS.getProjects)
    } catch (error) {
      console.warn("使用Maximo API獲取專案失敗，回退到模擬數據", error)
      return [...mockProjects]
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  return [...mockProjects]
}

// 新增獲取單個專案的功能
export async function fetchProject(projectId: string): Promise<Project | null> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // 如果實際API有獲取單個專案的端點，可以使用以下代碼
      // return await callMaximoAPI<Project>(API_ENDPOINTS.getProject, { projectId })
      
      // 目前暫時使用獲取所有專案再篩選的方式
      const projects = await callMaximoAPI<Project[]>(API_ENDPOINTS.getProjects)
      return projects.find(project => project.id === projectId) || null
    } catch (error) {
      console.warn("使用Maximo API獲取單個專案失敗，回退到模擬數據", error)
      // 從模擬數據中查找專案，確保函數總是返回一個值
      const project = mockProjects.find(p => p.id === projectId)
      return project || null
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  // 從模擬數據中查找專案
  const project = mockProjects.find(p => p.id === projectId)
  return project || null
}

export async function createProject(project: Project): Promise<Project> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // 複製並轉換日期格式
      const formattedProject = {
        ...project,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate)
      };
      
      return await callMaximoAPI<Project>(API_ENDPOINTS.createProject, formattedProject)
    } catch (error) {
      console.warn("使用Maximo API創建專案失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  
  // 確保專案有唯一ID - 使用時間戳+隨機字符串組合
  const newProject = { 
    ...project, 
    id: project.id || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  }
  
  mockProjects.push(newProject)
  return newProject
}

export async function updateProject(project: Project): Promise<Project> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // 複製並轉換日期格式
      const formattedProject = {
        ...project,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate)
      };
      
      return await callMaximoAPI<Project>(API_ENDPOINTS.updateProject, formattedProject)
    } catch (error) {
      console.warn("使用Maximo API更新專案失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  const index = mockProjects.findIndex((p) => p.id === project.id)
  if (index !== -1) {
    mockProjects[index] = project
  }
  return project
}

export async function deleteProject(projectId: string): Promise<void> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      await callMaximoAPI<void>(API_ENDPOINTS.deleteProject, { projectId })
      return
    } catch (error) {
      console.warn("使用Maximo API刪除專案失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockProjects.findIndex((p) => p.id === projectId)
  if (index !== -1) {
    mockProjects.splice(index, 1)
  }
}

// API 函數 - 風機管理
export async function fetchTurbines(projectId: string): Promise<Turbine[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Turbine[]>(API_ENDPOINTS.getTurbines, { projectId })
    } catch (error) {
      console.warn("使用Maximo API獲取風機失敗，回退到模擬數據", error)
      return mockTurbines[projectId] || []
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  return mockTurbines[projectId] || []
}

export async function createTurbine(projectId: string, turbine: Turbine): Promise<Turbine> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      const data = { ...turbine, projectId }
      return await callMaximoAPI<Turbine>(API_ENDPOINTS.createTurbine, data)
    } catch (error) {
      console.warn("使用Maximo API創建風機失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (!mockTurbines[projectId]) {
    mockTurbines[projectId] = []
  }
  mockTurbines[projectId].push(turbine)
  return turbine
}

export async function updateTurbine(projectId: string, turbine: Turbine): Promise<Turbine> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Turbine>(API_ENDPOINTS.updateTurbine, { ...turbine, projectId })
    } catch (error) {
      console.warn("使用Maximo API更新風機失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
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
  if (API_CONFIG.useMaximoAPI) {
    try {
      await callMaximoAPI<void>(API_ENDPOINTS.deleteTurbine, { projectId, turbineId })
      return
    } catch (error) {
      console.warn("使用Maximo API刪除風機失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
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
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Task[]>(API_ENDPOINTS.getTasks, { projectId })
    } catch (error) {
      console.warn("使用Maximo API獲取任務失敗，回退到模擬數據", error)
      return mockTasks[projectId] || []
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  // 確保每個任務都有 turbineIds 屬性
  const tasks = mockTasks[projectId] || []
  return tasks.map(task => ({
    ...task,
    turbineIds: task.turbineIds || []
  }))
}

export async function createTask(task: Task): Promise<Task> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // 確保有 turbineIds 屬性
      const taskWithTurbineIds = {
        ...task,
        turbineIds: task.turbineIds || []
      }
      return await callMaximoAPI<Task>(API_ENDPOINTS.createTask, taskWithTurbineIds)
    } catch (error) {
      console.warn("使用Maximo API創建任務失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (!mockTasks[task.projectId]) {
    mockTasks[task.projectId] = []
  }
  // 確保有 turbineIds 屬性
  const taskWithTurbineIds = {
    ...task,
    turbineIds: task.turbineIds || []
  }
  mockTasks[task.projectId].push(taskWithTurbineIds)
  return taskWithTurbineIds
}

export async function updateTask(task: Task): Promise<Task> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // 確保有 turbineIds 屬性
      const taskWithTurbineIds = {
        ...task,
        turbineIds: task.turbineIds || []
      }
      return await callMaximoAPI<Task>(API_ENDPOINTS.updateTask, taskWithTurbineIds)
    } catch (error) {
      console.warn("使用Maximo API更新任務失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 600))
  const tasks = mockTasks[task.projectId] || []
  const index = tasks.findIndex((t) => t.id === task.id)
  // 確保有 turbineIds 屬性
  const taskWithTurbineIds = {
    ...task,
    turbineIds: task.turbineIds || []
  }
  if (index !== -1) {
    tasks[index] = taskWithTurbineIds
  }
  return taskWithTurbineIds
}

export async function deleteTask(taskId: string): Promise<void> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      await callMaximoAPI<void>(API_ENDPOINTS.deleteTask, { taskId })
      return
    } catch (error) {
      console.warn("使用Maximo API刪除任務失敗，回退到模擬數據", error)
      // 回退到模擬數據操作
    }
  }
  
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
