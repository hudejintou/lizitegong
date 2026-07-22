// 订单卡片 Canvas 2D 绘制封装
// 画布逻辑宽度固定 600，高度按内容动态计算
const CARD_WIDTH = 600
const PAD = 30

// 计算卡片所需逻辑高度
function measureHeight(data) {
  const { items = [], remark = '' } = data
  let h = PAD
  h += 70   // 标题区（品牌名 + 订单号 + 时间）
  h += 30   // 分隔线
  items.forEach(() => { h += 96 })   // 每条商品（名/规格/小计 + 细分隔线）
  if (remark) h += 50                // 备注区
  h += 80   // 合计
  h += 90   // 底部提示 + 店主微信
  h += PAD
  return h
}

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function truncate(str, max) {
  str = String(str || '')
  return str.length > max ? str.slice(0, max) + '…' : str
}

// 在已按 dpr 缩放的 ctx 上绘制；调用前需设置 canvas.width/height 并 ctx.scale(dpr, dpr)
function drawOrderCard(ctx, data) {
  const {
    items = [],
    orderNo = '',
    createdAt = '',
    totalAmount = 0,
    remark = '',
    shopWechat = '',
    brandName = '栗子特供 · 选购清单'
  } = data

  const H = measureHeight(data)
  // 背景
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CARD_WIDTH, H)

  let y = PAD

  // 标题区
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#8B4513'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText(brandName, PAD, y)
  y += 46
  ctx.fillStyle = '#666666'
  ctx.font = '22px sans-serif'
  ctx.fillText(`订单号：${orderNo}`, PAD, y)
  y += 30
  ctx.fillText(`生成时间：${formatTime(createdAt)}`, PAD, y)
  y += 38

  // 分隔线
  ctx.strokeStyle = '#EEEEEE'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(CARD_WIDTH - PAD, y)
  ctx.stroke()
  y += 26

  // 商品逐条
  items.forEach(it => {
    const name = it.productName || ''
    const spec = it.specName || ''
    const qty = it.quantity || 0
    const price = Number(it.price) || 0

    ctx.fillStyle = '#333333'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(truncate(name, 16), PAD, y)
    ctx.textAlign = 'right'
    ctx.fillText(`x${qty}`, CARD_WIDTH - PAD, y)
    ctx.textAlign = 'left'
    y += 36

    ctx.fillStyle = '#8B4513'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(truncate(spec, 20), PAD, y)
    ctx.textAlign = 'right'
    ctx.fillText(`¥${(price * qty).toFixed(2)}`, CARD_WIDTH - PAD, y)
    ctx.textAlign = 'left'
    y += 34

    // 细分隔线
    ctx.strokeStyle = '#F2F2F2'
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(CARD_WIDTH - PAD, y)
    ctx.stroke()
    y += 26
  })

  // 备注
  if (remark) {
    ctx.fillStyle = '#999999'
    ctx.font = '22px sans-serif'
    ctx.fillText(`备注：${truncate(remark, 28)}`, PAD, y)
    y += 44
  }

  // 合计
  ctx.fillStyle = '#333333'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('合计', PAD, y)
  ctx.fillStyle = '#8B4513'
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`¥${Number(totalAmount).toFixed(2)}`, CARD_WIDTH - PAD, y)
  ctx.textAlign = 'left'
  y += 64

  // 底部提示
  ctx.fillStyle = '#8B4513'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText('截图发给店主即可下单 ~', PAD, y)
  y += 38
  ctx.fillStyle = '#666666'
  ctx.font = '22px sans-serif'
  ctx.fillText(`店主微信：${shopWechat || '（未配置）'}`, PAD, y)

  return H
}

module.exports = { drawOrderCard, measureHeight, CARD_WIDTH }
