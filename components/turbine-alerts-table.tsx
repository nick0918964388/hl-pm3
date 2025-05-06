'use client'

import { useState, useEffect } from 'react'
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  PlusCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TurbineAlert } from '@/lib/types'
import { fetchTurbineAlerts } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface TurbineAlertsTableProps {
  turbineId: string
  turbineCode: string
}

export function TurbineAlertsTable({ turbineId, turbineCode }: TurbineAlertsTableProps) {
  const [alerts, setAlerts] = useState<TurbineAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      try {
        const data = await fetchTurbineAlerts(turbineId)
        setAlerts(data)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [turbineId])

  // 嚴重等級配置
  const severityConfig = {
    low: { 
      label: '低', 
      icon: <Info className="mr-1 h-4 w-4" />, 
      color: 'bg-blue-100 text-blue-800',
      badgeVariant: 'secondary' as const
    },
    medium: { 
      label: '中', 
      icon: <AlertCircle className="mr-1 h-4 w-4" />, 
      color: 'bg-yellow-100 text-yellow-800',
      badgeVariant: 'outline' as const
    },
    high: { 
      label: '高', 
      icon: <AlertTriangle className="mr-1 h-4 w-4" />, 
      color: 'bg-orange-100 text-orange-800',
      badgeVariant: 'destructive' as const
    },
    critical: { 
      label: '緊急', 
      icon: <AlertTriangle className="mr-1 h-4 w-4" />, 
      color: 'bg-red-100 text-red-800',
      badgeVariant: 'destructive' as const
    }
  }

  // 列定義
  const columns: ColumnDef<TurbineAlert>[] = [
    {
      accessorKey: 'timestamp',
      header: '時間',
      cell: ({ row }) => {
        const date = new Date(row.getValue('timestamp'))
        return <span>{format(date, 'yyyy-MM-dd HH:mm')}</span>
      },
      sortingFn: 'datetime'
    },
    {
      accessorKey: 'description',
      header: '事件描述',
      cell: ({ row }) => {
        const description: string = row.getValue('description')
        const status = row.original.isResolved
        return (
          <div className="flex items-center">
            {status && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
            <span className={status ? 'text-muted-foreground' : ''}>
              {description}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'severity',
      header: '嚴重等級',
      cell: ({ row }) => {
        const severity: keyof typeof severityConfig = row.getValue('severity')
        const config = severityConfig[severity]
        
        return (
          <Badge variant={config.badgeVariant} className="flex items-center">
            {config.icon}
            {config.label}
          </Badge>
        )
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const alert = row.original
        return (
          <div className="text-right">
            {!alert.isResolved && (
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                建立工單
              </Button>
            )}
            {alert.isResolved && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="mr-2 h-3 w-3" />
                已解決
              </Badge>
            )}
          </div>
        )
      }
    }
  ]

  const table = useReactTable({
    data: alerts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting
    }
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{turbineCode} 異常事件列表</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  載入中...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  目前無異常事件記錄
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一頁
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一頁
        </Button>
      </div>
    </div>
  )
} 