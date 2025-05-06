export function StatusLegend() {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Status Legend</h3>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">Turbine Status</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-gray-300"></div>
              <span className="text-sm">Task Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300"></div>
              <span className="text-sm">Task Not Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500">
          * Each turbine circle is divided into different segments based on the number of tasks associated with that turbine. Each segment represents the completion status of one task type.
        </p>
      </div>
    </div>
  )
}
