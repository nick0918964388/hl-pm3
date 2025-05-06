"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, AlertCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { TurbineForm } from "@/components/turbine-form"
import type { Project, Turbine } from "@/lib/types"
import { fetchTurbines, createTurbine, updateTurbine, deleteTurbine } from "@/lib/api"

interface TurbineManagementProps {
  project: Project
}

export function TurbineManagement({ project }: TurbineManagementProps) {
  const [turbines, setTurbines] = useState<Turbine[]>([])
  const [selectedTurbine, setSelectedTurbine] = useState<Turbine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadTurbines = async () => {
      try {
        setIsLoading(true)
        const turbinesData = await fetchTurbines(project.id)
        setTurbines(turbinesData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load turbines:", error)
        toast({
          title: "Error",
          description: "Unable to load turbine data, please try again later",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadTurbines()
  }, [project.id, toast])

  const handleAddTurbine = async (data: Turbine) => {
    try {
      const newTurbine = await createTurbine(project.id, data)
      setTurbines([...turbines, newTurbine])
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Turbine created successfully",
      })
    } catch (error) {
      console.error("Failed to create turbine:", error)
      toast({
        title: "Error",
        description: "Unable to create turbine, please try again later",
        variant: "destructive",
      })
    }
  }

  const handleEditTurbine = async (data: Turbine) => {
    if (!selectedTurbine) return

    try {
      const updatedTurbine = await updateTurbine(project.id, data)
      setTurbines(turbines.map((turbine) => (turbine.id === selectedTurbine.id ? updatedTurbine : turbine)))
      setIsEditDialogOpen(false)
      setSelectedTurbine(null)
      toast({
        title: "Success",
        description: "Turbine updated successfully",
      })
    } catch (error) {
      console.error("Failed to update turbine:", error)
      toast({
        title: "Error",
        description: "Unable to update turbine, please try again later",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTurbine = async (turbineId: string) => {
    try {
      await deleteTurbine(project.id, turbineId)
      setTurbines(turbines.filter((turbine) => turbine.id !== turbineId))
      toast({
        title: "Success",
        description: "Turbine deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete turbine:", error)
      toast({
        title: "Error",
        description: "Unable to delete turbine, please try again later",
        variant: "destructive",
      })
    }
  }

  const filteredTurbines = turbines.filter((turbine) => {
    const query = searchQuery.toLowerCase()
    return (
      turbine.id.toLowerCase().includes(query) ||
      turbine.code.toLowerCase().includes(query) ||
      turbine.name.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Turbine Management - {project.name}</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Turbine
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Turbine</DialogTitle>
              <DialogDescription>Fill out the form below to create a new turbine</DialogDescription>
            </DialogHeader>
            <TurbineForm
              projectId={project.id}
              onSubmit={handleAddTurbine}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search turbines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTurbines.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-muted-foreground">No Turbines</h3>
          <p className="text-muted-foreground mt-2">Click the "Add Turbine" button to create a turbine</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location (X, Y)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTurbines.map((turbine) => (
                <TableRow key={turbine.id}>
                  <TableCell className="font-medium">{turbine.id}</TableCell>
                  <TableCell>{turbine.code}</TableCell>
                  <TableCell>{turbine.name}</TableCell>
                  <TableCell>
                    ({turbine.location.x}, {turbine.location.y})
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={isEditDialogOpen && selectedTurbine?.id === turbine.id}
                        onOpenChange={(open) => {
                          setIsEditDialogOpen(open)
                          if (!open) setSelectedTurbine(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedTurbine(turbine)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Turbine</DialogTitle>
                            <DialogDescription>Update turbine details</DialogDescription>
                          </DialogHeader>
                          {selectedTurbine && (
                            <TurbineForm
                              turbine={selectedTurbine}
                              projectId={project.id}
                              onSubmit={handleEditTurbine}
                              onCancel={() => {
                                setIsEditDialogOpen(false)
                                setSelectedTurbine(null)
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Turbine</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this turbine? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTurbine(turbine.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
