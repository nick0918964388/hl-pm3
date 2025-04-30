import { ProjectManagement } from "@/components/project-management"

export default function ProjectsPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">風場專案管理系統</h1>
      <ProjectManagement />
    </main>
  )
}
