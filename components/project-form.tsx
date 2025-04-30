"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/types"

const projectSchema = z.object({
  name: z.string().min(1, { message: "專案名稱不能為空" }),
  description: z.string().min(1, { message: "專案描述不能為空" }),
  startDate: z.date({ required_error: "請選擇開始日期" }),
  endDate: z.date({ required_error: "請選擇結束日期" }),
})

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: z.infer<typeof projectSchema>) => void
  onCancel: () => void
}

// 修改 onSubmit 處理函數，防止表單重複提交
export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          ...project,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
        }
      : {
          name: "",
          description: "",
          startDate: new Date(),
          endDate: new Date(),
        },
  })

  const handleSubmit = async (data: z.infer<typeof projectSchema>) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    await onSubmit(data)
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>專案名稱</FormLabel>
              <FormControl>
                <Input placeholder="輸入專案名稱" {...field} />
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
              <FormLabel>專案描述</FormLabel>
              <FormControl>
                <Textarea placeholder="輸入專案描述" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                        field.onChange(date)
                        // 將結束日期自動設為選擇的開始日期
                        if (date) {
                          form.setValue("endDate", date)
                        }
                        // 自動關閉日期選擇器
                        document.body.click()
                      }}
                      disabled={(date) =>
                        date < new Date("2000-01-01")
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
                      defaultMonth={form.getValues("startDate")}
                      onSelect={(date) => {
                        field.onChange(date)
                        // 自動關閉日期選擇器
                        document.body.click()
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

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "處理中..." : project ? "更新專案" : "建立專案"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
