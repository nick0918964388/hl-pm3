export function StatusLegend() {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">狀態說明</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">風機狀態</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-gray-300"></div>
              <span className="text-sm">任務已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300"></div>
              <span className="text-sm">任務未完成</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">連接線</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-red-500"></div>
              <span className="text-sm">虛線 - 進行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-600"></div>
              <span className="text-sm">實線 - 已完成</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500">
          * 每個風機圓圈根據該風機涉及的任務數量分為不同等份，每個等份代表一種任務類型的完成狀態
        </p>
      </div>
    </div>
  )
}
