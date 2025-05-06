"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ProjectForm } from "@/components/project-form"
import { TaskManagement } from "@/components/task-management"
import { TurbineManagement } from "@/components/turbine-management"
import type { Project } from "@/lib/types"
import { fetchProjects, createProject, updateProject, deleteProject } from "@/lib/api"

export function ProjectManagement() {
  console.log("ProjectManagement component initialized");
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("tasks")
  console.log("Before useEffect");
  useEffect(() => {
    console.log("useEffect executed");
    const loadProjects = async () => {
      console.log("loadProjects started execution");
      try {
        setIsLoading(true)
        console.log("About to call fetchProjects");
        const projectsData = await fetchProjects()
        console.log("fetchProjects call completed, data received:", projectsData);
        setProjects(projectsData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load projects:", error)
        toast({
          title: "Error",
          description: "Unable to load project data, please try again later",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [toast])

  // Modify handleAddProject function to prevent duplicate submissions
  const handleAddProject = async (data: { name: string; description: string; startDate: Date; endDate: Date }) => {
    try {
      setIsLoading(true)
      const newProject = await createProject({
        ...data,
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      })
      setProjects([...projects, newProject])
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Project created successfully",
      })
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to create project:", error)
      toast({
        title: "Error",
        description: "Unable to create project, please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleEditProject = async (data: { name: string; description: string; startDate: Date; endDate: Date }) => {
    if (!selectedProject) return

    try {
      const updatedProject = await updateProject({
        ...data,
        id: selectedProject.id,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      })
      setProjects(projects.map((project) => (project.id === selectedProject.id ? updatedProject : project)))
      setIsEditDialogOpen(false)
      setSelectedProject(null)
      toast({
        title: "Success",
        description: "Project updated successfully",
      })
    } catch (error) {
      console.error("Failed to update project:", error)
      toast({
        title: "Error",
        description: "Unable to update project, please try again later",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      setProjects(projects.filter((project) => project.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
        setActiveTab("projects")
      }
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast({
        title: "Error",
        description: "Unable to delete project, please try again later",
        variant: "destructive",
      })
    }
  }

  const handleManageProject = (project: Project) => {
    setActiveProject(project)
    setActiveTab("tasks") // Default to task management
  }

  const handleBackToProjects = () => {
    setActiveProject(null)
  }

  return (
    <div className="space-y-6">
      {/* Return to dashboard link */}

      {!activeProject ? (
        // Project list page
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium text-foreground/90 tracking-tight">Project Management</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary/90 hover:bg-primary shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Project</DialogTitle>
                  <DialogDescription>Fill out the form below to create a new wind farm project</DialogDescription>
                </DialogHeader>
                <ProjectForm onSubmit={handleAddProject} onCancel={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-border/30 shadow-sm">
              <AlertCircle className="h-12 w-12 text-muted-foreground/70 mb-4" />
              <h3 className="text-xl font-medium text-foreground/80">No Projects</h3>
              <p className="text-muted-foreground/80 mt-2">Click the "Add Project" button to create your first wind farm project</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/40 bg-card/80">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="text-xl font-medium text-card-foreground/90">{project.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground/80">
                      {format(new Date(project.startDate), "PPP", { locale: enUS })} - {format(new Date(project.endDate), "PPP", { locale: enUS })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 pb-2">
                    <p className="text-sm text-card-foreground/80 line-clamp-3">{project.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2 pb-4">
                    <Button variant="outline" size="sm" className="text-xs shadow-sm" onClick={() => handleManageProject(project)}>
                      Manage
                    </Button>
                    <div className="flex space-x-2">
                      <Dialog open={isEditDialogOpen && selectedProject?.id === project.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (!open) setSelectedProject(null)
                      }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-muted/50"
                            onClick={() => setSelectedProject(project)}
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                            <DialogDescription>Update the project details</DialogDescription>
                        </DialogHeader>
                        {selectedProject && (
                          <ProjectForm
                            project={selectedProject}
                            onSubmit={handleEditProject}
                            onCancel={() => {
                              setIsEditDialogOpen(false)
                              setSelectedProject(null)
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-muted/50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                              Are you sure you want to delete this project? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-red-500 hover:bg-red-600">
                              Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // Project detail page
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <Button variant="outline" onClick={handleBackToProjects} className="mb-4">
                ← Back to Projects
              </Button>
              <h2 className="text-2xl font-semibold tracking-tight">{activeProject.name}</h2>
              <p className="text-muted-foreground text-sm">
                {format(new Date(activeProject.startDate), "PPP", { locale: enUS })} - {format(new Date(activeProject.endDate), "PPP", { locale: enUS })}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="turbines">Turbines</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-0">
              <TaskManagement project={activeProject} />
            </TabsContent>
            <TabsContent value="turbines" className="mt-0">
              <TurbineManagement project={activeProject} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
