# 專案快照

## 專案目錄結構

```
hl-pm3
├── app/
│   ├── api/
│   │   └── maximo/
│   │       └── [endpoint]/
│   │           └── route.ts
│   ├── monitoring/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── projects/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── settings/
│   │   ├── task-types/
│   │   └── page.tsx
│   ├── turbines/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── date-range-picker.tsx
│   ├── navbar.tsx
│   ├── project-form.tsx
│   ├── project-management.tsx
│   ├── project-selector.tsx
│   ├── project-tabs.tsx
│   ├── status-legend.tsx
│   ├── task-form.tsx
│   ├── task-management.tsx
│   ├── task-type-settings.tsx
│   ├── time-range-slider.tsx
│   ├── time-slider.tsx
│   ├── turbine-form.tsx
│   ├── turbine-management.tsx
│   ├── wind-farm-dashboard.tsx
│   ├── wind-farm-map.tsx
│   ├── wind-farm-monitoring.tsx
│   └── wind-farm-visualization.tsx
├── hooks/
│   └── use-toast.ts
├── lib/
│   ├── api.ts
│   ├── types.ts
│   └── utils.ts
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── snapshot.js
└── tsconfig.json
```

## 函式清單

### app\api\maximo\[endpoint]\route.ts

- `POST(
  request: NextRequest,
  { params }: { params: { endpoint: string } }
)` - hl.webtw.xyz/maximo/oslc/script';

### components\date-range-picker.tsx

- `DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps)`

### components\navbar.tsx

- `Navbar()`

### components\project-form.tsx

- `ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps)` - Modify onSubmit handler to prevent form resubmission

### components\project-management.tsx

- `ProjectManagement()`

### components\project-selector.tsx

- `ProjectSelector({ projects, selectedProject, onProjectChange }: ProjectSelectorProps)`

### components\project-tabs.tsx

- `ProjectTabs()`

### components\status-legend.tsx

- `StatusLegend()`

### components\task-form.tsx

- `TaskForm({ projectId, task, turbines, onSubmit, onCancel }: TaskFormProps)`

### components\task-management.tsx

- `TaskManagement({ project }: TaskManagementProps)`

### components\task-type-settings.tsx

- `TaskTypeSettings({ onClose }: TaskTypeSettingsProps)`

### components\time-slider.tsx

- `TimeSlider({ startDate, endDate, currentDate, onDateChange, projectName, onRangeChange }: TimeSliderProps)`

### components\turbine-form.tsx

- `TurbineForm({ projectId, turbine, onSubmit, onCancel }: TurbineFormProps)`

### components\turbine-management.tsx

- `TurbineManagement({ project }: TurbineManagementProps)`

### components\ui\toaster.tsx

- `Toaster()`

### components\wind-farm-dashboard.tsx

- `WindFarmDashboard()`

### components\wind-farm-monitoring.tsx

- `WindFarmMonitoring()`

### components\wind-farm-visualization.tsx

- `WindFarmVisualization({ projectName, turbines, tasks, currentDate, dateRange }: WindFarmVisualizationProps)`

### hooks\use-toast.ts

- `reducer()`

### lib\api.ts

- `fetchProjects()` - API Functions - Project Management
- `fetchProject(projectId: string)` - Add function to fetch a single project
- `fetchTurbines(projectId: string)` - API Functions - Turbine Management
- `fetchTasks(projectId: string)` - API Functions - Task Management
- `fetchTaskTypes()` - 獲取任務類型
- `createTaskType(taskType: TaskType)` - 新增任務類型
- `updateTaskType(taskType: TaskType)` - 更新任務類型 - 使用新增API替代
- `deleteTaskType(taskTypeValue: string)` - 刪除任務類型
- `fetchCables(projectId: string)` - 獲取風場電纜數據
- `fetchSubstations(projectId: string)` - 獲取風場變電站數據
- `createProject(project: Project)`
- `updateProject(project: Project)`
- `deleteProject(projectId: string)`
- `createTurbine(projectId: string, turbine: Turbine)`
- `updateTurbine(projectId: string, turbine: Turbine)`
- `deleteTurbine(projectId: string, turbineId: string)`
- `createTask(task: Task)`
- `updateTask(task: Task)`
- `deleteTask(taskId: string)`

### lib\utils.ts

- `cn(...inputs: ClassValue[])`
- `calculateTaskCompletionRate(tasks: Task[])`

## 依賴清單

### hl-pm3

#### dependencies

```json
{
  "@hookform/resolvers": "^5.0.1",
  "@radix-ui/react-alert-dialog": "^1.1.11",
  "@radix-ui/react-checkbox": "^1.2.3",
  "@radix-ui/react-dialog": "^1.1.11",
  "@radix-ui/react-dropdown-menu": "^2.1.12",
  "@radix-ui/react-label": "^2.1.4",
  "@radix-ui/react-popover": "^1.1.11",
  "@radix-ui/react-select": "^2.2.2",
  "@radix-ui/react-slider": "^1.3.2",
  "@radix-ui/react-slot": "^1.2.0",
  "@radix-ui/react-switch": "^1.2.2",
  "@radix-ui/react-tabs": "^1.1.9",
  "@radix-ui/react-toast": "^1.2.11",
  "@types/leaflet": "^1.9.17",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.503.0",
  "mapbox-gl": "^3.11.1",
  "next": "15.3.1",
  "react": "^19.0.0",
  "react-day-picker": "^8.10.1",
  "react-dom": "^19.0.0",
  "react-hook-form": "^7.56.1",
  "react-leaflet": "^5.0.0",
  "react-map-gl": "^8.0.4",
  "tailwind-merge": "^3.2.0",
  "zod": "^3.24.3"
}
```

#### devDependencies

```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.3.1",
  "tailwindcss": "^4",
  "tw-animate-css": "^1.2.8",
  "typescript": "^5"
}
```

---
生成時間: 2025/5/6 上午8:58:39
