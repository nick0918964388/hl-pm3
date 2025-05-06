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
  // Add hover state
  const [hoveredTurbine, setHoveredTurbine] = useState<string | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null)
  const [turbineTasksInfo, setTurbineTasksInfo] = useState<Task[]>([])
  // Save all turbine position information for mouse events
  const [allTurbinePositions, setAllTurbinePositions] = useState<{ id: string; x: number; y: number; code: string; displayName: string }[]>([])

  // Get all task names in the project rather than types
  const taskNames = useMemo(() => {
    const names = new Set<string>()
    tasks.forEach((task) => {
      names.add(task.name)
    })
    return Array.from(names)
  }, [tasks])

  // Color mapping for task names
  const taskColorMap = useMemo(() => {
    const colors = [
      "#4CAF50", // Green
      "#2196F3", // Blue
      "#FFC107", // Yellow
      "#9C27B0", // Purple
      "#FF5722", // Orange
      "#3F51B5", // Indigo
      "#00BCD4", // Cyan
      "#E91E63", // Pink
      "#8BC34A", // Light green
      "#FF9800", // Amber
    ]
    
    const colorMap: { [key: string]: string } = {}
    taskNames.forEach((name, index) => {
      colorMap[name] = colors[index % colors.length]
    })
    
    return colorMap
  }, [taskNames])

  // In drawTitleBox function, use the passed projectName
  const drawTitleBox = (ctx: CanvasRenderingContext2D, title: string, x: number, y: number) => {
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y - 20, 240, 40)

    ctx.font = "bold 16px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(title, x + 120, y + 5)
  }

  // Listen for mouse movement
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    
    // Mouse movement handler function
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return
      
      // Get mouse position on canvas
      const rect = canvas.getBoundingClientRect()
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const displayWidth = rect.width
      const displayHeight = rect.height
      
      // Calculate scaling ratio
      const scaleX = canvasWidth / displayWidth
      const scaleY = canvasHeight / displayHeight
      
      // Get precise mouse position in canvas coordinate system
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY
      
      // Check if mouse is over any turbine
      let isOverTurbine = false
      
      for (const turbine of allTurbinePositions) {
        const distance = Math.sqrt(Math.pow(x - turbine.x, 2) + Math.pow(y - turbine.y, 2))
        if (distance <= 35) { // Turbine circle radius
          isOverTurbine = true
          
          if (hoveredTurbine !== turbine.id) {
            // Update hovered turbine ID
            setHoveredTurbine(turbine.id)
            setHoveredPosition({ x: turbine.x, y: turbine.y - 50 })
            
            // Get task information for this turbine
            const turbineTasks = tasks.filter(task => task.turbineIds.includes(turbine.id))
            setTurbineTasksInfo(turbineTasks)
            
            // Change cursor style
            canvas.style.cursor = 'pointer'
          }
          break
        }
      }
      
      if (!isOverTurbine && hoveredTurbine !== null) {
        // Mouse moved out of turbine
        setHoveredTurbine(null)
        setHoveredPosition(null)
        setTurbineTasksInfo([])
        canvas.style.cursor = 'default'
      }
    }
    
    // Add event listener
    canvas.addEventListener('mousemove', handleMouseMove)
    
    // Cleanup function
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [hoveredTurbine, tasks, allTurbinePositions])

  // In useEffect, dynamically adjust turbine positions based on projectName
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Dynamically adjust turbine positions based on project ID
    let turbinePositions: { id: string; x: number; y: number; code: string; displayName: string }[] = []

    // Set different turbine layouts based on different projects
    if (projectName.includes("HAI LONG")) {
      // Hai Long wind farm layout - increase spacing
      const spacing = 140
      const startX = 120
      const startY = 220
      
      turbinePositions = [
        // First row (WB030, WB050, WB170, WB090, WB150, WB130, WB110, WB070, WB010)
        { id: "WB030", x: startX, y: startY, code: "HL21-A01-A", displayName: "HL21-A01-A" },
        { id: "WB050", x: startX + spacing, y: startY, code: "HL21-B01-A", displayName: "HL21-B01-A" },
        { id: "WB170", x: startX + spacing * 2, y: startY, code: "HL22-C01-B", displayName: "HL22-C01-B" },
        { id: "WB090", x: startX + spacing * 3, y: startY, code: "HL21-D01-A", displayName: "HL21-D01-A" },
        { id: "WB150", x: startX + spacing * 4, y: startY, code: "HL22-E01-B", displayName: "HL22-E01-B" },
        { id: "WB130", x: startX + spacing * 5, y: startY, code: "HL22-F01-B", displayName: "HL22-F01-B" },
        { id: "WB110", x: startX + spacing * 6, y: startY, code: "HL22-G01-B", displayName: "HL22-G01-B" },
        { id: "WB070", x: startX + spacing * 7, y: startY, code: "HL21-H01-A", displayName: "HL21-H01-A" },
        { id: "WB010", x: startX + spacing * 8, y: startY, code: "HL21-J01-A", displayName: "HL21-J01-A" },

        // Second row (WB031, WB051, WB171, WB091, WB151, WB131, WB111, WB071, WB011)
        { id: "WB031", x: startX, y: startY + spacing, code: "HL21-A02-A", displayName: "HL21-A02-A" },
        { id: "WB051", x: startX + spacing, y: startY + spacing, code: "HL21-B02-A", displayName: "HL21-B02-A" },
        { id: "WB171", x: startX + spacing * 2, y: startY + spacing, code: "HL22-C02-B", displayName: "HL22-C02-B" },
        { id: "WB091", x: startX + spacing * 3, y: startY + spacing, code: "HL21-D02-A", displayName: "HL21-D02-A" },
        { id: "WB151", x: startX + spacing * 4, y: startY + spacing, code: "HL22-E02-B", displayName: "HL22-E02-B" },
        { id: "WB131", x: startX + spacing * 5, y: startY + spacing, code: "HL22-F02-B", displayName: "HL22-F02-B" },
        { id: "WB111", x: startX + spacing * 6, y: startY + spacing, code: "HL22-G02-B", displayName: "HL22-G02-B" },
        { id: "WB071", x: startX + spacing * 7, y: startY + spacing, code: "HL21-H02-A", displayName: "HL21-H02-A" },
        { id: "WB011", x: startX + spacing * 8, y: startY + spacing, code: "HL21-J02-A", displayName: "HL21-J02-A" },

        // Third row (WB032, WB052, WB172, WB092, WB152, WB132, WB112, WB072, WB012)
        { id: "WB032", x: startX, y: startY + spacing * 2, code: "HL21-A03-A", displayName: "HL21-A03-A" },
        { id: "WB052", x: startX + spacing, y: startY + spacing * 2, code: "HL21-B03-A", displayName: "HL21-B03-A" },
        { id: "WB172", x: startX + spacing * 2, y: startY + spacing * 2, code: "HL22-C03-B", displayName: "HL22-C03-B" },
        { id: "WB092", x: startX + spacing * 3, y: startY + spacing * 2, code: "HL21-D03-A", displayName: "HL21-D03-A" },
        { id: "WB152", x: startX + spacing * 4, y: startY + spacing * 2, code: "HL22-E03-B", displayName: "HL22-E03-B" },
        { id: "WB132", x: startX + spacing * 5, y: startY + spacing * 2, code: "HL22-F03-B", displayName: "HL22-F03-B" },
        { id: "WB112", x: startX + spacing * 6, y: startY + spacing * 2, code: "HL22-G03-B", displayName: "HL22-G03-B" },
        { id: "WB072", x: startX + spacing * 7, y: startY + spacing * 2, code: "HL21-H03-A", displayName: "HL21-H03-A" },
        { id: "WB012", x: startX + spacing * 8, y: startY + spacing * 2, code: "HL21-J03-A", displayName: "HL21-J03-A" },

        // Fourth row (WB033, -, WB173, WB093, WB153, WB133, -, WB073, WB013)
        { id: "WB033", x: startX, y: startY + spacing * 3, code: "HL21-A04-A", displayName: "HL21-A04-A" },
        { id: "WB173", x: startX + spacing * 2, y: startY + spacing * 3, code: "HL22-C04-B", displayName: "HL22-C04-B" },
        { id: "WB093", x: startX + spacing * 3, y: startY + spacing * 3, code: "HL21-D04-A", displayName: "HL21-D04-A" },
        { id: "WB153", x: startX + spacing * 4, y: startY + spacing * 3, code: "HL22-E04-B", displayName: "HL22-E04-B" },
        { id: "WB133", x: startX + spacing * 5, y: startY + spacing * 3, code: "HL22-F04-B", displayName: "HL22-F04-B" },
        { id: "WB013", x: startX + spacing * 8, y: startY + spacing * 3, code: "HL21-J04-A", displayName: "HL21-J04-A" },

        // Fifth row (WB034, -, -, WB094, -, WB134, -, -, WB014)
        { id: "WB034", x: startX, y: startY + spacing * 4, code: "HL21-A05-A", displayName: "HL21-A05-A" },
        { id: "WB094", x: startX + spacing * 3, y: startY + spacing * 4, code: "HL21-D05-A", displayName: "HL21-D05-A" },
        { id: "WB134", x: startX + spacing * 5, y: startY + spacing * 4, code: "HL22-F05-B", displayName: "HL22-F05-B" },
        { id: "WB014", x: startX + spacing * 8, y: startY + spacing * 4, code: "HL21-J05-A", displayName: "HL21-J05-A" },
      ]
      
      // Use turbines data to update displayName
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("FORMOSA")) {
      // Formosa wind farm layout - 5x5 grid, adjust spacing
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
      
      // Use turbines data to update turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("CHANGHUA")) {
      // Da Changhua wind farm layout - 6x5 grid, adjust spacing
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
      
      // Use turbines data to update turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else if (projectName.includes("YUNLIN")) {
      // Yunlin wind farm layout - 4x5 grid, adjust spacing
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
      
      // Use turbines data to update turbinePositions
      turbinePositions = turbinePositions.map(position => {
        const turbine = turbines.find(t => t.id === position.id)
        return {
          ...position,
          displayName: turbine?.displayName || position.code
        }
      })
    } else {
      // Default layout - use passed turbines data, adjust spacing
      const startX = 250
      const startY = 250
      const spacing = 180

      // Create a map to store each turbine's position
      const turbineMap = new Map<string, { id: string; x: number; y: number; code: string; displayName: string }>()

      // First process all turbines
      turbines.forEach((turbine) => {
        // Use turbine's actual position to determine its position on the canvas
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

      // Convert map to array
      turbinePositions = Array.from(turbineMap.values())
    }

    // Update turbine position state, for mouse events
    setAllTurbinePositions(turbinePositions)

    // Calculate maximum turbine Y position, for dynamic adjustment of Canvas height
    const maxTurbineY = Math.max(...turbinePositions.map(t => t.y)) + 100  // Add extra space
    
    // Set canvas size - adjust to fill screen, and dynamically adjust height based on turbine positions
    const minHeight = 900; // Minimum height
    canvas.width = 1920   // More standard width, still ensuring all content is visible
    canvas.height = Math.max(minHeight, maxTurbineY);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title box
    drawTitleBox(ctx, projectName, 120, 85)

    // Draw OSS - adjust its position to Canvas center
    const ossX = canvas.width / 2
    const ossY = 100
    drawOSS(ctx, ossX, ossY)

    // Draw export lines
    drawExportLines(ctx, ossX, ossY)

    // Draw connection lines - draw lines first, then draw turbines
    drawConnections(ctx, ossX, ossY, turbinePositions, tasks, currentDate)

    // Draw turbines
    turbinePositions.forEach((turbine) => {
      // Get task for this turbine
      const turbineTasks = tasks.filter((task) => task.turbineIds.includes(turbine.id))

      // Calculate task completion by name
      const taskCompletionByName = calculateTaskCompletionByName(turbineTasks, currentDate, taskNames)

      drawTurbine(ctx, turbine.x, turbine.y, turbine.id, turbine.displayName, taskCompletionByName, taskNames)
    })

    // Draw legend - adjust to right top corner of screen area
    const legendX = canvas.width - 270;  // Calculate position from right side of canvas
    const legendY = 30;                 // Position at top of the canvas
    drawLegend(ctx, legendX, legendY, taskNames)
    
    // If there's a hovered turbine, draw info box
    if (hoveredTurbine && hoveredPosition) {
      drawTurbineInfo(ctx, hoveredPosition.x, hoveredPosition.y, turbineTasksInfo, currentDate)
    }
  }, [projectName, turbines, tasks, currentDate, taskNames, hoveredTurbine, hoveredPosition, turbineTasksInfo, taskColorMap, dateRange])

  // Calculate task completion by name
  const calculateTaskCompletionByName = (turbineTasks: Task[], currentDate: Date, taskNames: string[]) => {
    const result: { [key: string]: boolean } = {}

    // Initialize all task names as not completed
    taskNames.forEach(name => {
      result[name] = false
    })

    // Check each task associated with each turbine
    turbineTasks.forEach((task) => {
      const taskEndDate = new Date(task.endDate)
      
      // Check task completion status, ignoring task start time
      // If there's a date range, check if task end date is within range and status is completed
      if (dateRange) {
        // Only mark as completed if task end date is within selected range and task status is completed
        if (taskEndDate <= dateRange.end && task.status === "completed") {
          result[task.name] = true
        }
      } else {
        // Use current date as reference
        if (taskEndDate <= currentDate && task.status === "completed") {
          result[task.name] = true
        }
      }
    })

    return result
  }

  // Draw turbine task info box
  const drawTurbineInfo = (ctx: CanvasRenderingContext2D, x: number, y: number, turbineTasks: Task[], currentDate: Date) => {
    // Sort tasks, by start date
    const sortedTasks = [...turbineTasks].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    
    // Calculate info box size
    const boxWidth = 210  // Narrower box width
    const lineHeight = 18  // Smaller line height
    const padding = 6     // Smaller inner padding
    const titleHeight = 24  // Title height
    const contentPadding = 10  // Space between line and content
    
    // Dynamic height calculation, based on actual task count, but max display 5
    const shownTasks = Math.min(sortedTasks.length, 5)
    const boxHeight = shownTasks === 0 ? 
      65 : // Height when no tasks
      titleHeight + contentPadding + (shownTasks * lineHeight) + (sortedTasks.length > 5 ? lineHeight : 0) + padding * 2
    
    // Adjust info box position
    let infoX = x - boxWidth / 2
    let infoY = y - boxHeight - 10  // Move info box above turbine
    
    // Ensure info box doesn't go out of canvas
    if (infoX < 10) infoX = 10
    if (infoX + boxWidth > ctx.canvas.width - 10) infoX = ctx.canvas.width - boxWidth - 10
    if (infoY < 10) infoY = 10
    if (infoY + boxHeight > ctx.canvas.height - 10) infoY = ctx.canvas.height - boxHeight - 10
    
    // Draw info box background
    ctx.fillStyle = "rgba(255, 255, 255, 0.97)"
    ctx.fillRect(infoX, infoY, boxWidth, boxHeight)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.strokeRect(infoX, infoY, boxWidth, boxHeight)
    
    // Draw title
    ctx.font = "bold 12px Arial"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.fillText("Task Information", infoX + boxWidth / 2, infoY + 16)
    
    // Draw separator line
    ctx.beginPath()
    ctx.moveTo(infoX, infoY + titleHeight)
    ctx.lineTo(infoX + boxWidth, infoY + titleHeight)
    ctx.strokeStyle = "#cccccc"
    ctx.stroke()
    
    // Calculate content start Y coordinate - below separator line, add extra space
    const contentStartY = infoY + titleHeight + contentPadding
    
    // Draw task list
    ctx.font = "11px Arial"
    ctx.textAlign = "left"
    
    // Calculate max display task count, avoid too many
    const maxTasksToShow = 5
    const tasksToShow = sortedTasks.length > maxTasksToShow ? 
      sortedTasks.slice(0, maxTasksToShow) : sortedTasks
    
    tasksToShow.forEach((task, index) => {
      // Use content start Y coordinate to calculate each task item position
      const taskY = contentStartY + index * lineHeight
      
      // Determine task status
      const taskEndDate = new Date(task.endDate)
      const isCompleted = taskEndDate <= currentDate && task.status === "completed"
      
      // Set color based on task status
      ctx.fillStyle = isCompleted ? 
        taskColorMap[task.name] || "#006400" :
        "#333333"
      
      // Draw task name
      const displayName = task.name.length > 12 ? task.name.substring(0, 10) + "..." : task.name
      ctx.fillText(`• ${displayName}`, infoX + padding, taskY)
      
      // Date format
      const endDate = new Date(task.endDate).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})
      ctx.textAlign = "right"
      ctx.fillText(`Completed: ${endDate}`, infoX + boxWidth - padding, taskY)
      ctx.textAlign = "left" // Reset alignment
    })
    
    // If there are more tasks not displayed, show omitted information
    if (sortedTasks.length > maxTasksToShow) {
      const moreY = contentStartY + maxTasksToShow * lineHeight
      ctx.fillStyle = "#222222"
      ctx.fillText(`...${sortedTasks.length - maxTasksToShow} more tasks`, infoX + padding, moreY)
    }
    
    // If no tasks, show prompt information
    if (sortedTasks.length === 0) {
      ctx.fillStyle = "#222222"
      ctx.textAlign = "center"
      ctx.fillText("This turbine has no tasks", infoX + boxWidth / 2, contentStartY + 6) // Adjust prompt position for no tasks
    }
  }

  // Draw OSS
  const drawOSS = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Draw OSS circle outer frame
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 2.5 // Thicker line
    ctx.stroke()

    // Find OSS related tasks
    const ossRelatedTasks = tasks.filter(task => task.type === "operation");
    const ossCompletedTasks = ossRelatedTasks.filter(task => {
      const taskEndDate = new Date(task.endDate);
      if (dateRange) {
        return taskEndDate <= dateRange.end && task.status === "completed";
      } else {
        return taskEndDate <= currentDate && task.status === "completed";
      }
    });

    // Draw OSS inner - divide into three parts
    const totalSegments = 3; // Fixed to three parts
    const segments = Array(totalSegments).fill(null).map((_, index) => {
      // Check if there's a completed OSS task corresponding
      const isCompleted = index < ossCompletedTasks.length;
      return {
        color: isCompleted ? "#4CAF50" : "#FFFFFF",  // Green represents completed, white represents not completed
        percentage: 100 / totalSegments
      };
    });

    drawPieChart(ctx, x, y, 30, segments)

    // Draw inner circle
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw OSS text
    ctx.font = "bold 14px Arial"
    ctx.fillStyle = "#0066cc"
    ctx.textAlign = "center"
    ctx.fillText("OSS", x, y + 5)
  }

  // Draw export lines
  const drawExportLines = (ctx: CanvasRenderingContext2D, ossX: number, ossY: number) => {
    // HL2A-EXPORT line
    ctx.beginPath()
    ctx.moveTo(ossX + 30, ossY - 10)
    ctx.lineTo(ossX + 500, ossY - 10)
    ctx.strokeStyle = "#cc0000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Text
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("HL2A-EXPORT", ossX + 50, ossY - 15)

    // HL2B-EXPORT line
    ctx.beginPath()
    ctx.moveTo(ossX + 30, ossY + 10)
    ctx.lineTo(ossX + 500, ossY + 10)
    ctx.strokeStyle = "#cc0000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Text
    ctx.fillText("HL2B-EXPORT", ossX + 50, ossY + 25)
  }

  // Draw connection lines
  const drawConnections = (
    ctx: CanvasRenderingContext2D,
    ossX: number,
    ossY: number,
    turbinePositions: { id: string; x: number; y: number; code: string; displayName: string }[],
    tasks: Task[],
    currentDate: Date,
  ) => {
    // Determine which turbines have completed cable laying tasks
    const completedCablesTurbines = new Set<string>()
    tasks.forEach((task) => {
      if (task.type === "cables" && task.status === "completed") {
        // If there's a date range, check if task end date is within range
        if (dateRange) {
          const taskEndDate = new Date(task.endDate)
          if (taskEndDate <= dateRange.end) {
            task.turbineIds.forEach((id) => completedCablesTurbines.add(id))
          }
        } else {
          // Use current date
          if (new Date(task.endDate) <= currentDate) {
            task.turbineIds.forEach((id) => completedCablesTurbines.add(id))
          }
        }
      }
    })

    // First row turbines
    const firstRowTurbines = turbinePositions.filter((t) => t.y === Math.min(...turbinePositions.map((tp) => tp.y)))
    // Sort first row by x position to get column index
    const sortedFirstRow = [...firstRowTurbines].sort((a, b) => a.x - b.x)

    // First draw connection lines from OSS to first row turbines
    firstRowTurbines.forEach((turbine) => {
      ctx.beginPath()
      ctx.moveTo(ossX, ossY + 30)
      ctx.lineTo(turbine.x, turbine.y - 25)

      // 找出這個風機在第一行中的列索引
      const columnIndex = sortedFirstRow.findIndex(t => t.x === turbine.x)
      
      // 特殊處理第0列和第3列，其他都改為藍色實線
      if (columnIndex === 0 || columnIndex === 3) {
        // 依照原來的邏輯處理這兩列
        const isCompleted = completedCablesTurbines.has(turbine.id)
        if (isCompleted) {
          ctx.strokeStyle = "#0066cc"
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = "#cc0000"
          ctx.setLineDash([5, 5])
        }
      } else {
        // 其他風機連接線都改為深藍色實線
        ctx.strokeStyle = "#0066cc"
        ctx.setLineDash([])
      }

      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw vertical connection lines by column
    // First, group turbines by x coordinate
    const turbinesByColumn: { [key: number]: { id: string; x: number; y: number; code: string; displayName: string }[] } = {}

    turbinePositions.forEach((turbine) => {
      if (!turbinesByColumn[turbine.x]) {
        turbinesByColumn[turbine.x] = []
      }
      turbinesByColumn[turbine.x].push(turbine)
    })

    // 對 x 坐標排序以獲取列索引
    const sortedXValues = [...new Set(turbinePositions.map(t => t.x))].sort((a, b) => a - b)

    // Sort each column's turbines by y coordinate
    Object.values(turbinesByColumn).forEach((column) => {
      column.sort((a, b) => a.y - b.y)

      // 找出這列的 x 坐標在排序後的位置，即為列索引
      const columnIndex = sortedXValues.indexOf(column[0].x)
      
      // 檢查這一列是否是特殊處理的列（第0列和第3列）
      const isSpecialColumn = columnIndex === 0 || columnIndex === 3;

      // Draw connection lines between adjacent turbines in each column
      for (let i = 0; i < column.length - 1; i++) {
        const upperTurbine = column[i]
        const lowerTurbine = column[i + 1]

        ctx.beginPath()
        ctx.moveTo(upperTurbine.x, upperTurbine.y + 35)
        ctx.lineTo(lowerTurbine.x, lowerTurbine.y - 35)

        const isCompleted = completedCablesTurbines.has(lowerTurbine.id) && completedCablesTurbines.has(upperTurbine.id)
        
        if (isSpecialColumn) {
          // 特殊列使用原來的邏輯
          if (isCompleted) {
            ctx.strokeStyle = "#0066cc"
            ctx.setLineDash([])
          } else {
            ctx.strokeStyle = "#cc0000"
            ctx.setLineDash([5, 5])
          }
        } else {
          // 其他列的連接線都改為深藍色實線
          ctx.strokeStyle = "#0066cc"
          ctx.setLineDash([])
        }

        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }

  // Draw turbine
  const drawTurbine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    id: string,
    displayName: string,
    taskCompletionByName: { [key: string]: boolean },
    taskNames: string[],
  ) => {
    // Get original code - find corresponding turbine to get code from displayName
    const turbine = turbines.find(t => t.id === id)
    const code = turbine?.code || displayName

    // Draw turbine circle outer frame - increase turbine circle size
    ctx.beginPath()
    ctx.arc(x, y, 35, 0, Math.PI * 2)
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 3.0 // Thicker line
    ctx.stroke()

    // Get turbines involved task names
    const turbineTaskNames = Object.keys(taskCompletionByName)

    // Use project all task names for splitting, regardless of whether turbine is associated
    let segments: { color: string; percentage: number }[] = []
    
    if (taskNames.length === 0) {
      // If project has no tasks, draw blank circle
      ctx.beginPath()
      ctx.arc(x, y, 35, 0, Math.PI * 2)
      ctx.fillStyle = "#FFFFFF"
      ctx.fill()
    } else {
      // Create segments for all project tasks, regardless of whether turbine is associated
      segments = taskNames.map((name) => {
        // Check if task is associated with this turbine
        const isTaskRelated = turbineTaskNames.includes(name);
        // Check if task is completed (within selected time range)
        const isCompleted = isTaskRelated && taskCompletionByName[name];
        
        return {
          // If task is completed and associated with this turbine, use task's corresponding color; otherwise white
          color: isCompleted ? (taskColorMap[name] || "#006400") : "#FFFFFF",
          percentage: 100 / taskNames.length,
        }
      })

      // Draw turbine status - average split based on project all task names
      drawPieChart(ctx, x, y, 35, segments)
    }

    // Add obvious segment lines - draw segment lines whenever there's a task
    if (segments.length > 0) {
      let startAngle = -Math.PI / 2 // Start from top

      segments.forEach((segment) => {
        const sliceAngle = (segment.percentage / 100) * (Math.PI * 2)
        const endAngle = startAngle + sliceAngle

        // Draw segment line from center to circumference
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(startAngle) * 35, y + Math.sin(startAngle) * 35)
        ctx.strokeStyle = "#333333"
        ctx.lineWidth = 1.5
        ctx.stroke()

        startAngle = endAngle
      })

      // Last line (back to start)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - 35) // Back to top
      ctx.strokeStyle = "#333333"
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Draw inner circle - increase inner circle size
    ctx.beginPath()
    ctx.arc(x, y, 26, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#0066cc"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw turbine code rather than ID - adjust position (outer circle displays displayName)
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(displayName, x, y - 45)

    // Split turbine code into two lines to display in inner circle - use original code rather than displayName
    const codeLines = code.split("-")
    ctx.font = "bold 11px Arial"
    ctx.fillStyle = "#0066cc"
    ctx.fillText(codeLines[0], x, y - 6) // First line
    ctx.fillText(codeLines[1] + (codeLines[2] ? "-" + codeLines[2] : ""), x, y + 10) // Second line
  }

  // Draw pie chart
  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    segments: { color: string; percentage: number }[],
  ) => {
    let startAngle = -Math.PI / 2 // Start from top

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

  // Draw legend
  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number, taskNames: string[]) => {
    // Draw legend background
    const legendWidth = 250;
    const itemHeight = 34;  // Slightly smaller item height for compactness
    const legendHeight = 35 + Math.ceil(taskNames.length / 2) * itemHeight;  // Dynamically adjust height based on task name count
    
    // Draw semi-transparent background with rounded corners
    const radius = 5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.beginPath();
    // Draw rounded rectangle manually for browser compatibility
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + legendWidth - radius, y);
    ctx.arcTo(x + legendWidth, y, x + legendWidth, y + radius, radius);
    ctx.lineTo(x + legendWidth, y + legendHeight - radius);
    ctx.arcTo(x + legendWidth, y + legendHeight, x + legendWidth - radius, y + legendHeight, radius);
    ctx.lineTo(x + radius, y + legendHeight);
    ctx.arcTo(x, y + legendHeight, x, y + legendHeight - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#aaaaaa"
    ctx.lineWidth = 1
    ctx.stroke();

    // Draw title
    ctx.font = "bold 15px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("Task Name Legend", x + 10, y + 22)

    // Draw legend items
    const boxSize = 16
    const startY = y + 35  // Reduced space between title and items
    const itemsPerCol = Math.ceil(taskNames.length / 2)

    taskNames.forEach((name, index) => {
      const col = Math.floor(index / itemsPerCol)
      const row = index % itemsPerCol

      const itemX = x + 10 + col * 120
      const itemY = startY + row * itemHeight

      // Draw color block, use corresponding task's color
      ctx.fillStyle = taskColorMap[name] || "#4CAF50"
      ctx.fillRect(itemX, itemY, boxSize, boxSize)
      ctx.strokeStyle = "#555"
      ctx.lineWidth = 1
      ctx.strokeRect(itemX, itemY, boxSize, boxSize)

      // Draw task name - use short name to avoid too long
      ctx.fillStyle = "#000"
      ctx.font = "13px Arial"
      
      // If name is too long, truncate display
      const displayText = name.length > 15 ? name.substring(0, 12) + "..." : name
      ctx.fillText(displayText, itemX + boxSize + 8, itemY + 12)
    })
  }

  return (
    <div className="relative w-full overflow-x-auto bg-white" style={{ minWidth: "100%", overflowX: "auto" }}>
      <div className="min-w-max">
        <canvas 
          ref={canvasRef} 
          width="1920" 
          height="900" 
          className="mx-0" 
          // Add mouse leave processing
          onMouseLeave={() => {
            setHoveredTurbine(null);
            setHoveredPosition(null);
            setTurbineTasksInfo([]);
          }}
        />
        {/* Optional: Display current hovered turbine ID, for debugging */}
        {hoveredTurbine && (
          <div className="hidden">{`Current hovered turbine: ${hoveredTurbine}`}</div>
        )}
      </div>
    </div>
  )
}
