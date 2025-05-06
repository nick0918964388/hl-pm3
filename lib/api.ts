import type { Project, Task, Turbine, TaskType, Cable, Substation } from "./types"
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
  deleteTaskType: "DELETE_TASK_TYPE"
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
      maintenanceTickets
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
  if (API_CONFIG.useMaximoAPI) {
    try {
      return await callMaximoAPI<Turbine[]>(API_ENDPOINTS.getTurbines, { projectId })
    } catch (error) {
      console.warn("Failed to fetch turbines using Maximo API, falling back to mock data", error)
      return mockTurbines[projectId] || []
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))
  return mockTurbines[projectId] || []
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
      // 返回模擬數據
      resolve([
        {
          id: 'cable-1',
          sourceId: '1',
          targetId: '2',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 1.5,
        },
        {
          id: 'cable-2',
          sourceId: '2',
          targetId: '3',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'normal',
          powerFlow: 2.8,
        },
        {
          id: 'cable-3',
          sourceId: '3',
          targetId: 'sub-1',
          sourceType: 'turbine',
          targetType: 'substation',
          status: 'normal',
          powerFlow: 4.2,
        },
        {
          id: 'cable-4',
          sourceId: '4',
          targetId: '5',
          sourceType: 'turbine',
          targetType: 'turbine',
          status: 'warning',
          powerFlow: 1.1,
        },
        {
          id: 'cable-5',
          sourceId: '5',
          targetId: 'sub-1',
          sourceType: 'turbine',
          targetType: 'substation',
          status: 'normal',
          powerFlow: 3.7,
        },
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
