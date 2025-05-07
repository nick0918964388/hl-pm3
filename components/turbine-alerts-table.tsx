'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  CheckCircle,
  Wrench,
  X,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TurbineAlert } from '@/lib/types'
import { fetchTurbineAlerts, createCMWorkOrder } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface TurbineAlertsTableProps {
  turbineId: string
  turbineCode: string
}

// 自定義工單創建彈窗
function WorkOrderModal({
  isOpen, 
  onClose, 
  alert, 
  turbineId, 
  turbineCode, 
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  alert: TurbineAlert | null;
  turbineId: string;
  turbineCode: string;
  onSuccess: (workOrderId: string, alertId: string) => void;
}) {
  const [workOrderDescription, setWorkOrderDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (alert) {
      setWorkOrderDescription(`處理異常：${alert.description}`);
    }
  }, [alert]);

  useEffect(() => {
    // 防止背景滾動
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 點擊遮罩層不關閉
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCreateWorkOrder = async () => {
    if (!alert || !workOrderDescription.trim()) return;
    
    setLoading(true);
    try {
      const response = await createCMWorkOrder({
        equipmentId: turbineCode || turbineId,
        description: workOrderDescription
      });
      
      toast({
        title: "工單建立成功",
        description: `工單號碼: ${response.id}`,
      });
      
      onSuccess(response.id, alert.id);
      onClose();
    } catch (error) {
      console.error('Failed to create work order:', error);
      toast({
        title: "工單建立失敗",
        description: "請稍後再試或聯絡系統管理員",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  // 使用 Portal 將彈窗渲染到 body 最後，確保它顯示在所有其他元素之上
  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000]"
      onClick={handleContainerClick}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 z-[10001]"
        style={{ position: 'relative' }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">建立工單</h2>
            <button 
              onClick={onClose} 
              className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">針對異常事件建立修復性維護工單 (CM)</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="equipment-id" className="text-right">設備編號</Label>
              <Input
                id="equipment-id"
                value={turbineCode || turbineId}
                className="col-span-3"
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="event-type" className="text-right">異常類型</Label>
              <Input
                id="event-type"
                value={alert?.description || ''}
                className="col-span-3"
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="description" className="text-right align-top pt-2">工單描述</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="請輸入工單描述和處理方案..."
                className="col-span-3"
                value={workOrderDescription}
                onChange={(e) => setWorkOrderDescription(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={handleCreateWorkOrder} 
              disabled={loading || !workOrderDescription.trim()}
            >
              {loading ? '處理中...' : '建立工單'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function TurbineAlertsTable({ turbineId, turbineCode }: TurbineAlertsTableProps) {
  const [alerts, setAlerts] = useState<TurbineAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<TurbineAlert | null>(null)
  const [processedAlerts, setProcessedAlerts] = useState<Record<string, string>>({}) // 記錄已處理的事件及其工單ID
  const { toast } = useToast()

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      try {
        // 優先使用 turbineCode 獲取異常事件
        if (turbineCode) {
          const data = await fetchTurbineAlerts(turbineCode, true)
          setAlerts(data)
        } else {
          const data = await fetchTurbineAlerts(turbineId)
          setAlerts(data)
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
    
    // 從本地儲存讀取已處理的事件記錄
    const savedProcessedAlerts = localStorage.getItem(`processed-alerts-${turbineCode || turbineId}`)
    if (savedProcessedAlerts) {
      try {
        setProcessedAlerts(JSON.parse(savedProcessedAlerts))
      } catch (e) {
        console.error('Failed to parse saved processed alerts', e)
      }
    }
  }, [turbineId, turbineCode])

  const openWorkOrderModal = useCallback((alert: TurbineAlert) => {
    setSelectedAlert(alert);
    setIsWorkOrderOpen(true);
  }, []);

  const handleWorkOrderSuccess = useCallback((workOrderId: string, alertId: string) => {
    // 更新已處理的事件記錄
    setProcessedAlerts(prev => {
      const updated = { ...prev, [alertId]: workOrderId }
      
      // 保存到本地儲存
      localStorage.setItem(`processed-alerts-${turbineCode || turbineId}`, JSON.stringify(updated))
      
      return updated
    })
    
    toast({
      title: "工單已建立",
      description: `工單編號: ${workOrderId} 已成功建立`,
    });
  }, [toast, turbineCode, turbineId]);

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
      header: '操作',
      cell: ({ row }) => {
        const alert = row.original
        const hasWorkOrder = alert.id in processedAlerts
        
        return (
          <div className="text-right">
            {!alert.isResolved && !hasWorkOrder && (
              <button 
                className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none"
                style={{ zIndex: 20, position: 'relative' }}
                title="建立工單"
                onClick={(e) => {
                  // 阻止事件冒泡
                  e.stopPropagation();
                  e.preventDefault();
                  // 打開工單彈窗
                  openWorkOrderModal(alert);
                }}
              >
                <Wrench className="h-4 w-4 text-gray-500" />
              </button>
            )}
            {hasWorkOrder && (
              <div className="flex items-center justify-end gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center">
                  <FileCheck className="mr-1 h-3 w-3" />
                  <span>工單: {processedAlerts[alert.id]}</span>
                </Badge>
              </div>
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
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

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 個事件
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {table.getState().pagination.pageIndex + 1} 頁，共 {table.getPageCount()} 頁
          </span>
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

      {/* 使用自定義彈窗替代 Dialog 組件 */}
      <WorkOrderModal
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
        alert={selectedAlert}
        turbineId={turbineId}
        turbineCode={turbineCode}
        onSuccess={handleWorkOrderSuccess}
      />
    </div>
  )
} 