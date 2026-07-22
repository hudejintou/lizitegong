# 任务3：首页（商品橱窗）— 给本地 AI 的指令

> 直接复制下方代码块中的内容，粘贴给你的本地 AI。

---

## 复制以下内容给本地 AI

```
这是一个微信原生小程序项目，使用微信云开发（云数据库+云函数），不使用任何前端框架（不是Taro/uni-app）。请只生成【任务3：首页（商品橱窗）】涉及的文件，遵循需求文档第二节的目录结构和第三节的数据库字段命名，不要擅自增加字段或修改已定义的云函数输入输出格式。

## 当前项目状态

项目路径：E:\myproject\lizi
已完成：
- 任务1：项目初始化（miniprogram/ + cloudfunctions/ 双根目录，app.js/json/wxss 已配置）
- 任务2：云函数 getProducts + checkAdmin 已生成

当前 utils/cloud.js 只有一行注释，是空壳文件。components/product-card/ 目录下只有 .gitkeep。pages/index/ 四个文件是空白骨架。

## 已有云函数接口（不要修改，只调用）

### getProducts
- 调用方式：wx.cloud.callFunction({ name: 'getProducts', data: { category?: string } })
- 返回：{ code: 0, data: [商品数组] } 或 { code: 1, msg: string }
- 商品对象字段：_id, name, category, images(array<fileID>), description, specs(array<{specName, price, tag}>), sortOrder, status, createdAt, updatedAt

### checkAdmin
- 调用方式：wx.cloud.callFunction({ name: 'checkAdmin' })
- 返回：{ isAdmin: boolean }

## 你需要完成的文件

### 文件1：utils/cloud.js — 云函数调用封装

封装 wx.cloud.callFunction 为 Promise，统一错误处理。

```javascript
// utils/cloud.js
const call = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: err => reject(err)
    })
  })
}

module.exports = { call }
```

### 文件2：components/product-card/ — 商品卡片组件

创建 4 个文件：

#### product-card.json
```json
{
  "component": true
}
```

#### product-card.js
要求：
- 接收 properties：product（对象，包含 _id, name, images, specs 等字段）
- 计算属性或 data：priceText（价格区间文本）
  - 从 product.specs 数组中取最低价，格式化为 "¥XX起"
  - 如果只有一个规格，显示 "¥XX"（不加"起"）
  - 如果 specs 为空，显示 "暂无报价"
- 方法：onCardTap，triggerEvent('tap', { productId: product._id })

#### product-card.wxml
要求：
- 整个卡片可点击，bindtap="onCardTap"
- 商品图片：用 <image> 标签，src 取 product.images[0]，mode="aspectFill"
  - 如果 images 为空，显示一个占位灰色块（用 view + 文字"暂无图片"）
  - 图片加 lazy-load 属性
- 商品名称：product.name
- 价格：{{priceText}}，使用全局 .price 样式类（主色棕红）

#### product-card.wxss
要求：
- 卡片样式：白色背景、圆角、阴影，宽度约 340rpx（两列瀑布流用）
- 图片：宽度 100%，高度 340rpx（正方形），圆角顶部
- 名称：最多两行，超出省略号
- 价格：右下角，主色
- 整体内边距合理

### 文件3-6：pages/index/ — 首页面

#### index.json
```json
{
  "navigationBarTitleText": "栗子特供",
  "enablePullDownRefresh": true,
  "usingComponents": {
    "product-card": "/components/product-card/product-card"
  }
}
```

#### index.js
要求：
```javascript
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
```

#### index.wxml
要求：
1. 顶部分类导航：横向滚动（scroll-view scroll-x），每个分类是一个可点击标签
   - 选中的分类高亮（主色文字 + 底部下划线或背景色变化）
   - 未选中的分类灰色文字
2. 商品列表区域：
   - loading 状态：显示加载提示（如"加载中..."或简单骨架屏）
   - 有商品时：两列布局展示 product-card 组件列表
   - 无商品时：显示空状态（一个图标/插图 + "暂无商品"文字）
3. 右下角悬浮清单图标：
   - 固定定位，圆形按钮，使用清单/购物车图标
   - 如果 cartCount > 0，右上角显示红色圆形角标数字
   - bindtap="onCartTap"
4. 商品卡片使用 product-card 组件，监听 bind:tap="onProductTap"

结构示例：
```xml
<view class="page">
  <!-- 分类导航 -->
  <scroll-view class="category-bar" scroll-x>
    <view class="category-item {{currentCategory === item ? 'active' : ''}}"
          wx:for="{{categories}}" wx:key="*this"
          data-category="{{item}}"
          bindtap="onCategoryTap">
      {{item}}
    </view>
  </scroll-view>

  <!-- 商品列表 -->
  <view class="product-list" wx:if="{{!loading && products.length > 0}}">
    <product-card wx:for="{{products}}" wx:key="_id"
                  product="{{item}}"
                  bind:tap="onProductTap" />
  </view>

  <!-- 加载中 -->
  <view class="loading" wx:if="{{loading}}">
    <text>加载中...</text>
  </view>

  <!-- 空状态 -->
  <view class="empty" wx:if="{{!loading && products.length === 0}}">
    <text class="empty-text">暂无商品</text>
  </view>

  <!-- 悬浮清单按钮 -->
  <view class="cart-fab" bindtap="onCartTap">
    <text class="cart-icon">🛒</text>
    <view class="cart-badge" wx:if="{{cartCount > 0}}">{{cartCount}}</view>
  </view>
