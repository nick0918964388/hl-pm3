"use client"

import type { Project } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"

interface ProjectSelectorProps {
  projects: Project[]
  selectedProject: string | null
  onProjectChange: (projectId: string) => void
}

export function ProjectSelector({ projects, selectedProject, onProjectChange }: ProjectSelectorProps) {
  // 如果 selectedProject 是 null 且有可用項目，使用第一個項目的 ID
  const effectiveValue = selectedProject || (projects.length > 0 ? projects[0].id : "")
  
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={effectiveValue} 
        onValueChange={onProjectChange}
        disabled={projects.length === 0}
      >
        <SelectTrigger className="w-[200px] h-9 bg-white">
          <SelectValue placeholder="選擇專案" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
