// 数据初始化云函数：一键创建 config 集合 + admins 集合
// 在云开发控制台 → 云函数 → 测试调用，传入参数即可
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { wxid } = event // 店主微信号，可选
  const { OPENID } = cloud.getWXContext()

  const results = { config: '', admin: '', openid: OPENID }

  // 1. 创建 config 集合的 shop 记录
  try {
    await db.collection('config').doc('shop').set({
      data: {
        shopWechat: wxid || '',
        shopName: '栗子特供',
        updatedAt: db.serverDate()
      }
    })
    results.config = 'ok'
  } catch (e) {
    results.config = 'fail: ' + e.errMsg
  }

  // 2. 将当前调用者加入 admins 集合（首次调用即设为管理员）
  try {
    const existing = await db.collection('admins').where({ openid: OPENID }).count()
    if (existing.total === 0) {
      await db.collection('admins').add({
        data: {
          openid: OPENID,
          nickname: '店主',
          createdAt: db.serverDate()
        }
      })
      results.admin = 'created'
    } else {
      results.admin = 'already exists'
    }
  } catch (e) {
    results.admin = 'fail: ' + e.errMsg
  }

  return {
    code: 0,
    msg: '初始化完成',
    data: results
  }
}
