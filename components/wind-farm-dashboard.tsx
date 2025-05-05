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
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)
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
          const newFrom = new Date(currentProject.startDate);
          const newTo = new Date(currentProject.endDate);
          
          setDateRange({
            from: newFrom,
            to: newTo,
          });
          
          // 初始化 selectedRange 為第一週
          const oneWeekLater = new Date(newFrom);
          oneWeekLater.setDate(newFrom.getDate() + 7);
          setSelectedRange({
            start: newFrom,
            end: oneWeekLater > newTo ? newTo : oneWeekLater
          });
          
          // 只有當當前日期不在項目日期範圍內，才重設當前日期
          const current = currentDate;
          if (current < newFrom || current > newTo) {
            setCurrentDate(newFrom);
          }
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
    if (projectId !== selectedProject) {
      setSelectedProject(projectId);
    }
  }

  const handleDateRangeChange = (range: { from: Date; to: Date } | null) => {
    setDateRange(range)
  }

  const handleCurrentDateChange = (date: Date) => {
    if (date && (!currentDate || date.getTime() !== currentDate.getTime())) {
      setCurrentDate(date);
    }
  }
  
  const handleTimeRangeChange = (start: Date, end: Date) => {
    setSelectedRange({ start, end });
  }

  // 根據選擇的日期範圍篩選任務，而不僅是當前日期
  const filteredTasks = tasks;
  // 移除篩選，顯示所有任務，而不管起始時間
  // 我們將在風機視覺化組件中控制哪些任務要塗色

  const currentProject = projects.find((p) => p.id === selectedProject)

  return (
    <div className="w-full max-w-full mx-auto">
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
                onRangeChange={handleTimeRangeChange}
              />
            )}

            <div className="bg-white p-4 rounded-lg shadow w-full">
              <WindFarmVisualization
                projectName={currentProject?.name || ""}
                turbines={turbines}
                tasks={filteredTasks}
                currentDate={currentDate}
                dateRange={selectedRange}
              />
            </div>

            <StatusLegend />
          </>
        )}
      </div>
    </div>
  )
}