</view>
```

#### index.wxss
要求：
1. 分类导航栏：
   - 固定在顶部（sticky 或 fixed），白色背景，底部细边框
   - scroll-view 高度约 80rpx，内部 item 横向排列，不换行
   - category-item：padding 左右 24rpx，字号 28rpx，行高 80rpx
   - active 状态：主色（var(--color-primary)）文字 + 底部 4rpx 主色边框
   - 非 active：#999 文字
2. 商品列表：
   - 两列布局（flex-wrap 或 grid），左右间距 16rpx，上下间距 16rpx
   - 整体 padding 16rpx
3. loading 和 empty 状态：
   - 居中显示，padding-top 200rpx
   - empty-text 灰色（#999），字号 28rpx
4. 悬浮清单按钮：
   - position: fixed，right: 32rpx，bottom: 120rpx（避开 tabBar）
   - 宽高 96rpx，圆形，背景 var(--color-primary)
   - 居中显示购物车图标，白色
   - box-shadow 增加层次感
   - cart-badge：绝对定位右上角，红色背景（#FF4444），白色文字，圆形，min-width 32rpx，font-size 20rpx
5. 使用全局 CSS 变量 var(--color-primary)、var(--color-bg) 等，不要硬编码颜色值

## 验收标准

1. 微信开发者工具编译无报错
2. 首页显示分类导航栏（6 个分类标签），默认选中"全部"
3. 调用 getProducts 云函数加载商品数据（云开发控制台需有 products 集合数据才能看到效果）
4. 商品以两列卡片列表展示，每张卡片显示图片、名称、价格
5. 点击不同分类，商品列表正确切换
6. 没有商品时显示"暂无商品"空状态，不报错
7. 右下角悬浮清单按钮可见，有商品时显示数量角标
8. 点击商品卡片能跳转到 /pages/product-detail/product-detail?id=xxx（详情页尚未开发，跳转报错正常）
9. 下拉刷新功能正常
```

---

## 验收检查清单

完成后，在微信开发者工具中确认：

- [ ] 编译无报错，首页正常渲染
- [ ] 分类导航栏显示 6 个分类，点击可切换高亮
- [ ] 商品卡片为两列布局，显示图片+名称+价格
- [ ] 价格显示格式正确（多规格显示"¥XX起"，单规格显示"¥XX"）
- [ ] 无商品时显示空状态提示
- [ ] 右下角悬浮清单按钮可见
- [ ] 点击商品卡片触发跳转（详情页未开发时跳转报错是正常的）
- [ ] 下拉刷新可触发

## 测试前提

要在首页看到商品数据，需要先在云开发控制台的 `products` 集合中添加几条测试数据。手动添加示例：

```json
{
  "name": "糖炒栗子",
  "category": "糖炒栗子",
  "images": [],
  "description": "现炒现卖，颗颗饱满",
  "specs": [{ "specName": "500g", "price": 28, "tag": "现货" }, { "specName": "1kg", "price": 52, "tag": "现货" }],
  "sortOrder": 1,
  "status": "on",
  "createdAt": "2026-07-22T00:00:00.000Z",
  "updatedAt": "2026-07-22T00:00:00.000Z"
}
```

## 完成后下一步

验收通过后，进入 **任务4：商品详情页**。
告诉本地 AI："请继续生成任务4的商品详情页代码。"
