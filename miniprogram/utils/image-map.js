// 本地图片映射工具
// 当云存储图片不可用或加载失败时，使用本地图片作为兜底

// 商品名称 → 本地图片路径 的映射表
// 如果你的商品名不同，请修改这里的 key
const LOCAL_IMAGE_MAP = {
  '即食栗子仁': '/image/jishiliziren.png',
  '糖炒栗子': '/image/tangchaolizi.png',
  '燕山生板栗': '/image/yanshanshengbanli.png',
  // 可以继续添加更多映射...
}

// 根据商品名称获取本地图片路径
function getLocalImage(name) {
  if (!name) return ''
  // 精确匹配
  if (LOCAL_IMAGE_MAP[name]) return LOCAL_IMAGE_MAP[name]
  // 模糊匹配：检查商品名是否包含映射表中的关键字
  for (const key in LOCAL_IMAGE_MAP) {
    if (name.includes(key) || key.includes(name)) {
      return LOCAL_IMAGE_MAP[key]
    }
  }
  return ''
}

// 判断是否为可直接显示的图片路径（https/http/本地路径）
// 注意：cloud:// 不能直接显示，必须先转换，所以不算"可直接显示"
function isValidImageUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))
}

// 解析商品图片：
// 1. 如果有可直接显示的网络/本地图片，直接返回
// 2. 如果是 cloud:// 或没有任何图片，用本地兜底图
function resolveProductImage(name, rawImages = []) {
  const raw = rawImages[0] || ''

  // 情况1：可直接显示的网络/本地图片
  if (isValidImageUrl(raw)) {
    return { hasImage: true, cover: raw, source: 'network' }
  }

  // 情况2：有 cloud:// fileID，但这些云文件可能已失效
  // 先检查是否有本地兜底图，有的话直接用本地图，不再尝试转换失效的云文件
  const local = getLocalImage(name)
  if (local) {
    return { hasImage: true, cover: local, source: 'local' }
  }

  // 情况3：没有本地兜底，但有 cloud://，标记为 cloud 让调用方尝试转换
  if (raw && raw.startsWith('cloud://')) {
    return { hasImage: true, cover: raw, source: 'cloud' }
  }

  return { hasImage: false, cover: '', source: 'none' }
}

module.exports = {
  getLocalImage,
  isValidImageUrl,
  resolveProductImage,
  LOCAL_IMAGE_MAP
}
