"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format, addDays, differenceInDays, parseISO } from "date-fns"

interface TimeRangeSliderProps {
  projectStartDate: string // ISO format date string
  projectEndDate: string // ISO format date string
  onChange?: (startDate: Date, endDate: Date) => void
}

export default function TimeRangeSlider({ projectStartDate, projectEndDate, onChange }: TimeRangeSliderProps) {
  const startDate = parseISO(projectStartDate)
  const endDate = parseISO(projectEndDate)
  const totalDays = differenceInDays(endDate, startDate) + 1

  // Default to first week
  const [selectedStartDate, setSelectedStartDate] = useState(startDate)
  const [selectedEndDate, setSelectedEndDate] = useState(addDays(startDate, Math.min(7, totalDays - 1)))

  const sliderRef = useRef<HTMLDivElement>(null)
  const isDraggingStart = useRef(false)
  const isDraggingEnd = useRef(false)

  // Calculate positions as percentages
  const getPositionPercent = (date: Date) => {
    const days = differenceInDays(date, startDate)
    return (days / totalDays) * 100
  }

  const startPosition = getPositionPercent(selectedStartDate)
  const endPosition = getPositionPercent(selectedEndDate)

  // Convert position to date
  const positionToDate = (position: number) => {
    const percent = Math.max(0, Math.min(100, position))
    const days = Math.round((percent / 100) * totalDays)
    return addDays(startDate, days)
  }

  // Handle mouse/touch events
  const handleMouseDown = (e: React.MouseEvent, isStart: boolean) => {
    e.preventDefault()
    if (isStart) {
      isDraggingStart.current = true
    } else {
      isDraggingEnd.current = true
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingStart.current && !isDraggingEnd.current) return
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const position = ((e.clientX - rect.left) / rect.width) * 100

    const newDate = positionToDate(position)

    if (isDraggingStart.current) {
      if (newDate < endDate && newDate >= startDate) {
        setSelectedStartDate(newDate)
      }
    } else if (isDraggingEnd.current) {
      if (newDate > selectedStartDate && newDate <= endDate) {
        setSelectedEndDate(newDate)
      }
    }
  }

  const handleMouseUp = () => {
    if (isDraggingStart.current || isDraggingEnd.current) {
      isDraggingStart.current = false
      isDraggingEnd.current = false
      onChange?.(selectedStartDate, selectedEndDate)
    }
  }

  // Set date range programmatically
  const setDateRange = (start: Date, end: Date) => {
    if (start >= startDate && end <= endDate && start <= end) {
      setSelectedStartDate(start)
      setSelectedEndDate(end)
      onChange?.(start, end)
    }
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", (e) => handleMouseMove(e.touches[0] as unknown as MouseEvent))
    window.addEventListener("touchend", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", (e) => handleMouseMove(e.touches[0] as unknown as MouseEvent))
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [selectedStartDate, selectedEndDate])

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{format(startDate, "yyyy/MM/dd")}</span>
        <span>{format(endDate, "yyyy/MM/dd")}</span>
      </div>

      <div className="relative pt-2 pb-2">
        {/* Timeline bar */}
        <div
          ref={sliderRef}
          className="absolute w-full h-2 bg-gray-200 rounded-full cursor-pointer top-1/2 -translate-y-1/2"
        >
          {/* Selected range */}
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{
              left: `${startPosition}%`,
              width: `${endPosition - startPosition}%`,
            }}
          />
        </div>

        {/* Start handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ left: `${startPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, true)}
          onTouchStart={(e) => handleMouseDown(e as unknown as React.MouseEvent, true)}
        >
          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
        </div>

        {/* End handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ left: `${endPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, false)}
          onTouchStart={(e) => handleMouseDown(e as unknown as React.MouseEvent, false)}
        >
          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Date display */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <div className="text-gray-500">Start Date</div>
          <div className="font-medium">{format(selectedStartDate, "yyyy/MM/dd")}</div>
        </div>

        <div className="h-8 w-px bg-gray-300"></div>

        <div className="text-sm text-right">
          <div className="text-gray-500">End Date</div>
          <div className="font-medium">{format(selectedEndDate, "yyyy/MM/dd")}</div>
        </div>
      </div>
    </div>
  )
}
