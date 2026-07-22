const { call } = require('../../utils/cloud')
const { addItem } = require('../../utils/cart-storage')

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
        this.setData({
          product,
          images: rawImages,
          activeSpecIndex: specs.length > 0 ? 0 : -1,
          specName: first ? first.specName : '',
          price: first ? first.price : 0,
          quantity: this.data.quantity,
          subtotal: first ? first.price * this.data.quantity : 0,
          loading: false
        })
        // cloud:// fileID 转 HTTPS 临时链接
        this.convertImages(rawImages)
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

  // 将 cloud:// fileID 转为可显示的 HTTPS 临时链接
  convertImages(images) {
    const cloudIds = (images || []).filter(url => url && url.startsWith('cloud://'))
    if (cloudIds.length === 0) return
    wx.cloud.getTempFileURL({
      fileList: cloudIds,
      success: res => {
        const urlMap = {}
        res.fileList.forEach(f => {
          if (f.tempFileURL) urlMap[f.fileID] = f.tempFileURL
        })
        const converted = images.map(url => urlMap[url] || url)
        this.setData({ images: converted })
      },
      fail: err => {
        console.error('详情页图片转换失败：', err)
      }
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
