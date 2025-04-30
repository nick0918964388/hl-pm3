import { WindFarmDashboard } from "@/components/wind-farm-dashboard"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">風場儀表板</h1>
        </div>
        <WindFarmDashboard />
      </div>
    </main>
  )
}
