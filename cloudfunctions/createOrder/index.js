const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 生成订单
// 输入：{ items: array, remark: string }
// 逻辑：后端按 productId+specName 重新查库计算金额；生成 orderNo；写入 orders
// 输出：{ code: 0, orderNo, createdAt, totalAmount } 或 { code: 403/400/1, msg }
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { items, remark } = event
  const db = cloud.database()

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { code: 400, msg: '清单为空' }
  }

  try {
    // 后端重新计算金额，不信任前端传值
    let totalAmount = 0
    for (const it of items) {
      const product = await db.collection('products').doc(it.productId).get()
      const spec = (product.data.specs || []).find(s => s.specName === it.specName)
      if (!spec) {
        return { code: 400, msg: `商品规格不存在: ${it.productName || it.productId}` }
      }
      const qty = Number(it.quantity) || 0
      totalAmount += spec.price * qty
    }
    totalAmount = Math.round(totalAmount * 100) / 100

    // 生成订单号：LZ + 当天日期 + 当日流水号（3 位）
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const dateStr = `${y}${m}${d}`
    const prefix = `LZ${dateStr}`
    const count = await db.collection('orders').where({
      orderNo: db.RegExp({ regexp: `^${prefix}` })
    }).count()
    const seq = String(count.total + 1).padStart(3, '0')
    const orderNo = `${prefix}-${seq}`

    const createdAt = now.toISOString()
    await db.collection('orders').add({
      data: {
        orderNo,
        openid: OPENID,
        items,
        totalAmount,
        remark: remark || '',
        createdAt: now,
        status: 'pending'
      }
    })

    return { code: 0, orderNo, createdAt, totalAmount }
  } catch (err) {
    return { code: 1, msg: err.message || '下单失败' }
  }
}
