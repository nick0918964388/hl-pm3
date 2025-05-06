"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectManagement } from "@/components/project-management"
import { TaskManagement } from "@/components/task-management"
import { TurbineManagement } from "@/components/turbine-management"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project } from "@/lib/types"
import { fetchProjects } from "@/lib/api"

export function ProjectTabs() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState<string>("projects")
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // If there's a tab parameter in the URL, set it as the active tab
    if (tabParam && ["projects", "tasks", "turbines"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const projectsData = await fetchProjects()
        setProjects(projectsData)
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load projects:", error)
        toast({
          title: "Error",
          description: "Unable to load project data. Please try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [toast])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <TabsList>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="tasks" disabled={!selectedProject}>
            Task Management
          </TabsTrigger>
          <TabsTrigger value="turbines" disabled={!selectedProject}>
            Turbine Management
          </TabsTrigger>
        </TabsList>

        {selectedProject && (
          <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <TabsContent value="projects" className="mt-0">
        <ProjectManagement />
      </TabsContent>

      <TabsContent value="tasks" className="mt-0">
        {selectedProject ? (
          <TaskManagement project={selectedProject} />
        ) : (
          <div className="flex justify-center items-center h-64 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Please select a project first</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="turbines" className="mt-0">
        {selectedProject ? (
          <TurbineManagement project={selectedProject} />
        ) : (
          <div className="flex justify-center items-center h-64 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Please select a project first</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
