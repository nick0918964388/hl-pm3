"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
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
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("tasks")

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const projectsData = await fetchProjects()
        setProjects(projectsData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load projects:", error)
        toast({
          title: "錯誤",
          description: "無法載入專案資料，請稍後再試",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [toast])

  // 修改 handleAddProject 函數，防止重複提交
  const handleAddProject = async (data: Omit<Project, "id">) => {
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
        title: "成功",
        description: "專案已成功建立",
      })
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to create project:", error)
      toast({
        title: "錯誤",
        description: "無法建立專案，請稍後再試",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleEditProject = async (data: Omit<Project, "id">) => {
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
        title: "成功",
        description: "專案已成功更新",
      })
    } catch (error) {
      console.error("Failed to update project:", error)
      toast({
        title: "錯誤",
        description: "無法更新專案，請稍後再試",
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
        title: "成功",
        description: "專案已成功刪除",
      })
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast({
        title: "錯誤",
        description: "無法刪除專案，請稍後再試",
        variant: "destructive",
      })
    }
  }

  const handleManageProject = (project: Project) => {
    setActiveProject(project)
    setActiveTab("tasks") // 默認顯示任務管理
  }

  const handleBackToProjects = () => {
    setActiveProject(null)
  }

  return (
    <div className="space-y-6">
      {/* 返回儀表板連結 */}

      {!activeProject ? (
        // 專案列表頁面
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium text-foreground/90 tracking-tight">專案管理</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary/90 hover:bg-primary shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  新增專案
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>新增專案</DialogTitle>
                  <DialogDescription>填寫以下表單來建立新的風場專案</DialogDescription>
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
              <h3 className="text-xl font-medium text-foreground/80">尚無專案</h3>
              <p className="text-muted-foreground/80 mt-2">點擊「新增專案」按鈕來建立您的第一個風場專案</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/40 bg-card/80">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="text-xl font-medium text-card-foreground/90">{project.name}</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      {format(new Date(project.startDate), "yyyy/MM/dd", { locale: zhTW })} -{" "}
                      {format(new Date(project.endDate), "yyyy/MM/dd", { locale: zhTW })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-card-foreground/80 line-clamp-3 mb-4">{project.description}</p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 border-t border-border/30 pt-3 bg-background/50">
                    <Button variant="default" size="sm" onClick={() => handleManageProject(project)} className="bg-primary/90 hover:bg-primary">
                      管理專案
                    </Button>
                    <Dialog
                      open={isEditDialogOpen && selectedProject?.id === project.id}
                      onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (!open) setSelectedProject(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project)
                            setIsEditDialogOpen(true)
                          }}
                          className="border-border/50 hover:bg-accent/30 hover:text-accent-foreground"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          編輯
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>編輯專案</DialogTitle>
                          <DialogDescription>修改專案資訊</DialogDescription>
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
                        <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          刪除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            您確定要刪除此專案嗎？此操作無法撤銷，所有相關的任務和數據都將被刪除。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // 專案詳情頁面（包含任務和風機管理的標籤）
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <Button variant="outline" onClick={handleBackToProjects} className="mb-4">
                返回專案列表
              </Button>
              <h2 className="text-2xl font-bold">{activeProject.name}</h2>
              <p className="text-muted-foreground">
                {format(new Date(activeProject.startDate), "yyyy/MM/dd", { locale: zhTW })} -{" "}
                {format(new Date(activeProject.endDate), "yyyy/MM/dd", { locale: zhTW })}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tasks">任務管理</TabsTrigger>
              <TabsTrigger value="turbines">風機管理</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <TaskManagement project={activeProject} />
            </TabsContent>

            <TabsContent value="turbines" className="mt-4">
              <TurbineManagement project={activeProject} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
