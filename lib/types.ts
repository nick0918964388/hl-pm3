export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: "pending" | "in-progress" | "completed"
  type: "foundation" | "piles" | "jacket" | "wtg" | "cables" | "operation"
  turbineIds: string[]
}

export interface Turbine {
  id: string
  code: string // For example HL21-A01-A
  name: string
  displayName?: string
  location: {
    x: number
    y: number
  }
  coordinates?: {
    lat: number
    lng: number
  }
  status: 'normal' | 'warning' | 'error' | 'maintenance'
  rpm?: number
  power?: number
  maintenanceTickets?: number
}

export interface TaskType {
  value: string
  label: string
  description?: string
}

export interface Cable {
  id: string
  sourceId: string  // 起點ID (風機或變電站)
  targetId: string  // 終點ID (風機或變電站)
  sourceType: 'turbine' | 'substation'  // 起點類型
  targetType: 'turbine' | 'substation'  // 終點類型
  status: 'normal' | 'warning' | 'error'  // 電纜狀態
  powerFlow: number  // 電力流量 (MW)
}

export interface Substation {
  id: string
  name: string
  coordinates: {
    lat: number
    lng: number
  }
  capacity: number  // 變電站容量 (MW)
  currentLoad: number  // 當前負載 (MW)
  status: 'normal' | 'warning' | 'error' | 'maintenance'  // 變電站狀態
}

export interface TurbineAlert {
  id: string;
  turbineId: string;
  timestamp: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolvedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  turbineId: string;
  description: string;
  type: 'PM' | 'CM'; // PM: 預防性維護, CM: 修復性維護
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  estimatedHours: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  details?: string;
}
