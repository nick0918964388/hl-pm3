"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
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
import { TaskTypeSettings, type TaskType } from "@/components/task-type-settings"
import type { Project, Task, Turbine } from "@/lib/types"
import { fetchTasks, fetchTurbines, createTask, updateTask, deleteTask } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskManagementProps {
  project: Project
}

// 從 localStorage 獲取自定義任務類型
const getCustomTaskTypes = () => {
  if (typeof window !== "undefined") {
    const savedTypes = localStorage.getItem("customTaskTypes")
    return savedTypes ? JSON.parse(savedTypes) : []
  }
  return []
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
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [showTaskTypeSettings, setShowTaskTypeSettings] = useState(false)
  const { toast } = useToast()

  // 預設任務類型
  const defaultTaskTypes: TaskType[] = [
    { value: "foundation", label: "海床整平", color: "red" },
    { value: "piles", label: "樁基礎安裝", color: "yellow" },
    { value: "jacket", label: "套管安裝", color: "blue" },
    { value: "wtg", label: "風機安裝", color: "green" },
    { value: "cables", label: "電纜鋪設", color: "purple" },
    { value: "operation", label: "運營維護", color: "gray" },
  ]

  useEffect(() => {
    // 載入自定義任務類型
    const customTypes = getCustomTaskTypes()
    setTaskTypes([...defaultTaskTypes, ...customTypes])

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [tasksData, turbinesData] = await Promise.all([fetchTasks(project.id), fetchTurbines(project.id)])
        setTasks(tasksData)
        setTurbines(turbinesData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "錯誤",
          description: "無法載入任務和風機資料，請稍後再試",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadData()

    // 添加事件監聽器，當 localStorage 變更時重新載入任務類型
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "customTaskTypes") {
        const updatedCustomTypes = getCustomTaskTypes()
        setTaskTypes([...defaultTaskTypes, ...updatedCustomTypes])
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
        title: "成功",
        description: "任務已成功建立",
      })
    } catch (error) {
      console.error("Failed to create task:", error)
      toast({
        title: "錯誤",
        description: "無法建立任務，請稍後再試",
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
        title: "成功",
        description: "任務已成功更新",
      })
    } catch (error) {
      console.error("Failed to update task:", error)
      toast({
        title: "錯誤",
        description: "無法更新任務，請稍後再試",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "成功",
        description: "任務已成功刪除",
      })
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast({
        title: "錯誤",
        description: "無法刪除任務，請稍後再試",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">待處理</Badge>
      case "in-progress":
        return <Badge variant="secondary">進行中</Badge>
      case "completed":
        return <Badge variant="default">已完成</Badge>
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    // 查找任務類型
    const taskType = taskTypes.find((t) => t.value === type)

    if (!taskType) {
      // 如果找不到類型，使用默認樣式
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
          {type}
        </Badge>
      )
    }

    // 獲取顏色樣式
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

  // 任務類型設定對話框關閉時重新載入任務類型
  const handleTaskTypeSettingsClose = () => {
    setShowTaskTypeSettings(false)
    const customTypes = getCustomTaskTypes()
    setTaskTypes([...defaultTaskTypes, ...customTypes])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">任務管理 - {project.name}</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增任務
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>新增任務</DialogTitle>
                <DialogDescription>填寫以下表單來建立新的工作任務</DialogDescription>
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
            任務類型設定
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">篩選：</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="選擇任務類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有類型</SelectItem>
              {taskTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="選擇任務狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有狀態</SelectItem>
              <SelectItem value="pending">待處理</SelectItem>
              <SelectItem value="in-progress">進行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
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
          <h3 className="text-xl font-medium text-muted-foreground">尚無任務</h3>
          <p className="text-muted-foreground mt-2">點擊「新增任務」按鈕來建立工作任務</p>
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
                  {format(new Date(task.startDate), "yyyy/MM/dd", { locale: zhTW })} -{" "}
                  {format(new Date(task.endDate), "yyyy/MM/dd", { locale: zhTW })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">{getTypeBadge(task.type)}</div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                <div className="text-xs text-muted-foreground">
                  涉及風機：{task.turbineIds.length} 台
                  {task.turbineIds.length > 0 && (
                    <span className="block mt-1">
                      {task.turbineIds
                        .slice(0, 3)
                        .map((id) => {
                          const turbine = turbines.find((t) => t.id === id)
                          return turbine ? turbine.code : id
                        })
                        .join(", ")}
                      {task.turbineIds.length > 3 && "..."}
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
                      編輯
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>編輯任務</DialogTitle>
                      <DialogDescription>修改任務資訊</DialogDescription>
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
                      刪除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除</AlertDialogTitle>
                      <AlertDialogDescription>您確定要刪除此任務嗎？此操作無法撤銷。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>確認刪除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 任務類型設定對話框 */}
      <Dialog open={showTaskTypeSettings} onOpenChange={setShowTaskTypeSettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>任務類型設定</DialogTitle>
          </DialogHeader>
          <TaskTypeSettings onClose={handleTaskTypeSettingsClose} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
