import { TurbineManagement } from "@/components/turbine-management"
import { fetchProjects } from "@/lib/api"

export default async function TurbinesPage() {
  // Get the first project as the default project
  const projects = await fetchProjects()
  const defaultProject = projects.length > 0 ? projects[0] : null

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Turbine Management</h1>
      {defaultProject ? (
        <TurbineManagement project={defaultProject} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No project found, please create a project</p>
        </div>
      )}
    </main>
  )
}
