"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Turbine } from "@/lib/types"

const turbineSchema = z.object({
  code: z.string().min(1, { message: "風機代碼不能為空" }),
  name: z.string().min(1, { message: "風機名稱不能為空" }),
  location: z.object({
    x: z.coerce.number(),
    y: z.coerce.number(),
  }),
})

interface TurbineFormProps {
  projectId: string
  turbine?: Turbine
  onSubmit: (data: z.infer<typeof turbineSchema>) => void
  onCancel: () => void
}

export function TurbineForm({ projectId, turbine, onSubmit, onCancel }: TurbineFormProps) {
  const form = useForm<z.infer<typeof turbineSchema>>({
    resolver: zodResolver(turbineSchema),
    defaultValues: turbine || {
      code: "",
      name: "",
      location: {
        x: 0,
        y: 0,
      },
    },
  })

  const handleFormSubmit = (data: z.infer<typeof turbineSchema>) => {
    onSubmit({
      ...data,
      id: turbine?.id || `${data.code.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>風機代碼</FormLabel>
              <FormControl>
                <Input placeholder="例如: HL21-A01-A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>風機名稱</FormLabel>
              <FormControl>
                <Input placeholder="例如: 風機 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location.x"
            render={({ field }) => (
              <FormItem>
                <FormLabel>X 座標</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>X座標代表風機在視覺化圖上的水平位置（從左到右）</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location.y"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Y 座標</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Y座標代表風機在視覺化圖上的垂直位置（從上到下）</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">{turbine ? "更新風機" : "建立風機"}</Button>
        </div>
      </form>
    </Form>
  )
}
