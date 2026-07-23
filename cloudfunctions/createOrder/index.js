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
    // 确保 orders 集合存在（不存在则自动创建，已存在则忽略报错）
    try { await db.createCollection('orders') } catch (e) { /* 已存在，忽略 */ }

    // 后端重新计算金额，不信任前端传值
    // 健壮性策略：商品存在 → 按后端价重算；商品被删/规格失效 → 用清单项缓存价 + 警告
    let totalAmount = 0
    const warnings = []
    const orderItems = []
    for (const it of items) {
      const qty = Number(it.quantity) || 0
      if (qty <= 0) continue

      let unitPrice = Number(it.price) || 0
      let productName = it.productName || ''
      let productImage = it.image || ''

      try {
        const productRes = await db.collection('products').doc(it.productId).get()
        const product = productRes.data
        const spec = (product.specs || []).find(s => s.specName === it.specName)
        if (spec) {
          unitPrice = spec.price
          productName = product.name
          productImage = (product.images && product.images[0]) || productImage
        } else {
          warnings.push(`商品「${productName}」的规格「${it.specName}」已失效，已按原价下单`)
        }
      } catch (e) {
        // 商品被删/不存在时，回退到清单项里缓存的价格
        warnings.push(`商品「${productName}」信息已变更，已按原价下单`)
      }

      totalAmount += unitPrice * qty
      orderItems.push({
        productId: it.productId,
        productName,
        productImage,
        specName: it.specName,
        unitPrice,
        quantity: qty,
        subtotal: Math.round(unitPrice * qty * 100) / 100
      })
    }
    totalAmount = Math.round(totalAmount * 100) / 100

    if (orderItems.length === 0) {
      return { code: 400, msg: '清单中无有效商品' }
    }

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
        items: orderItems,
        totalAmount,
        remark: remark || '',
        warnings,
        createdAt: now,
        status: 'pending'
      }
    })

    return { code: 0, orderNo, createdAt, totalAmount, warnings }
  } catch (err) {
    return { code: 1, msg: err.message || '下单失败' }
  }
}
