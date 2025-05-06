import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateTaskCompletionRate(tasks: Task[]) {
  const completionRates: { [key: string]: number } = {
    foundation: 0,
    piles: 0,
    jacket: 0,
    wtg: 0,
    cables: 0,
    operation: 0,
  }

  // Group tasks by type
  const tasksByType: { [key: string]: Task[] } = {}

  tasks.forEach((task) => {
    if (!tasksByType[task.type]) {
      tasksByType[task.type] = []
    }
    tasksByType[task.type].push(task)
  })

  // Calculate completion rate for each type
  Object.keys(tasksByType).forEach((type) => {
    const typeTasks = tasksByType[type]
    const completedTasks = typeTasks.filter((task) => task.status === "completed")

    completionRates[type] = typeTasks.length > 0 ? (completedTasks.length / typeTasks.length) * 100 : 0
  })

  return completionRates
}
