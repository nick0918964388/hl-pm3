"use client"

import { useState, useEffect, useRef } from "react"
import { format, addDays, differenceInDays, parseISO } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Play, Pause, Calendar } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import TimeRangeSlider from "@/components/time-range-slider"

interface TimeSliderProps {
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  projectName?: string
  onRangeChange?: (start: Date, end: Date) => void
}

export function TimeSlider({ startDate, endDate, currentDate, onDateChange, projectName, onRangeChange }: TimeSliderProps) {
  // 使用 ref 來存儲專案信息，減少重新渲染
  const projectInfoRef = useRef({
    totalDays: Math.max(1, differenceInDays(endDate, startDate) + 1),
    startDate,
    endDate
  });
  
  // 選擇的日期範圍
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startDate,
    end: addDays(startDate, Math.min(7, projectInfoRef.current.totalDays - 1))
  });
  
  // 當前索引使用 ref 避免過多的更新
  const currentIndexRef = useRef(differenceInDays(currentDate, startDate));
  
  // 動畫控制
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // 格式化當前日期的顯示
  const getCurrentFormattedDate = () => {
    const date = addDays(startDate, currentIndexRef.current);
    return format(date, "yyyy年MM月dd日", { locale: zhTW });
  };
  
  // 更新外部的日期
  const updateExternalDate = () => {
    const date = addDays(startDate, currentIndexRef.current);
    onDateChange(date);
  };
  
  // 初始化
  useEffect(() => {
    // 更新項目信息
    projectInfoRef.current = {
      totalDays: Math.max(1, differenceInDays(endDate, startDate) + 1),
      startDate,
      endDate
    };
    
    // 設置初始日期範圍
    const initialStart = startDate;
    const initialEnd = addDays(startDate, Math.min(7, projectInfoRef.current.totalDays - 1));
    
    setDateRange({
      start: initialStart,
      end: initialEnd
    });
    
    // 設置當前索引
    currentIndexRef.current = Math.min(
      Math.max(0, differenceInDays(currentDate, startDate)),
      projectInfoRef.current.totalDays - 1
    );
    
    // 通知外部
    updateExternalDate();
    
    // 通知父組件初始範圍
    if (onRangeChange) {
      onRangeChange(initialStart, initialEnd);
    }
    
    // 清理任何可能的動畫
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startDate, endDate, currentDate]);
  
  // 播放動畫
  const animate = (time: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = time;
    }

    const deltaTime = time - lastUpdateTimeRef.current;

    // 每300毫秒更新一次
    if (deltaTime > 300) {
      lastUpdateTimeRef.current = time;
      
      // 計算範圍的索引
      const startIndex = differenceInDays(dateRange.start, startDate);
      const endIndex = differenceInDays(dateRange.end, startDate);
      
      // 更新當前索引
      currentIndexRef.current += 1;
      
      // 如果超出範圍，返回開始
      if (currentIndexRef.current > endIndex) {
        currentIndexRef.current = startIndex;
      }
      
      // 通知外部
      updateExternalDate();
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };
  
  // 控制動畫播放/暫停
  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  // 處理範圍變更
  const handleRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
    
    // 確保當前索引在範圍內
    const startIndex = differenceInDays(start, startDate);
    const endIndex = differenceInDays(end, startDate);
    
    if (currentIndexRef.current < startIndex || currentIndexRef.current > endIndex) {
      currentIndexRef.current = startIndex;
      updateExternalDate();
    }
    
    // 通知父組件日期範圍已變更
    if (onRangeChange) {
      onRangeChange(start, end);
    }
  };
  
  // 處理日期選擇器變更
  const handleDatePickerChange = (range: DateRange | null) => {
    if (range?.from) {
      const newStart = range.from;
      const newEnd = range.to || addDays(range.from, 7);
      handleRangeChange(newStart, newEnd);
    }
  };
  
  // 取得當前日期顯示
  const [formattedDate, setFormattedDate] = useState(getCurrentFormattedDate());
  
  // 更新顯示的日期
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFormattedDate(getCurrentFormattedDate());
    }, 300);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">
            時間進度
            {projectName && <span className="ml-2 text-sm text-muted-foreground">({projectName})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {/* 日期範圍選擇器 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                設定日期範圍
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-4">
                <DateRangePicker 
                  dateRange={{
                    from: dateRange.start,
                    to: dateRange.end
                  }}
                  onDateRangeChange={handleDatePickerChange}
                />
              </div>
            </PopoverContent>
          </Popover>
          
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
      
      <div className="relative">
        {/* 使用新的 TimeRangeSlider 元件 */}
        <TimeRangeSlider
          projectStartDate={startDate.toISOString()}
          projectEndDate={endDate.toISOString()}
          onChange={handleRangeChange}
        />
        
        {/* 已移除當前位置指標 */}
      </div>
      
      {/* 顯示專案總天數 */}
      <div className="mt-4 text-xs text-right text-gray-500">
        專案總天數: {projectInfoRef.current.totalDays} 天
      </div>
    </div>
  )
}
