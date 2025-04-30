"use client"

import { useState, useEffect, useRef } from "react"
import { format, addWeeks, differenceInWeeks, addDays } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Play, Pause } from "lucide-react"

interface TimeSliderProps {
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  projectName?: string // 添加專案名稱屬性
}

export function TimeSlider({ startDate, endDate, currentDate, onDateChange, projectName }: TimeSliderProps) {
  const [value, setValue] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalWeeks, setTotalWeeks] = useState(0)
  const animationRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

  // 計算總週數 - 增加一週的緩衝
  useEffect(() => {
    // 增加一週的緩衝，讓用戶可以滑動到專案結束日期之後
    const extendedEndDate = addDays(endDate, 7)
    const weeks = Math.max(1, differenceInWeeks(extendedEndDate, startDate) + 1)
    setTotalWeeks(weeks)

    // 設置初始值
    const initialWeek = Math.min(differenceInWeeks(currentDate, startDate), weeks - 1)
    setValue(initialWeek)
  }, [startDate, endDate, currentDate])

  // 處理滑塊變化
  const handleSliderChange = (newValue: number[]) => {
    setValue(newValue[0])
    const newDate = addWeeks(startDate, newValue[0])
    onDateChange(newDate)
  }

  // 播放動畫
  const animate = (time: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = time
    }

    const deltaTime = time - lastUpdateTimeRef.current

    // 每500毫秒更新一次
    if (deltaTime > 500) {
      lastUpdateTimeRef.current = time

      setValue((prev) => {
        const newValue = prev + 1
        if (newValue >= totalWeeks) {
          setIsPlaying(false)
          return 0
        }

        const newDate = addWeeks(startDate, newValue)
        onDateChange(newDate)
        return newValue
      })
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }

  // 處理播放/暫停
  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = 0
      animationRef.current = requestAnimationFrame(animate)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  // 格式化當前日期
  const formattedDate = format(addWeeks(startDate, value), "yyyy年MM月dd日 'Week' w", { locale: zhTW })

  // 格式化週標籤
  const formatWeekLabel = (week: number) => {
    if (week === 0 || week === totalWeeks - 1 || week % Math.ceil(totalWeeks / 5) === 0) {
      return format(addWeeks(startDate, week), "MM/dd", { locale: zhTW })
    }
    return ""
  }

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">
            時間進度
            {projectName && <span className="ml-2 text-sm text-muted-foreground">({projectName})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "暫停" : "播放"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>
      </div>

      <div className="pt-6 pb-2">
        <Slider value={[value]} min={0} max={totalWeeks - 1} step={1} onValueChange={handleSliderChange} />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500">
        {Array.from({ length: totalWeeks }).map((_, i) => (
          <div key={i} className="flex-1 text-center">
            {formatWeekLabel(i)}
          </div>
        ))}
      </div>
    </div>
  )
}
