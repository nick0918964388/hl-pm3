import { WindFarmDashboard } from "@/components/wind-farm-dashboard"

export default function ProjectDashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-6 w-full">
      <div className="w-full max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Wind Farm Project Dashboard</h1>
        </div>
        <WindFarmDashboard />
      </div>
    </main>
  )
} 