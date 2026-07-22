const { call } = require('../../../utils/cloud')

Page({
  data: {
    noAuth: false,
    loading: true,
    products: [],
    showForm: false,
    editingId: '',
    categoryIndex: 0,
    form: {
      name: '',
      category: '糖炒栗子',
      description: '',
      images: [],
      specsText: '',
      sortOrder: 0,
      status: 'on'
    },
    categories: ['糖炒栗子', '生栗子', '栗子仁', '栗子酱', '礼盒装']
  },

  noop() {},

  onLoad() {
    this.checkAuth()
  },

  async checkAuth() {
    try {
      const res = await call('checkAdmin')
      if (res.isAdmin) {
        this.setData({ noAuth: false, loading: false })
        this.loadProducts()
      } else {
        this.setData({ noAuth: true, loading: false })
      }
    } catch (e) {
      this.setData({ noAuth: true, loading: false })
    }
  },

  // 管理视角需看全部（含下架）；products 权限为所有用户可读，故直接查询
  async loadProducts() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('products')
        .orderBy('sortOrder', 'asc')
        .limit(100)
        .get()
      const products = res.data
      this.setData({ products })
      // cloud:// fileID 转 HTTPS 临时链接
      this.convertProductImages(products)
    } catch (e) {
      this.setData({ products: [] })
    }
  },

  // 批量转换商品列表中的 cloud:// 图片为 HTTPS 临时链接
  convertProductImages(products) {
    const allCloudIds = []
    products.forEach(p => {
      (p.images || []).forEach(url => {
        if (url && url.startsWith('cloud://')) allCloudIds.push(url)
      })
    })
    if (allCloudIds.length === 0) return
    // 去重
    const uniqueIds = [...new Set(allCloudIds)]
    wx.cloud.getTempFileURL({
      fileList: uniqueIds,
      success: res => {
        const urlMap = {}
        res.fileList.forEach(f => {
          if (f.tempFileURL) urlMap[f.fileID] = f.tempFileURL
        })
        const converted = products.map(p => ({
          ...p,
          images: (p.images || []).map(url => urlMap[url] || url)
        }))
        this.setData({ products: converted })
      },
      fail: err => {
        console.error('管理页图片转换失败：', err)
      }
    })
  },

  onAdd() {
    this.setData({
      showForm: true,
      editingId: '',
      categoryIndex: 0,
      form: { name: '', category: '糖炒栗子', description: '', images: [], specsText: '', sortOrder: 0, status: 'on' }
    })
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset
    const p = this.data.products.find(x => x._id === id)
    if (!p) return
    const specsText = (p.specs || []).map(s => `${s.specName},${s.price},${s.tag || ''}`).join('\n')
    this.setData({
      showForm: true,
      editingId: id,
      categoryIndex: Math.max(0, this.data.categories.indexOf(p.category)),
      form: {
        name: p.name,
        category: p.category,
        description: p.description || '',
        images: p.images || [],
        specsText,
        sortOrder: p.sortOrder || 0,
        status: p.status || 'on'
      }
    })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    const idx = e.detail.value
    this.setData({
      categoryIndex: idx,
      'form.category': this.data.categories[idx]
    })
  },

  onStatusChange(e) {
    this.setData({ 'form.status': e.detail.value ? 'on' : 'off' })
  },

  async onChooseImage() {
    const res = await wx.chooseMedia({ count: 9, mediaType: ['image'] })
    const tempFiles = res.tempFiles.map(f => f.tempFilePath)
    wx.showLoading({ title: '上传中' })
    const uploaded = []
    for (const f of tempFiles) {
      const ext = (f.match(/\.\w+$/) || ['.png'])[0]
      const cloudPath = `products/${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`
      try {
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: f })
        uploaded.push(up.fileID)
      } catch (err) {}
    }
    wx.hideLoading()
    this.setData({ 'form.images': this.data.form.images.concat(uploaded) })
  },

  onRemoveImage(e) {
    const { index } = e.currentTarget.dataset
    const images = this.data.form.images.slice()
    images.splice(index, 1)
    this.setData({ 'form.images': images })
  },

  parseSpecs(text) {
    return (text || '').split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(',').map(s => s.trim())
        return { specName: parts[0] || '', price: Number(parts[1]) || 0, tag: parts[2] || '' }
      })
      .filter(s => s.specName)
  },

  async onSubmit() {
    const f = this.data.form
    if (!f.name) {
      wx.showToast({ title: '请填写商品名', icon: 'none' })
      return
    }
    const productData = {
      name: f.name,
      category: f.category,
      description: f.description,
      images: f.images,
      specs: this.parseSpecs(f.specsText),
      sortOrder: Number(f.sortOrder) || 0,
      status: f.status
    }
    const action = this.data.editingId ? 'update' : 'create'
    const data = { action, productData }
    if (this.data.editingId) data.productId = this.data.editingId
    wx.showLoading({ title: '保存中' })
    try {
      const res = await call('manageProduct', data)
      wx.hideLoading()
      if (res.code === 0) {
        wx.showToast({ title: '已保存', icon: 'success' })
        this.setData({ showForm: false })
        this.loadProducts()
      } else if (res.code === 403) {
        wx.showToast({ title: '无权限', icon: 'none' })
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          const res = await call('manageProduct', { action: 'delete', productId: id })
          wx.hideLoading()
          if (res.code === 0) {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadProducts()
          } else {
            wx.showToast({ title: res.msg || '删除失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
        }
      }
    })
  },

  onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset
    const newStatus = status === 'on' ? 'off' : 'on'
    call('manageProduct', { action: 'update', productId: id, productData: { status: newStatus } })
      .then(res => {
        if (res.code === 0) this.loadProducts()
        else wx.showToast({ title: res.msg || '失败', icon: 'none' })
      })
  },

  onCancel() {
    this.setData({ showForm: false })
  }
})
