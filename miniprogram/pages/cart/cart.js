const { call } = require('../../utils/cloud')
const { getCart, updateQuantity, removeItem, addItem, clearCart } = require('../../utils/cart-storage')

Page({
  data: {
    items: [],
    productsMap: {},
    totalAmount: 0,
    remark: '',
    isEmpty: true,
    loading: true,
    submitting: false
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    this.setData({ loading: true })
    const items = getCart()
    if (items.length === 0) {
      this.setData({ items: [], totalAmount: 0, isEmpty: true, loading: false })
      return
    }
    // 拉取商品以构建规格切换选项
    let productsMap = {}
    try {
      const res = await call('getProducts', {})
      if (res.code === 0) {
        res.data.forEach(p => { productsMap[p._id] = p })
      }
    } catch (e) {
      // 规格切换降级：仅展示已存信息
    }
    this.setData({
      items,
      productsMap,
      totalAmount: this.calcTotal(items),
      isEmpty: false,
      loading: false
    })
  },

  calcTotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0)
  },

  onMinus(e) {
    const { productid, specname } = e.currentTarget.dataset
    const item = this.data.items.find(i => i.productId === productid && i.specName === specname)
    if (!item) return
    updateQuantity(productid, specname, item.quantity - 1)
    this.refresh()
  },

  onPlus(e) {
    const { productid, specname } = e.currentTarget.dataset
    const item = this.data.items.find(i => i.productId === productid && i.specName === specname)
    if (!item) return
    updateQuantity(productid, specname, item.quantity + 1)
    this.refresh()
  },

  onRemove(e) {
    const { productid, specname } = e.currentTarget.dataset
    wx.showModal({
      title: '提示',
      content: '确定移除该商品？',
      success: (r) => {
        if (r.confirm) {
          removeItem(productid, specname)
          this.refresh()
        }
      }
    })
  },

  // 切换规格：从商品可选规格中选择
  onSwitchSpec(e) {
    const { productid, specname } = e.currentTarget.dataset
    const product = this.data.productsMap[productid]
    if (!product || !product.specs || product.specs.length === 0) {
      wx.showToast({ title: '无可选规格', icon: 'none' })
      return
    }
    const options = product.specs.map(s => `${s.specName} ¥${s.price}`)
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const newSpec = product.specs[res.tapIndex]
        if (newSpec.specName === specname) return
        removeItem(productid, specname)
        addItem({
          productId: productid,
          productName: product.name,
          specName: newSpec.specName,
          price: newSpec.price,
          quantity: 1,
          image: (product.images && product.images[0]) || ''
        })
        this.refresh()
      }
    })
  },

  refresh() {
    const items = getCart()
    this.setData({
      items,
      totalAmount: this.calcTotal(items),
      isEmpty: items.length === 0
    })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  async onGenerateOrder() {
    const { items, remark, submitting } = this.data
    // 防重复点击锁
    if (submitting) return
    if (items.length === 0) {
      wx.showToast({ title: '请先选购商品', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '生成订单中' })
    try {
      const res = await call('createOrder', { items, remark })
      if (res.code === 0) {
        const draft = {
          items,
          orderNo: res.orderNo,
          createdAt: res.createdAt,
          totalAmount: res.totalAmount,
          remark
        }
        wx.setStorageSync('lastOrder', draft)
        this.saveHistory(draft)
        clearCart()
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.navigateTo({ url: `/pages/order-card/order-card?orderNo=${res.orderNo}` })
      } else {
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.showToast({ title: res.msg || '下单失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  saveHistory(draft) {
    try {
      const history = wx.getStorageSync('orderHistory') || []
      history.unshift(draft)
      wx.setStorageSync('orderHistory', history.slice(0, 50))
    } catch (e) {}
  }
})
