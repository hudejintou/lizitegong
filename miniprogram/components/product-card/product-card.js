// 商品卡片组件
const { resolveProductImage } = require('../../utils/image-map')

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

      // 使用图片映射工具解析图片（优先本地兜底）
      const { hasImage, cover, source } = resolveProductImage(product.name, product.images)
      console.log(`[product-card] ${product.name} 图片解析结果:`, { source, cover: cover || '(空)' })

      this.setData({
        priceText,
        hasImage,
        cover
      })

      // 只有云存储图片才需要转换
      if (source === 'cloud') {
        this.resolveCloudImage(cover, product.name)
      }
    }
  },
  methods: {
    // 解析云存储图片：先 getTempFileURL，失败时用 downloadFile 下载到本地
    resolveCloudImage(fileID, productName) {
      wx.cloud.getTempFileURL({
        fileList: [fileID],
        success: res => {
          console.log(`[product-card] ${productName} getTempFileURL 响应:`, JSON.stringify(res))
          const item = res.fileList && res.fileList[0]
          if (item && item.tempFileURL) {
            console.log(`[product-card] ${productName} 转换成功:`, item.tempFileURL)
            this.setData({ cover: item.tempFileURL })
          } else {
            console.warn(`[product-card] ${productName} getTempFileURL 无 tempFileURL, 改用 downloadFile`)
            this.downloadCloudImage(fileID, productName)
          }
        },
        fail: err => {
          console.error(`[product-card] ${productName} getTempFileURL 失败:`, JSON.stringify(err))
          this.downloadCloudImage(fileID, productName)
        }
      })
    },

    // 下载到本地临时路径
    downloadCloudImage(fileID, productName) {
      wx.cloud.downloadFile({
        fileID: fileID,
        success: res => {
          if (res.tempFilePath) {
            console.log(`[product-card] ${productName} 下载到本地:`, res.tempFilePath)
            this.setData({ cover: res.tempFilePath })
          } else {
            console.error(`[product-card] ${productName} 下载无 tempFilePath`)
            this.setData({ hasImage: false })
          }
        },
        fail: err => {
          console.error(`[product-card] ${productName} downloadFile 失败:`, JSON.stringify(err))
          this.setData({ hasImage: false })
        }
      })
    },

    // 图片加载失败兜底
    onImageError(e) {
      console.error(`[product-card] 图片加载失败, URL:`, this.data.cover, 'detail:', e && e.detail)
      // 不要直接 hasImage=false，因为可能只是临时网络抖动
      // 让 downloadCloudImage 兜底
      const fallback = this.data.cover
      if (fallback && fallback.startsWith('cloud://')) {
        this.downloadCloudImage(fallback, this.data.product && this.data.product.name)
      } else {
        this.setData({ hasImage: false })
      }
    },

    onCardTap() {
      this.triggerEvent('tap', { productId: this.data.product._id })
    }
  }
})
