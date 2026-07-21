Page({
  data: {
    message: 'Hello, 小程序!'
  },
  onLoad() {
    console.log('首页加载')
  },
  onTap() {
    this.setData({
      message: '你点击了按钮 - ' + Date.now()
    })
  }
})
