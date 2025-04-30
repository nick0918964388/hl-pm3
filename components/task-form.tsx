"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Settings } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Task, Turbine } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskTypeSettings, type TaskType } from "@/components/task-type-settings"

const taskSchema = z.object({
  name: z.string().min(1, { message: "任務名稱不能為空" }),
  description: z.string().min(1, { message: "任務描述不能為空" }),
  startDate: z.date({ required_error: "請選擇開始日期" }),
  endDate: z.date({ required_error: "請選擇結束日期" }),
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "請選擇狀態",
  }),
  type: z.string().min(1, { message: "請選擇類型" }),
  turbineIds: z.array(z.string()).min(1, { message: "請至少選擇一個風機" }),
})

interface TaskFormProps {
  projectId: string
  task?: Task
  turbines: Turbine[]
  onSubmit: (data: z.infer<typeof taskSchema>) => void
  onCancel: () => void
}

// 預設任務類型
const defaultTaskTypes = [
  { value: "foundation", label: "海床整平", color: "red" },
  { value: "piles", label: "樁基礎安裝", color: "yellow" },
  { value: "jacket", label: "套管安裝", color: "blue" },
  { value: "wtg", label: "風機安裝", color: "green" },
  { value: "cables", label: "電纜鋪設", color: "purple" },
  { value: "operation", label: "運營維護", color: "gray" },
]

// 從 localStorage 獲取自定義任務類型
const getCustomTaskTypes = () => {
  if (typeof window !== "undefined") {
    const savedTypes = localStorage.getItem("customTaskTypes")
    return savedTypes ? JSON.parse(savedTypes) : []
  }
  return []
}

export function TaskForm({ projectId, task, turbines, onSubmit, onCancel }: TaskFormProps) {
  // 合併預設和自定義任務類型
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([...defaultTaskTypes])
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [showTaskTypeSettings, setShowTaskTypeSettings] = useState(false)

  // 載入自定義任務類型
  useEffect(() => {
    const loadTaskTypes = () => {
      const customTypes = getCustomTaskTypes()
      setTaskTypes([...defaultTaskTypes, ...customTypes])
    }

    loadTaskTypes()

    // 添加事件監聽器，當 localStorage 變更時重新載入
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "customTaskTypes") {
        loadTaskTypes()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          ...task,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
        }
      : {
          name: "",
          description: "",
          startDate: new Date(),
          endDate: new Date(),
          status: "pending",
          type: "foundation",
          turbineIds: [],
        },
  })

  // 監聽開始日期變化，自動更新結束日期
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "startDate" && value.startDate) {
        form.setValue("endDate", value.startDate as Date)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const handleFormSubmit = (data: z.infer<typeof taskSchema>) => {
    onSubmit({
      ...data,
      projectId,
      id: task?.id || `task-${Date.now()}`,
    })
  }

  // 任務類型設定對話框關閉時重新載入任務類型
  const handleTaskTypeSettingsClose = () => {
    setShowTaskTypeSettings(false)
    const customTypes = getCustomTaskTypes()
    setTaskTypes([...defaultTaskTypes, ...customTypes])
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>任務名稱</FormLabel>
              <FormControl>
                <Input placeholder="輸入任務名稱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>任務描述</FormLabel>
              <FormControl>
                <Textarea placeholder="輸入任務描述" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>任務類型</FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="選擇任務類型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 border-t">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setShowTaskTypeSettings(true)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            管理任務類型
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>任務狀態</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇任務狀態" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">待處理</SelectItem>
                    <SelectItem value="in-progress">進行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>開始日期</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "yyyy-MM-dd", { locale: zhTW }) : <span>選擇日期</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date)
                          // 自動關閉日期選擇器
                          document.body.click()
                        }
                      }}
                      disabled={(date) => date < new Date("2000-01-01")}
                      initialFocus
                      locale={zhTW}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>結束日期</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "yyyy-MM-dd", { locale: zhTW }) : <span>選擇日期</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date)
                          // 自動關閉日期選擇器
                          document.body.click()
                        }
                      }}
                      disabled={(date) =>
                        date < new Date("2000-01-01") ||
                        (form.getValues("startDate") && date < form.getValues("startDate"))
                      }
                      initialFocus
                      locale={zhTW}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="turbineIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">選擇風機</FormLabel>
                <div className="text-sm text-muted-foreground mb-4">選擇此任務涉及的風機</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allTurbineIds = turbines.map((t) => t.id)
                    form.setValue("turbineIds", allTurbineIds)
                  }}
                >
                  全選
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("turbineIds", [])}>
                  清除
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {turbines.map((turbine) => (
                  <FormField
                    key={turbine.id}
                    control={form.control}
                    name="turbineIds"
                    render={({ field }) => {
                      return (
                        <FormItem key={turbine.id} className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(turbine.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, turbine.id])
                                  : field.onChange(field.value?.filter((value) => value !== turbine.id))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {turbine.code} ({turbine.name})
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">{task ? "更新任務" : "建立任務"}</Button>
        </div>
      </form>

      {/* 任務類型設定對話框 */}
      <Dialog open={showTaskTypeSettings} onOpenChange={setShowTaskTypeSettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>任務類型設定</DialogTitle>
          </DialogHeader>
          <TaskTypeSettings onClose={handleTaskTypeSettingsClose} />
        </DialogContent>
      </Dialog>
    </Form>
  )
}
