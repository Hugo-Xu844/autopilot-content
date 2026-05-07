/**
 * AI 编程实验室 - 自动发货云函数
 * 
 * 部署到腾讯云函数 (SCF) 或阿里云函数计算 (FC)
 * 
 * 环境变量:
 *   PAYJS_MCHID  - PayJS 商户号
 *   PAYJS_KEY    - PayJS 通信密钥
 *   SITE_URL     - 网站地址 https://hugo-xu844.github.io/autopilot-content
 */

const crypto = require('crypto');
const axios = require('axios');

// === 配置（从环境变量读取）===
const PAYJS_MCHID = process.env.PAYJS_MCHID || '';
const PAYJS_KEY = process.env.PAYJS_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://hugo-xu844.github.io/autopilot-content';
const PDF_BASE_URL = `${SITE_URL}/assets/covers`;

// === 产品数据 ===
const PRODUCTS = {
  'ai-beginners': { name: 'AI 入门完全指南', price: 1990, file: 'ai-beginners.pdf' },
  'python-basics': { name: 'Python 编程入门到精通', price: 1990, file: 'python-basics.pdf' },
  'prompt-master': { name: 'Prompt 工程大师课', price: 1490, file: 'prompt-master.pdf' },
  'coding-practice': { name: '编程实战项目合集', price: 2990, file: 'coding-practice.pdf' },
  'ai-tools': { name: 'AI 工具评测大全', price: 990, file: 'ai-tools.pdf' }
};

// === 内存订单状态（生产环境建议用 Redis/数据库）===
const paidOrders = new Map();

// === 工具函数 ===
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function generateOrderId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `AP${ts}${rand}`;
}

