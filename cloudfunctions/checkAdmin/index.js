const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 校验当前调用者是否为店主
// 输入：无（云函数自动获取调用者 OPENID）
// 输出：{ isAdmin: boolean }
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await cloud
      .database()
      .collection('admins')
      .where({ openid: OPENID })
      .count()

    return {
      isAdmin: res.total > 0
    }
  } catch (err) {
    return {
      isAdmin: false,
      msg: err.message || '校验失败'
    }
  }
}
