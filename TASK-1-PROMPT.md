# 任务1：项目初始化 — 给本地 AI 的指令

> 直接复制下方代码块中的内容，粘贴给你的本地 AI（Cursor / Continue / 其他）。

---

## 复制以下内容给本地 AI

```
这是一个微信原生小程序项目，使用微信云开发（云数据库+云函数），不使用任何前端框架（不是Taro/uni-app）。请只生成【任务1：项目初始化】涉及的文件，遵循需求文档第二节的目录结构和第三节的数据库字段命名，不要擅自增加字段或修改已定义的云函数输入输出格式。

## 当前项目状态

项目路径：E:\myproject\lizi
当前是一个默认模板项目，文件结构为扁平结构（app.js/json/wxss 在根目录），需要改造为云开发项目结构。

## 你需要完成的具体任务

### 1. 项目结构重组

将当前扁平结构改为云开发标准结构：

```
lizi/
├── miniprogram/           ← 小程序前端代码全部移到这里
│   ├── pages/
│   │   ├── index/         ← 首页（商品橱窗），保留现有 index 页面但清空模板内容
│   │   ├── product-detail/
│   │   ├── cart/
│   │   ├── order-card/
│   │   ├── my/
│   │   └── admin/
│   │       └── product-manage/
│   ├── components/
│   │   └── product-card/
│   ├── utils/
│   │   ├── cloud.js       ← 云开发初始化+封装（本轮只建空壳，具体实现在后续任务）
│   │   ├── cart-storage.js ← 本轮只建空壳
│   │   └── canvas-order.js  ← 本轮只建空壳
│   ├── app.js
│   ├── app.json
│   └── app.wxss
├── cloudfunctions/         ← 云函数目录（本轮只建目录，不生成云函数代码）
├── project.config.json
└── sitemap.json
```

操作要点：
- 把现有的 app.js、app.json、app.wxss、sitemap.json 移到 miniprogram/ 目录下
- pages/ 目录整体移到 miniprogram/ 下
- 创建空的 components/、utils/ 目录（utils 下三个 .js 文件先建空壳，每个文件写一行注释说明用途即可）
- 创建空的 cloudfunctions/ 目录
- project.config.json 留在根目录，但更新 miniprogramRoot 为 "miniprogram/"

### 2. 更新 project.config.json

```json
{
  "description": "栗子特供小程序",
  "packOptions": {
    "ignore": [],
    "include": []
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true,
    "newFeature": false,
    "bigPackageSizeSupport": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.0.0",
  "appid": "touristappid",
  "projectname": "lizi",
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "condition": {}
}
```

注意：appid 暂时保持 "touristappid"，后续用户会替换为自己的真实 AppID。

### 3. 生成 app.js（云开发初始化）

```javascript
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'your-env-id',  // TODO: 用户替换为自己的云环境 ID
      traceUser: true
    })
  },
  globalData: {
    userInfo: null
  }
})
```

### 4. 生成 app.json（页面路由 + tabBar 配置）

要求：
- pages 数组包含所有 6 个页面路由
- tabBar 配置 2 个标签：首页、我的
- tabBar 主色调使用棕红色系（贴近栗子/糖炒色调），建议 #8B4513 或 #A0522D
- window 配置导航栏标题为"栗子特供"
- tabBar 图标暂时不需要（不配置 iconPath），只配置文字和颜色

页面路由列表（按顺序）：
1. pages/index/index
2. pages/product-detail/product-detail
3. pages/cart/cart
4. pages/order-card/order-card
5. pages/my/my
6. pages/admin/product-manage/product-manage

### 5. 生成 app.wxss（全局样式 + 主题变量）

要求：
- 定义 CSS 变量：主色 --color-primary: #8B4513（栗子棕红），辅色 --color-secondary: #D2691E（糖炒橙），背景色 --color-bg: #F5F0EB（暖白）
- 全局 page 样式：背景色、字体
- 全局 view 样式：box-sizing: border-box
- 价格文字样式：使用主色，font-weight: 500
- 通用按钮样式
- 通用卡片样式

### 6. 清空 index 页面模板内容

把 pages/index/ 下的四个文件改为干净的空白页面骨架（不是 Hello World 模板），后续任务会填充实际内容。

## 验收标准

1. 微信开发者工具打开项目后能正常编译，无报错
2. 目录结构为 miniprogram/ + cloudfunctions/ 双根目录
3. app.json 中 tabBar 正常显示"首页"和"我的"两个标签
4. 页面背景色为暖色调，导航栏标题显示"栗子特供"
5. 云开发初始化代码已写入 app.js（env ID 留 TODO 占位）
```

---

## 验收检查清单

完成后，你需要在微信开发者工具中确认：

- [ ] 项目能正常编译，控制台无报错
- [ ] 目录结构是 `miniprogram/` + `cloudfunctions/` 双根目录
- [ ] 底部 tabBar 显示"首页"和"我的"两个标签
- [ ] 导航栏标题显示"栗子特供"
- [ ] 页面背景色是暖色调（不是默认灰色）
- [ ] app.js 中有 `wx.cloud.init` 调用
- [ ] 6 个页面路由都在 app.json 的 pages 数组中

## 完成后下一步

验收通过后，进入 **任务2：云函数 getProducts + checkAdmin**。
告诉本地 AI："请继续生成任务2的云函数代码。"
