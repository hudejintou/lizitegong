// 云函数调用封装：统一 Promise 化与错误处理
const call = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: err => reject(err)
    })
  })
}

module.exports = { call }
