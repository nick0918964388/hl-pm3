'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, AlertTriangle, BarChart3, Wrench, Search } from 'lucide-react';
import { fetchTurbines, fetchCables, fetchSubstations } from '@/lib/api';
import type { Turbine, Cable as CableType, Substation } from '@/lib/types';
import { TurbinePowerHistory } from '@/components/turbine-power-history';
import { TurbineAlertsTable } from '@/components/turbine-alerts-table';
import { TurbineMaintenanceTable } from '@/components/turbine-maintenance-table';
import { Input } from '@/components/ui/input';

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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  const listContainerRef = useRef<HTMLDivElement>(null);
  const turbineRowRefs = useRef<{[key: string]: HTMLTableRowElement}>({});
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [turbineData, cableData, substationData] = await Promise.all([
          fetchTurbines(DEFAULT_PROJECT_ID),
          fetchCables(DEFAULT_PROJECT_ID),
          fetchSubstations(DEFAULT_PROJECT_ID)
        ]);
        
        setTurbines(turbineData);
        setCables(cableData);
        setSubstations(substationData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const toggleExpand = (turbineId: string) => {
    if (expandedTurbine === turbineId) {
      setExpandedTurbine(null);
    } else {
      setExpandedTurbine(turbineId);
      setSelectedTurbine(turbineId);
      scrollToTurbine(turbineId);
    }
  };

  const handleMapTurbineClick = (turbineId: string) => {
    setSelectedTurbine(turbineId);
    setExpandedTurbine(turbineId);
    scrollToTurbine(turbineId);
  };
  
  const scrollToTurbine = (turbineId: string) => {
    setTimeout(() => {
      if (listContainerRef.current && turbineRowRefs.current[turbineId]) {
        const container = listContainerRef.current;
        const row = turbineRowRefs.current[turbineId];
        
        const rowTop = row.offsetTop;
        const rowHeight = row.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        
        if (rowTop < scrollTop || rowTop + rowHeight > scrollTop + containerHeight) {
          container.scrollTo({
            top: rowTop - containerHeight / 4,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  const processedTurbines = turbines.map(turbine => {
    return {
      id: turbine.id,
      code: turbine.code,
      name: turbine.displayName || turbine.code,
      lat: turbine.coordinates?.lat || (23.5 + Math.random() * 0.5),
      lng: turbine.coordinates?.lng || (121.2 + Math.random() * 0.5),
      status: turbine.status || 'normal',
      rpm: turbine.rpm || 0,
      power: turbine.power || 0,
      maintenanceTickets: turbine.maintenanceTickets || 0,
      groupId: turbine.groupId || 'HL2A',
    };
  });

  const filteredTurbines = searchKeyword.trim()
    ? processedTurbines.filter(turbine => 
        turbine.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        turbine.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        turbine.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        turbine.groupId?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        statusConfig[turbine.status].text.includes(searchKeyword.toLowerCase())
      )
    : processedTurbines;

  const groupedTurbines = filteredTurbines.reduce<Record<string, typeof processedTurbines>>((acc, turbine) => {
    const groupId = turbine.groupId || 'HL2A';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(turbine);
    return acc;
  }, {});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="flex flex-row h-full gap-4">
      <div className="w-1/3 min-w-[350px] h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 bg-white z-10 flex-shrink-0">
            <CardTitle>風機狀態列表</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-2 px-4 py-2 border-b bg-white">
            <div className="flex gap-4">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${config.color.replace('bg-', 'bg-').replace('text-', '')}`}></div>
                  <span className="text-xs">{config.text}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="輸入關鍵字搜尋..." 
                className="h-8 text-sm"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs" 
                  onClick={() => setSearchKeyword('')}
                >
                  清除
                </Button>
              )}
            </div>
          </div>
          <CardContent className="p-0 overflow-auto flex-grow" ref={listContainerRef}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">載入風機數據中...</p>
              </div>
            ) : filteredTurbines.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  {searchKeyword ? '無符合搜尋條件的風機' : '無風機數據'}
                </p>
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
                    {Object.keys(groupedTurbines).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          無符合搜尋條件的風機
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(groupedTurbines).map(([groupId, turbines]) => (
                        <React.Fragment key={groupId}>
                          <TableRow 
                            className="bg-slate-200 hover:bg-slate-300 cursor-pointer"
                            onClick={() => toggleGroupCollapse(groupId)}
                          >
                            <TableCell colSpan={6} className="font-bold py-2 px-4 flex items-center justify-between">
                              <span>{groupId} ({turbines.length})</span>
                              <ChevronDown 
                                size={16} 
                                className={`transform transition-transform ${collapsedGroups[groupId] ? 'rotate-180' : ''}`} 
                              />
                            </TableCell>
                          </TableRow>
                          
                          {!collapsedGroups[groupId] && (
                            <>
                              {turbines.map((turbine) => (
                                <React.Fragment key={turbine.id}> 
                                  <TableRow 
                                    className={`${selectedTurbine === turbine.id ? 'bg-slate-100' : ''} hover:bg-slate-50 cursor-pointer`}
                                    ref={el => {
                                      if (el) turbineRowRefs.current[turbine.id] = el;
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(turbine.id);
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
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpand(turbine.id);
                                        }}
                                      >
                                        {expandedTurbine === turbine.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  
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
                                          ) : null}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              ))}
                            </>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-grow">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>風場地圖</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-60px)]">
            {!loading && (
              <WindFarmMap
                turbines={filteredTurbines}
                cables={cables}
                substations={substations}
                onTurbineClick={handleMapTurbineClick}
                selectedTurbineId={selectedTurbine}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 