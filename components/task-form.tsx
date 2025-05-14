"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Settings } from "lucide-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
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
import type { Task, Turbine, Project } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskTypeSettings, type TaskTypeWithColor } from "@/components/task-type-settings"
import { fetchProject, createTask, updateTask, fetchTaskTypes } from "@/lib/api"

// 導出 taskSchema 以供其他組件使用
export const taskSchema = z.object({
  name: z.string().min(1, { message: "Task name cannot be empty" }),
  description: z.string().min(1, { message: "Task description cannot be empty" }),
  startDate: z.date({ required_error: "Please select a start date" }),
  endDate: z.date({ required_error: "Please select an end date" }),
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "Please select a status",
  }),
  type: z.string().min(1, { message: "Please select a type" }),
  turbineIds: z.array(z.string()).min(1, { message: "Please select at least one turbine" }),
});

interface TaskFormProps {
  projectId: string
  task?: Task
  turbines: Turbine[]
  onSubmit: (data: z.infer<typeof taskSchema>) => void
  onCancel: () => void
}

export function TaskForm({ projectId, task, turbines, onSubmit, onCancel }: TaskFormProps) {
  // 使用TaskTypeWithColor類型
  const [taskTypes, setTaskTypes] = useState<TaskTypeWithColor[]>([])
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [showTaskTypeSettings, setShowTaskTypeSettings] = useState(false)
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null)
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(false)

  // 載入專案資訊以獲取開始日期
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const projectInfo = await fetchProject(projectId)
        if (projectInfo && projectInfo.startDate) {
          setProjectStartDate(new Date(projectInfo.startDate))
        } else {
          console.log("Unable to get project start date, using current date as default")
          // 如果無法獲取專案開始日期，使用當前日期作為默認值
          setProjectStartDate(new Date())
        }
      } catch (error) {
        console.error("Unable to load project information:", error)
        // 發生錯誤時也設置默認日期
        setProjectStartDate(new Date())
      }
    }
    
    loadProjectInfo()
  }, [projectId])

  // 載入任務類型
  useEffect(() => {
    const loadTaskTypes = async () => {
      try {
        setIsLoadingTaskTypes(true)
        // 從API獲取任務類型
        const typesData = await fetchTaskTypes()
        
        // 處理任務類型數據，添加顏色屬性
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
        
        const processedTypes = typesData.map(type => ({
          ...type,
          color: colorMap[type.value] || defaultColors[type.value] || "gray",
          isDefault: ["foundation", "piles", "jacket", "wtg", "cables", "operation"].includes(type.value)
        })) as TaskTypeWithColor[]
        
        setTaskTypes(processedTypes)
        setIsLoadingTaskTypes(false)
      } catch (error) {
        console.error("Failed to load task types:", error)
        setIsLoadingTaskTypes(false)
        
        // 如果API調用失敗，使用默認類型
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

    loadTaskTypes()

    // 監聽色彩設置變更
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "taskTypeColors") {
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

  // When project start date is loaded, update start date if it's a new task
  useEffect(() => {
    if (projectStartDate && !task) {
      form.setValue("startDate", projectStartDate)
    }
  }, [projectStartDate, form, task])

  const handleFormSubmit = (data: z.infer<typeof taskSchema>) => {
    // Get end date format
    const endDateStr = format(data.endDate, "yyyy-MM-dd");
    
    // If there's a project start date, use it as the task start date
    // Otherwise use the end date as the start date
    const startDateStr = projectStartDate 
      ? format(projectStartDate, "yyyy-MM-dd")
      : endDateStr;
    
    // 只傳遞符合 schema 的數據，其他數據由外部處理
    onSubmit({
      ...data,
      startDate: data.startDate,
      endDate: data.endDate,
    })
  }

  // Reload task types when task type settings dialog is closed
  const handleTaskTypeSettingsClose = () => {
    setShowTaskTypeSettings(false)
    // 移除對未定義函數和變數的引用，直接重新載入任務類型
    const loadTaskTypes = async () => {
      try {
        const typesData = await fetchTaskTypes()
        
        // 處理任務類型數據，添加顏色屬性
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
        
        const processedTypes = typesData.map(type => ({
          ...type,
          color: colorMap[type.value] || defaultColors[type.value] || "gray",
          isDefault: ["foundation", "piles", "jacket", "wtg", "cables", "operation"].includes(type.value)
        })) as TaskTypeWithColor[]
        
        setTaskTypes(processedTypes)
      } catch (error) {
        console.error("Failed to reload task types:", error)
        
        // 如果API調用失敗，使用默認類型
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
    
    loadTaskTypes()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter task name" {...field} />
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
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter task description" className="resize-none" {...field} />
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
                <FormLabel>Task Type</FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select task type" />
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
                            Manage Task Types
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
                <FormLabel>Task Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Start date field is hidden but keeps its functionality */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <div className="hidden">
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <input
                      type="hidden"
                      {...field}
                      value={field.value ? field.value.toISOString() : ""}
                    />
                  </FormControl>
                </FormItem>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="font-bold">Completion Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "yyyy-MM-dd", { locale: enUS }) : <span>Select date</span>}
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
                          // Automatically set start date to the same as end date
                          form.setValue("startDate", date)
                          // Automatically close date picker
                          document.body.click()
                        }
                      }}
                      disabled={(date) => date < new Date("2000-01-01")}
                      initialFocus
                      locale={enUS}
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
                <FormLabel className="text-base">Select Turbines</FormLabel>
                <div className="text-sm text-muted-foreground mb-4">Select turbines involved in this task</div>
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
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("turbineIds", [])}>
                  Clear
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
                            {turbine.code} ({turbine.displayName})
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
            Cancel
          </Button>
          <Button type="submit">{task ? "Update Task" : "Create Task"}</Button>
        </div>
      </form>

      {/* Task type settings dialog */}
      <Dialog open={showTaskTypeSettings} onOpenChange={setShowTaskTypeSettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Task Type Settings</DialogTitle>
          </DialogHeader>
          <TaskTypeSettings onClose={handleTaskTypeSettingsClose} />
        </DialogContent>
      </Dialog>
    </Form>
  )
}
