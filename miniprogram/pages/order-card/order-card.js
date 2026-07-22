const { drawOrderCard, measureHeight, CARD_WIDTH } = require('../../utils/canvas-order')

Page({
  data: {
    previewImage: '',
    items: [],
    orderNo: '',
    createdAt: '',
    totalAmount: 0,
    remark: '',
    shopWechat: '',
    loading: true
  },

  onLoad() {
    const draft = wx.getStorageSync('lastOrder')
    if (!draft || !draft.items) {
      wx.showToast({ title: '订单信息缺失', icon: 'none' })
      this.setData({ loading: false })
      return
    }
    this.setData({
      items: draft.items,
      orderNo: draft.orderNo,
      createdAt: draft.createdAt,
      totalAmount: draft.totalAmount,
      remark: draft.remark || ''
    })
    this.loadShopWechat(() => this.drawCard())
  },

  // 店主微信从云数据库 config 集合读取（不硬编码）
  loadShopWechat(cb) {
    const db = wx.cloud.database()
    db.collection('config').doc('shop').get()
      .then(res => {
        this.setData({ shopWechat: (res.data && res.data.shopWechat) || '' })
      })
      .catch(() => {
        this.setData({ shopWechat: '' })
      })
      .then(() => cb && cb())
  },

  drawCard() {
    const { items, orderNo, createdAt, totalAmount, remark, shopWechat } = this.data
    wx.createSelectorQuery()
      .select('#orderCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          this.setData({ loading: false })
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
        const height = measureHeight({ items, remark })
        canvas.width = CARD_WIDTH * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        drawOrderCard(ctx, { items, orderNo, createdAt, totalAmount, remark, shopWechat })
        this._textVersion = this.buildText()
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas,
            success: (r) => this.setData({ previewImage: r.tempFilePath, loading: false }),
            fail: () => this.setData({ loading: false })
          })
        }, 120)
      })
  },

  buildText() {
    const { items, orderNo, createdAt, totalAmount, remark } = this.data
    const lines = ['【栗子特供 · 选购清单】', `订单号：${orderNo}`, `生成时间：${createdAt}`, '']
    items.forEach((it, i) => {
      const sub = Number(it.price) * Number(it.quantity)
      lines.push(`${i + 1}. ${it.productName}（${it.specName}）x${it.quantity} ¥${sub.toFixed(2)}`)
    })
    lines.push('', `合计：¥${Number(totalAmount).toFixed(2)}`)
    if (remark) lines.push(`备注：${remark}`)
    return lines.join('\n')
  },

  onSaveAlbum() {
    if (!this.data.previewImage) {
      wx.showToast({ title: '图片未生成', icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.previewImage,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('auth') >= 0) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许保存图片到相册',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  onCopyText() {
    wx.setClipboardData({
      data: this._textVersion || '',
      success: () => wx.showToast({ title: '已复制文字版清单', icon: 'success' })
    })
  }
})
