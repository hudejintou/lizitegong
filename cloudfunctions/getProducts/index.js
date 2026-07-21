const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取上架商品列表
// 输入：{ category?: string }  可选分类筛选
// 输出：{ code: 0, data: [商品数组] }
exports.main = async (event, context) => {
  const { category } = event
  const db = cloud.database()

  const query = { status: 'on' }
  if (category) {
    query.category = category
  }

  try {
    const res = await db
      .collection('products')
      .where(query)
      .orderBy('sortOrder', 'asc')
      .get()

    return {
      code: 0,
      data: res.data
    }
  } catch (err) {
    return {
      code: 1,
      msg: err.message || '查询失败'
    }
  }
}
