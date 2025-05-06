'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchTurbineHistoricalPower } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface TurbinePowerHistoryProps {
  turbineId: string;
  turbineCode: string;
}

export function TurbinePowerHistory({ turbineId, turbineCode }: TurbinePowerHistoryProps) {
  const [powerData, setPowerData] = useState<{date: string, power: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPowerData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTurbineHistoricalPower(turbineId, period);
        setPowerData(data);
      } catch (err) {
        console.error('Failed to fetch power data:', err);
        setError('無法載入發電量數據，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    loadPowerData();
  }, [turbineId, period]);

  // 格式化日期顯示
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    
    if (period === '24h') {
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // 計算總發電量
  const calculateTotalPower = () => {
    if (powerData.length === 0) return 0;
    const total = powerData.reduce((sum, item) => sum + item.power, 0);
    return total.toFixed(1);
  };

  // 設置時間周期
  const handlePeriodChange = (newPeriod: '24h' | '7d' | '30d' | '90d') => {
    setPeriod(newPeriod);
  };

  // 獲取周期名稱
  const getPeriodName = () => {
    switch (period) {
      case '24h': return '24小時';
      case '7d': return '7天';
      case '30d': return '30天';
      case '90d': return '90天';
      default: return '7天';
    }
  };

  // 自定義工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{formatDateForDisplay(label)}</p>
          <p className="text-green-600">發電量: {payload[0].value} MWh</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {turbineCode} 歷史發電量 - {getPeriodName()}
          </CardTitle>
          <div className="flex gap-1 items-center">
            <Button 
              variant={period === '24h' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handlePeriodChange('24h')}
              className="h-8"
            >
              24小時
            </Button>
            <Button 
              variant={period === '7d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handlePeriodChange('7d')}
              className="h-8"
            >
              7天
            </Button>
            <Button 
              variant={period === '30d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handlePeriodChange('30d')}
              className="h-8"
            >
              30天
            </Button>
            <Button 
              variant={period === '90d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handlePeriodChange('90d')}
              className="h-8"
            >
              90天
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded">
            <p className="text-muted-foreground">載入中...</p>
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={powerData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDateForDisplay}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    name="發電量"
                    unit=" MWh"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="power"
                    name="發電量 (MWh)"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                總發電量: <span className="text-green-600 font-bold">{calculateTotalPower()} MWh</span>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7">
                  <ArrowLeft size={14} className="mr-1" /> 上一期
                </Button>
                <Button variant="outline" size="sm" className="h-7">
                  下一期 <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 