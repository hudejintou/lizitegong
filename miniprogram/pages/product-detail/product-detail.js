const { call } = require('../../utils/cloud')
const { addItem } = require('../../utils/cart-storage')
const { resolveProductImage, isValidImageUrl } = require('../../utils/image-map')

Page({
  data: {
    product: null,
    images: [],
    activeSpecIndex: -1,
    specName: '',
    price: 0,
    quantity: 1,
    subtotal: 0,
    loading: true
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '缺少商品ID', icon: 'none' })
      return
    }
    this.loadProduct(id)
  },

  // 通过 getProducts 拉取上架商品后按 _id 定位（当前无单商品接口）
  async loadProduct(id) {
    this.setData({ loading: true })
    try {
      const res = await call('getProducts', {})
      if (res.code === 0) {
        const product = res.data.find(p => p._id === id)
        if (!product) {
          wx.showToast({ title: '商品不存在', icon: 'none' })
          this.setData({ loading: false })
          return
        }
        const specs = product.specs || []
        const first = specs[0] || null
        const rawImages = product.images || []

        // 解析图片：优先使用本地兜底图
        const resolved = resolveProductImage(product.name, rawImages)
        const displayImages = resolved.hasImage ? [resolved.cover] : []
        console.log('[product-detail] 图片解析结果:', { name: product.name, source: resolved.source, images: displayImages })

        this.setData({
          product,
          images: displayImages,
          activeSpecIndex: specs.length > 0 ? 0 : -1,
          specName: first ? first.specName : '',
          price: first ? first.price : 0,
          quantity: this.data.quantity,
          subtotal: first ? first.price * this.data.quantity : 0,
          loading: false
        })
        // 如果是云存储图片，继续转换获取更高清的临时链接
        if (resolved.source === 'cloud') {
          this.convertImages(rawImages)
        }
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('详情页加载失败：', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 将 cloud:// fileID 转为 HTTPS 临时链接；失败时回退到 downloadFile 下载到本地
  convertImages(images) {
    const all = images || []
    const cloudIds = all.filter(url => url && url.startsWith('cloud://'))
    if (cloudIds.length === 0) return

    // 分离 http(s) 和 cloud://
    const networkUrls = all.filter(url => url && /^https?:\/\//.test(url))

    wx.cloud.getTempFileURL({
      fileList: cloudIds,
      success: res => {
        console.log('[product-detail] getTempFileURL 响应:', JSON.stringify(res))
        const urlMap = {}
        let allOk = true
        res.fileList.forEach(f => {
          if (f.tempFileURL) {
            urlMap[f.fileID] = f.tempFileURL
          } else {
            allOk = false
            console.warn('[product-detail] fileID 转换失败:', f.fileID, f.errMsg)
          }
        })

        if (allOk) {
          const converted = all.map(url => urlMap[url] || url)
          this.setData({ images: converted })
        } else {
          // 有图片转换失败，逐个用 downloadFile 兜底
          this.downloadImagesFallback(cloudIds, all, networkUrls)
        }
      },
      fail: err => {
        console.error('[product-detail] getTempFileURL 失败:', JSON.stringify(err))
        this.downloadImagesFallback(cloudIds, all, networkUrls)
      }
    })
  },

  // downloadFile 兜底：把每张云图下到本地临时路径
  downloadImagesFallback(cloudIds, all, networkUrls) {
    let done = 0
    const pathMap = {}
    cloudIds.forEach(fileID => {
      wx.cloud.downloadFile({
        fileID: fileID,
        success: res => {
          if (res.tempFilePath) pathMap[fileID] = res.tempFilePath
          done++
          if (done === cloudIds.length) {
            const converted = all.map(url => pathMap[url] || url)
            this.setData({ images: converted })
            console.log('[product-detail] downloadFile 兜底完成')
          }
        },
        fail: err => {
          console.error('[product-detail] downloadFile 失败:', fileID, JSON.stringify(err))
          done++
          if (done === cloudIds.length) {
            const converted = all.map(url => pathMap[url] || url)
            this.setData({ images: converted })
          }
        }
      })
    })
  },

  // 选择规格，价格联动
  onSpecTap(e) {
    const index = e.currentTarget.dataset.index
    const specs = this.data.product.specs || []
    const spec = specs[index]
    if (!spec) return
    const price = spec.price
    this.setData({
      activeSpecIndex: index,
      specName: spec.specName,
      price,
      subtotal: price * this.data.quantity
    })
  },

  onMinus() {
    if (this.data.quantity <= 1) return
    const quantity = this.data.quantity - 1
    this.setData({ quantity, subtotal: this.data.price * quantity })
  },

  onPlus() {
    const quantity = this.data.quantity + 1
    this.setData({ quantity, subtotal: this.data.price * quantity })
  },

  onAddToCart() {
    this.addToCart(false)
  },

  onAddAndCheckout() {
    this.addToCart(true)
  },

  addToCart(goCheckout) {
    const { product, specName, price, quantity } = this.data
    if (!product) return
    if (!specName) {
      wx.showToast({ title: '请选择规格', icon: 'none' })
      return
    }
    addItem({
      productId: product._id,
      productName: product.name,
      specName,
      price,
      quantity,
      image: (product.images && product.images[0]) || ''
    })
    wx.showToast({ title: '已加入清单', icon: 'success' })
    if (goCheckout) {
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/cart/cart' })
      }, 600)
    }
  }
})
