'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Cable, Substation } from '@/lib/types';

// 確保leaflet標記圖標正確顯示
const fixLeafletIcons = () => {
  // 因為Next.js特殊的資源載入方式，需要手動修正Leaflet圖標路徑
  // @ts-ignore - Ignore TypeScript error for _getIconUrl property
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// 風機類型
interface Turbine {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'normal' | 'warning' | 'error' | 'maintenance';
  rpm: number;
  power: number;
  maintenanceTickets: number;
  code?: string;
}

// 組件屬性
interface WindFarmMapProps {
  turbines: Turbine[];
  selectedTurbineId: string | null;
  onTurbineClick: (turbineId: string) => void;
  cables: Cable[];
  substations: Substation[];
}

// 狀態對應的標記顏色
const statusColors = {
  normal: '#22c55e',      // 綠色
  warning: '#f59e0b',     // 黃色
  error: '#ef4444',       // 紅色
  maintenance: '#3b82f6', // 藍色
};

// 創建自定義標記圖標
const createTurbineIcon = (status: 'normal' | 'warning' | 'error' | 'maintenance', isSelected: boolean) => {
  const color = statusColors[status];
  const size = isSelected ? 40 : 34;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        border: ${borderWidth}px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.1);' : ''}
        position: relative;
        overflow: hidden;
      ">
        <div style="
          font-size: ${size * 0.65}px;
          color: ${color};
          transform: rotate(${Math.random() * 360}deg);
          animation: spin 15s linear infinite;
        ">🌀</div>
        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// 創建變電站圖標
const createSubstationIcon = (status: 'normal' | 'warning' | 'error' | 'maintenance', isSelected: boolean) => {
  const color = statusColors[status];
  const size = isSelected ? 46 : 40;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: rgba(255, 255, 255, 0.9);
        border: ${borderWidth}px solid ${color};
        border-radius: 16%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        <div style="
          font-size: ${size * 0.5}px;
          color: ${color};
          font-weight: bold;
        ">🏭</div>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// 獲取狀態文字
const getStatusText = (status: 'normal' | 'warning' | 'error' | 'maintenance') => {
  const statusMap = {
    normal: '正常運行',
    warning: '警告',
    error: '故障',
    maintenance: '維護中'
  };
  return statusMap[status];
};

// 風機地圖組件
const WindFarmMap = ({ turbines, selectedTurbineId, onTurbineClick, cables, substations }: WindFarmMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  const cablesLayerRef = useRef<L.LayerGroup | null>(null);
  
  // 初始化地圖
  useEffect(() => {
    // 修正Leaflet圖標路徑
    fixLeafletIcons();
    
    // 如果地圖尚未初始化且DOM元素已就緒
    if (!mapRef.current && mapContainerRef.current) {
      // 創建地圖
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120
      }).setView([23.9, 130.35], 6); // 調整中心點到台灣與風機之間，並設置適當的縮放級別
      
      // 添加底圖
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // 創建電纜線圖層
      cablesLayerRef.current = L.layerGroup().addTo(map);
      
      // 保存地圖引用
      mapRef.current = map;
      
      // 調整地圖大小
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 0);
    }
    
    // 視窗大小變化時重新調整地圖大小
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清除函數
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // 清除標記
      if (mapRef.current) {
        for (const id in markersRef.current) {
          markersRef.current[id].remove();
        }
        markersRef.current = {};
      }
    };
  }, []);

  // 更新風機標記
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const markers = markersRef.current;
    
    // 清除所有現有標記
    for (const id in markers) {
      markers[id].remove();
      delete markers[id];
    }
    
    // 如果沒有風機數據，則返回
    if (turbines.length === 0) return;
    
    const bounds = L.latLngBounds([]);
    
    // 添加風機標記
    turbines.forEach(turbine => {
      const isSelected = turbine.id === selectedTurbineId;
      const icon = createTurbineIcon(turbine.status, isSelected);
      
      // 創建標記
      const marker = L.marker([turbine.lat, turbine.lng], { 
        icon, 
        zIndexOffset: isSelected ? 1000 : 0,
        riseOnHover: true
      })
        .addTo(map)
        .bindPopup(`
          <div class="p-3" style="min-width: 200px; border-radius: 8px; overflow: hidden;">
            <div style="margin: -16px -16px 10px -16px; padding: 10px 16px; background: linear-gradient(to right, #1e293b, #334155); color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 16px; display: flex; align-items: center;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColors[turbine.status]}; margin-right: 6px; display: inline-block;"></span>
                ${turbine.code || turbine.id}
              </div>
              <div style="font-size: 12px; opacity: 0.9; margin-left: 16px;">${turbine.name}</div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 500;">狀態: ${getStatusText(turbine.status)}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
              <div style="background-color: rgba(241, 245, 249, 0.8); padding: 8px; border-radius: 4px;">
                <div style="font-size: 12px; color: #64748b;">轉速</div>
                <div style="font-size: 16px; font-weight: bold; color: #334155;">${turbine.rpm} RPM</div>
              </div>
              <div style="background-color: rgba(241, 245, 249, 0.8); padding: 8px; border-radius: 4px;">
                <div style="font-size: 12px; color: #64748b;">發電量</div>
                <div style="font-size: 16px; font-weight: bold; color: #334155;">${turbine.power} MW</div>
              </div>
            </div>
            
            <div style="margin-top: 12px; padding: 8px; border-radius: 4px; background-color: ${
              turbine.maintenanceTickets > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)'
            }; display: flex; align-items: center; justify-content: space-between; border-left: 3px solid ${
              turbine.maintenanceTickets > 0 ? '#ef4444' : '#22c55e'
            };">
              <span style="color: #64748b;">工單數量</span>
              <span style="font-weight: bold; color: ${
                turbine.maintenanceTickets > 0 ? '#ef4444' : '#22c55e'
              };">${turbine.maintenanceTickets}</span>
            </div>
          </div>
        `, { 
          closeButton: true,
          className: 'custom-popup',
          maxWidth: 300,
          minWidth: 220
        });
        
      // 添加點擊事件
      marker.on('click', () => {
        onTurbineClick(turbine.id);
      });
      
      // 保存標記引用
      markers[turbine.id] = marker;
      
      // 擴展邊界包含所有風機
      bounds.extend([turbine.lat, turbine.lng]);
    });
    
    // 添加變電站標記
    substations.forEach(substation => {
      const isSelected = false; // 變電站不會被選中
      const icon = createSubstationIcon(substation.status, isSelected);
      
      // 創建標記
      const marker = L.marker([substation.coordinates.lat, substation.coordinates.lng], { 
        icon,
        riseOnHover: true
      })
        .addTo(map)
        .bindPopup(`
          <div class="p-3" style="min-width: 220px; border-radius: 8px; overflow: hidden;">
            <div style="margin: -16px -16px 10px -16px; padding: 10px 16px; background: linear-gradient(to right, #1e293b, #334155); color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 16px; display: flex; align-items: center;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColors[substation.status]}; margin-right: 6px; display: inline-block;"></span>
                ${substation.name}
              </div>
              <div style="font-size: 12px; opacity: 0.9; margin-left: 16px;">變電站</div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 500;">狀態: ${getStatusText(substation.status)}</span>
            </div>
            
            <div style="background-color: rgba(241, 245, 249, 0.8); padding: 10px; border-radius: 4px; margin-bottom: 8px;">
              <div style="font-size: 12px; color: #64748b;">變電站容量</div>
              <div style="font-size: 16px; font-weight: bold; color: #334155;">${substation.capacity} MW</div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 4px; background-color: rgba(241, 245, 249, 0.8); border-left: 3px solid ${
              substation.currentLoad / substation.capacity > 0.8 ? '#ef4444' : 
              substation.currentLoad / substation.capacity > 0.6 ? '#f59e0b' : 
              '#22c55e'
            };">
              <div>
                <div style="font-size: 12px; color: #64748b;">當前負載</div>
                <div style="font-size: 16px; font-weight: bold; color: #334155;">${substation.currentLoad} MW</div>
              </div>
              <div style="font-weight: bold; color: ${
                substation.currentLoad / substation.capacity > 0.8 ? '#ef4444' : 
                substation.currentLoad / substation.capacity > 0.6 ? '#f59e0b' : 
                '#22c55e'
              };">
                ${(substation.currentLoad / substation.capacity * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        `, { 
          closeButton: true,
          className: 'custom-popup',
          maxWidth: 300,
          minWidth: 220
        });
      
      // 保存標記引用
      markers[`substation-${substation.id}`] = marker;
      
      // 擴展邊界包含所有變電站
      bounds.extend([substation.coordinates.lat, substation.coordinates.lng]);
    });
    
    // 調整地圖視圖以顯示所有標記
    if (bounds.isValid() && Object.keys(markers).length > 0) {
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 12
      });
    }
    
    // 選中風機時，打開彈窗
    if (selectedTurbineId && markers[selectedTurbineId]) {
      markers[selectedTurbineId].openPopup();
    }
  }, [turbines, substations, selectedTurbineId, onTurbineClick]);

  // 更新電纜連接線
  useEffect(() => {
    if (!mapRef.current || !cablesLayerRef.current) return;
    
    // 清除之前的電纜線
    cablesLayerRef.current.clearLayers();
    
    // 如果沒有電纜數據，則返回
    if (cables.length === 0) {
      console.log('沒有電纜數據可顯示');
      return;
    }

    console.log('開始繪製電纜連接線，總數:', cables.length);
    console.log('電纜數據:', cables);
    console.log('變電站數據:', substations);
    
    // 創建所有元素的位置映射
    const locations: {[key: string]: [number, number]} = {};
    
    // 添加風機位置 - 使用多種可能的ID格式
    turbines.forEach(turbine => {
      // 標準格式
      locations[`turbine-${turbine.id}`] = [turbine.lat, turbine.lng];
      
      // 直接使用ID作為鍵（無前綴）
      locations[turbine.id] = [turbine.lat, turbine.lng];
      
      // 如果有code屬性，也添加映射
      if (turbine.code) {
        locations[`turbine-${turbine.code}`] = [turbine.lat, turbine.lng];
        locations[turbine.code] = [turbine.lat, turbine.lng];
      }
      
      // 如果有name屬性，也添加映射
      if (turbine.name) {
        locations[`turbine-${turbine.name}`] = [turbine.lat, turbine.lng];
        locations[turbine.name] = [turbine.lat, turbine.lng];
      }
      
      console.log(`風機 ${turbine.id} / ${turbine.code || ''} / ${turbine.name || ''} 位置: [${turbine.lat}, ${turbine.lng}]`);
    });
    
    // 添加變電站位置 - 支持多種可能的ID格式
    substations.forEach(substation => {
      // 標準格式
      locations[`substation-${substation.id}`] = [substation.coordinates.lat, substation.coordinates.lng];
      
      // 直接使用ID作為鍵（無前綴）
      locations[substation.id] = [substation.coordinates.lat, substation.coordinates.lng];
      
      // 如果有name屬性，也添加映射
      if (substation.name) {
        locations[`substation-${substation.name}`] = [substation.coordinates.lat, substation.coordinates.lng];
        locations[substation.name] = [substation.coordinates.lat, substation.coordinates.lng];
      }
      
      console.log(`變電站 ${substation.id} / ${substation.name || ''} 位置: [${substation.coordinates.lat}, ${substation.coordinates.lng}]`);
    });
    
    console.log('可用位置對應表:', locations);
    
    // 繪製電纜線
    cables.forEach(cable => {
      // 嘗試多種可能的來源/目標格式
      const possibleSourceKeys = [
        `${cable.sourceType}-${cable.sourceId}`,
        cable.sourceId,
        `turbine-${cable.sourceId}`
      ];
      
      const possibleTargetKeys = [
        `${cable.targetType}-${cable.targetId}`,
        cable.targetId,
        `turbine-${cable.targetId}`,
        `substation-${cable.targetId}`
      ];
      
      console.log(`嘗試連接: ${cable.sourceId} 到 ${cable.targetId}`);
      console.log('可能的來源鍵:', possibleSourceKeys);
      console.log('可能的目標鍵:', possibleTargetKeys);
      
      // 尋找有效的來源和目標位置
      let sourceLocation = null;
      for (const key of possibleSourceKeys) {
        if (locations[key]) {
          sourceLocation = locations[key];
          console.log(`找到來源位置，使用鍵: ${key}`);
          break;
        }
      }
      
      let targetLocation = null;
      for (const key of possibleTargetKeys) {
        if (locations[key]) {
          targetLocation = locations[key];
          console.log(`找到目標位置，使用鍵: ${key}`);
          break;
        }
      }
      
      // 檢查源和目標位置是否存在
      if (!sourceLocation || !targetLocation) {
        console.warn(`無法找到連接位置: 從 ${cable.sourceId} 到 ${cable.targetId}`);
        return;
      }
      
      console.log(`成功連接: 從 ${cable.sourceId} 到 ${cable.targetId}`);
      
      // 固定使用綠色作為電纜線顏色，不再根據狀態區分
      const lineColor = '#22c55e'; // 綠色
      
      // 創建線條樣式
      const lineOptions = {
        color: lineColor,
        weight: 3,  // 增加線條寬度使其更明顯
        opacity: 0.8,
        dashArray: '5, 10', // 虛線樣式
        className: `animated-line flow-${cable.status || 'normal'}`, // 添加狀態類以區分不同流量動畫
      };
      
      // 創建折線
      const polyline = L.polyline([sourceLocation, targetLocation], lineOptions).addTo(cablesLayerRef.current!);
      
      // 為折線添加彈出信息
      polyline.bindPopup(`
        <div class="p-3" style="min-width: 200px; border-radius: 8px; overflow: hidden;">
          <div style="margin: -16px -16px 10px -16px; padding: 10px 16px; background: linear-gradient(to right, #1e293b, #334155); color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 16px; display: flex; align-items: center;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${
                cable.status === 'normal' ? '#22c55e' : 
                cable.status === 'warning' ? '#f59e0b' : '#ef4444'
              }; margin-right: 6px; display: inline-block;"></span>
              電纜連接
            </div>
            <div style="font-size: 12px; opacity: 0.9; margin-left: 16px;">Cable Connection</div>
          </div>
          
          <div style="margin-bottom: 10px; background-color: rgba(241, 245, 249, 0.8); padding: 8px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="color: #64748b;">從:</span>
              <span style="font-weight: 500; color: #334155;">${cable.sourceId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">到:</span>
              <span style="font-weight: 500; color: #334155;">${cable.targetId}</span>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; margin: 12px 0 8px 0;">
            <span style="font-weight: 500;">狀態: 
              <span style="color: ${
                cable.status === 'normal' ? '#22c55e' : 
                cable.status === 'warning' ? '#f59e0b' : '#ef4444'
              };">${cable.status === 'normal' ? '正常' : cable.status === 'warning' ? '警告' : '故障'}</span>
            </span>
          </div>
          
          ${cable.powerFlow ? `
          <div style="background-color: rgba(241, 245, 249, 0.8); padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #64748b;">電力流量</div>
            <div style="font-size: 16px; font-weight: bold; color: #334155;">${typeof cable.powerFlow === 'number' ? cable.powerFlow.toFixed(1) : cable.powerFlow} MW</div>
          </div>
          ` : ''}
        </div>
      `);
    });
    
    // 添加增強的CSS動畫
    if (!document.getElementById('animated-line-css')) {
      const style = document.createElement('style');
      style.id = 'animated-line-css';
      style.innerHTML = `
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -30;
          }
        }
        
        @keyframes glowAnimation {
          0%, 100% {
            stroke-opacity: 0.6;
            filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.3));
          }
          50% {
            stroke-opacity: 1;
            filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.6));
          }
        }
        
        .animated-line {
          animation: dashAnimation 3s linear infinite, glowAnimation 2s ease-in-out infinite;
          stroke-linecap: round;
        }
        
        .flow-normal {
          animation-duration: 3s;
        }
        
        .flow-warning {
          animation-duration: 5s;
        }
        
        .flow-error {
          animation-duration: 8s;
        }
      `;
      document.head.appendChild(style);
    }
  }, [cables, turbines, substations]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-md"></div>;
};

export default WindFarmMap; 