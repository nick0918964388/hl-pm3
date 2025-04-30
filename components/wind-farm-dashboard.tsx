"use client"

import { useState, useEffect } from "react"
import { ProjectSelector } from "@/components/project-selector"
import { WindFarmVisualization } from "@/components/wind-farm-visualization"
import { StatusLegend } from "@/components/status-legend"
import { TimeSlider } from "@/components/time-slider"
import { useToast } from "@/hooks/use-toast"
import type { Project, Task, Turbine } from "@/lib/types"
import { fetchProjects, fetchTurbines, fetchTasks } from "@/lib/api"

export function WindFarmDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [turbines, setTurbines] = useState<Turbine[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const projectsData = await fetchProjects()
        setProjects(projectsData)

        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load initial data:", error)
        toast({
          title: "錯誤",
          description: "無法載入專案資料，請稍後再試",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [toast])

  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject) return

      try {
        setIsLoading(true)
        const [turbinesData, tasksData] = await Promise.all([
          fetchTurbines(selectedProject),
          fetchTasks(selectedProject),
        ])

        setTurbines(turbinesData)
        setTasks(tasksData)

        // 設置項目的開始和結束日期
        const currentProject = projects.find((p) => p.id === selectedProject)
        if (currentProject) {
          setDateRange({
            from: new Date(currentProject.startDate),
            to: new Date(currentProject.endDate),
          })
          setCurrentDate(new Date(currentProject.startDate))
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load project data:", error)
        toast({
          title: "錯誤",
          description: "無法載入風機和任務資料，請稍後再試",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [selectedProject, projects, toast])

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
  }

  const handleDateRangeChange = (range: { from: Date; to: Date } | null) => {
    setDateRange(range)
  }

  const handleCurrentDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  // 根據當前日期篩選任務
  const filteredTasks = tasks.filter((task) => {
    const taskStartDate = new Date(task.startDate)
    return taskStartDate <= currentDate
  })

  const currentProject = projects.find((p) => p.id === selectedProject)

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h2 className="text-xl font-semibold">風場狀態概覽</h2>
          {currentProject && <p className="text-muted-foreground">{currentProject.name}</p>}
        </div>
        <ProjectSelector projects={projects} selectedProject={selectedProject} onProjectChange={handleProjectChange} />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {dateRange && (
              <TimeSlider
                startDate={dateRange.from}
                endDate={dateRange.to}
                currentDate={currentDate}
                onDateChange={handleCurrentDateChange}
                projectName={currentProject?.name}
              />
            )}

            <div className="bg-white p-4 rounded-lg shadow">
              <WindFarmVisualization
                projectName={currentProject?.name || ""}
                turbines={turbines}
                tasks={filteredTasks}
                currentDate={currentDate}
              />
            </div>

            <StatusLegend />
          </>
        )}
      </div>
    </div>
  )
}
