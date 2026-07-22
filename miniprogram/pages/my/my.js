const { addItem } = require('../../utils/cart-storage')

Page({
  data: {
    history: [],
    shopWechat: ''
  },

  onShow() {
    const history = wx.getStorageSync('orderHistory') || []
    this.setData({ history })
    this.loadShopWechat()
  },

  // 店主微信从云数据库 config 集合读取（不硬编码）
  loadShopWechat() {
    wx.cloud.database().collection('config').doc('shop').get()
      .then(res => {
        this.setData({ shopWechat: (res.data && res.data.shopWechat) || '' })
      })
      .catch(() => {
        this.setData({ shopWechat: '' })
      })
  },

  // 历史记录一键重新加载回选品清单（复购）
  onHistoryTap(e) {
    const { index } = e.currentTarget.dataset
    const order = this.data.history[index]
    if (!order || !order.items) return
    order.items.forEach(it => {
      addItem({
        productId: it.productId,
        productName: it.productName,
        specName: it.specName,
        price: it.price,
        quantity: it.quantity,
        image: it.image || ''
      })
    })
    wx.showToast({ title: '已加入清单', icon: 'success' })
    setTimeout(() => wx.navigateTo({ url: '/pages/cart/cart' }), 600)
  },

  onCopyWechat() {
    if (!this.data.shopWechat) {
      wx.showToast({ title: '暂未配置店主微信', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: this.data.shopWechat,
      success: () => wx.showToast({ title: '已复制店主微信', icon: 'success' })
    })
  }
})
