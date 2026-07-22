// 商品卡片组件
Component({
  properties: {
    product: {
      type: Object,
      value: {}
    }
  },
  data: {
    priceText: '暂无报价',
    hasImage: false,
    cover: ''
  },
  observers: {
    'product': function (product) {
      if (!product) return
      const specs = product.specs || []
      let priceText = '暂无报价'
      if (specs.length > 0) {
        const prices = specs.map(s => Number(s.price) || 0)
        const min = Math.min(...prices)
        priceText = specs.length === 1 ? `¥${min}` : `¥${min}起`
      }
      const images = product.images || []
      const rawCover = images[0] || ''
      this.setData({ priceText, hasImage: !!rawCover, cover: rawCover })
      // 如果是云存储 fileID，转成临时 HTTPS 链接
      if (rawCover && rawCover.startsWith('cloud://')) {
        wx.cloud.getTempFileURL({
          fileList: [rawCover],
          success: res => {
            if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
              this.setData({ cover: res.fileList[0].tempFileURL })
            }
          },
          fail: err => {
            console.error('获取图片临时链接失败：', err)
          }
        })
      }
    }
  },
  methods: {
    onCardTap() {
      this.triggerEvent('tap', { productId: this.data.product._id })
    }
  }
})
