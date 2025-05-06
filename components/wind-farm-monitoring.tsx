'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, AlertTriangle, BarChart3, ArrowUpDown, Wrench, Cable } from 'lucide-react';
import { fetchTurbines, fetchCables, fetchSubstations } from '@/lib/api';
import type { Turbine, Cable as CableType, Substation } from '@/lib/types';
import { TurbinePowerHistory } from '@/components/turbine-power-history';
import { TurbineAlertsTable } from '@/components/turbine-alerts-table';
import { TurbineMaintenanceTable } from '@/components/turbine-maintenance-table';

// 動態引入地圖組件以避免服務端渲染問題
const WindFarmMap = dynamic(() => import('@/components/wind-farm-map'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-slate-100 animate-pulse flex items-center justify-center">地圖載入中...</div>
});

// 狀態對應的文字和顏色
const statusConfig = {
  normal: { text: '正常運行', color: 'bg-green-100 text-green-800' },
  warning: { text: '警告', color: 'bg-yellow-100 text-yellow-800' },
  error: { text: '故障', color: 'bg-red-100 text-red-800' },
  maintenance: { text: '維護中', color: 'bg-blue-100 text-blue-800' },
};

// 預設選擇第一個風場
const DEFAULT_PROJECT_ID = "1";

export function WindFarmMonitoring() {
  const [turbines, setTurbines] = useState<Turbine[]>([]);
  const [cables, setCables] = useState<CableType[]>([]);
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTurbine, setExpandedTurbine] = useState<string | null>(null);
  const [selectedTurbine, setSelectedTurbine] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'power' | 'alerts' | 'maintenance'>('power');
  
  // 參考列表容器元素，用於滾動
  const listContainerRef = useRef<HTMLDivElement>(null);
  // 參考各個風機行，用於滾動到特定風機
  const turbineRowRefs = useRef<{[key: string]: HTMLTableRowElement}>({});
  
  // 獲取風機、電纜和變電站數據
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 並行加載所有數據以提高性能
        const [turbineData, cableData, substationData] = await Promise.all([
          fetchTurbines(DEFAULT_PROJECT_ID),
          fetchCables(DEFAULT_PROJECT_ID),
          fetchSubstations(DEFAULT_PROJECT_ID)
        ]);
        
        setTurbines(turbineData);
        setCables(cableData);
        setSubstations(substationData);
        
        // 添加調試輸出
        console.log('風機數據:', turbineData);
        console.log('電纜數據:', cableData);
        console.log('變電站數據:', substationData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 處理展開/收起詳細資訊
  const toggleExpand = (turbineId: string) => {
    if (expandedTurbine === turbineId) {
      setExpandedTurbine(null);
    } else {
      setExpandedTurbine(turbineId);
      setSelectedTurbine(turbineId);
      scrollToTurbine(turbineId);
    }
  };

  // 地圖點擊風機時
  const handleMapTurbineClick = (turbineId: string) => {
    setSelectedTurbine(turbineId);
    setExpandedTurbine(turbineId);
    // 滾動到選中的風機
    scrollToTurbine(turbineId);
  };
  
  // 滾動到指定風機
  const scrollToTurbine = (turbineId: string) => {
    // 使用setTimeout確保DOM已經更新
    setTimeout(() => {
      if (listContainerRef.current && turbineRowRefs.current[turbineId]) {
        const container = listContainerRef.current;
        const row = turbineRowRefs.current[turbineId];
        
        // 計算滾動位置
        const rowTop = row.offsetTop;
        const rowHeight = row.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        
        // 如果行不在可視範圍內，則滾動到使其可見
        if (rowTop < scrollTop || rowTop + rowHeight > scrollTop + containerHeight) {
          container.scrollTo({
            top: rowTop - containerHeight / 4, // 滾動到行前的位置，留出一些空間
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  // 將API返回的風機數據轉換為地圖所需格式
  const processedTurbines = turbines.map(turbine => {
    // 如果API返回的風機數據沒有狀態或座標信息，則使用默認值
    return {
      id: turbine.id,
      code: turbine.code,
      name: turbine.displayName || turbine.code,
      lat: turbine.coordinates?.lat || (23.5 + Math.random() * 0.5),
      lng: turbine.coordinates?.lng || (121.2 + Math.random() * 0.5),
      status: turbine.status || 'normal',
      rpm: turbine.rpm || 0,
      power: turbine.power || 0,
      maintenanceTickets: turbine.maintenanceTickets || 0
    };
  });

  return (
    <div className="flex flex-row h-full gap-4">
      {/* 風機列表 - 固定寬度 */}
      <div className="w-1/3 min-w-[350px] h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 bg-white z-10 flex-shrink-0">
            <CardTitle>風機狀態列表</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
            <div className="flex gap-4">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${config.color.replace('bg-', 'bg-').replace('text-', '')}`}></div>
                  <span className="text-xs">{config.text}</span>
                </div>
              ))}
            </div>
          </div>
          <CardContent className="p-0 overflow-auto flex-grow" ref={listContainerRef}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">載入風機數據中...</p>
              </div>
            ) : processedTurbines.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">無風機數據</p>
              </div>
            ) : (
              <div className="w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-1/4">風機編號</TableHead>
                      <TableHead className="w-1/5">狀態</TableHead>
                      <TableHead className="w-1/6">轉速</TableHead>
                      <TableHead className="w-1/6">發電量</TableHead>
                      <TableHead className="w-1/6">工單</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTurbines.map((turbine) => (
                      <React.Fragment key={turbine.id}> 
                        <TableRow 
                          className={selectedTurbine === turbine.id ? 'bg-slate-100' : ''}
                          ref={el => {
                            if (el) turbineRowRefs.current[turbine.id] = el;
                          }}
                        >
                          <TableCell className="font-medium">{turbine.code}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[turbine.status].color}`}>
                              {statusConfig[turbine.status].text}
                            </span>
                          </TableCell>
                          <TableCell>{turbine.rpm}</TableCell>
                          <TableCell>{turbine.power}</TableCell>
                          <TableCell>{turbine.maintenanceTickets}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(turbine.id)}>
                              {expandedTurbine === turbine.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* 展開的詳細資訊 */}
                        {expandedTurbine === turbine.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-slate-50 p-3">
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button 
                                    size="sm" 
                                    variant={expandedSection === 'power' ? 'default' : 'outline'} 
                                    className="flex items-center gap-2"
                                    onClick={() => setExpandedSection('power')}
                                  >
                                    <BarChart3 size={14} />
                                    歷史發電量
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={expandedSection === 'alerts' ? 'default' : 'outline'} 
                                    className="flex items-center gap-2"
                                    onClick={() => setExpandedSection('alerts')}
                                  >
                                    <AlertTriangle size={14} />
                                    異常事件
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={expandedSection === 'maintenance' ? 'default' : 'outline'} 
                                    className="flex items-center gap-2"
                                    onClick={() => setExpandedSection('maintenance')}
                                  >
                                    <Wrench size={14} />
                                    維護工單
                                  </Button>
                                </div>
                                
                                {expandedSection === 'power' ? (
                                  <TurbinePowerHistory 
                                    turbineId={turbine.id} 
                                    turbineCode={turbine.code} 
                                  />
                                ) : expandedSection === 'alerts' ? (
                                  <TurbineAlertsTable
                                    turbineId={turbine.id}
                                    turbineCode={turbine.code}
                                  />
                                ) : expandedSection === 'maintenance' ? (
                                  <TurbineMaintenanceTable
                                    turbineId={turbine.id}
                                    turbineCode={turbine.code}
                                  />
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <Card>
                                      <CardHeader className="py-1">
                                        <CardTitle className="text-sm">今日發電量</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-lg font-bold">{(turbine.power * 24).toFixed(1)} MWh</p>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader className="py-1">
                                        <CardTitle className="text-sm">運行效率</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-lg font-bold">
                                          {turbine.status === 'normal' ? '92%' : 
                                           turbine.status === 'warning' ? '78%' : '0%'}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 地圖顯示 - 佔據剩餘空間 */}
      <div className="w-2/3 flex-grow h-full">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>風場地圖</CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[calc(100%-60px)]">
            <div className="h-full">
              {loading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                  載入地圖中...
                </div>
              ) : (
                <WindFarmMap 
                  turbines={processedTurbines} 
                  selectedTurbineId={selectedTurbine}
                  onTurbineClick={handleMapTurbineClick}
                  cables={cables} 
                  substations={substations}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 