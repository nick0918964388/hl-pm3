import { TurbineManagement } from "@/components/turbine-management"
import { fetchProjects } from "@/lib/api"

export default async function TurbinesPage() {
  // 獲取第一個專案作為默認專案
  const projects = await fetchProjects()
  const defaultProject = projects.length > 0 ? projects[0] : null

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">風機管理</h1>
      {defaultProject ? (
        <TurbineManagement project={defaultProject} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">尚無專案，請先建立專案</p>
        </div>
      )}
    </main>
  )
}