// === PayJS API 调用 ===
async function createPayJSPayJSOrder(orderId, product, userIp) {
  const params = {
    mchid: PAYJS_MCHID,
    total_fee: product.price,
    out_trade_no: orderId,
    body: product.name,
    notify_url: `${SITE_URL}/api/pay/notify`,
    attach: product.id,
    ip: userIp || '127.0.0.1'
  };
  
  // 生成签名
  const signStr = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + `&key=${PAYJS_KEY}`;
  params.sign = md5(signStr).toUpperCase();
  
  // 调用 PayJS 原生支付 API
  const res = await axios.post('https://payjs.cn/api/native', new URLSearchParams(params), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  return res.data;
}

async function checkPayJSOrder(payjsOrderId) {
  const params = {
    payjs_order_id: payjsOrderId
  };
  const signStr = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + `&key=${PAYJS_KEY}`;
  params.sign = md5(signStr).toUpperCase();
  
  const res = await axios.post('https://payjs.cn/api/check', new URLSearchParams(params), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  return res.data;
}

// === 云函数入口 ===

/**
 * 腾讯云函数 / 阿里云函数计算 入口
 * 会处理不同路由
 */
exports.main_handler = async (event, context) => {
  try {
    // 解析路径和参数
    const path = event.path || event.url || '';
    const method = event.httpMethod || 'GET';
    
    // 统一 body 解析
    let body = {};
    try {
      body = JSON.parse(event.body || event.isBase64Encoded ? 
        Buffer.from(event.body, 'base64').toString() : '{}');
    } catch (e) {
      body = event.queryStringParameters || event.query || {};
    }

    // 路由分发
    if (path.includes('/api/create-order')) {
      return await handleCreateOrder(body);
    } else if (path.includes('/api/check-order')) {
      return await handleCheckOrder(body);
    } else if (path.includes('/api/pay/notify')) {
      return await handlePayNotify(event);
    } else if (path.includes('/api/download/')) {
      return await handleDownload(path);
    } else {
      return jsonResponse(404, { error: 'Not Found' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return jsonResponse(500, { error: 'Internal Server Error', message: err.message });
  }
};

// === 路由处理 ===

// 1. 创建订单：返回收款二维码
async function handleCreateOrder(body) {
  const { productId } = body;
  
  if (!productId || !PRODUCTS[productId]) {
    return jsonResponse(400, { error: '无效的产品ID' });
  }
  
  const product = PRODUCTS[productId];
  const orderId = generateOrderId();
  
  // 调用 PayJS 生成收款码
  const payjsResult = await createPayJSPayJSOrder(orderId, product, body.ip);
  
  if (payjsResult.return_code !== 1) {
    return jsonResponse(500, { error: '支付创建失败', msg: payjsResult.return_msg });
  }
  
  // 保存订单到内存
  paidOrders.set(orderId, {
    productId,
    outTradeNo: orderId,
    payjsOrderId: payjsResult.payjs_order_id,
    paid: false,
    qrcode: payjsResult.qrcode,
    createdAt: Date.now()
  });
  
  return jsonResponse(200, {
    orderId,
    qrcode: payjsResult.qrcode,
    price: product.price,
    productName: product.name
  });
}

// 2. 查询订单状态（前端轮询用）
async function handleCheckOrder(body) {
  const { orderId } = body;
  
  if (!orderId || !paidOrders.has(orderId)) {
    return jsonResponse(400, { error: '订单不存在' });
  }
  
  const order = paidOrders.get(orderId);
  
  // 如果本地还未标记已支付，再向 PayJS 确认一次
  if (!order.paid) {
    try {
      const checkResult = await checkPayJSOrder(order.payjsOrderId);
      if (checkResult.return_code === 1 && checkResult.status === 1) {
        order.paid = true;
        paidOrders.set(orderId, order);
      }
    } catch (e) {
      // 查询失败不影响返回
    }
  }
  
  return jsonResponse(200, {
    paid: order.paid,
    orderId,
    productId: order.productId,
    downloadUrl: order.paid ? `${SITE_URL}/api/download/${orderId}` : null
  });
}

// 3. PayJS 支付回调通知
async function handlePayNotify(event) {
  // PayJS 回调是 form 格式
  const params = {};
  const bodyStr = event.isBase64Encoded ? 
    Buffer.from(event.body, 'base64').toString() : (event.body || '');
  
  // 解析 form data
  bodyStr.split('&').forEach(pair => {
    const [k, v] = pair.split('=').map(decodeURIComponent);
    if (k) params[k] = v;
  });
  
  // 验证签名
  const signStr = Object.keys(params)
    .filter(k => k !== 'sign')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + `&key=${PAYJS_KEY}`;
  const expectedSign = md5(signStr).toUpperCase();
  
  if (params.sign !== expectedSign) {
    console.error('PayJS callback signature mismatch');
    return { return_code: 0, return_msg: 'sign error' };
  }
  
  // 标记订单为已支付
  const { out_trade_no, payjs_order_id } = params;
  if (paidOrders.has(out_trade_no)) {
    const order = paidOrders.get(out_trade_no);
    order.paid = true;
    order.payjsOrderId = payjs_order_id;
    order.paidAt = new Date().toISOString();
    paidOrders.set(out_trade_no, order);
    console.log(`✅ 订单已支付: ${out_trade_no}`);
  }
  
  return { return_code: 1, return_msg: 'ok' };
}

// 4. 下载 PDF（验证后返回）
async function handleDownload(path) {
  const orderId = path.split('/download/')[1]?.split('/')[0] || '';
  
  if (!orderId || !paidOrders.has(orderId)) {
    return { statusCode: 404, body: '订单不存在' };
  }
  
  const order = paidOrders.get(orderId);
  
  if (!order.paid) {
    return { statusCode: 402, body: '未支付' };
  }
  
  const product = PRODUCTS[order.productId];
  if (!product) {
    return { statusCode: 404, body: '产品不存在' };
  }
  
  // 重定向到 PDF 文件
  const pdfUrl = `${SITE_URL}/content/products/pdf/${product.file}`;
  
  return {
    statusCode: 302,
    headers: {
      'Location': pdfUrl
    }
  };
}

// === 辅助 ===
function jsonResponse(statusCode, data) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(data)
  };
}
