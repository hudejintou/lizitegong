const { call } = require('../../utils/cloud')

Page({
  data: {
    categories: ['全部', '糖炒栗子', '生栗子', '栗子仁', '栗子酱', '礼盒装'],
    currentCategory: '全部',
    products: [],
    loading: true,
    cartCount: 0
  },

  onLoad() {
    this.loadProducts()
  },

  onShow() {
    // 每次显示页面时刷新清单角标（用户可能从详情页加入了商品）
    this.updateCartCount()
  },

  // 加载商品列表
  async loadProducts() {
    this.setData({ loading: true })
    try {
      const category = this.data.currentCategory === '全部' ? '' : this.data.currentCategory
      const res = await call('getProducts', category ? { category } : {})
      if (res.code === 0) {
        this.setData({ products: res.data, loading: false })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 切换分类
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    if (category === this.data.currentCategory) return
    this.setData({ currentCategory: category })
    this.loadProducts()
  },

  // 点击商品卡片，跳转详情页
  onProductTap(e) {
    const { productId } = e.detail
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${productId}`
    })
  },

  // 点击悬浮清单图标，跳转清单页
  onCartTap() {
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },

  // 更新本地清单商品件数角标
  updateCartCount() {
    try {
      const cart = wx.getStorageSync('cart') || []
      this.setData({ cartCount: cart.length })
    } catch (e) {
      this.setData({ cartCount: 0 })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
