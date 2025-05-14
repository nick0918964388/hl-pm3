"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Turbine } from "@/lib/types"

const turbineSchema = z.object({
  code: z.string().min(1, { message: "Turbine code cannot be empty" }),
  name: z.string().min(1, { message: "Turbine name cannot be empty" }),
  location: z.object({
    x: z.coerce.number(),
    y: z.coerce.number(),
  }),
  id: z.string().optional(),
})

interface TurbineFormProps {
  projectId: string
  turbine?: Turbine
  onSubmit: (data: z.infer<typeof turbineSchema> & { id: string }) => void
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
              <FormLabel>Turbine Code</FormLabel>
              <FormControl>
                <Input placeholder="Example: HL21-A01-A" {...field} />
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
              <FormLabel>Turbine Name</FormLabel>
              <FormControl>
                <Input placeholder="Example: Turbine 1" {...field} />
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
                <FormLabel>X Coordinate</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>X coordinate represents the horizontal position of the turbine on the visualization map (from left to right)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location.y"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Y Coordinate</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Y coordinate represents the vertical position of the turbine on the visualization map (from top to bottom)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{turbine ? "Update Turbine" : "Create Turbine"}</Button>
        </div>
      </form>
    </Form>
  )
}
