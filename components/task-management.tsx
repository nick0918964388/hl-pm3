"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { Plus, Pencil, Trash2, AlertCircle, Filter, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { TaskForm } from "@/components/task-form"
import { TaskTypeSettings, type TaskTypeWithColor } from "@/components/task-type-settings"
import type { Project, Task, Turbine } from "@/lib/types"
import { fetchTasks, fetchTurbines, createTask, updateTask, deleteTask, fetchTaskTypes } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskManagementProps {
  project: Project
}

export function TaskManagement({ project }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [turbines, setTurbines] = useState<Turbine[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [taskTypes, setTaskTypes] = useState<TaskTypeWithColor[]>([])
  const [showTaskTypeSettings, setShowTaskTypeSettings] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // 並行獲取所有數據
        const [tasksData, turbinesData, typesData] = await Promise.all([
          fetchTasks(project.id), 
          fetchTurbines(project.id),
          fetchTaskTypes()
        ])
        
        setTasks(tasksData)
        setTurbines(turbinesData)
        
        // 處理任務類型數據，添加顏色屬性
        const processedTypes = typesData.map(type => {
          // 從localStorage獲取顏色設置
          const savedColors = localStorage.getItem("taskTypeColors")
          const colorMap = savedColors ? JSON.parse(savedColors) : {}
          
          // 默認顏色映射
          const defaultColors: {[key: string]: string} = {
            "foundation": "red",
            "piles": "yellow",
            "jacket": "blue",
            "wtg": "green",
            "cables": "purple",
            "operation": "gray"
          }
          
          return {
            ...type,
            color: colorMap[type.value] || defaultColors[type.value] || "gray",
            isDefault: ["foundation", "piles", "jacket", "wtg", "cables", "operation"].includes(type.value)
          } as TaskTypeWithColor
        })
        
        setTaskTypes(processedTypes)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Error",
          description: "Unable to load tasks and turbine data. Please try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
        
        // 任務類型獲取失敗時使用默認類型
        const defaultTaskTypes: TaskTypeWithColor[] = [
          { value: "foundation", label: "Seabed Leveling", color: "red", isDefault: true },
          { value: "piles", label: "Pile Foundation Installation", color: "yellow", isDefault: true },
          { value: "jacket", label: "Jacket Installation", color: "blue", isDefault: true },
          { value: "wtg", label: "Wind Turbine Installation", color: "green", isDefault: true },
          { value: "cables", label: "Cable Laying", color: "purple", isDefault: true },
          { value: "operation", label: "Operation & Maintenance", color: "gray", isDefault: true },
        ]
        setTaskTypes(defaultTaskTypes)
      }
    }

    loadData()
    
    // 任務類型可能在設置對話框中更改，需要監聽該事件
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "taskTypeColors") {
        // 重新加載任務類型
        fetchTaskTypes().then(types => {
          const savedColors = localStorage.getItem("taskTypeColors")
          const colorMap = savedColors ? JSON.parse(savedColors) : {}
          
          const processedTypes = types.map(type => ({
            ...type,
            color: colorMap[type.value] || "gray",
            isDefault: ["foundation", "piles", "jacket", "wtg", "cables", "operation"].includes(type.value)
          })) as TaskTypeWithColor[]
          
          setTaskTypes(processedTypes)
        }).catch(err => {
          console.error("Failed to reload task types:", err)
        })
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [project.id, toast])

  const handleAddTask = async (data: Task) => {
    try {
      const newTask = await createTask(data)
      setTasks([...tasks, newTask])
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Task created successfully",
      })
    } catch (error) {
      console.error("Failed to create task:", error)
      toast({
        title: "Error",
        description: "Unable to create task. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = async (data: Task) => {
    if (!selectedTask) return

    try {
      const updatedTask = await updateTask(data)
      setTasks(tasks.map((task) => (task.id === selectedTask.id ? updatedTask : task)))
      setIsEditDialogOpen(false)
      setSelectedTask(null)
      toast({
        title: "Success",
        description: "Task updated successfully",
      })
    } catch (error) {
      console.error("Failed to update task:", error)
      toast({
        title: "Error",
        description: "Unable to update task. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast({
        title: "Error",
        description: "Unable to delete task. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "in-progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "completed":
        return <Badge variant="default">Completed</Badge>
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    // Find task type
    const taskType = taskTypes.find((t) => t.value === type)

    if (!taskType) {
      // If type not found, use default style
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
          {type}
        </Badge>
      )
    }

    // Get color style
    const getColorClass = (color: string) => {
      const colorMap: Record<string, string> = {
        red: "bg-red-50 text-red-700 border-red-300",
        yellow: "bg-yellow-50 text-yellow-700 border-yellow-300",
        blue: "bg-blue-50 text-blue-700 border-blue-300",
        green: "bg-green-50 text-green-700 border-green-300",
        purple: "bg-purple-50 text-purple-700 border-purple-300",
        gray: "bg-gray-50 text-gray-700 border-gray-300",
        teal: "bg-teal-50 text-teal-700 border-teal-300",
        orange: "bg-orange-50 text-orange-700 border-orange-300",
        pink: "bg-pink-50 text-pink-700 border-pink-300",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-300",
      }

      return colorMap[color] || "bg-gray-50 text-gray-700 border-gray-300"
    }

    return (
      <Badge variant="outline" className={cn(getColorClass(taskType.color))}>
        {taskType.label}
      </Badge>
    )
  }

  const filteredTasks = tasks.filter((task) => {
    const typeMatch = filterType === "all" || task.type === filterType
    const statusMatch = filterStatus === "all" || task.status === filterStatus
    return typeMatch && statusMatch
  })

  // Reload task types when task type settings dialog is closed
  const handleTaskTypeSettingsClose = () => {
    setShowTaskTypeSettings(false)
    const customTypes = localStorage.getItem("customTaskTypes") ? JSON.parse(localStorage.getItem("customTaskTypes")!) : []
    setTaskTypes([...taskTypes.filter(t => t.isDefault), ...customTypes])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Task Management - {project.name}</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Add Task</DialogTitle>
                <DialogDescription>Fill out the form below to create a new task</DialogDescription>
              </DialogHeader>
              <TaskForm
                projectId={project.id}
                turbines={turbines}
                onSubmit={handleAddTask}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setShowTaskTypeSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Task Type Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {taskTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select task status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-muted-foreground">No Tasks Yet</h3>
          <p className="text-muted-foreground mt-2">Click the "Add Task" button to create a new task</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="mr-2">{task.name}</CardTitle>
                  {getStatusBadge(task.status)}
                </div>
                <CardDescription>
                  Completion Date: {format(new Date(task.endDate), "yyyy/MM/dd", { locale: enUS })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">{getTypeBadge(task.type)}</div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                <div className="text-xs text-muted-foreground">
                  Turbines Involved: {task.turbineIds?.length || 0}
                  {task.turbineIds && task.turbineIds.length > 0 && (
                    <span className="block mt-1">
                      {task.turbineIds
                        .slice(0, 3)
                        .map((id) => {
                          const turbine = turbines.find((t) => t.id === id)
                          return turbine ? turbine.code : id
                        })
                        .join(", ")}
                      {task.turbineIds && task.turbineIds.length > 3 && "..."}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Dialog
                  open={isEditDialogOpen && selectedTask?.id === task.id}
                  onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setSelectedTask(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription>Modify task information</DialogDescription>
                    </DialogHeader>
                    {selectedTask && (
                      <TaskForm
                        projectId={project.id}
                        task={selectedTask}
                        turbines={turbines}
                        onSubmit={handleEditTask}
                        onCancel={() => {
                          setIsEditDialogOpen(false)
                          setSelectedTask(null)
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to delete this task? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Task Type Settings Dialog */}
      <Dialog open={showTaskTypeSettings} onOpenChange={setShowTaskTypeSettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Task Type Settings</DialogTitle>
          </DialogHeader>
          <TaskTypeSettings onClose={handleTaskTypeSettingsClose} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
