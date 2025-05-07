import type { Project, Task, Turbine, TaskType, Cable, Substation, TurbineAlert, MaintenanceTicket } from "./types"
import { addDays, addWeeks } from "date-fns"

// 預設任務類型
const defaultTaskTypes: TaskType[] = [
  { value: "foundation", label: "Seabed Leveling" },
  { value: "piles", label: "Pile Foundation Installation" },
  { value: "jacket", label: "Jacket Installation" },
  { value: "wtg", label: "Wind Turbine Installation" },
  { value: "cables", label: "Cable Laying" },
  { value: "operation", label: "Operation & Maintenance" }
];

// API Configuration
export const API_CONFIG = {
  useMaximoAPI: process.env.NEXT_PUBLIC_USE_MAXIMO_API === "true" || true, // Read from environment variables
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"), // Milliseconds
  maxauth: process.env.NEXT_PUBLIC_MAXIMO_AUTH || "bWF4YWRtaW46emFxMXhzVzI=" // Maximo authorization token
}

// Maximo API Endpoints
const API_ENDPOINTS = {
  // Project related endpoints
  getProjects: "GET_PROJECTS",
  createProject: "CREATE_PROJECT",
  updateProject: "UPDATE_PROJECT",
  deleteProject: "DELETE_PROJECT",
  
  // Turbine related endpoints
  getTurbines: "GET_TURBINES",
  createTurbine: "CREATE_TURBINE",
  updateTurbine: "UPDATE_TURBINE",
  deleteTurbine: "DELETE_TURBINE",
  
  // Cable and Substation related endpoints
  getCables: "GET_CABLES",
  getSubstations: "GET_SUBSTATIONS",
  
  // Task related endpoints
  getTasks: "GET_TASKS",
  createTask: "CREATE_TASK",
  updateTask: "UPDATE_TASK",
  deleteTask: "DELETE_TASK",
  
  // Task type related endpoints
  getTaskTypes: "GET_TASK_TYPES",
  newTaskType: "NEW_TASK_TYPE",
  deleteTaskType: "DELETE_TASK_TYPE",
  
  // Turbine data and event endpoints
  getTurbineHistoricalPower: "GET_TURBINE_HISTORICAL_POWER",
  getEvents: "GET_EVENTS",  // 異常事件端點
  getWorkOrders: "GET_WO",  // 維修工單端點
  createCMWorkOrder: "MOBILEAPP_CREATE_CM_WORKORDER" // 創建修復性維護工單
}

// Maximo API Call Function
async function callMaximoAPI<T>(endpoint: string, data: any = {}): Promise<T> {
  try {
    // 確保端點是有效的URL路徑
    const sanitizedEndpoint = endpoint.replace(/[^\w-]/g, '_');
    
    // Use Next.js proxy route
    const url = `/api/maximo/${sanitizedEndpoint}`
    
    // Remove maxauth from data object, no longer sending in request body
    const requestData = { ...data }
    
    const options: RequestInit = {
      method: "POST", // Uniformly use POST method
      headers: {
        "Content-Type": "application/json",
        "maxauth": API_CONFIG.maxauth, // Set maxauth directly in header
      },
      body: JSON.stringify(requestData)
    }

    // Use AbortController to implement request timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    options.signal = controller.signal

    try {
      const response = await fetch(url, options)
      clearTimeout(timeoutId) // Clear timeout timer
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return await response.json() as T
    } catch (error) {
      clearTimeout(timeoutId) // Ensure timeout timer is cleared
      throw error
    }
  } catch (error) {
    console.error("Maximo API call failed:", error)
    throw error
  }
}

// Modified mock project data section
const mockProjects: Project[] = [
  {
    id: "1",
    name: "HAI LONG 2A + 2B",
    description: "Hai Long Wind Farm Project, located in the Taiwan Strait, with a total installed capacity of 1,044 MW",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
  },
  {
    id: "2",
    name: "FORMOSA 2",
    description: "Formosa Wind Farm Project, located off the coast of Miaoli, with a total installed capacity of 376 MW",
    startDate: "2023-03-15",
    endDate: "2024-06-30",
  },
  {
    id: "3",
    name: "GREATER CHANGHUA",
    description: "Greater Changhua Wind Farm Project, located off the coast of Changhua, with a total installed capacity of 900 MW",
    startDate: "2023-02-01",
    endDate: "2024-01-31",
  },
  {
    id: "4",
    name: "YUNLIN OFFSHORE",
    description: "Yunlin Offshore Wind Farm Project, located off the coast of Yunlin, with a total installed capacity of 640 MW",
    startDate: "2023-04-01",
    endDate: "2024-03-31",
  },
]

