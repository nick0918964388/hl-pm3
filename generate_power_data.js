// 生成風機發電量JSON數據
// 使用方法: node generate_power_data.js

const fs = require('fs');

// 風機列表
const assets = [
  'HL21-A01-A',
  'HL21-A02-A'
];

// 時間範圍
const startDate = new Date('2025-01-01T00:00:00');
const endDate = new Date('2025-05-06T23:00:00');

// 輸出文件名
const outputFile = 'power.json';

// 生成固定範圍內的隨機數
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// 根據日期和時間生成合理的發電量
function generatePowerValue(date) {
  const hour = date.getHours();
  const month = date.getMonth(); // 0-11
  
  // 基礎發電量
  let basePower = 2.0;
  
  // 根據月份調整（冬季風力較大）
  if (month === 0 || month === 1) { // 1-2月
    basePower += 0.8;
  } else if (month === 2 || month === 3) { // 3-4月
    basePower += 0.4;
  } else if (month === 4) { // 5月
    basePower += 0.2;
  }
  
  // 根據小時調整（白天風力通常較大）
  if (hour >= 8 && hour <= 18) {
    basePower += 1.0;
  } else if (hour >= 19 || hour <= 5) {
    basePower -= 0.5;
  }
  
  // 添加隨機波動
  basePower += getRandomNumber(-0.7, 0.7);
  
  // 確保發電量不為負
  return Math.max(0.5, basePower).toFixed(2);
}

// 建立讀數陣列
const readings = [];

// 計算每小時的時間點
let currentDate = new Date(startDate);
while (currentDate <= endDate) {
  // 為每個風機生成數據
  assets.forEach(asset => {
    // 生成發電量
    const power = generatePowerValue(currentDate);
    
    // 格式化日期時間
    const dateStr = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    
    // 添加到讀數陣列
    readings.push({
      assetnum: asset,
      reading: power,  // 注意: 這裡使用字串形式
      readingdate: dateStr
    });
  });
  
  // 增加一小時
  currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
}

// 建立最終JSON結構
const powerData = {
  metername: "POWER",
  readings: readings
};

// 寫入文件
fs.writeFileSync(outputFile, JSON.stringify(powerData, null, 2));

console.log(`已生成 ${readings.length} 筆發電量數據，寫入到 ${outputFile}`);
console.log(`時間範圍: ${startDate.toLocaleString()} 至 ${endDate.toLocaleString()}`);
console.log(`風機數量: ${assets.length}`); 