'use client'

import { useState, useEffect, Fragment } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  RowData,
  ExpandedState
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
  Wrench,
  Timer,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaintenanceTicket } from '@/lib/types'
import { fetchTurbineMaintenanceTickets } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { format, isValid } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'

// 擴展RowData接口以支持展開/折疊列
declare module '@tanstack/react-table' {
  interface RowData {
    getToggleExpandedHandler: () => void
  }
}

interface TurbineMaintenanceTableProps {
  turbineId: string
  turbineCode: string
}

export function TurbineMaintenanceTable({ turbineId, turbineCode }: TurbineMaintenanceTableProps) {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true)
      try {
        // 優先使用 turbineCode 獲取工單
        if (turbineCode) {
          const data = await fetchTurbineMaintenanceTickets(turbineCode, true)
          setTickets(data)
        } else {
          const data = await fetchTurbineMaintenanceTickets(turbineId)
          setTickets(data)
        }
      } catch (error) {
        console.error('Failed to fetch maintenance tickets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [turbineId, turbineCode])

  // 工單類型配置
  const typeConfig = {
    PM: {
      label: '預防性維護',
      icon: <ClipboardList className="mr-2 h-4 w-4" />,
      badgeVariant: 'secondary' as const
    },
    CM: {
      label: '修復性維護',
      icon: <Wrench className="mr-2 h-4 w-4" />,
      badgeVariant: 'outline' as const
    }
  }

  // 工單狀態配置
  const statusConfig = {
    WAPPR: {
      label: '等待中',
      color: 'bg-yellow-100 text-yellow-800',
      badgeVariant: 'outline' as const
    },
    INPRG: {
      label: '進行中',
      color: 'bg-blue-100 text-blue-800',
      badgeVariant: 'secondary' as const
    },
    COMP: {
      label: '已完成',
      color: 'bg-green-100 text-green-800',
      badgeVariant: 'default' as const
    },
    APPR: {
      label: '已批准',
      color: 'bg-green-100 text-green-800',
      badgeVariant: 'default' as const
    },
    REJECT: {
      label: '已拒絕',
      color: 'bg-red-100 text-red-800',
      badgeVariant: 'destructive' as const
    }
  }

  // 優先級配置
  const priorityConfig = {
    low: {
      label: '低',
      color: 'text-blue-600',
      badgeVariant: 'outline' as const
    },
    normal: {
      label: '一般',
      color: 'text-green-600',
      badgeVariant: 'outline' as const
    },
    high: {
      label: '高',
      color: 'text-orange-600',
      badgeVariant: 'outline' as const
    },
    urgent: {
      label: '緊急',
      color: 'text-red-600',
      badgeVariant: 'destructive' as const
    }
  }

  // 列定義
  const columns: ColumnDef<MaintenanceTicket>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            onClick={row.getToggleExpandedHandler()}
            className="p-0 h-8 w-8"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )
      }
    },
    {
      accessorKey: 'id',
      header: '工單編號',
      cell: ({ row }) => <span className="font-medium">{row.getValue('id')}</span>
    },
    {
      accessorKey: 'description',
      header: '工單描述',
      cell: ({ row }) => {
        const priority: keyof typeof priorityConfig = row.original.priority
        return (
          <div className="flex flex-col space-y-1">
            <span>{row.getValue('description')}</span>
            <Badge variant={priorityConfig[priority].badgeVariant} className={`w-fit ${priorityConfig[priority].color}`}>
              {`優先級: ${priorityConfig[priority].label}`}
            </Badge>
          </div>
        )
      }
    },
    {
      accessorKey: 'type',
      header: '工單類型',
      cell: ({ row }) => {
        const type: keyof typeof typeConfig = row.getValue('type')
        return (
          <Badge variant={typeConfig[type].badgeVariant} className="flex items-center">
            {typeConfig[type].icon}
            {typeConfig[type].label}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'scheduledDate',
      header: '預計時間',
      cell: ({ row }) => {
        try {
          const rawDate = row.getValue('scheduledDate');
          const date = rawDate ? new Date(rawDate) : null;
          const hours = row.original.estimatedHours;
          
          return (
            <div className="flex flex-col">
              <div className="flex items-center text-muted-foreground">
                <CalendarClock className="mr-1 h-4 w-4" />
                <span>
                  {date && isValid(date) 
                    ? format(date, 'yyyy-MM-dd') 
                    : '日期未設定'}
                </span>
              </div>
              <div className="flex items-center text-muted-foreground mt-1">
                <Timer className="mr-1 h-4 w-4" />
                <span>{hours || 0} 小時</span>
              </div>
            </div>
          );
        } catch (error) {
          console.error('Error formatting date:', error);
          return (
            <div className="flex flex-col">
              <div className="flex items-center text-muted-foreground">
                <CalendarClock className="mr-1 h-4 w-4" />
                <span>日期格式錯誤</span>
              </div>
              <div className="flex items-center text-muted-foreground mt-1">
                <Timer className="mr-1 h-4 w-4" />
                <span>{row.original.estimatedHours || 0} 小時</span>
              </div>
            </div>
          );
        }
      },
      sortingFn: 'datetime'
    },
    {
      accessorKey: 'status',
      header: '狀態',
      cell: ({ row }) => {
        const status: keyof typeof statusConfig = row.getValue('status')
        return (
          <Badge variant={statusConfig[status].badgeVariant}>
            {statusConfig[status].label}
          </Badge>
        )
      }
    }
  ]

  // 渲染展開的詳細資訊
  const renderExpandedRow = (ticket: MaintenanceTicket) => {
    // 安全地格式化日期
    const formatScheduledDate = () => {
      try {
        const date = ticket.scheduledDate ? new Date(ticket.scheduledDate) : null;
        return date && isValid(date) ? format(date, 'yyyy-MM-dd') : '日期未設定';
      } catch (error) {
        return '日期格式錯誤';
      }
    };

    return (
      <div className="p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">詳細資訊</h4>
            <Card>
              <CardContent className="p-4">
                <p>{ticket.details || '無詳細資訊'}</p>
                <p className="mt-2 text-sm text-muted-foreground">預計日期: {formatScheduledDate()}</p>
              </CardContent>
            </Card>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">人員分配</h4>
            <Card>
              <CardContent className="p-4">
                {ticket.assignedTo ? (
                  <p>{ticket.assignedTo}</p>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span>尚未分配人員</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">檢視詳情</Button>
          <Button variant="outline" size="sm">編輯工單</Button>
          {ticket.status !== 'COMP' && ticket.status !== 'REJECT' && (
            <Button size="sm">標記為完成</Button>
          )}
        </div>
      </div>
    )
  }

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    state: {
      sorting,
      expanded
    }
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{turbineCode} 維修工單列表</h3>
      
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
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        {renderExpandedRow(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  目前無維修工單記錄
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 個工單
        </div>
        <div className="space-x-2">
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
    </div>
  )
} 