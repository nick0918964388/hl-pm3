"use client"

import { useState, useEffect, useRef } from "react"
import { format, addDays, differenceInDays, parseISO } from "date-fns"
import { enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
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
  // Use ref to store project info, reducing re-renders
  const projectInfoRef = useRef({
    totalDays: Math.max(1, differenceInDays(endDate, startDate) + 1),
    startDate,
    endDate
  });
  
  // Selected date range
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startDate,
    end: addDays(startDate, Math.min(7, projectInfoRef.current.totalDays - 1))
  });
  
  // Current index using ref to avoid too many updates
  const currentIndexRef = useRef(differenceInDays(currentDate, startDate));
  
  // Animation control
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Format current date display
  const getCurrentFormattedDate = () => {
    const date = addDays(startDate, currentIndexRef.current);
    return format(date, "yyyy/MM/dd", { locale: enUS });
  };
  
  // Update external date
  const updateExternalDate = () => {
    const date = addDays(startDate, currentIndexRef.current);
    onDateChange(date);
  };
  
  // Initialization
  useEffect(() => {
    // Update project info
    projectInfoRef.current = {
      totalDays: Math.max(1, differenceInDays(endDate, startDate) + 1),
      startDate,
      endDate
    };
    
    // Set initial date range
    const initialStart = startDate;
    const initialEnd = addDays(startDate, Math.min(7, projectInfoRef.current.totalDays - 1));
    
    setDateRange({
      start: initialStart,
      end: initialEnd
    });
    
    // Set current index
    currentIndexRef.current = Math.min(
      Math.max(0, differenceInDays(currentDate, startDate)),
      projectInfoRef.current.totalDays - 1
    );
    
    // Notify external
    updateExternalDate();
    
    // Notify parent component of initial range
    if (onRangeChange) {
      onRangeChange(initialStart, initialEnd);
    }
    
    // Clean up any possible animations
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startDate, endDate, currentDate]);
  
  // Play animation
  const animate = (time: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = time;
    }

    const deltaTime = time - lastUpdateTimeRef.current;

    // Update every 300ms
    if (deltaTime > 300) {
      lastUpdateTimeRef.current = time;
      
      // Calculate range indices
      const startIndex = differenceInDays(dateRange.start, startDate);
      const endIndex = differenceInDays(dateRange.end, startDate);
      
      // Update current index
      currentIndexRef.current += 1;
      
      // If beyond range, return to start
      if (currentIndexRef.current > endIndex) {
        currentIndexRef.current = startIndex;
      }
      
      // Notify external
      updateExternalDate();
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };
  
  // Control animation play/pause
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
  
  // Handle range change
  const handleRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
    
    // Ensure current index is within range
    const startIndex = differenceInDays(start, startDate);
    const endIndex = differenceInDays(end, startDate);
    
    if (currentIndexRef.current < startIndex || currentIndexRef.current > endIndex) {
      currentIndexRef.current = startIndex;
      updateExternalDate();
    }
    
    // Notify parent component of date range change
    if (onRangeChange) {
      onRangeChange(start, end);
    }
  };
  
  // Get current date display
  const [formattedDate, setFormattedDate] = useState(getCurrentFormattedDate());
  
  // Update displayed date
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
            Time Progress
            {projectName && <span className="ml-2 text-sm text-muted-foreground">({projectName})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>
      </div>
      
      <div className="relative">
        {/* Use new TimeRangeSlider component */}
        <TimeRangeSlider
          projectStartDate={startDate.toISOString()}
          projectEndDate={endDate.toISOString()}
          onChange={handleRangeChange}
        />
        
        {/* Current position indicator removed */}
      </div>
      
      {/* Display project total days */}
      <div className="mt-4 text-xs text-right text-gray-500">
        Total Project Days: {projectInfoRef.current.totalDays} days
      </div>
    </div>
  )
}
