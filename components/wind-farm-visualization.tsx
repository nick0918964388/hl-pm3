"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import type { Turbine, Task } from "@/lib/types"

interface WindFarmVisualizationProps {
  projectName: string
  turbines: Turbine[]
  tasks: Task[]
  currentDate: Date
  dateRange: { start: Date; end: Date } | null
}

export function WindFarmVisualization({ projectName, turbines, tasks, currentDate, dateRange }: WindFarmVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 添加懸停狀態
  const [hoveredTurbine, setHoveredTurbine] = useState<string | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null)
  const [turbineTasksInfo, setTurbineTasksInfo] = useState<Task[]>([])
  // 保存所有風機位置信息以供滑鼠事件使用
  const [allTurbinePositions, setAllTurbinePositions] = useState<{ id: string; x: number; y: number; code: string; displayName: string }[]>([])

  // 獲取專案中的所有任務名稱而非類型
  const taskNames = useMemo(() => {
    const names = new Set<string>()
    tasks.forEach((task) => {
      names.add(task.name)
    })
    return Array.from(names)
  }, [tasks])

  // 任務名稱對應的顏色映射
  const taskColorMap = useMemo(() => {
    const colors = [
      "#4CAF50", // 綠色
      "#2196F3", // 藍色
      "#FFC107", // 黃色
      "#9C27B0", // 紫色
      "#FF5722", // 橙色
      "#3F51B5", // 靛藍色
      "#00BCD4", // 青色
      "#E91E63", // 粉紅色
      "#8BC34A", // 淺綠色
      "#FF9800", // 琥珀色
    ]
    
    const colorMap: { [key: string]: string } = {}
    taskNames.forEach((name, index) => {
      colorMap[name] = colors[index % colors.length]
    })
    
    return colorMap
  }, [taskNames])

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

  // 監聽滑鼠移動
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    
    // 滑鼠移動處理函數
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return
      
      // 獲取滑鼠在畫布上的位置
      const rect = canvas.getBoundingClientRect()
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const displayWidth = rect.width
      const displayHeight = rect.height
      
      // 計算縮放比例
      const scaleX = canvasWidth / displayWidth
      const scaleY = canvasHeight / displayHeight
      
      // 獲取滑鼠在畫布坐標系中的精確位置
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY
      
      // 檢查滑鼠是否在任何風機上
      let isOverTurbine = false
      
      for (const turbine of allTurbinePositions) {
        const distance = Math.sqrt(Math.pow(x - turbine.x, 2) + Math.pow(y - turbine.y, 2))
        if (distance <= 35) { // 風機圓圈半徑
          isOverTurbine = true
          
          if (hoveredTurbine !== turbine.id) {
            // 更新懸停的風機ID
            setHoveredTurbine(turbine.id)
            setHoveredPosition({ x: turbine.x, y: turbine.y - 50 })
            
            // 獲取該風機的任務信息
            const turbineTasks = tasks.filter(task => task.turbineIds.includes(turbine.id))
            setTurbineTasksInfo(turbineTasks)
            
            // 改變鼠標樣式
            canvas.style.cursor = 'pointer'
          }
          break
        }
      }
      
      if (!isOverTurbine && hoveredTurbine !== null) {
        // 滑鼠移出風機
        setHoveredTurbine(null)
        setHoveredPosition(null)
        setTurbineTasksInfo([])
        canvas.style.cursor = 'default'
      }
    }
    
    // 添加事件監聽器
    canvas.addEventListener('mousemove', handleMouseMove)
    
    // 清理函數
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [hoveredTurbine, tasks, allTurbinePositions])

  // 在useEffect中，根據projectName動態調整風機位置
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 根據專案ID動態調整風機位置
    let turbinePositions: { id: string; x: number; y: number; code: string; displayName: string }[] = []

    // 根據不同專案設置不同的風機佈局
    if (projectName.includes("HAI LONG")) {
      // 海龍風場佈局 - 增加間距
      const spacing = 140
      const startX = 120
      const startY = 220
      
      turbinePositions = [
        // 第一行 (WB030, WB050, WB170, WB090, WB150, WB130, WB110, WB070, WB010)
        { id: "WB030", x: startX, y: startY, code: "HL21-A01-A", displayName: "HL21-A01-A" },
        { id: "WB050", x: startX + spacing, y: startY, code: "HL21-B01-A", displayName: "HL21-B01-A" },
        { id: "WB170", x: startX + spacing * 2, y: startY, code: "HL22-C01-B", displayName: "HL22-C01-B" },
        { id: "WB090", x: startX + spacing * 3, y: startY, code: "HL21-D01-A", displayName: "HL21-D01-A" },
        { id: "WB150", x: startX + spacing * 4, y: startY, code: "HL22-E01-B", displayName: "HL22-E01-B" },
        { id: "WB130", x: startX + spacing * 5, y: startY, code: "HL22-F01-B", displayName: "HL22-F01-B" },
        { id: "WB110", x: startX + spacing * 6, y: startY, code: "HL22-G01-B", displayName: "HL22-G01-B" },
        { id: "WB070", x: startX + spacing * 7, y: startY, code: "HL21-H01-A", displayName: "HL21-H01-A" },
        { id: "WB010", x: startX + spacing * 8, y: startY, code: "HL21-J01-A", displayName: "HL21-J01-A" },

        // 第二行 (WB031, WB051, WB171, WB091, WB151, WB131, WB111, WB071, WB011)
        { id: "WB031", x: startX, y: startY + spacing, code: "HL21-A02-A", displayName: "HL21-A02-A" },
        { id: "WB051", x: startX + spacing, y: startY + spacing, code: "HL21-B02-A", displayName: "HL21-B02-A" },
        { id: "WB171", x: startX + spacing * 2, y: startY + spacing, code: "HL22-C02-B", displayName: "HL22-C02-B" },
        { id: "WB091", x: startX + spacing * 3, y: startY + spacing, code: "HL21-D02-A", displayName: "HL21-D02-A" },
        { id: "WB151", x: startX + spacing * 4, y: startY + spacing, code: "HL22-E02-B", displayName: "HL22-E02-B" },
        { id: "WB131", x: startX + spacing * 5, y: startY + spacing, code: "HL22-F02-B", displayName: "HL22-F02-B" },
        { id: "WB111", x: startX + spacing * 6, y: startY + spacing, code: "HL22-G02-B", displayName: "HL22-G02-B" },
        { id: "WB071", x: startX + spacing * 7, y: startY + spacing, code: "HL21-H02-A", displayName: "HL21-H02-A" },
        { id: "WB011", x: startX + spacing * 8, y: startY + spacing, code: "HL21-J02-A", displayName: "HL21-J02-A" },

        // 第三行 (WB032, WB052, WB172, WB092, WB152, WB132, WB112, WB072, WB012)
        { id: "WB032", x: startX, y: startY + spacing * 2, code: "HL21-A03-A", displayName: "HL21-A03-A" },
        { id: "WB052", x: startX + spacing, y: startY + spacing * 2, code: "HL21-B03-A", displayName: "HL21-B03-A" },
        { id: "WB172", x: startX + spacing * 2, y: startY + spacing * 2, code: "HL22-C03-B", displayName: "HL22-C03-B" },
        { id: "WB092", x: startX + spacing * 3, y: startY + spacing * 2, code: "HL21-D03-A", displayName: "HL21-D03-A" },
        { id: "WB152", x: startX + spacing * 4, y: startY + spacing * 2, code: "HL22-E03-B", displayName: "HL22-E03-B" },
        { id: "WB132", x: startX + spacing * 5, y: startY + spacing * 2, code: "HL22-F03-B", displayName: "HL22-F03-B" },
        { id: "WB112", x: startX + spacing * 6, y: startY + spacing * 2, code: "HL22-G03-B", displayName: "HL22-G03-B" },
        { id: "WB072", x: startX + spacing * 7, y: startY + spacing * 2, code: "HL21-H03-A", displayName: "HL21-H03-A" },
        { id: "WB012", x: startX + spacing * 8, y: startY + spacing * 2, code: "HL21-J03-A", displayName: "HL21-J03-A" },

        // 第四行 (WB033, -, WB173, WB093, WB153, WB133, -, WB073, WB013)
        { id: "WB033", x: startX, y: startY + spacing * 3, code: "HL21-A04-A", displayName: "HL21-A04-A" },
        { id: "WB173", x: startX + spacing * 2, y: startY + spacing * 3, code: "HL22-C04-B", displayName: "HL22-C04-B" },
        { id: "WB093", x: startX + spacing * 3, y: startY + spacing * 3, code: "HL21-D04-A", displayName: "HL21-D04-A" },
        { id: "WB153", x: startX + spacing * 4, y: startY + spacing * 3, code: "HL22-E04-B", displayName: "HL22-E04-B" },
        { id: "WB133", x: startX + spacing * 5, y: startY + spacing * 3, code: "HL22-F04-B", displayName: "HL22-F04-B" },
        { id: "WB013", x: startX + spacing * 8, y: startY + spacing * 3, code: "HL21-J04-A", displayName: "HL21-J04-A" },

        // 第五行 (WB034, -, -, WB094, -, WB134, -, -, WB014)
        { id: "WB034", x: startX, y: startY + spacing * 4, code: "HL21-A05-A", displayName: "HL21-A05-A" },
        { id: "WB094", x: startX + spacing * 3, y: startY + spacing * 4, code: "HL21-D05-A", displayName: "HL21-D05-A" },
        { id: "WB134", x: startX + spacing * 5, y: startY + spacing * 4, code: "HL22-F05-B", displayName: "HL22-F05-B" },
        { id: "WB014", x: startX + spacing * 8, y: startY + spacing * 4, code: "HL21-J05-A", displayName: "HL21-J05-A" },
      ]
      
      // 使用turbines數據更新displayName
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("FORMOSA")) {
      // 福爾摩沙風場佈局 - 5x5網格, 調整間距
      const gridSize = 5
      const startX = 250
      const startY = 250
      const spacing = 180

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
            displayName: `FM${String(index + 1).padStart(3, "0")}`
          })
        }
      }
      
      // 使用turbines數據更新turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("CHANGHUA")) {
      // 大彰化風場佈局 - 6x5網格, 調整間距
      const cols = 6
      const rows = 5
      const startX = 180
      const startY = 230
      const spacing = 180

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
            displayName: `GC${String(index + 1).padStart(3, "0")}`
          })
        }
      }
      
      // 使用turbines數據更新turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("YUNLIN")) {
      // 雲林風場佈局 - 4x5網格, 調整間距
      const cols = 4
      const rows = 5
      const startX = 400
      const startY = 230
      const spacing = 200

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
            displayName: `YL${String(index + 1).padStart(3, "0")}`
          })
        }
      }
      
      // 使用turbines數據更新turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else {
      // 默認佈局 - 使用傳入的turbines數據, 調整間距
      const startX = 250
      const startY = 250
      const spacing = 180

      // 創建一個映射來存儲每個風機的位置
      const turbineMap = new Map<string, { id: string; x: number; y: number; code: string; displayName: string }>()

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
          displayName: turbine.displayName || turbine.code
        })
      })

      // 將映射轉換為數組
      turbinePositions = Array.from(turbineMap.values())
    }

    // 更新風機位置狀態，供滑鼠事件使用
    setAllTurbinePositions(turbinePositions)

    // 計算最大的風機Y位置，用於動態調整Canvas高度
    const maxTurbineY = Math.max(...turbinePositions.map(t => t.y)) + 100  // 加上額外空間
    
    // 設置畫布大小 - 調整為填滿螢幕，並根據風機位置動態調整高度
    const minHeight = 900; // 最小高度
    canvas.width = 1600
    canvas.height = Math.max(minHeight, maxTurbineY);

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 繪製標題框
    drawTitleBox(ctx, projectName, 120, 85)

    // 繪製 OSS - 將其位置調整到Canvas中心
    const ossX = canvas.width / 2
    const ossY = 100
    drawOSS(ctx, ossX, ossY)

    // 繪製匯出線
    drawExportLines(ctx, ossX, ossY)

    // 繪製連接線 - 先畫線再畫風機
    drawConnections(ctx, ossX, ossY, turbinePositions, tasks, currentDate)

    // 繪製風機
    turbinePositions.forEach((turbine) => {
      // 獲取該風機的任務
      const turbineTasks = tasks.filter((task) => task.turbineIds.includes(turbine.id))

      // 計算每種任務名稱的完成情況
      const taskCompletionByName = calculateTaskCompletionByName(turbineTasks, currentDate, taskNames)

      drawTurbine(ctx, turbine.x, turbine.y, turbine.id, turbine.displayName, taskCompletionByName, taskNames)
    })

    // 繪製圖例 - 調整至畫面右側區域
    const legendX = canvas.width - 300;  // 從畫布右側計算位置
    const legendY = 250;                 // 垂直位置約為中間
    drawLegend(ctx, legendX, legendY, taskNames)
    
    // 如果有懸停的風機，繪製信息框
    if (hoveredTurbine && hoveredPosition) {
      drawTurbineInfo(ctx, hoveredPosition.x, hoveredPosition.y, turbineTasksInfo, currentDate)
    }
  }, [projectName, turbines, tasks, currentDate, taskNames, hoveredTurbine, hoveredPosition, turbineTasksInfo, taskColorMap, dateRange])

  // 計算每種任務名稱的完成情況
  const calculateTaskCompletionByName = (turbineTasks: Task[], currentDate: Date, taskNames: string[]) => {
    const result: { [key: string]: boolean } = {}

    // 初始化所有任務名稱為未完成
    taskNames.forEach(name => {
      result[name] = false
    })

    // 檢查風機關聯的每個任務
    turbineTasks.forEach((task) => {
      const taskEndDate = new Date(task.endDate)
      
      // 只檢查任務完成狀態，忽略任務開始時間
      // 如果有日期範圍，則檢查任務結束日期是否在範圍內且狀態為已完成
      if (dateRange) {
        // 只有當任務完成日期在選擇的範圍內，且任務狀態為已完成時，才標記為完成
        if (taskEndDate <= dateRange.end && task.status === "completed") {
          result[task.name] = true
        }
      } else {
        // 使用當前日期作為參考
        if (taskEndDate <= currentDate && task.status === "completed") {
          result[task.name] = true
        }
      }
    })

    return result
  }

  // 繪製風機任務信息框
  const drawTurbineInfo = (ctx: CanvasRenderingContext2D, x: number, y: number, turbineTasks: Task[], currentDate: Date) => {
    // 排序任務，按照開始日期先後排序
    const sortedTasks = [...turbineTasks].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    
    // 計算信息框尺寸
    const boxWidth = 210  // 更窄的框寬度
    const lineHeight = 18  // 更小的行高
    const padding = 6     // 更小的內邊距
    const titleHeight = 24  // 標題高度
    const contentPadding = 10  // 分隔線和內容之間的間距
    
    // 動態計算高度，基於實際任務數量，但最多顯示5個
    const shownTasks = Math.min(sortedTasks.length, 5)
    const boxHeight = shownTasks === 0 ? 
      65 : // 沒有任務時的高度
      titleHeight + contentPadding + (shownTasks * lineHeight) + (sortedTasks.length > 5 ? lineHeight : 0) + padding * 2
    
    // 調整信息框位置
    let infoX = x - boxWidth / 2
    let infoY = y - boxHeight - 10  // 將信息框移到風機上方
    
    // 確保信息框不會超出畫布
    if (infoX < 10) infoX = 10
    if (infoX + boxWidth > ctx.canvas.width - 10) infoX = ctx.canvas.width - boxWidth - 10
    if (infoY < 10) infoY = 10
    if (infoY + boxHeight > ctx.canvas.height - 10) infoY = ctx.canvas.height - boxHeight - 10
    
    // 繪製信息框背景
    ctx.fillStyle = "rgba(255, 255, 255, 0.97)"
    ctx.fillRect(infoX, infoY, boxWidth, boxHeight)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.strokeRect(infoX, infoY, boxWidth, boxHeight)
    
    // 繪製標題
    ctx.font = "bold 12px Arial"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.fillText("任務資訊", infoX + boxWidth / 2, infoY + 16)
    
    // 繪製分隔線
    ctx.beginPath()
    ctx.moveTo(infoX, infoY + titleHeight)
    ctx.lineTo(infoX + boxWidth, infoY + titleHeight)
    ctx.strokeStyle = "#cccccc"
    ctx.stroke()
    
    // 計算內容起始Y坐標 - 分隔線以下，加上額外間距
    const contentStartY = infoY + titleHeight + contentPadding
    
    // 繪製任務列表
    ctx.font = "11px Arial"
    ctx.textAlign = "left"
    
    // 計算最大顯示任務數，避免過多
    const maxTasksToShow = 5
    const tasksToShow = sortedTasks.length > maxTasksToShow ? 
      sortedTasks.slice(0, maxTasksToShow) : sortedTasks
    
    tasksToShow.forEach((task, index) => {
      // 使用內容起始Y坐標計算每個任務項的位置
      const taskY = contentStartY + index * lineHeight
      
      // 確定任務狀態
      const taskEndDate = new Date(task.endDate)
      const isCompleted = taskEndDate <= currentDate && task.status === "completed"
      
      // 根據任務狀態設置顏色
      ctx.fillStyle = isCompleted ? 
        taskColorMap[task.name] || "#006400" :
        "#333333"
      
      // 繪製任務名稱
      const displayName = task.name.length > 12 ? task.name.substring(0, 10) + "..." : task.name
      ctx.fillText(`• ${displayName}`, infoX + padding, taskY)
      
      // 日期格式
      const endDate = new Date(task.endDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})
      ctx.textAlign = "right"
      ctx.fillText(`完工: ${endDate}`, infoX + boxWidth - padding, taskY)
      ctx.textAlign = "left" // 重置對齊方式
    })
    
    // 如果有更多任務未顯示，顯示省略信息
    if (sortedTasks.length > maxTasksToShow) {
      const moreY = contentStartY + maxTasksToShow * lineHeight
      ctx.fillStyle = "#222222"
      ctx.fillText(`...還有${sortedTasks.length - maxTasksToShow}個任務`, infoX + padding, moreY)
    }
    
    // 如果沒有任務，顯示提示信息
    if (sortedTasks.length === 0) {
      ctx.fillStyle = "#222222"
      ctx.textAlign = "center"
      ctx.fillText("該風機沒有任務", infoX + boxWidth / 2, contentStartY + 6) // 調整無任務提示的位置
    }
  }

  // 繪製 OSS
  const drawOSS = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 繪製 OSS 圓形外框
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 2.5 // 加粗線條
    ctx.stroke()

    // 尋找OSS相關任務
    const ossRelatedTasks = tasks.filter(task => task.type === "operation");
    const ossCompletedTasks = ossRelatedTasks.filter(task => {
      const taskEndDate = new Date(task.endDate);
      if (dateRange) {
        return taskEndDate <= dateRange.end && task.status === "completed";
      } else {
        return taskEndDate <= currentDate && task.status === "completed";
      }
    });

    // 繪製 OSS 內部 - 分三等份
    const totalSegments = 3; // 固定為三等份
    const segments = Array(totalSegments).fill(null).map((_, index) => {
      // 檢查是否有對應的已完成OSS任務
      const isCompleted = index < ossCompletedTasks.length;
      return {
        color: isCompleted ? "#4CAF50" : "#FFFFFF",  // 綠色表示完成，白色表示未完成
        percentage: 100 / totalSegments
      };
    });

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
    turbinePositions: { id: string; x: number; y: number; code: string; displayName: string }[],
    tasks: Task[],
    currentDate: Date,
  ) => {
    // 確定哪些風機已經完成電纜鋪設任務
    const completedCablesTurbines = new Set<string>()
    tasks.forEach((task) => {
      if (task.type === "cables" && task.status === "completed") {
        // 如果有日期範圍，則檢查任務結束日期是否在範圍內
        if (dateRange) {
          const taskEndDate = new Date(task.endDate)
          if (taskEndDate <= dateRange.end) {
            task.turbineIds.forEach((id) => completedCablesTurbines.add(id))
          }
        } else {
          // 使用當前日期
          if (new Date(task.endDate) <= currentDate) {
            task.turbineIds.forEach((id) => completedCablesTurbines.add(id))
          }
        }
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
    const turbinesByColumn: { [key: number]: { id: string; x: number; y: number; code: string; displayName: string }[] } = {}

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
        ctx.moveTo(upperTurbine.x, upperTurbine.y + 35)
        ctx.lineTo(lowerTurbine.x, lowerTurbine.y - 35)

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
    displayName: string,
    taskCompletionByName: { [key: string]: boolean },
    taskNames: string[],
  ) => {
    // 獲取原始代碼 - 從displayName中尋找對應的turbine以取得code
    const turbine = turbines.find(t => t.id === id)
    const code = turbine?.code || displayName

    // 繪製風機圓形外框 - 增大風機圈圈尺寸
    ctx.beginPath()
    ctx.arc(x, y, 35, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 3.0 // 加粗線條
    ctx.stroke()

    // 獲取風機涉及的任務名稱
    const turbineTaskNames = Object.keys(taskCompletionByName)

    // 使用專案所有任務名稱進行分割，無論風機是否有關聯
    let segments: { color: string; percentage: number }[] = []
    
    if (taskNames.length === 0) {
      // 如果專案沒有任務，繪製空白圓圈
      ctx.beginPath()
      ctx.arc(x, y, 35, 0, Math.PI * 2)
      ctx.fillStyle = "#FFFFFF"
      ctx.fill()
    } else {
      // 為所有專案任務創建分段，無論風機是否關聯
      segments = taskNames.map((name) => {
        // 判斷該任務是否關聯到此風機
        const isTaskRelated = turbineTaskNames.includes(name);
        // 判斷該任務是否已完成（在所選時間範圍內）
        const isCompleted = isTaskRelated && taskCompletionByName[name];
        
        return {
          // 如果任務已完成並且關聯到此風機，使用該任務對應的顏色；否則為白色
          color: isCompleted ? (taskColorMap[name] || "#006400") : "#FFFFFF",
          percentage: 100 / taskNames.length,
        }
      })

      // 繪製風機狀態 - 根據專案的所有任務名稱平均分段
      drawPieChart(ctx, x, y, 35, segments)
    }

    // 增加明顯的分段線 - 只要有任務就繪製分段線
    if (segments.length > 0) {
      let startAngle = -Math.PI / 2 // 從頂部開始

      segments.forEach((segment) => {
        const sliceAngle = (segment.percentage / 100) * (Math.PI * 2)
        const endAngle = startAngle + sliceAngle

        // 繪製從圓心到圓周的分段線
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(startAngle) * 35, y + Math.sin(startAngle) * 35)
        ctx.strokeStyle = "#333333"
        ctx.lineWidth = 1.5
        ctx.stroke()

        startAngle = endAngle
      })

      // 最後一條線（回到起點）
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - 35) // 回到頂部
      ctx.strokeStyle = "#333333"
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // 繪製內圓 - 增大內圓尺寸
    ctx.beginPath()
    ctx.arc(x, y, 26, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.stroke()

    // 繪製風機代碼而非ID - 調整位置 (外圈顯示displayName)
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(displayName, x, y - 45)

    // 將風機代碼分成兩行顯示在內圈 - 使用原始code而非displayName
    const codeLines = code.split("-")
    ctx.font = "bold 11px Arial"
    ctx.fillStyle = "#0066cc"
    ctx.fillText(codeLines[0], x, y - 6) // 第一行
    ctx.fillText(codeLines[1] + (codeLines[2] ? "-" + codeLines[2] : ""), x, y + 10) // 第二行
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
  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number, taskNames: string[]) => {
    // 繪製圖例背景
    const legendWidth = 250;
    const itemHeight = 40;  // 增加每項的高度，讓間距更大
    const legendHeight = 50 + Math.ceil(taskNames.length / 2) * itemHeight;  // 根據任務名稱數量動態調整高度
    
    // 繪製半透明背景
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.fillRect(x, y, legendWidth, legendHeight)
    ctx.strokeStyle = "#cccccc"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, legendWidth, legendHeight)

    // 繪製標題
    ctx.font = "bold 16px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("任務名稱圖例", x + 10, y + 30)

    // 繪製圖例項目
    const boxSize = 18
    const startY = y + 50  // 增加標題與項目間距
    const itemsPerCol = Math.ceil(taskNames.length / 2)

    taskNames.forEach((name, index) => {
      const col = Math.floor(index / itemsPerCol)
      const row = index % itemsPerCol

      const itemX = x + 10 + col * 120
      const itemY = startY + row * itemHeight

      // 繪製顏色方塊，使用對應任務的顏色
      ctx.fillStyle = taskColorMap[name] || "#4CAF50"
      ctx.fillRect(itemX, itemY, boxSize, boxSize)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.strokeRect(itemX, itemY, boxSize, boxSize)

      // 繪製任務名稱 - 使用短名稱避免太長
      ctx.fillStyle = "#000"
      ctx.font = "14px Arial"
      
      // 如果名稱過長，截斷顯示
      const displayText = name.length > 15 ? name.substring(0, 12) + "..." : name
      ctx.fillText(displayText, itemX + boxSize + 8, itemY + 15)
    })
  }

  return (
    <div className="relative w-full overflow-auto bg-white">
      <canvas 
        ref={canvasRef} 
        width="1600" 
        height="900" 
        className="mx-auto w-full" 
        // 添加滑鼠離開畫布的處理
        onMouseLeave={() => {
          setHoveredTurbine(null);
          setHoveredPosition(null);
          setTurbineTasksInfo([]);
        }}
      />
      {/* 可選: 顯示當前懸停的風機ID，用於調試 */}
      {hoveredTurbine && (
        <div className="hidden">{`當前懸停風機: ${hoveredTurbine}`}</div>
      )}
    </div>
  )
}
