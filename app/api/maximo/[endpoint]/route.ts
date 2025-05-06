import { NextRequest, NextResponse } from 'next/server';

// 實際的API基地址，應該設定在環境變數中
const REAL_API_BASE_URL = process.env.REAL_API_BASE_URL || 'http://hl.webtw.xyz/maximo/oslc/script';

export async function POST(
  request: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const { endpoint } = params;
    const requestBody = await request.json();
    const maxauth = request.headers.get('maxauth') || '';

    // 從前端獲取的API請求轉發到實際的API端點
    const response = await fetch(`${REAL_API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'maxauth': maxauth,
      },
      body: JSON.stringify(requestBody)
    });

    // 獲取響應數據
    const data = await response.json();

    // 返回響應到前端
    return NextResponse.json(data);
  } catch (error) {
    console.error('API代理錯誤:', error);
    return NextResponse.json(
      { error: '處理API請求時出錯' }, 
      { status: 500 }
    );
  }
} 