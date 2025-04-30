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

// 預設任務類型
const defaultTaskTypes = [
  { value: "foundation", label: "海床整平", color: "red" },
  { value: "piles", label: "樁基礎安裝", color: "yellow" },
  { value: "jacket", label: "套管安裝", color: "blue" },
  { value: "wtg", label: "風機安裝", color: "green" },
  { value: "cables", label: "電纜鋪設", color: "purple" },
  { value: "operation", label: "運營維護", color: "gray" },
]

// 可用的顏色選項
const colorOptions = [
  { name: "紅色", value: "red", class: "bg-red-100 text-red-700 border-red-300" },
  { name: "黃色", value: "yellow", class: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { name: "藍色", value: "blue", class: "bg-blue-100 text-blue-700 border-blue-300" },
  { name: "綠色", value: "green", class: "bg-green-100 text-green-700 border-green-300" },
  { name: "紫色", value: "purple", class: "bg-purple-100 text-purple-700 border-purple-300" },
  { name: "灰色", value: "gray", class: "bg-gray-100 text-gray-700 border-gray-300" },
  { name: "青色", value: "teal", class: "bg-teal-100 text-teal-700 border-teal-300" },
  { name: "橙色", value: "orange", class: "bg-orange-100 text-orange-700 border-orange-300" },
  { name: "粉色", value: "pink", class: "bg-pink-100 text-pink-700 border-pink-300" },
  { name: "靛藍", value: "indigo", class: "bg-indigo-100 text-indigo-700 border-indigo-300" },
]

export interface TaskType {
  value: string
  label: string
  color: string
  isDefault?: boolean
}

interface TaskTypeSettingsProps {
  onClose?: () => void
}

export function TaskTypeSettings({ onClose }: TaskTypeSettingsProps) {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [newTaskType, setNewTaskType] = useState<TaskType>({ value: "", label: "", color: "teal" })
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteTaskTypeId, setDeleteTaskTypeId] = useState<string | null>(null)
  const { toast } = useToast()

  // 載入任務類型
  useEffect(() => {
    const loadTaskTypes = () => {
      // 從 localStorage 獲取自定義任務類型
      const savedTypes = localStorage.getItem("customTaskTypes")
      const customTypes: TaskType[] = savedTypes ? JSON.parse(savedTypes) : []

      // 合併預設和自定義任務類型
      const allTypes = [...defaultTaskTypes.map((type) => ({ ...type, isDefault: true })), ...customTypes]
      setTaskTypes(allTypes)
    }

    loadTaskTypes()
  }, [])

  // 保存任務類型到 localStorage
  const saveTaskTypes = (types: TaskType[]) => {
    // 只保存自定義類型
    const customTypes = types.filter((type) => !type.isDefault)
    localStorage.setItem("customTaskTypes", JSON.stringify(customTypes))
  }

  // 添加新任務類型
  const handleAddTaskType = () => {
    if (!newTaskType.label.trim()) {
      toast({
        title: "錯誤",
        description: "任務類型名稱不能為空",
        variant: "destructive",
      })
      return
    }

    // 生成 value (如果為空)
    if (!newTaskType.value.trim()) {
      newTaskType.value = newTaskType.label.toLowerCase().replace(/\s+/g, "_")
    }

    // 檢查是否已存在相同的值
    if (taskTypes.some((type) => type.value === newTaskType.value)) {
      toast({
        title: "錯誤",
        description: "已存在相同的任務類型值",
        variant: "destructive",
      })
      return
    }

    const updatedTypes = [...taskTypes, newTaskType]
    setTaskTypes(updatedTypes)
    saveTaskTypes(updatedTypes)

    setNewTaskType({ value: "", label: "", color: "teal" })
    setIsAddDialogOpen(false)

    toast({
      title: "成功",
      description: "任務類型已成功添加",
    })
  }

  // 編輯任務類型
  const handleEditTaskType = () => {
    if (!editingTaskType || !editingTaskType.label.trim()) {
      toast({
        title: "錯誤",
        description: "任務類型名稱不能為空",
        variant: "destructive",
      })
      return
    }

    const updatedTypes = taskTypes.map((type) => (type.value === editingTaskType.value ? editingTaskType : type))

    setTaskTypes(updatedTypes)
    saveTaskTypes(updatedTypes)
    setIsEditDialogOpen(false)
    setEditingTaskType(null)

    toast({
      title: "成功",
      description: "任務類型已成功更新",
    })
  }

  // 刪除任務類型
  const handleDeleteTaskType = () => {
    if (!deleteTaskTypeId) return

    const updatedTypes = taskTypes.filter((type) => type.value !== deleteTaskTypeId)
    setTaskTypes(updatedTypes)
    saveTaskTypes(updatedTypes)
    setDeleteTaskTypeId(null)

    toast({
      title: "成功",
      description: "任務類型已成功刪除",
    })
  }

  // 獲取顏色樣式
  const getColorClass = (colorValue: string) => {
    const color = colorOptions.find((c) => c.value === colorValue)
    return color ? color.class : colorOptions[0].class
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">任務類型設定</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增任務類型
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增任務類型</DialogTitle>
                <DialogDescription>添加新的任務類型，將可在建立任務時使用</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="taskTypeLabel">任務類型名稱</Label>
                  <Input
                    id="taskTypeLabel"
                    value={newTaskType.label}
                    onChange={(e) => setNewTaskType({ ...newTaskType, label: e.target.value })}
                    placeholder="例如: 挖掘工程"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taskTypeValue">任務類型值 (選填)</Label>
                  <Input
                    id="taskTypeValue"
                    value={newTaskType.value}
                    onChange={(e) => setNewTaskType({ ...newTaskType, value: e.target.value })}
                    placeholder="例如: excavation (留空將自動生成)"
                  />
                  <p className="text-xs text-muted-foreground">如果留空，將根據名稱自動生成</p>
                </div>

                <div className="grid gap-2">
                  <Label>顏色</Label>
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
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleAddTaskType}>新增</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              關閉
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium">
          <div className="col-span-3">名稱</div>
          <div className="col-span-3">值</div>
          <div className="col-span-3">顏色</div>
          <div className="col-span-3 text-right">操作</div>
        </div>

        {taskTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">尚無任務類型</h3>
            <p className="text-muted-foreground mt-2">點擊「新增任務類型」按鈕來建立</p>
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
                            <DialogTitle>編輯任務類型</DialogTitle>
                            <DialogDescription>修改任務類型的名稱和顏色</DialogDescription>
                          </DialogHeader>

                          {editingTaskType && (
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="editTaskTypeLabel">任務類型名稱</Label>
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
                                <Label htmlFor="editTaskTypeValue">任務類型值</Label>
                                <Input
                                  id="editTaskTypeValue"
                                  value={editingTaskType.value}
                                  disabled
                                  className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">任務類型值不可修改，以確保系統穩定性</p>
                              </div>

                              <div className="grid gap-2">
                                <Label>顏色</Label>
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
                              <Button variant="outline">取消</Button>
                            </DialogClose>
                            <Button onClick={handleEditTaskType}>更新</Button>
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
                            <AlertDialogTitle>確認刪除</AlertDialogTitle>
                            <AlertDialogDescription>
                              您確定要刪除「{type.label}」任務類型嗎？此操作無法撤銷，且可能影響使用此類型的現有任務。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteTaskTypeId(null)}>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTaskType}>確認刪除</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {type.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      預設類型
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
