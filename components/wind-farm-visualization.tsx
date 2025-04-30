"use client"

import { useRef, useEffect, useMemo } from "react"
import type { Turbine, Task } from "@/lib/types"

interface WindFarmVisualizationProps {
  projectName: string
  turbines: Turbine[]
  tasks: Task[]
  currentDate: Date
}

export function WindFarmVisualization({ projectName, turbines, tasks, currentDate }: WindFarmVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 獲取專案中的所有任務類型
  const taskTypes = useMemo(() => {
    const types = new Set<string>()
    tasks.forEach((task) => {
      types.add(task.type)
    })
    return Array.from(types)
  }, [tasks])

  // 在drawTitleBox函數中，使用傳入的projectName
  const drawTitleBox = (ctx: CanvasRenderingContext2D, title: string, x: number, y: number) => {
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y - 20, 240, 40)

    ctx.font = "bold 16px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(title, x + 120, y + 5)
  }

  // 在useEffect中，根據projectName動態調整風機位置
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 設置畫布大小
    canvas.width = 1200
    canvas.height = 800

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 繪製標題框
    drawTitleBox(ctx, projectName, 80, 85)

    // 繪製 OSS
    const ossX = canvas.width / 2
    const ossY = 80
    drawOSS(ctx, ossX, ossY)

    // 繪製匯出線
    drawExportLines(ctx, ossX, ossY)

    // 根據專案ID動態調整風機位置
    let turbinePositions: { id: string; x: number; y: number; code: string }[] = []

    // 根據不同專案設置不同的風機佈局
    if (projectName.includes("HAI LONG")) {
      // 海龍風場佈局
      turbinePositions = [
        // 第一行 (WB030, WB050, WB170, WB090, WB150, WB130, WB110, WB070, WB010)
        { id: "WB030", x: 80, y: 210, code: "HL21-A01-A" },
        { id: "WB050", x: 200, y: 210, code: "HL21-B01-A" },
        { id: "WB170", x: 320, y: 210, code: "HL22-C01-B" },
        { id: "WB090", x: 440, y: 210, code: "HL21-D01-A" },
        { id: "WB150", x: 560, y: 210, code: "HL22-E01-B" },
        { id: "WB130", x: 680, y: 210, code: "HL22-F01-B" },
        { id: "WB110", x: 800, y: 210, code: "HL22-G01-B" },
        { id: "WB070", x: 920, y: 210, code: "HL21-H01-A" },
        { id: "WB010", x: 1040, y: 210, code: "HL21-J01-A" },

        // 第二行 (WB031, WB051, WB171, WB091, WB151, WB131, WB111, WB071, WB011)
        { id: "WB031", x: 80, y: 320, code: "HL21-A02-A" },
        { id: "WB051", x: 200, y: 320, code: "HL21-B02-A" },
        { id: "WB171", x: 320, y: 320, code: "HL22-C02-B" },
        { id: "WB091", x: 440, y: 320, code: "HL21-D02-A" },
        { id: "WB151", x: 560, y: 320, code: "HL22-E02-B" },
        { id: "WB131", x: 680, y: 320, code: "HL22-F02-B" },
        { id: "WB111", x: 800, y: 320, code: "HL22-G02-B" },
        { id: "WB071", x: 920, y: 320, code: "HL21-H02-A" },
        { id: "WB011", x: 1040, y: 320, code: "HL21-J02-A" },

        // 第三行 (WB032, WB052, WB172, WB092, WB152, WB132, WB112, WB072, WB012)
        { id: "WB032", x: 80, y: 430, code: "HL21-A03-A" },
        { id: "WB052", x: 200, y: 430, code: "HL21-B03-A" },
        { id: "WB172", x: 320, y: 430, code: "HL22-C03-B" },
        { id: "WB092", x: 440, y: 430, code: "HL21-D03-A" },
        { id: "WB152", x: 560, y: 430, code: "HL22-E03-B" },
        { id: "WB132", x: 680, y: 430, code: "HL22-F03-B" },
        { id: "WB112", x: 800, y: 430, code: "HL22-G03-B" },
        { id: "WB072", x: 920, y: 430, code: "HL21-H03-A" },
        { id: "WB012", x: 1040, y: 430, code: "HL21-J03-A" },

        // 第四行 (WB033, -, WB173, WB093, WB153, WB133, -, WB073, WB013)
        { id: "WB033", x: 80, y: 540, code: "HL21-A04-A" },
        { id: "WB173", x: 320, y: 540, code: "HL22-C04-B" },
        { id: "WB093", x: 440, y: 540, code: "HL21-D04-A" },
        { id: "WB153", x: 560, y: 540, code: "HL22-E04-B" },
        { id: "WB133", x: 680, y: 540, code: "HL22-F04-B" },
        { id: "WB013", x: 1040, y: 540, code: "HL21-J04-A" },

        // 第五行 (WB034, -, -, WB094, -, WB134, -, -, WB014)
        { id: "WB034", x: 80, y: 650, code: "HL21-A05-A" },
        { id: "WB094", x: 440, y: 650, code: "HL21-D05-A" },
        { id: "WB134", x: 680, y: 650, code: "HL22-F05-B" },
        { id: "WB014", x: 1040, y: 650, code: "HL21-J05-A" },
      ]
    } else if (projectName.includes("FORMOSA")) {
      // 福爾摩沙風場佈局 - 5x5網格
      const gridSize = 5
      const startX = 200
      const startY = 200
      const spacing = 150

      turbinePositions = []
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const index = row * gridSize + col
          const id = `FM${String(index + 1).padStart(3, "0")}`
          const code = `FM2-${String(row + 1).padStart(2, "0")}-${String(col + 1).padStart(2, "0")}`

          turbinePositions.push({
            id,
            x: startX + col * spacing,
            y: startY + row * spacing,
            code,
          })
        }
      }
    } else if (projectName.includes("CHANGHUA")) {
      // 大彰化風場佈局 - 6x5網格
      const cols = 6
      const rows = 5
      const startX = 150
      const startY = 200
      const spacing = 150

      turbinePositions = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col
          const id = `GC${String(index + 1).padStart(3, "0")}`
          const code = `GC-${String(row + 1).padStart(2, "0")}-${String(col + 1).padStart(2, "0")}`

          turbinePositions.push({
            id,
            x: startX + col * spacing,
            y: startY + row * spacing,
            code,
          })
        }
      }
    } else if (projectName.includes("YUNLIN")) {
      // 雲林風場佈局 - 4x5網格
      const cols = 4
      const rows = 5
      const startX = 250
      const startY = 200
      const spacing = 170

      turbinePositions = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col
          const id = `YL${String(index + 1).padStart(3, "0")}`
          const code = `YL-${String(row + 1).padStart(2, "0")}-${String(col + 1).padStart(2, "0")}`

          turbinePositions.push({
            id,
            x: startX + col * spacing,
            y: startY + row * spacing,
            code,
          })
        }
      }
    } else {
      // 默認佈局 - 使用傳入的turbines數據
      // 為新建立的專案創建一個網格佈局
      const startX = 200
      const startY = 200
      const spacing = 150

      // 創建一個映射來存儲每個風機的位置
      const turbineMap = new Map<string, { x: number; y: number; code: string; id: string }>()

      // 首先處理所有風機
      turbines.forEach((turbine) => {
        // 使用風機的實際位置來確定其在畫布上的位置
        const x = startX + turbine.location.x * spacing
        const y = startY + turbine.location.y * spacing

        turbineMap.set(turbine.id, {
          id: turbine.id,
          x,
          y,
          code: turbine.code,
        })
      })

      // 將映射轉換為數組
      turbinePositions = Array.from(turbineMap.values())
    }

    // 繪製連接線 - 先畫線再畫風機
    drawConnections(ctx, ossX, ossY, turbinePositions, tasks, currentDate)

    // 繪製風機
    turbinePositions.forEach((turbine) => {
      // 獲取該風機的任務
      const turbineTasks = tasks.filter((task) => task.turbineIds.includes(turbine.id))

      // 計算每種類型任務的完成情況
      const taskCompletionByType = calculateTaskCompletionByType(turbineTasks, currentDate, taskTypes)

      drawTurbine(ctx, turbine.x, turbine.y, turbine.id, turbine.code, taskCompletionByType, taskTypes)
    })

    // 繪製圖例
    drawLegend(ctx, 80, 720, taskTypes)
  }, [projectName, turbines, tasks, currentDate, taskTypes])

  // 計算每種類型任務的完成情況
  const calculateTaskCompletionByType = (turbineTasks: Task[], currentDate: Date, taskTypes: string[]) => {
    const result: { [key: string]: boolean } = {}

    // 先獲取該風機涉及的所有任務類型
    const turbineTaskTypes = new Set<string>()
    turbineTasks.forEach((task) => {
      turbineTaskTypes.add(task.type)
    })

    // 只處理風機涉及的任務類型
    Array.from(turbineTaskTypes).forEach((type) => {
      // 檢查該類型的任務是否在當前日期前已完成
      const tasksOfType = turbineTasks.filter((task) => task.type === type)
      const isCompleted = tasksOfType.some((task) => {
        const taskEndDate = new Date(task.endDate)
        return taskEndDate <= currentDate && task.status === "completed"
      })

      result[type] = isCompleted
    })

    return result
  }

  // 繪製 OSS
  const drawOSS = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 繪製 OSS 圓形外框
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 2.5 // 加粗線條
    ctx.stroke()

    // 繪製 OSS 內部 - 分三等份
    const segments = [
      { color: "#4CAF50", percentage: 33.33 }, // 綠色 - 第一部分
      { color: "#4CAF50", percentage: 33.33 }, // 綠色 - 第二部分
      { color: "#4CAF50", percentage: 33.34 }, // 綠色 - 第三部分
    ]

    drawPieChart(ctx, x, y, 30, segments)

    // 繪製內圓
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.stroke()

    // 繪製 OSS 文字
    ctx.font = "bold 14px Arial"
    ctx.fillStyle = "#0066cc"
    ctx.textAlign = "center"
    ctx.fillText("OSS", x, y + 5)
  }

  // 繪製匯出線
  const drawExportLines = (ctx: CanvasRenderingContext2D, ossX: number, ossY: number) => {
    // HL2A-EXPORT 線
    ctx.beginPath()
    ctx.moveTo(ossX + 30, ossY - 10)
    ctx.lineTo(ossX + 500, ossY - 10)
    ctx.strokeStyle = "#cc0000"
    ctx.lineWidth = 2
    ctx.stroke()

    // 文字
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("EXPORT-A", ossX + 50, ossY - 15)

    // HL2B-EXPORT 線
    ctx.beginPath()
    ctx.moveTo(ossX + 30, ossY + 10)
    ctx.lineTo(ossX + 500, ossY + 10)
    ctx.strokeStyle = "#cc0000"
    ctx.lineWidth = 2
    ctx.stroke()

    // 文字
    ctx.fillText("EXPORT-B", ossX + 50, ossY + 25)
  }

  // 繪製連接線
  const drawConnections = (
    ctx: CanvasRenderingContext2D,
    ossX: number,
    ossY: number,
    turbinePositions: { id: string; x: number; y: number; code: string }[],
    tasks: Task[],
    currentDate: Date,
  ) => {
    // 確定哪些風機已經完成電纜鋪設任務
    const completedCablesTurbines = new Set<string>()
    tasks.forEach((task) => {
      if (task.type === "cables" && task.status === "completed" && new Date(task.endDate) <= currentDate) {
        task.turbineIds.forEach((id) => completedCablesTurbines.add(id))
      }
    })

    // 先繪製從 OSS 到第一行風機的連接線
    const firstRowTurbines = turbinePositions.filter((t) => t.y === Math.min(...turbinePositions.map((tp) => tp.y)))

    firstRowTurbines.forEach((turbine) => {
      ctx.beginPath()
      ctx.moveTo(ossX, ossY + 30)
      ctx.lineTo(turbine.x, turbine.y - 25)

      const isCompleted = completedCablesTurbines.has(turbine.id)
      if (isCompleted) {
        ctx.strokeStyle = "#0066cc"
        ctx.setLineDash([])
      } else {
        ctx.strokeStyle = "#cc0000"
        ctx.setLineDash([5, 5])
      }

      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
    })

    // 按列繪製垂直連接線
    // 首先，將風機按 x 坐標分組
    const turbinesByColumn: { [key: number]: { id: string; x: number; y: number; code: string }[] } = {}

    turbinePositions.forEach((turbine) => {
      if (!turbinesByColumn[turbine.x]) {
        turbinesByColumn[turbine.x] = []
      }
      turbinesByColumn[turbine.x].push(turbine)
    })

    // 對每一列的風機按 y 坐標排序
    Object.values(turbinesByColumn).forEach((column) => {
      column.sort((a, b) => a.y - b.y)

      // 繪製每一列中相鄰風機之間的連接線
      for (let i = 0; i < column.length - 1; i++) {
        const upperTurbine = column[i]
        const lowerTurbine = column[i + 1]

        ctx.beginPath()
        ctx.moveTo(upperTurbine.x, upperTurbine.y + 25)
        ctx.lineTo(lowerTurbine.x, lowerTurbine.y - 25)

        const isCompleted = completedCablesTurbines.has(lowerTurbine.id) && completedCablesTurbines.has(upperTurbine.id)
        if (isCompleted) {
          ctx.strokeStyle = "#0066cc"
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = "#cc0000"
          ctx.setLineDash([5, 5])
        }

        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }

  // 繪製風機
  const drawTurbine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    id: string,
    code: string,
    taskCompletionByType: { [key: string]: boolean },
    taskTypes: string[],
  ) => {
    // 繪製風機圓形外框
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 2.5 // 加粗線條
    ctx.stroke()

    // 獲取風機涉及的任務類型
    const turbineTaskTypes = Object.keys(taskCompletionByType)

    // 如果風機沒有任務，繪製空白圓圈
    if (turbineTaskTypes.length === 0) {
      ctx.beginPath()
      ctx.arc(x, y, 25, 0, Math.PI * 2)
      ctx.fillStyle = "#FFFFFF"
      ctx.fill()
    } else {
      // 根據風機涉及的任務類型數量動態分段
      const segments = turbineTaskTypes.map((type) => {
        return {
          color: taskCompletionByType[type] ? "#4CAF50" : "#FFFFFF",
          percentage: 100 / turbineTaskTypes.length,
        }
      })

      // 繪製風機狀態 - 根據風機涉及的任務類型數量分段
      drawPieChart(ctx, x, y, 25, segments)

      // 增加明顯的分段線 - 只有當有多個分段時才繪製
      if (segments.length > 1) {
        let startAngle = -Math.PI / 2 // 從頂部開始

        segments.forEach((segment) => {
          const sliceAngle = (segment.percentage / 100) * (Math.PI * 2)
          const endAngle = startAngle + sliceAngle

          // 繪製從圓心到圓周的分段線
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + Math.cos(startAngle) * 25, y + Math.sin(startAngle) * 25)
          ctx.strokeStyle = "#333333"
          ctx.lineWidth = 1.5
          ctx.stroke()

          startAngle = endAngle
        })

        // 最後一條線（回到起點）
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y - 25) // 回到頂部
        ctx.strokeStyle = "#333333"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // 繪製內圓
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.stroke()

    // 繪製風機 ID
    ctx.font = "11px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(id, x, y - 35)

    // 將風機代碼分成兩行顯示
    const codeLines = code.split("-")
    ctx.font = "bold 10px Arial"
    ctx.fillStyle = "#0066cc"
    ctx.fillText(codeLines[0], x, y - 5) // 第一行
    ctx.fillText(codeLines[1] + (codeLines[2] ? "-" + codeLines[2] : ""), x, y + 8) // 第二行
  }

  // 繪製圓形分段圖表
  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    segments: { color: string; percentage: number }[],
  ) => {
    let startAngle = -Math.PI / 2 // 從頂部開始

    segments.forEach((segment) => {
      const sliceAngle = (segment.percentage / 100) * (Math.PI * 2)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.arc(x, y, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = segment.color
      ctx.fill()

      startAngle += sliceAngle
    })
  }

  // 繪製圖例
  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number, taskTypes: string[]) => {
    const taskTypeNames: { [key: string]: string } = {
      foundation: "海床整平",
      piles: "樁基礎安裝",
      jacket: "套管安裝",
      wtg: "風機安裝",
      cables: "電纜鋪設",
      operation: "運營維護",
    }

    ctx.font = "14px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("任務類型圖例:", x, y)

    const boxSize = 15
    const spacing = 20
    const itemsPerRow = 3
    const itemWidth = 120

    taskTypes.forEach((type, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow

      const itemX = x + col * itemWidth
      const itemY = y + spacing + row * (boxSize + spacing)

      // 繪製顏色方塊
      ctx.fillStyle = "#4CAF50"
      ctx.fillRect(itemX, itemY - boxSize + 3, boxSize, boxSize)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.strokeRect(itemX, itemY - boxSize + 3, boxSize, boxSize)

      // 繪製任務類型名稱
      ctx.fillStyle = "#000"
      ctx.fillText(taskTypeNames[type] || type, itemX + boxSize + 5, itemY)
    })
  }

  return (
    <div className="relative w-full overflow-auto bg-white">
      <canvas ref={canvasRef} width="1200" height="800" className="mx-auto" />
    </div>
  )
}
