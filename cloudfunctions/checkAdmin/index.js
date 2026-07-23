const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 校验当前调用者是否为店主
// 输入：无（云函数自动获取调用者 OPENID）
// 输出：{ isAdmin: boolean, openid: string }
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 云端测试环境没有用户身份，OPENID 为空
  if (!OPENID) {
    return {
      isAdmin: false,
      msg: '云端测试环境无法获取 openid，请在小程序端调用（编译后看 Console 日志）'
    }
  }

  try {
    const res = await cloud
      .database()
      .collection('admins')
      .where({ openid: OPENID })
      .count()

    return {
      isAdmin: res.total > 0,
      openid: OPENID
    }
  } catch (err) {
    return {
      isAdmin: false,
      openid: OPENID,
      msg: err.message || '校验失败'
    }
  }
}