// Add simulated turbine data for new projects
// Add turbine data for new projects in the mockTurbines object
const mockTurbines: { [key: string]: Turbine[] } = {
  "1": Array.from({ length: 38 }, (_, i) => {
    const row = Math.floor(i / 9)
    const col = i % 9
    const series = col < 5 ? "HL21" : "HL22"
    const position = String(row + 1).padStart(2, "0") + (col < 5 ? "-A" : "-B")
    const code = `${series}-${position}`
    
    // 生成隨機狀態和運行數據
    const statusOptions = ['normal', 'warning', 'error', 'maintenance'] as const
    const statusIndex = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
    const status = statusOptions[statusIndex]
    
    // 根據狀態生成對應的數據
    const rpm = status === 'normal' ? 12 + Math.random() * 4 : 
               status === 'warning' ? 8 + Math.random() * 5 :
               status === 'maintenance' || status === 'error' ? 0 : 0
    
    const power = status === 'normal' ? 0.8 + Math.random() * 0.5 :
                 status === 'warning' ? 0.3 + Math.random() * 0.6 :
                 status === 'maintenance' || status === 'error' ? 0 : 0
    
    const maintenanceTickets = status === 'normal' ? 0 :
                              status === 'warning' ? 1 :
                              status === 'error' ? Math.floor(Math.random() * 2) + 1 :
                              status === 'maintenance' ? 1 : 0

    // 生成台灣北部海域的座標 (約宜蘭外海)
    const baseLat = 24.7 + (row * 0.05)
    const baseLng = 122.1 + (col * 0.05)

    // 添加 groupId 屬性
    let groupId = series === "HL21" ? "HL2A" : "HL2B"

    return {
      id: `WB${String(i + 30).padStart(3, "0")}`,
      code: code,
      name: `Turbine ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
      coordinates: { lat: baseLat, lng: baseLng },
      status,
      rpm: Number(rpm.toFixed(1)),
      power: Number(power.toFixed(1)),
      maintenanceTickets,
      groupId
    }
  }),
  "2": Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5)
    const col = i % 5
    const series = "FM2"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`
    
    // 生成隨機狀態和運行數據
    const statusOptions = ['normal', 'warning', 'error', 'maintenance'] as const
    const statusIndex = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
    const status = statusOptions[statusIndex]
    
    // 根據狀態生成對應的數據
    const rpm = status === 'normal' ? 12 + Math.random() * 4 : 
               status === 'warning' ? 8 + Math.random() * 5 :
               status === 'maintenance' || status === 'error' ? 0 : 0
    
    const power = status === 'normal' ? 0.8 + Math.random() * 0.5 :
                 status === 'warning' ? 0.3 + Math.random() * 0.6 :
                 status === 'maintenance' || status === 'error' ? 0 : 0
    
    const maintenanceTickets = status === 'normal' ? 0 :
                              status === 'warning' ? 1 :
                              status === 'error' ? Math.floor(Math.random() * 2) + 1 :
                              status === 'maintenance' ? 1 : 0

    // 生成台灣西部海域的座標 (約苗栗外海)
    const baseLat = 24.55 + (row * 0.04)
    const baseLng = 120.4 + (col * 0.04)

    return {
      id: `FM${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `Turbine ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
      coordinates: { lat: baseLat, lng: baseLng },
      status,
      rpm: Number(rpm.toFixed(1)),
      power: Number(power.toFixed(1)),
      maintenanceTickets
    }
  }),
  "3": Array.from({ length: 30 }, (_, i) => {
    const row = Math.floor(i / 6)
    const col = i % 6
    const series = "GC"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`
    
    // 生成隨機狀態和運行數據
    const statusOptions = ['normal', 'warning', 'error', 'maintenance'] as const
    const statusIndex = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
    const status = statusOptions[statusIndex]
    
    // 根據狀態生成對應的數據
    const rpm = status === 'normal' ? 12 + Math.random() * 4 : 
               status === 'warning' ? 8 + Math.random() * 5 :
               status === 'maintenance' || status === 'error' ? 0 : 0
    
    const power = status === 'normal' ? 0.8 + Math.random() * 0.5 :
                 status === 'warning' ? 0.3 + Math.random() * 0.6 :
                 status === 'maintenance' || status === 'error' ? 0 : 0
    
    const maintenanceTickets = status === 'normal' ? 0 :
                              status === 'warning' ? 1 :
                              status === 'error' ? Math.floor(Math.random() * 2) + 1 :
                              status === 'maintenance' ? 1 : 0

    // 生成台灣中部海域的座標 (約彰化外海)
    const baseLat = 23.8 + (row * 0.04)
    const baseLng = 120.0 + (col * 0.04)

    return {
      id: `GC${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `Turbine ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
      coordinates: { lat: baseLat, lng: baseLng },
      status,
      rpm: Number(rpm.toFixed(1)),
      power: Number(power.toFixed(1)),
      maintenanceTickets
    }
  }),
  "4": Array.from({ length: 20 }, (_, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    const series = "YL"
    const position = String(row + 1).padStart(2, "0") + "-" + String(col + 1).padStart(2, "0")
    const code = `${series}-${position}`
    
    // 生成隨機狀態和運行數據
    const statusOptions = ['normal', 'warning', 'error', 'maintenance'] as const
    const statusIndex = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
    const status = statusOptions[statusIndex]
    
    // 根據狀態生成對應的數據
    const rpm = status === 'normal' ? 12 + Math.random() * 4 : 
               status === 'warning' ? 8 + Math.random() * 5 :
               status === 'maintenance' || status === 'error' ? 0 : 0
    
    const power = status === 'normal' ? 0.8 + Math.random() * 0.5 :
                 status === 'warning' ? 0.3 + Math.random() * 0.6 :
                 status === 'maintenance' || status === 'error' ? 0 : 0
    
    const maintenanceTickets = status === 'normal' ? 0 :
                              status === 'warning' ? 1 :
                              status === 'error' ? Math.floor(Math.random() * 2) + 1 :
                              status === 'maintenance' ? 1 : 0

    // 生成台灣中南部海域的座標 (約雲林外海)
    const baseLat = 23.6 + (row * 0.03)
    const baseLng = 120.0 + (col * 0.03)

    return {
      id: `YL${String(i + 1).padStart(3, "0")}`,
      code: code,
      name: `Turbine ${i + 1}`,
      displayName: code,
      location: { x: col, y: row },
      coordinates: { lat: baseLat, lng: baseLng },
      status,
      rpm: Number(rpm.toFixed(1)),
      power: Number(power.toFixed(1)),
      maintenanceTickets
    }
  }),
}

// Define task types for each project
const projectTaskTypes = {
  "1": ["foundation", "piles", "jacket", "wtg", "cables", "operation"], // Hai Long - 6 task types
  "2": ["foundation", "piles", "jacket", "cables"], // Formosa - 4 task types
  "3": ["foundation", "piles", "jacket", "wtg", "cables"], // Greater Changhua - 5 task types
  "4": ["foundation", "piles", "jacket"], // Yunlin - 3 task types
}

// Generate task data, allocate tasks in chronological order
const generateTasksWithTimeProgression = (projectId: string, turbines: Turbine[]) => {
  const tasks: Task[] = []
  const baseDate = new Date("2023-01-01")

  // Get task types for this project
  const taskTypes = projectTaskTypes[projectId as keyof typeof projectTaskTypes] || ["foundation", "piles", "jacket"]

  // Calculate time interval for each task type
  const totalWeeks = 52 // Weeks in a year
  const weeksPerTaskType = Math.floor(totalWeeks / taskTypes.length)

  // Generate tasks for each task type
  taskTypes.forEach((taskType, typeIndex) => {
    // Calculate start week and end week for this task type
    const startWeek = typeIndex * weeksPerTaskType
    const endWeek = (typeIndex + 1) * weeksPerTaskType - 1

    // Number of turbines completed per week
    const turbinesPerWeek = Math.ceil(turbines.length / (endWeek - startWeek + 1))

    // Generate tasks of this type for each turbine
    turbines.forEach((turbine, turbineIndex) => {
      // Calculate week offset for this turbine's task
      const weekOffset = startWeek + Math.floor(turbineIndex / turbinesPerWeek)
      const startDate = addWeeks(baseDate, weekOffset)
      const endDate = addDays(startDate, 6) // Completed after one week

      // Determine task status based on time
      const status = weekOffset < 20 ? "completed" : weekOffset < 30 ? "in-progress" : "pending"

      // Ensure taskType is a valid Task.type
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

// Get task type name
const getTaskTypeName = (taskType: string): string => {
  const taskTypeNames: { [key: string]: string } = {
    foundation: "Seabed Leveling",
    piles: "Pile Foundation Installation",
    jacket: "Jacket Installation",
    wtg: "Wind Turbine Installation",
    cables: "Cable Laying",
    operation: "Operation & Maintenance",
  }
  return taskTypeNames[taskType] || taskType
}

// Get task type description
const getTaskTypeDescription = (taskType: string): string => {
  const taskTypeDescriptions: { [key: string]: string } = {
    foundation: "Wind turbine foundation seabed leveling work",
    piles: "Wind turbine pile foundation installation work",
    jacket: "Wind turbine jacket installation work",
    wtg: "Wind turbine body installation work",
    cables: "Wind turbine cable laying work",
    operation: "Wind turbine operation and maintenance work",
  }
  
  return taskTypeDescriptions[taskType] || ""
}

// Generate task data for new projects
// Add task data for new projects in the mockTasks object
const mockTasks: { [key: string]: Task[] } = {
  "1": generateTasksWithTimeProgression("1", mockTurbines["1"]),
  "2": generateTasksWithTimeProgression("2", mockTurbines["2"]),
  "3": generateTasksWithTimeProgression("3", mockTurbines["3"]),
  "4": generateTasksWithTimeProgression("4", mockTurbines["4"]),
}

// Format date as yyyy-MM-dd
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Extract yyyy-MM-dd part from ISO format
}

// API Functions - Project Management
export async function fetchProjects(): Promise<Project[]> {
  if (API_CONFIG.useMaximoAPI) {
    console.log('Attempting to get data using API');
    try {
      return await callMaximoAPI<Project[]>(API_ENDPOINTS.getProjects)
    } catch (error) {
      console.warn("Failed to fetch projects using Maximo API, falling back to mock data", error)
      return [...mockProjects]
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  return [...mockProjects]
}

// Add function to fetch a single project
export async function fetchProject(projectId: string): Promise<Project | null> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // If the actual API has an endpoint for fetching a single project, use the following code
      // return await callMaximoAPI<Project>(API_ENDPOINTS.getProject, { projectId })
      
      // Currently temporarily using the method of fetching all projects and then filtering
      const projects = await callMaximoAPI<Project[]>(API_ENDPOINTS.getProjects)
      return projects.find(project => project.id === projectId) || null
    } catch (error) {
      console.warn("Failed to fetch single project using Maximo API, falling back to mock data", error)
      // Find project from mock data, ensure the function always returns a value
      const project = mockProjects.find(p => p.id === projectId)
      return project || null
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  // Find project from mock data
  const project = mockProjects.find(p => p.id === projectId)
  return project || null
}

export async function createProject(project: Project): Promise<Project> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // Copy and convert date format
      const formattedProject = {
        ...project,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate)
      };
      
      return await callMaximoAPI<Project>(API_ENDPOINTS.createProject, formattedProject)
    } catch (error) {
      console.warn("Failed to create project using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))
  
  // Ensure project has unique ID - use timestamp + random string combination
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
      // Copy and convert date format
      const formattedProject = {
        ...project,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate)
      };
      
      return await callMaximoAPI<Project>(API_ENDPOINTS.updateProject, formattedProject)
    } catch (error) {
      console.warn("Failed to update project using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
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
      console.warn("Failed to delete project using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockProjects.findIndex((p) => p.id === projectId)
  if (index !== -1) {
    mockProjects.splice(index, 1)
  }
}

// API Functions - Turbine Management
export async function fetchTurbines(projectId: string): Promise<Turbine[]> {
  try {
    if (API_CONFIG.useMaximoAPI) {
      const data = await callMaximoAPI<Turbine[]>(API_ENDPOINTS.getTurbines, { projectId })
      return data
    } else {
      // 模擬API延遲
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockTurbines[projectId] || []
    }
  } catch (error) {
    console.error("Error fetching turbines:", error)
    return mockTurbines[projectId] || []
  }
}

export async function createTurbine(projectId: string, turbine: Turbine): Promise<Turbine> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      const data = { ...turbine, projectId }
      return await callMaximoAPI<Turbine>(API_ENDPOINTS.createTurbine, data)
    } catch (error) {
      console.warn("Failed to create turbine using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
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
      console.warn("Failed to update turbine using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
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
      console.warn("Failed to delete turbine using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  const turbines = mockTurbines[projectId] || []
  const index = turbines.findIndex((t) => t.id === turbineId)
  if (index !== -1) {
    turbines.splice(index, 1)
  }
}

// API Functions - Task Management
export async function fetchTasks(projectId: string): Promise<Task[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Task[]>(API_ENDPOINTS.getTasks, { projectId })
    } catch (error) {
      console.warn("Failed to fetch tasks using Maximo API, falling back to mock data", error)
      return mockTasks[projectId] || []
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  // Ensure each task has turbineIds property
  const tasks = mockTasks[projectId] || []
  return tasks.map(task => ({
    ...task,
    turbineIds: task.turbineIds || []
  }))
}

export async function createTask(task: Task): Promise<Task> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      // Ensure task has turbineIds property
      const taskWithTurbineIds = {
        ...task,
        turbineIds: task.turbineIds || []
      }
      return await callMaximoAPI<Task>(API_ENDPOINTS.createTask, taskWithTurbineIds)
    } catch (error) {
      console.warn("Failed to create task using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (!mockTasks[task.projectId]) {
    mockTasks[task.projectId] = []
  }
  // Ensure task has turbineIds property
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
      // Ensure task has turbineIds property
      const taskWithTurbineIds = {
        ...task,
        turbineIds: task.turbineIds || []
      }
      return await callMaximoAPI<Task>(API_ENDPOINTS.updateTask, taskWithTurbineIds)
    } catch (error) {
      console.warn("Failed to update task using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  const tasks = mockTasks[task.projectId] || []
  const index = tasks.findIndex((t) => t.id === task.id)
  // Ensure task has turbineIds property
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
      console.warn("Failed to delete task using Maximo API, falling back to mock data", error)
      // Fall back to mock data operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  Object.keys(mockTasks).forEach((projectId) => {
    const tasks = mockTasks[projectId]
    const index = tasks.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      tasks.splice(index, 1)
    }
  })
}

// 獲取任務類型
export async function fetchTaskTypes(): Promise<TaskType[]> {
  if (API_CONFIG.useMaximoAPI) {
    console.log('Attempting to get task types using API');
    try {
      return await callMaximoAPI<TaskType[]>(API_ENDPOINTS.getTaskTypes)
    } catch (error) {
      console.warn("Failed to fetch task types using Maximo API, falling back to default types", error)
      return [...defaultTaskTypes]
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  return [...defaultTaskTypes]
}

// 新增任務類型
export async function createTaskType(taskType: TaskType): Promise<TaskType> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<TaskType>(API_ENDPOINTS.newTaskType, taskType)
    } catch (error) {
      console.warn("Failed to create task type using Maximo API, falling back to local operation", error)
      // Fall back to local operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))
  
  // Generate a unique ID for the task type if not provided
  const newTaskType = {
    ...taskType,
    value: taskType.value || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  }
  
  // 在本地情況下，模擬成功操作
  return newTaskType
}

// 更新任務類型 - 使用新增API替代
export async function updateTaskType(taskType: TaskType): Promise<TaskType> {
  // 使用新增API完成更新操作
  return await createTaskType(taskType);
}

// 刪除任務類型
export async function deleteTaskType(taskTypeValue: string): Promise<void> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      await callMaximoAPI<void>(API_ENDPOINTS.deleteTaskType, { value: taskTypeValue })
      return
    } catch (error) {
      console.warn("Failed to delete task type using Maximo API, falling back to local operation", error)
      // Fall back to local operation
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  // 在本地情況下，不需要做任何實際操作，僅模擬API延遲
}

// 獲取風場電纜數據
export async function fetchCables(projectId: string): Promise<Cable[]> {
  if (API_CONFIG.useMaximoAPI) {
    console.log('Attempting to get cables using API');
    try {
      return await callMaximoAPI<Cable[]>(API_ENDPOINTS.getCables, { projectId })
    } catch (error) {
      console.warn("Failed to fetch cables using Maximo API, falling back to mock data", error)
      // 使用模擬數據作為備用選項
      return getSimulatedCables(projectId);
    }
  }
  
  // 不使用API時，返回模擬數據
  return getSimulatedCables(projectId);
}

// 獲取風場變電站數據
export async function fetchSubstations(projectId: string): Promise<Substation[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Substation[]>(API_ENDPOINTS.getSubstations, { projectId })
    } catch (error) {
      console.warn("Failed to fetch substations using Maximo API, falling back to mock data", error)
      // 使用模擬數據作為備用選項
      return getSimulatedSubstations(projectId);
    }
  }
  
  // 不使用API時，返回模擬數據
  return getSimulatedSubstations(projectId);
}

// 模擬電纜數據
function getSimulatedCables(projectId: string): Promise<Cable[]> {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // 返回模擬數據，修改ID以更好匹配項目中的風機ID格式
      resolve([
        {
          id: 'cable-1',
          sourceId: 'HL21-A01-A',  // 修改為實際風機ID格式
          targetId: 'HL21-A02-A',  // 修改為實際風機ID格式
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 1.5,
        },
        {
          id: 'cable-2',
          sourceId: 'HL21-A02-A',
          targetId: 'HL21-A03-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 2.8,
        },
        {
          id: 'cable-3',
          sourceId: 'HL21-A03-A',
          targetId: 'HL21-A04-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 4.2,
        },
        {
          id: 'cable-4',
          sourceId: 'HL21-A04-A',
          targetId: 'HL21-A05-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'warning',
          powerFlow: 1.1,
        },
        {
          id: 'cable-5',
          sourceId: 'HL21-B01-A',
          targetId: 'HL21-B02-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 3.7,
        },
        {
          id: 'cable-6',
          sourceId: 'HL21-B02-A',
          targetId: 'HL21-B03-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 2.5,
        },
        {
          id: 'cable-7',
          sourceId: 'HL21-D01-A',
          targetId: 'HL21-D02-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 1.8,
        },
        {
          id: 'cable-8',
          sourceId: 'HL21-D02-A',
          targetId: 'HL21-D03-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'warning',
          powerFlow: 0.9,
        },
        {
          id: 'cable-9',
          sourceId: 'HL21-D03-A',
          targetId: 'HL21-D04-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 2.1,
        },
        {
          id: 'cable-10',
          sourceId: 'HL21-D04-A',
          targetId: 'HL21-D05-A',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 2.6,
        },
        // 添加子站連接
        {
          id: 'cable-sub-1',
          sourceId: 'HL21-A05-A',
          targetId: 'sub-1',
          sourceType: 'turbine',
          targetType: 'substation',
          status: 'normal',
          powerFlow: 6.5,
        },
        {
          id: 'cable-sub-2',
          sourceId: 'HL21-B03-A',
          targetId: 'sub-1',
          sourceType: 'turbine',
          targetType: 'substation',
          status: 'normal',
          powerFlow: 5.2,
        },
        {
          id: 'cable-sub-3',
          sourceId: 'HL21-D05-A',
          targetId: 'sub-1',
          sourceType: 'turbine',
          targetType: 'substation',
          status: 'normal',
          powerFlow: 7.8,
        }
      ]);
    }, 500); // 模擬網絡延遲
  });
}

// 模擬變電站數據
function getSimulatedSubstations(projectId: string): Promise<Substation[]> {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // 返回模擬數據
      resolve([
        {
          id: 'sub-1',
          name: '海上變電站 A',
          coordinates: {
            lat: 23.7,
            lng: 121.4
          },
          capacity: 250,
          currentLoad: 185.2,
          status: 'normal'
        },
      ]);
    }, 500); // 模擬網絡延遲
  });
}

// 獲取風機歷史發電量數據
export async function fetchTurbineHistoricalPower(turbineId: string, period: string = '7d'): Promise<{date: string, power: number}[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<{date: string, power: number}[]>(
        API_ENDPOINTS.getTurbineHistoricalPower, 
        { turbineId, period }
      )
    } catch (error) {
      console.warn("Failed to fetch turbine historical power using Maximo API, falling back to mock data", error)
      // 使用模擬數據作為備用選項
      return getSimulatedTurbineHistoricalPower(turbineId, period);
    }
  }
  
  // 不使用API時，返回模擬數據
  return getSimulatedTurbineHistoricalPower(turbineId, period);
}

// 通過風機編碼獲取歷史發電量
export async function fetchTurbineHistoricalPowerByCode(turbineCode: string, period: string = '7d'): Promise<{date: string, power: number}[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<{date: string, power: number}[]>(
        API_ENDPOINTS.getTurbineHistoricalPower, 
        { turbineCode, period }
      )
    } catch (error) {
      console.warn("Failed to fetch turbine historical power by code using Maximo API, falling back to mock data", error)
      
      // 嘗試使用風機編碼查找風機ID
      try {
        // 搜尋所有項目的風機
        let turbineId = '';
        for (const projectId in mockTurbines) {
          const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
          if (turbine) {
            turbineId = turbine.id;
            break;
          }
        }
        
        if (turbineId) {
          return getSimulatedTurbineHistoricalPower(turbineId, period);
        }
      } catch (innerError) {
        console.error("Error finding turbine by code:", innerError);
      }
      
      // 如果找不到風機，返回空數組
      return [];
    }
  }
  
  // 嘗試使用風機編碼查找風機ID
  try {
    // 搜尋所有項目的風機
    let turbineId = '';
    for (const projectId in mockTurbines) {
      const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
      if (turbine) {
        turbineId = turbine.id;
        break;
      }
    }
    
    if (turbineId) {
      return getSimulatedTurbineHistoricalPower(turbineId, period);
    }
  } catch (error) {
    console.error("Error finding turbine by code:", error);
  }
  
  // 如果找不到風機，返回空數組
  return [];
}

// 模擬風機歷史發電量數據
function getSimulatedTurbineHistoricalPower(turbineId: string, period: string): Promise<{date: string, power: number}[]> {
  // 根據不同時間周期生成不同的數據點數量
  let days = 7;
  let intervalHours = 24;
  
  if (period === '30d') {
    days = 30;
    intervalHours = 24;
  } else if (period === '90d') {
    days = 90;
    intervalHours = 24;
  } else if (period === '24h') {
    days = 1;
    intervalHours = 1;
  }
  
  // 生成模擬數據
  const data: {date: string, power: number}[] = [];
  const endDate = new Date();
  const seedValue = turbineId.charCodeAt(turbineId.length - 1); // 根據風機ID生成不同的隨機種子
  
  for (let i = 0; i < days * (24 / intervalHours); i++) {
    // 計算日期，從當前時間向前推算
    const date = new Date(endDate);
    date.setHours(date.getHours() - i * intervalHours);
    
    // 根據風機ID和日期生成一些隨機但有規律的數據
    // 使用正弦波以產生更自然的波動效果
    const hourOfDay = date.getHours();
    const dayFactor = Math.sin((hourOfDay - 12) * Math.PI / 12); // 日內波動
    const randomFactor = Math.random() * 0.3 + 0.85; // 隨機因子，使數據更自然
    
    // 基本發電量（白天發電量高，夜間低）
    let basePower = 3.5 + (seedValue % 5) * 0.5; // 不同風機有不同的基礎發電能力
    // 白天產能高，夜間低
    basePower = basePower * (dayFactor > 0 ? (1 + dayFactor * 0.6) : (0.4 + (1 + dayFactor) * 0.3));
    
    // 最終發電量數值
    const power = Math.max(0, basePower * randomFactor);
    
    data.push({
      date: date.toISOString(),
      power: parseFloat(power.toFixed(2))
    });
  }
  
  // 將數據按時間順序排序（從早到晚）
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 500); // 模擬API延遲
  });
}

// 獲取風機異常事件
export async function fetchTurbineAlerts(turbineIdOrCode: string, isCode: boolean = false): Promise<TurbineAlert[]> {
  if (isCode) {
    return fetchTurbineAlertsByCode(turbineIdOrCode);
  }
  
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<TurbineAlert[]>(
        API_ENDPOINTS.getEvents, 
        { turbineId: turbineIdOrCode }
      )
    } catch (error) {
      console.warn("Failed to fetch turbine alerts using Maximo API, falling back to mock data", error)
      // 使用模擬數據作為備用選項
      return getSimulatedTurbineAlerts(turbineIdOrCode);
    }
  }
  
  // 不使用API時，返回模擬數據
  return getSimulatedTurbineAlerts(turbineIdOrCode);
}

// 獲取風機維修工單
export async function fetchTurbineMaintenanceTickets(turbineIdOrCode: string, isCode: boolean = false): Promise<MaintenanceTicket[]> {
  if (isCode) {
    return fetchTurbineMaintenanceTicketsByCode(turbineIdOrCode);
  }
  
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<MaintenanceTicket[]>(
        API_ENDPOINTS.getWorkOrders, 
        { turbineId: turbineIdOrCode }
      )
    } catch (error) {
      console.warn("Failed to fetch turbine maintenance tickets using Maximo API, falling back to mock data", error)
      // 使用模擬數據作為備用選項
      return getSimulatedTurbineMaintenanceTickets(turbineIdOrCode);
    }
  }
  
  // 不使用API時，返回模擬數據
  return getSimulatedTurbineMaintenanceTickets(turbineIdOrCode);
}

// 通過風機編碼獲取異常事件
export async function fetchTurbineAlertsByCode(turbineCode: string): Promise<TurbineAlert[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<TurbineAlert[]>(
        API_ENDPOINTS.getEvents, 
        { turbineCode }
      )
    } catch (error) {
      console.warn("Failed to fetch turbine alerts by code using Maximo API, falling back to mock data", error)
      
      // 嘗試使用風機編碼查找風機ID
      try {
        // 搜尋所有項目的風機
        let turbineId = '';
        for (const projectId in mockTurbines) {
          const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
          if (turbine) {
            turbineId = turbine.id;
            break;
          }
        }
        
        if (turbineId) {
          return getSimulatedTurbineAlerts(turbineId);
        }
      } catch (innerError) {
        console.error("Error finding turbine by code:", innerError);
      }
      
      // 如果找不到風機，返回空數組
      return [];
    }
  }
  
  // 嘗試使用風機編碼查找風機ID
  try {
    // 搜尋所有項目的風機
    let turbineId = '';
    for (const projectId in mockTurbines) {
      const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
      if (turbine) {
        turbineId = turbine.id;
        break;
      }
    }
    
    if (turbineId) {
      return getSimulatedTurbineAlerts(turbineId);
    }
  } catch (error) {
    console.error("Error finding turbine by code:", error);
  }
  
  // 如果找不到風機，返回空數組
  return [];
}

// 通過風機編碼獲取維修工單
export async function fetchTurbineMaintenanceTicketsByCode(turbineCode: string): Promise<MaintenanceTicket[]> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<MaintenanceTicket[]>(
        API_ENDPOINTS.getWorkOrders, 
        { turbineCode }
      )
    } catch (error) {
      console.warn("Failed to fetch maintenance tickets by code using Maximo API, falling back to mock data", error)
      
      // 嘗試使用風機編碼查找風機ID
      try {
        // 搜尋所有項目的風機
        let turbineId = '';
        for (const projectId in mockTurbines) {
          const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
          if (turbine) {
            turbineId = turbine.id;
            break;
          }
        }
        
        if (turbineId) {
          return getSimulatedTurbineMaintenanceTickets(turbineId);
        }
      } catch (innerError) {
        console.error("Error finding turbine by code:", innerError);
      }
      
      // 如果找不到風機，返回空數組
      return [];
    }
  }
  
  // 嘗試使用風機編碼查找風機ID
  try {
    // 搜尋所有項目的風機
    let turbineId = '';
    for (const projectId in mockTurbines) {
      const turbine = mockTurbines[projectId].find(t => t.code === turbineCode);
      if (turbine) {
        turbineId = turbine.id;
        break;
      }
    }
    
    if (turbineId) {
      return getSimulatedTurbineMaintenanceTickets(turbineId);
    }
  } catch (error) {
    console.error("Error finding turbine by code:", error);
  }
  
  // 如果找不到風機，返回空數組
  return [];
}

// 模擬風機異常事件數據
function getSimulatedTurbineAlerts(turbineId: string): Promise<TurbineAlert[]> {
  // 根據turbineId的最後一個字元來隨機生成不同數量的警報
  const lastChar = turbineId.charAt(turbineId.length - 1);
  const numAlerts = (parseInt(lastChar, 36) % 4) + (Math.random() > 0.7 ? 1 : 0);
  
  const alertTypes = [
    { description: "葉片振動過大", severity: "medium" },
    { description: "齒輪箱溫度異常", severity: "high" },
    { description: "機艙方向偏移", severity: "low" },
    { description: "發電機軸承溫度升高", severity: "medium" },
    { description: "控制系統通訊中斷", severity: "critical" },
    { description: "葉片裂紋檢測", severity: "high" },
    { description: "葉片結冰", severity: "medium" },
    { description: "油壓系統壓力不足", severity: "high" },
    { description: "轉速超出安全範圍", severity: "critical" },
    { description: "剎車系統異常", severity: "high" }
  ];
  
  const alerts: TurbineAlert[] = [];
  const now = new Date();
  
  // 生成警報數據
  for (let i = 0; i < numAlerts; i++) {
    const alertIndex = (parseInt(lastChar, 36) + i) % alertTypes.length;
    const daysAgo = Math.floor(Math.random() * 10);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    
    const isResolved = Math.random() > 0.6;
    let resolvedAt: string | undefined = undefined;
    
    if (isResolved) {
      const resolvedDate = new Date(timestamp);
      resolvedDate.setHours(resolvedDate.getHours() + Math.floor(Math.random() * 8) + 1);
      resolvedAt = resolvedDate.toISOString();
    }
    
    alerts.push({
      id: `alert-${turbineId}-${i}-${Date.now()}`,
      turbineId,
      timestamp: timestamp.toISOString(),
      description: alertTypes[alertIndex].description,
      severity: alertTypes[alertIndex].severity as 'low' | 'medium' | 'high' | 'critical',
      isResolved,
      resolvedAt
    });
  }
  
  // 按時間排序
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(alerts), 500);
  });
}

// 模擬風機維修工單數據
function getSimulatedTurbineMaintenanceTickets(turbineId: string): Promise<MaintenanceTicket[]> {
  // 根據turbineId的最後一個字元來隨機生成不同數量的工單
  const lastChar = turbineId.charAt(turbineId.length - 1);
  const numTickets = (parseInt(lastChar, 36) % 3) + (Math.random() > 0.5 ? 1 : 0);
  
  const ticketTypes = [
    { description: "季度例行維護檢查", type: "PM", hours: 4, priority: "normal" },
    { description: "葉片檢查與清潔", type: "PM", hours: 6, priority: "normal" },
    { description: "齒輪箱潤滑油更換", type: "PM", hours: 5, priority: "normal" },
    { description: "電氣系統檢查", type: "PM", hours: 3, priority: "normal" },
    { description: "風速風向感測器校準", type: "PM", hours: 2, priority: "low" },
    { description: "葉片裂紋修復", type: "CM", hours: 12, priority: "high" },
    { description: "齒輪箱異常聲音排查", type: "CM", hours: 8, priority: "high" },
    { description: "控制系統重啟與校準", type: "CM", hours: 6, priority: "high" },
    { description: "緊急停機系統維修", type: "CM", hours: 10, priority: "urgent" },
    { description: "發電機軸承更換", type: "CM", hours: 24, priority: "high" }
  ];
  
  const tickets: MaintenanceTicket[] = [];
  const now = new Date();
  
  // 生成工單數據
  for (let i = 0; i < numTickets; i++) {
    const ticketIndex = (parseInt(lastChar, 36) + i) % ticketTypes.length;
    const daysAhead = Math.floor(Math.random() * 14);
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + daysAhead);
    
    // 生成隨機的狀態
    const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    const statusIndex = Math.floor(Math.random() * (daysAhead < 2 ? 2 : 4)); // 如果日期接近，則狀態應該是pending或in-progress
    
    const details = ticketTypes[ticketIndex].type === 'PM' 
      ? `執行標準${ticketTypes[ticketIndex].description}程序，確保各項關鍵參數符合規範。`
      : `檢查並修復${ticketTypes[ticketIndex].description.replace('修復', '').replace('排查', '')}問題，恢復正常運行狀態。`;
    
    tickets.push({
      id: `MT-${turbineId.substring(0, 5)}-${Date.now().toString().substring(7)}-${i}`,
      turbineId,
      description: ticketTypes[ticketIndex].description,
      type: ticketTypes[ticketIndex].type as 'PM' | 'CM',
      status: statuses[statusIndex] as 'pending' | 'in-progress' | 'completed' | 'cancelled',
      scheduledDate: scheduledDate.toISOString(),
      estimatedHours: ticketTypes[ticketIndex].hours,
      priority: ticketTypes[ticketIndex].priority as 'low' | 'normal' | 'high' | 'urgent',
      assignedTo: Math.random() > 0.3 ? "維護團隊" + ((parseInt(lastChar, 36) % 3) + 1) : undefined,
      details: details
    });
  }
  
  // 按照日期排序
  tickets.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(tickets), 500);
  });
}

// 創建修復性維護工單 (CM: Corrective Maintenance)
export async function createCMWorkOrder(params: { 
  equipmentId: string;  // 設備ID (assetnum)
  description: string;  // 故障描述
}): Promise<{ 
  id: string;           // 工單號
  status: string;       // 工單狀態
  equipmentId: string;  // 設備ID
  description: string;  // 描述
  worktype: string;     // 工單類型
  [key: string]: any;   // 其他字段
}> {
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI(API_ENDPOINTS.createCMWorkOrder, { params })
    } catch (error) {
      console.warn("Failed to create CM workorder using Maximo API", error)
      throw error;
    }
  }
  
  // 模擬API延遲和響應
  await new Promise(resolve => setTimeout(resolve, 700))
  
  // 模擬成功響應
  return {
    id: `WO-${Date.now().toString().slice(-6)}`,
    status: "APPR",
    created: new Date().toISOString(),
    equipmentId: params.equipmentId,
    equipmentName: `${params.equipmentId} 風力發電機`,
    location: "",
    description: params.description,
    pmType: "",
    frequency: "",
    creator: "系統",
    systemEngineer: "",
    worktype: "CM"
  }
}
