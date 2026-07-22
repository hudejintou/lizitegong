// 本地选品清单读写封装（基于 wx.setStorageSync('cart', ...)）
// 购物清单每行结构：{ productId, productName, specName, price, quantity, image }
const CART_KEY = 'cart'

const getCart = () => {
  try {
    return wx.getStorageSync(CART_KEY) || []
  } catch (e) {
    return []
  }
}

// 加入清单：同一商品同一规格重复加入时合并数量，不生成重复行
const addItem = (item) => {
  const cart = getCart()
  const idx = cart.findIndex(
    c => c.productId === item.productId && c.specName === item.specName
  )
  if (idx >= 0) {
    cart[idx].quantity += item.quantity
  } else {
    cart.push(item)
  }
  wx.setStorageSync(CART_KEY, cart)
  return cart
}

const updateQuantity = (productId, specName, quantity) => {
  const cart = getCart()
  const idx = cart.findIndex(
    c => c.productId === productId && c.specName === specName
  )
  if (idx >= 0) {
    if (quantity <= 0) {
      cart.splice(idx, 1)
    } else {
      cart[idx].quantity = quantity
    }
    wx.setStorageSync(CART_KEY, cart)
  }
  return cart
}

const removeItem = (productId, specName) => {
  const cart = getCart().filter(
    c => !(c.productId === productId && c.specName === specName)
  )
  wx.setStorageSync(CART_KEY, cart)
  return cart
}

const clearCart = () => {
  wx.setStorageSync(CART_KEY, [])
  return []
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart }
