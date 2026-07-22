const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 校验当前调用者是否为店主
const isAdmin = async (OPENID, db) => {
  const res = await db.collection('admins').where({ openid: OPENID }).count()
  return res.total > 0
}

// 店主增删改商品（含权限校验）
// 输入：{ action: 'create'|'update'|'delete', productData?, productId? }
// 输出：{ code: 0 } 或 { code: 403, msg } / { code: 400, msg } / { code: 1, msg }
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const { action, productData, productId } = event

  if (!(await isAdmin(OPENID, db))) {
    return { code: 403, msg: '无权限' }
  }

  try {
    if (action === 'create') {
      const now = new Date()
      await db.collection('products').add({
        data: Object.assign({}, productData, {
          status: productData.status || 'on',
          createdAt: now,
          updatedAt: now
        })
      })
      return { code: 0 }
    }
    if (action === 'update') {
      if (!productId) return { code: 400, msg: '缺少 productId' }
      await db.collection('products').doc(productId).update({
        data: Object.assign({}, productData, { updatedAt: new Date() })
      })
      return { code: 0 }
    }
    if (action === 'delete') {
      if (!productId) return { code: 400, msg: '缺少 productId' }
      await db.collection('products').doc(productId).remove()
      return { code: 0 }
    }
    return { code: 400, msg: '未知操作' }
  } catch (err) {
    return { code: 1, msg: err.message || '操作失败' }
  }
}
