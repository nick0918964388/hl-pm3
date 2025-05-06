"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { fetchTaskTypes, createTaskType, updateTaskType, deleteTaskType } from "@/lib/api"
import type { TaskType } from "@/lib/types"

// Available color options
const colorOptions = [
  { name: "Red", value: "red", class: "bg-red-100 text-red-700 border-red-300" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { name: "Blue", value: "blue", class: "bg-blue-100 text-blue-700 border-blue-300" },
  { name: "Green", value: "green", class: "bg-green-100 text-green-700 border-green-300" },
  { name: "Purple", value: "purple", class: "bg-purple-100 text-purple-700 border-purple-300" },
  { name: "Gray", value: "gray", class: "bg-gray-100 text-gray-700 border-gray-300" },
  { name: "Teal", value: "teal", class: "bg-teal-100 text-teal-700 border-teal-300" },
  { name: "Orange", value: "orange", class: "bg-orange-100 text-orange-700 border-orange-300" },
  { name: "Pink", value: "pink", class: "bg-pink-100 text-pink-700 border-pink-300" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-100 text-indigo-700 border-indigo-300" },
]

// 更新TaskType接口以包含color屬性
export interface TaskTypeWithColor extends TaskType {
  color: string
  isDefault?: boolean
}

interface TaskTypeSettingsProps {
  onClose?: () => void
}

export function TaskTypeSettings({ onClose }: TaskTypeSettingsProps) {
  const [taskTypes, setTaskTypes] = useState<TaskTypeWithColor[]>([])
  const [newTaskType, setNewTaskType] = useState<TaskTypeWithColor>({ value: "", label: "", color: "teal" })
  const [editingTaskType, setEditingTaskType] = useState<TaskTypeWithColor | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteTaskTypeId, setDeleteTaskTypeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 加載任務類型
  useEffect(() => {
    const loadTaskTypes = async () => {
      try {
        setIsLoading(true)
        const types = await fetchTaskTypes()
        
        // 將API返回的任務類型處理為包含color屬性的格式
        const typesWithColor: TaskTypeWithColor[] = types.map(type => {
          // 嘗試從localStorage獲取自定義顏色設置
          const savedTypes = localStorage.getItem("taskTypeColors")
          const colorMap = savedTypes ? JSON.parse(savedTypes) : {}
          
          return {
            ...type,
            // 使用保存的顏色或根據value分配一個默認顏色
            color: colorMap[type.value] || getDefaultColorForValue(type.value),
            isDefault: ["foundation", "piles", "jacket", "wtg", "cables", "operation"].includes(type.value)
          }
        })
        
        setTaskTypes(typesWithColor)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load task types:", error)
        toast({
          title: "Error",
          description: "Failed to load task types. Using local data instead.",
          variant: "destructive",
        })
        
        // 加載失敗時，嘗試從localStorage加載
        fallbackToLocalStorage()
      }
    }
    
    // 從localStorage加載的備用函數
    const fallbackToLocalStorage = () => {
      // 默認任務類型
      const defaultTypes = [
        { value: "foundation", label: "Seabed Leveling", color: "red", isDefault: true },
        { value: "piles", label: "Pile Foundation Installation", color: "yellow", isDefault: true },
        { value: "jacket", label: "Jacket Installation", color: "blue", isDefault: true },
        { value: "wtg", label: "Wind Turbine Installation", color: "green", isDefault: true },
        { value: "cables", label: "Cable Laying", color: "purple", isDefault: true },
        { value: "operation", label: "Operation & Maintenance", color: "gray", isDefault: true },
      ]
      
      // 獲取自定義任務類型
      const savedTypes = localStorage.getItem("customTaskTypes")
      const customTypes = savedTypes ? JSON.parse(savedTypes) : []
      
      setTaskTypes([...defaultTypes, ...customTypes])
      setIsLoading(false)
    }

    loadTaskTypes()
  }, [toast])
  
  // 根據任務類型值獲取默認顏色
  const getDefaultColorForValue = (value: string): string => {
    const colorMap: {[key: string]: string} = {
      "foundation": "red",
      "piles": "yellow",
      "jacket": "blue",
      "wtg": "green",
      "cables": "purple",
      "operation": "gray"
    }
    
    return colorMap[value] || 
      colorOptions[Math.floor(Math.random() * colorOptions.length)].value
  }

  // 保存任務類型顏色到localStorage
  const saveTaskTypeColors = (types: TaskTypeWithColor[]) => {
    const colorMap: {[key: string]: string} = {}
    types.forEach(type => {
      colorMap[type.value] = type.color
    })
    localStorage.setItem("taskTypeColors", JSON.stringify(colorMap))
  }

  // 新增任務類型
  const handleAddTaskType = async () => {
    if (!newTaskType.label.trim()) {
      toast({
        title: "Error",
        description: "Task type name cannot be empty",
        variant: "destructive",
      })
      return
    }

    // 生成value（如果為空）
    if (!newTaskType.value.trim()) {
      newTaskType.value = newTaskType.label.toLowerCase().replace(/\s+/g, "_")
    }

    // 檢查是否已存在相同value的任務類型
    if (taskTypes.some((type) => type.value === newTaskType.value)) {
      toast({
        title: "Error",
        description: "A task type with this value already exists",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      // 調用API創建新任務類型
      const newType = await createTaskType({
        value: newTaskType.value,
        label: newTaskType.label,
        description: ""
      })
      
      // 將新任務類型添加到列表中
      const newTypeWithColor: TaskTypeWithColor = {
        ...newType,
        color: newTaskType.color
      }
      
      const updatedTypes = [...taskTypes, newTypeWithColor]
      setTaskTypes(updatedTypes)
      
      // 保存顏色設置到localStorage
      saveTaskTypeColors(updatedTypes)
      
      setNewTaskType({ value: "", label: "", color: "teal" })
      setIsAddDialogOpen(false)
      setIsLoading(false)

      toast({
        title: "Success",
        description: "Task type added successfully",
      })
    } catch (error) {
      console.error("Failed to create task type:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to create task type. Please try again.",
        variant: "destructive",
      })
    }
  }

  // 編輯任務類型
  const handleEditTaskType = async () => {
    if (!editingTaskType || !editingTaskType.label.trim()) {
      toast({
        title: "Error",
        description: "Task type name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      // 調用API更新任務類型
      await updateTaskType({
        value: editingTaskType.value,
        label: editingTaskType.label,
        description: editingTaskType.description || ""
      })
      
      // 更新本地任務類型列表
      const updatedTypes = taskTypes.map((type) => 
        type.value === editingTaskType.value ? editingTaskType : type
      )
      
      setTaskTypes(updatedTypes)
      
      // 保存顏色設置到localStorage
      saveTaskTypeColors(updatedTypes)
      
      setIsEditDialogOpen(false)
      setEditingTaskType(null)
      setIsLoading(false)

      toast({
        title: "Success",
        description: "Task type updated successfully",
      })
    } catch (error) {
      console.error("Failed to update task type:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to update task type. Please try again.",
        variant: "destructive",
      })
    }
  }

  // 刪除任務類型
  const handleDeleteTaskType = async () => {
    if (!deleteTaskTypeId) return

    try {
      setIsLoading(true)
      // 調用API刪除任務類型
      await deleteTaskType(deleteTaskTypeId)
      
      // 更新本地任務類型列表
      const updatedTypes = taskTypes.filter((type) => type.value !== deleteTaskTypeId)
      setTaskTypes(updatedTypes)
      
      // 更新localStorage中的顏色設置
      saveTaskTypeColors(updatedTypes)
      
      setDeleteTaskTypeId(null)
      setIsLoading(false)

      toast({
        title: "Success",
        description: "Task type deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete task type:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to delete task type. Please try again.",
        variant: "destructive",
      })
    }
  }

  // 獲取顏色樣式
  const getColorClass = (colorValue: string) => {
    const color = colorOptions.find((c) => c.value === colorValue)
    return color ? color.class : colorOptions[0].class
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Type Settings</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Task Type</DialogTitle>
                <DialogDescription>Add a new task type that will be available when creating tasks</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="taskTypeLabel">Task Type Name</Label>
                  <Input
                    id="taskTypeLabel"
                    value={newTaskType.label}
                    onChange={(e) => setNewTaskType({ ...newTaskType, label: e.target.value })}
                    placeholder="Example: Excavation Work"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taskTypeValue">Task Type Value (Optional)</Label>
                  <Input
                    id="taskTypeValue"
                    value={newTaskType.value}
                    onChange={(e) => setNewTaskType({ ...newTaskType, value: e.target.value })}
                    placeholder="Example: excavation (leave empty to auto-generate)"
                  />
                  <p className="text-xs text-muted-foreground">If left empty, will be automatically generated from the name</p>
                </div>

                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={cn(
                          "flex items-center justify-center h-8 rounded-md border cursor-pointer hover:opacity-80",
                          color.class,
                          newTaskType.color === color.value && "ring-2 ring-offset-2 ring-primary",
                        )}
                        onClick={() => setNewTaskType({ ...newTaskType, color: color.value })}
                        title={color.name}
                      >
                        {newTaskType.color === color.value && <Save className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddTaskType}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Value</div>
          <div className="col-span-3">Color</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {taskTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">No Task Types Yet</h3>
            <p className="text-muted-foreground mt-2">Click the "Add Task Type" button to create one</p>
          </div>
        ) : (
          <div className="divide-y">
            {taskTypes.map((type) => (
              <div key={type.value} className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-3 font-medium">{type.label}</div>
                <div className="col-span-3 text-sm text-muted-foreground">{type.value}</div>
                <div className="col-span-3">
                  <Badge className={cn("px-3 py-1", getColorClass(type.color))}>{type.label}</Badge>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  {!type.isDefault && (
                    <>
                      <Dialog
                        open={isEditDialogOpen && editingTaskType?.value === type.value}
                        onOpenChange={(open) => {
                          setIsEditDialogOpen(open)
                          if (!open) setEditingTaskType(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingTaskType(type)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Task Type</DialogTitle>
                            <DialogDescription>Modify the task type name and color</DialogDescription>
                          </DialogHeader>

                          {editingTaskType && (
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="editTaskTypeLabel">Task Type Name</Label>
                                <Input
                                  id="editTaskTypeLabel"
                                  value={editingTaskType.label}
                                  onChange={(e) =>
                                    setEditingTaskType({
                                      ...editingTaskType,
                                      label: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="editTaskTypeValue">Task Type Value</Label>
                                <Input
                                  id="editTaskTypeValue"
                                  value={editingTaskType.value}
                                  disabled
                                  className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Task type value cannot be modified to ensure system stability</p>
                              </div>

                              <div className="grid gap-2">
                                <Label>Color</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {colorOptions.map((color) => (
                                    <div
                                      key={color.value}
                                      className={cn(
                                        "flex items-center justify-center h-8 rounded-md border cursor-pointer hover:opacity-80",
                                        color.class,
                                        editingTaskType.color === color.value && "ring-2 ring-offset-2 ring-primary",
                                      )}
                                      onClick={() =>
                                        setEditingTaskType({
                                          ...editingTaskType,
                                          color: color.value,
                                        })
                                      }
                                      title={color.name}
                                    >
                                      {editingTaskType.color === color.value && <Save className="h-4 w-4" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleEditTaskType}>Update</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTaskTypeId(type.value)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the "{type.label}" task type? This action cannot be undone and may affect existing tasks using this type.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteTaskTypeId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTaskType}>Confirm Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {type.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default Type
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
