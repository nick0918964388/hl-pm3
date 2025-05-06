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
  const size = isSelected ? 32 : 26;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: white;
        border-radius: 50%;
        border: ${borderWidth}px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        <div style="
          width: 55%;
          height: 55%;
          background-color: ${color};
          border-radius: 50%;
        "></div>
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
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: white;
        border: ${borderWidth}px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: rotate(45deg);
        ${isSelected ? 'transform: rotate(45deg) scale(1.1);' : ''}
      ">
        <div style="
          width: 60%;
          height: 60%;
          background-color: ${color};
          transform: rotate(0deg);
        "></div>
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
      }).setView([23.5, 121.2], 7); // 台灣中心點，縮小比例以顯示全台灣
      
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
          <div class="p-2">
            <h3 class="font-bold">${turbine.name}</h3>
            <p class="mb-1">狀態: ${getStatusText(turbine.status)}</p>
            <p class="mb-1">轉速: ${turbine.rpm} RPM</p>
            <p class="mb-1">發電量: ${turbine.power} MW</p>
            <p>工單數: ${turbine.maintenanceTickets}</p>
          </div>
        `, { 
          closeButton: true,
          className: 'custom-popup'
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
          <div class="p-2">
            <h3 class="font-bold">${substation.name}</h3>
            <p class="mb-1">狀態: ${getStatusText(substation.status)}</p>
            <p class="mb-1">容量: ${substation.capacity} MW</p>
            <p>當前負載: ${substation.currentLoad} MW (${(substation.currentLoad / substation.capacity * 100).toFixed(1)}%)</p>
          </div>
        `, { 
          closeButton: true,
          className: 'custom-popup'
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
    
    // 如果沒有電纜數據或不顯示電纜，則返回
    if (cables.length === 0) return;
    
    // 創建所有元素的位置映射
    const locations: {[key: string]: [number, number]} = {};
    
    // 添加風機位置
    turbines.forEach(turbine => {
      locations[`turbine-${turbine.id}`] = [turbine.lat, turbine.lng];
    });
    
    // 添加變電站位置
    substations.forEach(substation => {
      locations[`substation-${substation.id}`] = [substation.coordinates.lat, substation.coordinates.lng];
    });
    
    // 繪製電纜線
    cables.forEach(cable => {
      const sourceKey = `${cable.sourceType}-${cable.sourceId}`;
      const targetKey = `${cable.targetType}-${cable.targetId}`;
      
      // 檢查源和目標位置是否存在
      if (!locations[sourceKey] || !locations[targetKey]) return;
      
      const sourceLocation = locations[sourceKey];
      const targetLocation = locations[targetKey];
      
      // 根據狀態確定線的顏色
      const lineColor = 
        cable.status === 'normal' ? '#22c55e' :
        cable.status === 'warning' ? '#f59e0b' : '#ef4444';
      
      // 創建線條樣式
      const lineOptions = {
        color: lineColor,
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10', // 虛線樣式
        className: 'animated-line'  // 用於CSS動畫
      };
      
      // 創建折線
      const polyline = L.polyline([sourceLocation, targetLocation], lineOptions).addTo(cablesLayerRef.current!);
      
      // 為折線添加彈出信息
      polyline.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">電纜連接</h3>
          <p class="mb-1">狀態: ${cable.status === 'normal' ? '正常' : cable.status === 'warning' ? '警告' : '故障'}</p>
          <p>電力流量: ${cable.powerFlow.toFixed(1)} MW</p>
        </div>
      `);
    });
    
    // 添加CSS動畫
    if (!document.getElementById('animated-line-css')) {
      const style = document.createElement('style');
      style.id = 'animated-line-css';
      style.innerHTML = `
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -30;
          }
        }
        .animated-line {
          animation: dashAnimation 3s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, [cables, turbines, substations]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-md"></div>;
};

export default WindFarmMap; 